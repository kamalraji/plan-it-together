import 'dart:io';
import 'package:http/http.dart' as http;
export 'package:http/http.dart' show get;
import 'package:path_provider/path_provider.dart';
export 'package:path_provider/path_provider.dart' 
    show getExternalStorageDirectory, getApplicationDocumentsDirectory, getDownloadsDirectory;
import 'package:thittam1hub/models/chat_media_models.dart';
import 'package:thittam1hub/services/chat_media_service.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for downloading chat media to device storage
/// 
/// Supports batch downloads with progress tracking, cancellation,
/// and automatic folder organization by date.
class ChatMediaDownloadService {
  static const String _tag = 'ChatMediaDownloadService';
  static final _log = LoggingService.instance;
  
  static ChatMediaDownloadService? _instance;
  static ChatMediaDownloadService get instance => _instance ??= ChatMediaDownloadService._();
  ChatMediaDownloadService._();
  
  bool _isCancelled = false;
  bool _isDownloading = false;
  
  /// Whether a download is currently in progress
  bool get isDownloading => _isDownloading;
  
  /// Download all media from a channel
  /// 
  /// [channelId] - The channel to download media from
  /// [onProgress] - Callback for progress updates (0.0 to 1.0)
  /// [onStatus] - Callback for status text updates
  /// 
  /// Returns the number of files downloaded, or -1 on error
  Future<int> downloadAllMedia({
    required String channelId,
    void Function(double progress)? onProgress,
    void Function(String status)? onStatus,
    MediaType? filterType,
  }) async {
    if (_isDownloading) {
      _log.warning('Download already in progress', tag: _tag);
      return -1;
    }
    
    _isDownloading = true;
    _isCancelled = false;
    
    try {
      onStatus?.call('Fetching media list...');
      onProgress?.call(0.0);
      
      // Get all media items
      final allMedia = await ChatMediaService.fetchChannelMedia(
        channelId: channelId,
        type: filterType,
        limit: 1000, // Fetch all
      );
      
      if (allMedia.isEmpty) {
        onStatus?.call('No media found');
        return 0;
      }
      
      if (_isCancelled) {
        onStatus?.call('Download cancelled');
        return 0;
      }
      
      onStatus?.call('Preparing download folder...');
      
      // Create download directory
      final downloadDir = await _getDownloadDirectory(channelId);
      
      int downloaded = 0;
      int failed = 0;
      
      for (int i = 0; i < allMedia.length; i++) {
        if (_isCancelled) {
          onStatus?.call('Download cancelled after $downloaded files');
          break;
        }
        
        final item = allMedia[i];
        final progress = (i + 1) / allMedia.length;
        onProgress?.call(progress);
        onStatus?.call('Downloading ${i + 1}/${allMedia.length}: ${item.fileName ?? 'file'}');
        
        try {
          final success = await _downloadFile(item, downloadDir);
          if (success) {
            downloaded++;
          } else {
            failed++;
          }
        } catch (e) {
          _log.error('Failed to download ${item.url}', tag: _tag, error: e);
          failed++;
        }
      }
      
      onProgress?.call(1.0);
      onStatus?.call('Downloaded $downloaded files${failed > 0 ? ' ($failed failed)' : ''}');
      
      return downloaded;
    } catch (e) {
      _log.error('downloadAllMedia failed', tag: _tag, error: e);
      onStatus?.call('Download failed: $e');
      return -1;
    } finally {
      _isDownloading = false;
    }
  }
  
  /// Download a single media item
  Future<String?> downloadSingleMedia(ChatMediaItem item) async {
    try {
      final downloadDir = await _getDownloadDirectory(item.channelId);
      final success = await _downloadFile(item, downloadDir);
      
      if (success) {
        return '${downloadDir.path}/${_getFileName(item)}';
      }
      return null;
    } catch (e) {
      _log.error('downloadSingleMedia failed', tag: _tag, error: e);
      return null;
    }
  }
  
  /// Cancel ongoing download
  void cancelDownload() {
    _isCancelled = true;
  }
  
  /// Get the download directory for a channel
  Future<Directory> _getDownloadDirectory(String channelId) async {
    Directory baseDir;
    
    if (Platform.isAndroid) {
      // Use external storage on Android
      final externalDir = await getExternalStorageDirectory();
      baseDir = externalDir ?? await getApplicationDocumentsDirectory();
    } else if (Platform.isIOS) {
      baseDir = await getApplicationDocumentsDirectory();
    } else {
      baseDir = await getDownloadsDirectory() ?? await getApplicationDocumentsDirectory();
    }
    
    final chatMediaDir = Directory('${baseDir.path}/ChatMedia/$channelId');
    
    if (!await chatMediaDir.exists()) {
      await chatMediaDir.create(recursive: true);
    }
    
    return chatMediaDir;
  }
  
  /// Download a file to the specified directory
  Future<bool> _downloadFile(ChatMediaItem item, Directory targetDir) async {
    if (item.url == null || item.url!.isEmpty) {
      return false;
    }
    
    try {
      final response = await http.get(Uri.parse(item.url!));
      
      if (response.statusCode != 200) {
        _log.warning('HTTP ${response.statusCode} for ${item.url}', tag: _tag);
        return false;
      }
      
      final fileName = _getFileName(item);
      final file = File('${targetDir.path}/$fileName');
      
      await file.writeAsBytes(response.bodyBytes);
      
      _log.debug('Saved $fileName', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Download file failed', tag: _tag, error: e);
      return false;
    }
  }
  
  /// Generate a unique filename for a media item
  String _getFileName(ChatMediaItem item) {
    // Use existing filename if available
    if (item.fileName != null && item.fileName!.isNotEmpty) {
      // Add timestamp prefix to avoid conflicts
      final timestamp = item.createdAt.millisecondsSinceEpoch;
      return '${timestamp}_${item.fileName}';
    }
    
    // Generate filename from URL or ID
    final extension = _getExtension(item);
    final timestamp = item.createdAt.millisecondsSinceEpoch;
    
    return '${item.type.name}_$timestamp$extension';
  }
  
  /// Get file extension based on media type and mime type
  String _getExtension(ChatMediaItem item) {
    // Try to get from mime type
    if (item.mimeType != null) {
      final parts = item.mimeType!.split('/');
      if (parts.length == 2) {
        final ext = parts[1].toLowerCase();
        // Map common mime subtypes to extensions
        switch (ext) {
          case 'jpeg':
            return '.jpg';
          case 'png':
          case 'gif':
          case 'webp':
          case 'svg+xml':
            return '.$ext';
          case 'mp4':
          case 'webm':
          case 'quicktime':
            return ext == 'quicktime' ? '.mov' : '.$ext';
          case 'pdf':
          case 'doc':
          case 'docx':
          case 'xls':
          case 'xlsx':
            return '.$ext';
          default:
            break;
        }
      }
    }
    
    // Fall back based on media type
    switch (item.type) {
      case MediaType.photo:
        return '.jpg';
      case MediaType.video:
        return '.mp4';
      case MediaType.document:
        return '.pdf';
      case MediaType.link:
        return '.html';
    }
  }
  
  /// Get storage usage for downloaded media
  Future<int> getDownloadedStorageBytes(String channelId) async {
    try {
      final dir = await _getDownloadDirectory(channelId);
      
      if (!await dir.exists()) {
        return 0;
      }
      
      int totalBytes = 0;
      await for (final entity in dir.list(recursive: true)) {
        if (entity is File) {
          totalBytes += await entity.length();
        }
      }
      
      return totalBytes;
    } catch (e) {
      _log.error('getDownloadedStorageBytes failed', tag: _tag, error: e);
      return 0;
    }
  }
  
  /// Clear all downloaded media for a channel
  Future<bool> clearDownloadedMedia(String channelId) async {
    try {
      final dir = await _getDownloadDirectory(channelId);
      
      if (await dir.exists()) {
        await dir.delete(recursive: true);
      }
      
      return true;
    } catch (e) {
      _log.error('clearDownloadedMedia failed', tag: _tag, error: e);
      return false;
    }
  }
}
