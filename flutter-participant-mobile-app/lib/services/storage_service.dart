import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
export 'package:path_provider/path_provider.dart' 
    show getTemporaryDirectory, getApplicationDocumentsDirectory, getExternalStorageDirectory, getDownloadsDirectory;
import 'package:shared_preferences/shared_preferences.dart';
export 'package:shared_preferences/shared_preferences.dart' show SharedPreferences;
import 'package:thittam1hub/services/logging_service.dart';

/// Storage category for breakdown display
class StorageCategory {
  final String name;
  final int bytes;
  final Color color;

  const StorageCategory({
    required this.name,
    required this.bytes,
    required this.color,
  });

  double get sizeMB => bytes / (1024 * 1024);

  String get formattedSize {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
}

/// Storage breakdown result
class StorageBreakdown {
  final List<StorageCategory> categories;
  final int totalBytes;
  final DateTime calculatedAt;

  const StorageBreakdown({
    required this.categories,
    required this.totalBytes,
    required this.calculatedAt,
  });

  double get totalMB => totalBytes / (1024 * 1024);

  String get formattedTotal {
    if (totalBytes < 1024) return '$totalBytes B';
    if (totalBytes < 1024 * 1024) return '${(totalBytes / 1024).toStringAsFixed(1)} KB';
    if (totalBytes < 1024 * 1024 * 1024) return '${(totalBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(totalBytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
}

/// Service for calculating and managing app storage
/// Uses SharedPreferences for web compatibility
class StorageService extends ChangeNotifier {
  static const String _tag = 'StorageService';
  static final _log = LoggingService.instance;
  
  static StorageService? _instance;
  static StorageService get instance => _instance ??= StorageService._();

  StorageService._();

  StorageBreakdown? _breakdown;
  bool _isCalculating = false;
  String? _error;

  StorageBreakdown? get breakdown => _breakdown;
  bool get isCalculating => _isCalculating;
  String? get error => _error;

  /// Calculate storage breakdown for all app data
  Future<StorageBreakdown> calculateStorage() async {
    _isCalculating = true;
    _error = null;
    notifyListeners();

    try {
      final categories = <StorageCategory>[];
      int total = 0;

      // Calculate SharedPreferences cache size (estimate)
      final prefsSize = await _calculatePrefsSize();
      if (prefsSize > 0) {
        categories.add(StorageCategory(
          name: 'Cache',
          bytes: prefsSize,
          color: Colors.blue,
        ));
        total += prefsSize;
      }

      // Calculate image cache size (mobile only)
      if (!kIsWeb) {
        final imageCacheSize = await _calculateImageCacheSize();
        if (imageCacheSize > 0) {
          categories.add(StorageCategory(
            name: 'Images',
            bytes: imageCacheSize,
            color: Colors.green,
          ));
          total += imageCacheSize;
        }

        // Calculate temp files size
        final tempSize = await _calculateTempSize();
        if (tempSize > 0) {
          categories.add(StorageCategory(
            name: 'Temp Files',
            bytes: tempSize,
            color: Colors.orange,
          ));
          total += tempSize;
        }

        // Calculate documents size (offline data)
        final docsSize = await _calculateDocumentsSize();
        if (docsSize > 0) {
          categories.add(StorageCategory(
            name: 'Offline Data',
            bytes: docsSize,
            color: Colors.purple,
          ));
          total += docsSize;
        }
      }

      _breakdown = StorageBreakdown(
        categories: categories,
        totalBytes: total,
        calculatedAt: DateTime.now(),
      );

      _isCalculating = false;
      notifyListeners();

      return _breakdown!;
    } catch (e) {
      _error = e.toString();
      _isCalculating = false;
      notifyListeners();
      rethrow;
    }
  }

  /// Calculate SharedPreferences size (estimate based on keys)
  Future<int> _calculatePrefsSize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      int estimate = 0;
      
      for (final key in keys) {
        // Estimate size based on value type
        final value = prefs.get(key);
        if (value is String) {
          estimate = estimate + key.length + value.length;
        } else if (value is List<String>) {
          estimate = estimate + key.length + value.fold<int>(0, (sum, s) => sum + s.length);
        } else {
          estimate = estimate + key.length + 8; // Rough estimate for primitives
        }
      }
      
      return estimate;
    } catch (e) {
      _log.error('Error calculating prefs size', tag: _tag, error: e);
      return 0;
    }
  }

  /// Calculate image cache size (mobile only)
  Future<int> _calculateImageCacheSize() async {
    if (kIsWeb) return 0;

    try {
      final tempDir = await getTemporaryDirectory();
      final cacheDir = Directory('${tempDir.path}/libCachedImageData');
      if (await cacheDir.exists()) {
        return await _getDirectorySize(cacheDir);
      }
    } catch (e) {
      _log.error('Error calculating image cache size', tag: _tag, error: e);
    }
    return 0;
  }

  /// Calculate temp directory size
  Future<int> _calculateTempSize() async {
    if (kIsWeb) return 0;

    try {
      final tempDir = await getTemporaryDirectory();
      return await _getDirectorySize(tempDir);
    } catch (e) {
      _log.error('Error calculating temp size', tag: _tag, error: e);
    }
    return 0;
  }

  /// Calculate documents directory size
  Future<int> _calculateDocumentsSize() async {
    if (kIsWeb) return 0;

    try {
      final docsDir = await getApplicationDocumentsDirectory();
      final appDataDir = Directory('${docsDir.path}/app_data');
      if (await appDataDir.exists()) {
        return await _getDirectorySize(appDataDir);
      }
    } catch (e) {
      _log.error('Error calculating documents size', tag: _tag, error: e);
    }
    return 0;
  }

  /// Get total size of a directory
  Future<int> _getDirectorySize(Directory dir) async {
    int size = 0;
    try {
      await for (final entity in dir.list(recursive: true, followLinks: false)) {
        if (entity is File) {
          size += await entity.length();
        }
      }
    } catch (e) {
      _log.error('Error getting directory size', tag: _tag, error: e);
    }
    return size;
  }

  /// Clear all cached data
  Future<void> clearAllCache() async {
    try {
      // Clear SharedPreferences cache keys
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().toList();
      for (final key in keys) {
        if (key.startsWith('cached_') || 
            key.startsWith('cache_') || 
            key.startsWith('offline_')) {
          await prefs.remove(key);
        }
      }

      // Clear temp directory on mobile
      if (!kIsWeb) {
        final tempDir = await getTemporaryDirectory();
        await _clearDirectory(tempDir);
      }

      // Recalculate storage
      await calculateStorage();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Clear image cache only
  Future<void> clearImageCache() async {
    if (kIsWeb) return;

    try {
      final tempDir = await getTemporaryDirectory();
      final cacheDir = Directory('${tempDir.path}/libCachedImageData');
      if (await cacheDir.exists()) {
        await _clearDirectory(cacheDir);
      }
      await calculateStorage();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Clear chat cache only
  Future<void> clearChatCache() async {
    try {
      // Clear chat-related SharedPreferences keys
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().toList();
      for (final key in keys) {
        if (key.startsWith('messages_') || key.startsWith('chat_')) {
          await prefs.remove(key);
        }
      }
      await calculateStorage();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Clear directory contents
  Future<void> _clearDirectory(Directory dir) async {
    try {
      await for (final entity in dir.list(followLinks: false)) {
        await entity.delete(recursive: true);
      }
    } catch (e) {
      _log.error('Error clearing directory', tag: _tag, error: e);
    }
  }
}
