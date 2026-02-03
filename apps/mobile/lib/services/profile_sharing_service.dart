import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thittam1hub/services/qr_code_service.dart';

/// Service for profile sharing with deep links and social media integration
class ProfileSharingService {
  static const String _baseUrl = 'https://thittam1hub.app';
  
  /// Generate profile deep link URL
  static String getProfileUrl(String userId) {
    return '$_baseUrl/profile/$userId';
  }
  
  /// Generate short profile URL for QR codes (uses /p/ route)
  static String getShortProfileUrl(String userId) {
    return QrCodeService.getShortProfileUrl(userId);
  }
  
  /// Copy profile URL with haptic feedback
  static Future<void> copyProfileUrlWithFeedback(String userId) async {
    final url = getShortProfileUrl(userId);
    await Clipboard.setData(ClipboardData(text: url));
    HapticFeedback.lightImpact();
  }
  
  /// Share profile QR as text (URL)
  static Future<void> shareProfileQr({
    required String userId,
    required String displayName,
    String? headline,
  }) async {
    final url = getShortProfileUrl(userId);
    await Share.share(
      'Connect with $displayName on Thittam1Hub!\n\n${headline ?? 'Check out my profile!'}\n\n$url',
      subject: 'Connect with $displayName',
    );
  }
  
  /// Generate short profile handle URL (if user has handle)
  static String getProfileHandleUrl(String handle) {
    return '$_baseUrl/@$handle';
  }
  
  /// Generate event deep link URL
  static String getEventUrl(String eventId) {
    return '$_baseUrl/events/$eventId';
  }
  
  /// Share profile with native share dialog
  static Future<void> shareProfile({
    required String userId,
    required String displayName,
    String? headline,
    String? handle,
  }) async {
    final profileUrl = getProfileUrl(userId);
    final handleText = handle != null ? '@$handle' : '';
    
    final shareText = '''
$displayName $handleText on Thittam1Hub

${headline ?? 'Check out my profile!'}

$profileUrl
''';
    
    await Share.share(
      shareText.trim(),
      subject: '$displayName on Thittam1Hub',
    );
  }
  
  /// Share profile to specific platform
  static Future<void> shareToTwitter({
    required String userId,
    required String displayName,
    String? headline,
  }) async {
    final profileUrl = getProfileUrl(userId);
    final text = '${headline ?? 'Check out my profile on Thittam1Hub!'}\n\n$profileUrl';
    final encodedText = Uri.encodeComponent(text);
    final twitterUrl = 'https://twitter.com/intent/tweet?text=$encodedText';
    
    await _launchUrl(twitterUrl);
  }
  
  static Future<void> shareToLinkedIn({
    required String userId,
    required String displayName,
  }) async {
    final profileUrl = getProfileUrl(userId);
    final encodedUrl = Uri.encodeComponent(profileUrl);
    final linkedInUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=$encodedUrl';
    
    await _launchUrl(linkedInUrl);
  }
  
  static Future<void> shareToWhatsApp({
    required String userId,
    required String displayName,
    String? headline,
  }) async {
    final profileUrl = getProfileUrl(userId);
    final text = '${displayName}\'s profile on Thittam1Hub\n\n${headline ?? ''}\n\n$profileUrl';
    final encodedText = Uri.encodeComponent(text.trim());
    final whatsAppUrl = 'https://wa.me/?text=$encodedText';
    
    await _launchUrl(whatsAppUrl);
  }
  
  static Future<void> shareToTelegram({
    required String userId,
    required String displayName,
    String? headline,
  }) async {
    final profileUrl = getProfileUrl(userId);
    final text = '${displayName}\'s profile on Thittam1Hub\n\n${headline ?? ''}\n\n$profileUrl';
    final encodedText = Uri.encodeComponent(text.trim());
    final encodedUrl = Uri.encodeComponent(profileUrl);
    final telegramUrl = 'https://t.me/share/url?url=$encodedUrl&text=$encodedText';
    
    await _launchUrl(telegramUrl);
  }
  
  /// Copy profile URL to clipboard
  static Future<void> copyProfileUrl(String userId) async {
    final profileUrl = getProfileUrl(userId);
    await Clipboard.setData(ClipboardData(text: profileUrl));
    HapticFeedback.lightImpact();
  }
  
  /// Open profile URL in browser
  static Future<void> openInBrowser(String userId) async {
    final profileUrl = getProfileUrl(userId);
    await _launchUrl(profileUrl);
  }
  
  static Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
  
  /// Get meta tag data for social media preview cards
  static Map<String, String> getSocialMetaTags({
    required String displayName,
    required String profileUrl,
    String? headline,
    String? avatarUrl,
    int? impactScore,
    int? eventsAttended,
    int? followersCount,
  }) {
    final description = headline ?? 
      'Impact Score: ${impactScore ?? 0} • ${eventsAttended ?? 0} Events • ${followersCount ?? 0} Followers';
    
    return {
      'og:title': '$displayName on Thittam1Hub',
      'og:description': description,
      'og:url': profileUrl,
      'og:type': 'profile',
      'og:image': avatarUrl ?? '$_baseUrl/images/og-default.png',
      'og:site_name': 'Thittam1Hub',
      'twitter:card': 'summary',
      'twitter:title': '$displayName on Thittam1Hub',
      'twitter:description': description,
      'twitter:image': avatarUrl ?? '$_baseUrl/images/og-default.png',
    };
  }
}
