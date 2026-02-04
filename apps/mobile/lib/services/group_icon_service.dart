import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
export 'package:image_picker/image_picker.dart' show ImagePicker, ImageSource, XFile;
import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;
import '../services/group_chat_service.dart';
import '../services/group_event_service.dart';
import '../services/logging_service.dart';
import '../models/chat_group.dart';

/// Exception for group icon validation errors
class GroupIconValidationError implements Exception {
  final String message;
  GroupIconValidationError(this.message);
  @override
  String toString() => message;
}

/// Service for managing group icon uploads
class GroupIconService {
  static const String _tag = 'GroupIconService';
  static final _log = LoggingService.instance;
  static const String bucket = 'avatars'; // Using existing avatars bucket
  static const int maxSize = 2 * 1024 * 1024; // 2MB max
  static const List<String> allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  final _supabase = Supabase.instance.client;
  final _groupService = GroupChatService();
  final _eventService = GroupEventService();

  /// Pick and upload a group icon
  Future<String?> pickAndUploadGroupIcon(String groupId) async {
    try {
      // Pick image from gallery
      final picker = ImagePicker();
      final image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );

      if (image == null) return null;

      // Validate file
      final bytes = await image.readAsBytes();
      await _validateImage(image, bytes);

      // Upload to storage
      final url = await _uploadIcon(groupId, bytes, image.name);

      // Update group record
      final groupResult = await _groupService.updateGroup(groupId, iconUrl: url);
      if (!groupResult.isSuccess) {
        throw Exception(groupResult.errorMessage ?? 'Failed to update group');
      }
      final group = groupResult.data;

      // Log event
      await _eventService.onIconUpdated(groupId: groupId, group: group);

      return url;
    } catch (e) {
      _log.error('Failed to pick and upload group icon', tag: _tag, error: e);
      rethrow;
    }
  }

  /// Pick icon from camera
  Future<String?> pickFromCamera(String groupId) async {
    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );

      if (image == null) return null;

      final bytes = await image.readAsBytes();
      await _validateImage(image, bytes);

      final url = await _uploadIcon(groupId, bytes, image.name);
      final groupResult = await _groupService.updateGroup(groupId, iconUrl: url);
      if (!groupResult.isSuccess) {
        throw Exception(groupResult.errorMessage ?? 'Failed to update group');
      }
      final group = groupResult.data;
      await _eventService.onIconUpdated(groupId: groupId, group: group);

      return url;
    } catch (e) {
      _log.error('Failed to pick from camera', tag: _tag, error: e);
      rethrow;
    }
  }

  /// Upload icon from bytes (for pre-selected images)
  Future<String?> uploadIconFromBytes({
    required String groupId,
    required Uint8List bytes,
    required String fileName,
    bool logEvent = true,
  }) async {
    try {
      if (bytes.length > maxSize) {
        throw GroupIconValidationError('Image is too large (max 2MB)');
      }

      final url = await _uploadIcon(groupId, bytes, fileName);
      final groupResult = await _groupService.updateGroup(groupId, iconUrl: url);
      if (!groupResult.isSuccess) {
        throw Exception(groupResult.errorMessage ?? 'Failed to update group');
      }
      final group = groupResult.data;

      if (logEvent) {
        await _eventService.onIconUpdated(groupId: groupId, group: group);
      }

      return url;
    } catch (e) {
      _log.error('Failed to upload icon from bytes', tag: _tag, error: e);
      rethrow;
    }
  }

  /// Delete a group's icon
  Future<void> deleteGroupIcon(String groupId) async {
    try {
      final groupResult = await _groupService.getGroupById(groupId);
      if (!groupResult.isSuccess) return;
      final group = groupResult.data;
      if (group.iconUrl == null) return;

      // Extract path from URL and delete
      final path = _extractPathFromUrl(group.iconUrl!);
      if (path != null) {
        await _supabase.storage.from(bucket).remove([path]);
      }

      // Clear icon URL in group
      await _groupService.updateGroup(groupId, iconUrl: '');
    } catch (e) {
      _log.error('Failed to delete group icon', tag: _tag, error: e);
    }
  }

  Future<void> _validateImage(XFile file, Uint8List bytes) async {
    // Check file size
    if (bytes.length > maxSize) {
      throw GroupIconValidationError('Image is too large (max 2MB)');
    }

    // Check extension
    final ext = file.name.split('.').last.toLowerCase();
    if (!allowedExtensions.contains(ext)) {
      throw GroupIconValidationError(
        'Invalid file type. Allowed: ${allowedExtensions.join(", ")}',
      );
    }
  }

  Future<String> _uploadIcon(String groupId, Uint8List bytes, String originalName) async {
    final ext = originalName.split('.').last.toLowerCase();
    final fileName = 'group_${groupId}_${DateTime.now().millisecondsSinceEpoch}.$ext';
    final path = 'groups/$fileName';

    // Delete old icon first
    try {
      final groupResult = await _groupService.getGroupById(groupId);
      if (groupResult.isSuccess) {
        final group = groupResult.data;
        if (group.iconUrl != null && group.iconUrl!.isNotEmpty) {
          final oldPath = _extractPathFromUrl(group.iconUrl!);
          if (oldPath != null) {
            await _supabase.storage.from(bucket).remove([oldPath]);
          }
        }
      }
    } catch (e) {
      _log.warning('Failed to delete old icon', tag: _tag, error: e);
    }

    // Upload new icon
    await _supabase.storage.from(bucket).uploadBinary(
      path,
      bytes,
      fileOptions: const FileOptions(
        contentType: 'image/jpeg',
        upsert: true,
      ),
    );

    // Return public URL
    return _supabase.storage.from(bucket).getPublicUrl(path);
  }

  String? _extractPathFromUrl(String url) {
    try {
      final uri = Uri.parse(url);
      final pathSegments = uri.pathSegments;
      // Find 'avatars' bucket and get everything after it
      final bucketIndex = pathSegments.indexOf(bucket);
      if (bucketIndex >= 0 && bucketIndex < pathSegments.length - 1) {
        return pathSegments.sublist(bucketIndex + 1).join('/');
      }
      // Try to extract from object/public path
      if (pathSegments.contains('object') && pathSegments.contains('public')) {
        final publicIndex = pathSegments.indexOf('public');
        if (publicIndex >= 0 && publicIndex < pathSegments.length - 1) {
          final afterPublic = pathSegments.sublist(publicIndex + 1);
          if (afterPublic.first == bucket && afterPublic.length > 1) {
            return afterPublic.sublist(1).join('/');
          }
        }
      }
    } catch (e) {
      _log.warning('Failed to extract path from URL', tag: _tag, error: e);
    }
    return null;
  }
}
