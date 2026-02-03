/// YouTube URL parsing and validation utilities
/// 
/// Industrial-grade parser supporting all YouTube URL formats:
/// - Standard watch URLs: youtube.com/watch?v=VIDEO_ID
/// - Short URLs: youtu.be/VIDEO_ID
/// - Embed URLs: youtube.com/embed/VIDEO_ID
/// - Live URLs: youtube.com/live/VIDEO_ID
/// - Shorts: youtube.com/shorts/VIDEO_ID
/// - Mobile URLs: m.youtube.com/watch?v=VIDEO_ID

class YouTubeUtils {
  YouTubeUtils._();

  /// YouTube video ID length (always 11 characters)
  static const int videoIdLength = 11;

  /// Regex pattern for valid YouTube video ID
  static final RegExp _videoIdPattern = RegExp(r'^[a-zA-Z0-9_-]{11}$');

  /// Patterns to extract video ID from various YouTube URL formats
  static final List<RegExp> _urlPatterns = [
    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    RegExp(r'(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})'),
    // Short URL: youtu.be/VIDEO_ID
    RegExp(r'(?:youtu\.be\/)([a-zA-Z0-9_-]{11})'),
    // Embed URL: youtube.com/embed/VIDEO_ID
    RegExp(r'(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})'),
    // Live URL: youtube.com/live/VIDEO_ID
    RegExp(r'(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})'),
    // Shorts URL: youtube.com/shorts/VIDEO_ID
    RegExp(r'(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})'),
    // Mobile URL: m.youtube.com/watch?v=VIDEO_ID
    RegExp(r'(?:m\.youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})'),
    // YouTube-nocookie: youtube-nocookie.com/embed/VIDEO_ID
    RegExp(r'(?:youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})'),
    // Just the video ID (direct input)
    RegExp(r'^([a-zA-Z0-9_-]{11})$'),
  ];

  /// Extract video ID from a YouTube URL
  /// 
  /// Returns the 11-character video ID or null if not found.
  /// 
  /// Example:
  /// ```dart
  /// YouTubeUtils.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  /// // Returns: 'dQw4w9WgXcQ'
  /// ```
  static String? extractVideoId(String url) {
    if (url.isEmpty) return null;

    final trimmedUrl = url.trim();

    for (final pattern in _urlPatterns) {
      final match = pattern.firstMatch(trimmedUrl);
      if (match != null && match.groupCount >= 1) {
        final videoId = match.group(1);
        if (videoId != null && isValidVideoId(videoId)) {
          return videoId;
        }
      }
    }

    return null;
  }

  /// Validate if a string is a valid YouTube video ID
  /// 
  /// Video IDs are exactly 11 characters, alphanumeric with hyphens and underscores.
  static bool isValidVideoId(String videoId) {
    return videoId.length == videoIdLength && _videoIdPattern.hasMatch(videoId);
  }

  /// Check if a URL is a valid YouTube URL
  static bool isValidYouTubeUrl(String url) {
    return extractVideoId(url) != null;
  }

  /// Build standard embed URL for a video ID
  /// 
  /// Parameters:
  /// - [videoId]: The 11-character YouTube video ID
  /// - [autoplay]: Start playing immediately (default: true)
  /// - [showControls]: Show player controls (default: true)
  /// - [modestBranding]: Use minimal YouTube branding (default: true)
  /// - [playsinline]: Play inline on mobile (default: true)
  /// - [enablejsapi]: Enable JavaScript API (default: true)
  static String buildEmbedUrl(
    String videoId, {
    bool autoplay = true,
    bool showControls = true,
    bool modestBranding = true,
    bool playsinline = true,
    bool enablejsapi = true,
    bool rel = false,
  }) {
    if (!isValidVideoId(videoId)) {
      throw ArgumentError('Invalid YouTube video ID: $videoId');
    }

    final params = <String, String>{
      if (autoplay) 'autoplay': '1',
      if (!showControls) 'controls': '0',
      if (modestBranding) 'modestbranding': '1',
      if (playsinline) 'playsinline': '1',
      if (enablejsapi) 'enablejsapi': '1',
      if (!rel) 'rel': '0',
    };

    final queryString = params.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&');

    return 'https://www.youtube.com/embed/$videoId?$queryString';
  }

  /// Build privacy-enhanced embed URL (no cookies)
  static String buildPrivacyEmbedUrl(
    String videoId, {
    bool autoplay = true,
    bool showControls = true,
  }) {
    if (!isValidVideoId(videoId)) {
      throw ArgumentError('Invalid YouTube video ID: $videoId');
    }

    final params = <String, String>{
      if (autoplay) 'autoplay': '1',
      if (!showControls) 'controls': '0',
      'modestbranding': '1',
      'playsinline': '1',
      'rel': '0',
    };

    final queryString = params.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&');

    return 'https://www.youtube-nocookie.com/embed/$videoId?$queryString';
  }

  /// Get thumbnail URL for a video
  /// 
  /// Quality options:
  /// - 'default': 120x90
  /// - 'mqdefault': 320x180
  /// - 'hqdefault': 480x360
  /// - 'sddefault': 640x480
  /// - 'maxresdefault': 1280x720 (may not exist for all videos)
  static String getThumbnailUrl(String videoId, {String quality = 'maxresdefault'}) {
    if (!isValidVideoId(videoId)) {
      return '';
    }
    return 'https://img.youtube.com/vi/$videoId/$quality.jpg';
  }

  /// Get all available thumbnail URLs for a video
  static Map<String, String> getAllThumbnails(String videoId) {
    if (!isValidVideoId(videoId)) {
      return {};
    }
    
    return {
      'default': getThumbnailUrl(videoId, quality: 'default'),
      'medium': getThumbnailUrl(videoId, quality: 'mqdefault'),
      'high': getThumbnailUrl(videoId, quality: 'hqdefault'),
      'standard': getThumbnailUrl(videoId, quality: 'sddefault'),
      'maxres': getThumbnailUrl(videoId, quality: 'maxresdefault'),
    };
  }

  /// Build watch URL for a video
  static String buildWatchUrl(String videoId) {
    if (!isValidVideoId(videoId)) {
      throw ArgumentError('Invalid YouTube video ID: $videoId');
    }
    return 'https://www.youtube.com/watch?v=$videoId';
  }

  /// Build live URL for a video
  static String buildLiveUrl(String videoId) {
    if (!isValidVideoId(videoId)) {
      throw ArgumentError('Invalid YouTube video ID: $videoId');
    }
    return 'https://www.youtube.com/live/$videoId';
  }

  /// Sanitize and validate a stream URL input
  /// 
  /// Returns a sanitized video ID or null if invalid.
  /// This should be used for all user input before storage.
  static String? sanitizeStreamInput(String input) {
    if (input.isEmpty) return null;

    // Remove leading/trailing whitespace
    final trimmed = input.trim();

    // Extract video ID
    final videoId = extractVideoId(trimmed);

    // Double-check the extracted ID is valid
    if (videoId != null && isValidVideoId(videoId)) {
      return videoId;
    }

    return null;
  }
}

/// Vimeo URL parsing utilities
class VimeoUtils {
  VimeoUtils._();

  /// Regex pattern for Vimeo video IDs (numeric)
  static final RegExp _videoIdPattern = RegExp(r'^\d+$');

  /// Patterns to extract video ID from Vimeo URLs
  static final List<RegExp> _urlPatterns = [
    // Standard URL: vimeo.com/VIDEO_ID
    RegExp(r'(?:vimeo\.com\/)(\d+)'),
    // Player URL: player.vimeo.com/video/VIDEO_ID
    RegExp(r'(?:player\.vimeo\.com\/video\/)(\d+)'),
    // Just the video ID
    RegExp(r'^(\d+)$'),
  ];

  /// Extract video ID from a Vimeo URL
  static String? extractVideoId(String url) {
    if (url.isEmpty) return null;

    final trimmedUrl = url.trim();

    for (final pattern in _urlPatterns) {
      final match = pattern.firstMatch(trimmedUrl);
      if (match != null && match.groupCount >= 1) {
        return match.group(1);
      }
    }

    return null;
  }

  /// Validate if a string is a valid Vimeo video ID
  static bool isValidVideoId(String videoId) {
    return _videoIdPattern.hasMatch(videoId);
  }

  /// Check if a URL is a valid Vimeo URL
  static bool isValidVimeoUrl(String url) {
    return extractVideoId(url) != null;
  }

  /// Build embed URL for Vimeo
  static String buildEmbedUrl(
    String videoId, {
    bool autoplay = true,
    bool title = false,
    bool byline = false,
    bool portrait = false,
  }) {
    if (!isValidVideoId(videoId)) {
      throw ArgumentError('Invalid Vimeo video ID: $videoId');
    }

    final params = <String, String>{
      if (autoplay) 'autoplay': '1',
      if (!title) 'title': '0',
      if (!byline) 'byline': '0',
      if (!portrait) 'portrait': '0',
    };

    final queryString = params.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&');

    return 'https://player.vimeo.com/video/$videoId?$queryString';
  }

  /// Get thumbnail URL (uses vumbnail service)
  static String getThumbnailUrl(String videoId) {
    if (!isValidVideoId(videoId)) return '';
    return 'https://vumbnail.com/$videoId.jpg';
  }
}

/// Unified stream URL utilities
class StreamUrlUtils {
  StreamUrlUtils._();

  /// Detect platform from URL
  static String detectPlatform(String url) {
    if (YouTubeUtils.isValidYouTubeUrl(url)) {
      return 'YOUTUBE';
    } else if (VimeoUtils.isValidVimeoUrl(url)) {
      return 'VIMEO';
    } else {
      return 'CUSTOM';
    }
  }

  /// Extract video ID from any supported platform URL
  static String? extractVideoId(String url) {
    // Try YouTube first
    final youtubeId = YouTubeUtils.extractVideoId(url);
    if (youtubeId != null) return youtubeId;

    // Try Vimeo
    final vimeoId = VimeoUtils.extractVideoId(url);
    if (vimeoId != null) return vimeoId;

    return null;
  }

  /// Parse and validate a stream URL input
  /// Returns platform and video ID, or null if invalid
  static ({String platform, String videoId})? parseStreamUrl(String url) {
    // Try YouTube
    final youtubeId = YouTubeUtils.extractVideoId(url);
    if (youtubeId != null) {
      return (platform: 'YOUTUBE', videoId: youtubeId);
    }

    // Try Vimeo
    final vimeoId = VimeoUtils.extractVideoId(url);
    if (vimeoId != null) {
      return (platform: 'VIMEO', videoId: vimeoId);
    }

    return null;
  }
}
