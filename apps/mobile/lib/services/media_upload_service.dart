import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
export 'package:image_picker/image_picker.dart' show ImagePicker, ImageSource, XFile;
import 'package:thittam1hub/services/logging_service.dart';
import 'package:mime/mime.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

class ImageValidationError implements Exception {
  final String message;
  ImageValidationError(this.message);
  
  @override
  String toString() => message;
}

/// Compression quality presets
enum ImageQuality {
  /// Original quality, no compression (may exceed size limits)
  original,
  /// High quality: 1200px max, 90% quality (~1-2MB)
  high,
  /// Medium quality: 1000px max, 80% quality (~500KB-1MB)
  medium,
  /// Low quality: 800px max, 70% quality (~200-500KB)
  low,
}

extension ImageQualityExtension on ImageQuality {
  String get label {
    switch (this) {
      case ImageQuality.original:
        return 'Original';
      case ImageQuality.high:
        return 'High';
      case ImageQuality.medium:
        return 'Medium';
      case ImageQuality.low:
        return 'Low';
    }
  }
  
  String get description {
    switch (this) {
      case ImageQuality.original:
        return 'No compression';
      case ImageQuality.high:
        return '~1-2MB, great quality';
      case ImageQuality.medium:
        return '~500KB, good quality';
      case ImageQuality.low:
        return '~200KB, faster upload';
    }
  }
  
  int get maxDimension {
    switch (this) {
      case ImageQuality.original:
        return 4096;
      case ImageQuality.high:
        return 1200;
      case ImageQuality.medium:
        return 1000;
      case ImageQuality.low:
        return 800;
    }
  }
  
  int get jpegQuality {
    switch (this) {
      case ImageQuality.original:
        return 100;
      case ImageQuality.high:
        return 90;
      case ImageQuality.medium:
        return 80;
      case ImageQuality.low:
        return 70;
    }
  }
}

class MediaUploadService {
  static const String _tag = 'MediaUploadService';
  static final _log = LoggingService.instance;
  
  static const int maxFileSizeBytes = 5 * 1024 * 1024; // 5MB
  static const int autoCompressThresholdBytes = 2 * 1024 * 1024; // 2MB - auto-compress above this
  static const List<String> allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  static const String sparkPostsBucket = 'media-assets';
  
  final _supabase = SupabaseConfig.client;
  
  /// Format file size for display
  static String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
  
  /// Check if image needs compression based on size
  static bool needsCompression(int bytes) {
    return bytes > autoCompressThresholdBytes;
  }
  
  /// Suggest optimal quality based on file size
  static ImageQuality suggestQuality(int bytes) {
    if (bytes > 4 * 1024 * 1024) return ImageQuality.low;
    if (bytes > 2 * 1024 * 1024) return ImageQuality.medium;
    if (bytes > 1 * 1024 * 1024) return ImageQuality.high;
    return ImageQuality.original;
  }
  
  /// Validate image file before upload using magic bytes detection
  Future<({Uint8List bytes, String mimeType})> validateAndProcessImage(XFile file) async {
    final bytes = await file.readAsBytes();
    
    // Validate file size first
    if (bytes.length > maxFileSizeBytes) {
      throw ImageValidationError(
        'Image too large (${formatFileSize(bytes.length)}). Max 5MB. Try using compression.'
      );
    }
    
    // Detect MIME type from magic bytes (first 12 bytes are sufficient)
    final headerBytes = bytes.length >= 12 
        ? bytes.sublist(0, 12) 
        : bytes;
    
    final mimeType = lookupMimeType(
      file.path, // Used as fallback
      headerBytes: headerBytes,
    );
    
    _log.debug('Detected MIME type: $mimeType, size: ${formatFileSize(bytes.length)}', tag: _tag);
    
    // Validate detected MIME type
    if (mimeType == null || !allowedMimeTypes.contains(mimeType)) {
      throw ImageValidationError('Invalid file type. Use JPG, PNG, or WebP');
    }
    
    return (bytes: bytes, mimeType: mimeType);
  }
  
  /// Get file extension from MIME type
  String _extensionFromMime(String mimeType) {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg'; // Safe fallback
    }
  }
  
  /// Upload image to Supabase Storage
  /// Returns the public URL of the uploaded image
  Future<String> uploadImage({
    required Uint8List bytes,
    required String fileName,
    String mimeType = 'image/jpeg',
    void Function(double)? onProgress,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');
      
      // Generate unique file path with correct extension
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final ext = _extensionFromMime(mimeType);
      final sanitizedName = fileName.replaceAll(RegExp(r'[^a-zA-Z0-9_.]'), '_');
      final path = 'spark-posts/$userId/${timestamp}_$sanitizedName.$ext';
      
      onProgress?.call(0.1);
      
      // Upload to Supabase Storage
      await _supabase.storage
          .from(sparkPostsBucket)
          .uploadBinary(path, bytes, fileOptions: FileOptions(
            contentType: mimeType,
            upsert: true,
          ));
      
      onProgress?.call(0.9);
      
      // Get public URL
      final publicUrl = _supabase.storage
          .from(sparkPostsBucket)
          .getPublicUrl(path);
      
      onProgress?.call(1.0);
      
      _log.info('Image uploaded: ${formatFileSize(bytes.length)}', tag: _tag);
      return publicUrl;
    } catch (e) {
      _log.error('Upload failed', tag: _tag, error: e);
      rethrow;
    }
  }
  
  /// Pick and validate image from gallery with compression options
  Future<({Uint8List bytes, String name, String mimeType, int originalSize})?> pickImage({
    ImageQuality quality = ImageQuality.high,
  }) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: quality.maxDimension.toDouble(),
      maxHeight: quality.maxDimension.toDouble(),
      imageQuality: quality.jpegQuality,
    );
    
    if (image == null) return null;
    
    final result = await validateAndProcessImage(image);
    return (
      bytes: result.bytes, 
      name: image.name, 
      mimeType: result.mimeType,
      originalSize: result.bytes.length,
    );
  }
  
  /// Pick image from camera with compression options
  Future<({Uint8List bytes, String name, String mimeType, int originalSize})?> pickImageFromCamera({
    ImageQuality quality = ImageQuality.high,
  }) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: quality.maxDimension.toDouble(),
      maxHeight: quality.maxDimension.toDouble(),
      imageQuality: quality.jpegQuality,
    );
    
    if (image == null) return null;
    
    final result = await validateAndProcessImage(image);
    return (
      bytes: result.bytes, 
      name: image.name, 
      mimeType: result.mimeType,
      originalSize: result.bytes.length,
    );
  }
  
  /// Re-pick image with different quality (for compression adjustment)
  Future<({Uint8List bytes, String name, String mimeType, int originalSize})?> repickWithQuality({
    required ImageSource source,
    required ImageQuality quality,
  }) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: source,
      maxWidth: quality.maxDimension.toDouble(),
      maxHeight: quality.maxDimension.toDouble(),
      imageQuality: quality.jpegQuality,
    );
    
    if (image == null) return null;
    
    final result = await validateAndProcessImage(image);
    return (
      bytes: result.bytes, 
      name: image.name, 
      mimeType: result.mimeType,
      originalSize: result.bytes.length,
    );
  }
}
