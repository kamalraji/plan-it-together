import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/share_analytics_service.dart';
import 'package:thittam1hub/supabase/spark_service.dart';
import 'package:url_launcher/url_launcher.dart';

/// Service for sharing posts across platforms
class PostSharingService {
  static const String _tag = 'PostSharingService';
  static final _log = LoggingService.instance;
  static const String _baseUrl = 'https://thittam1hub.app';

  /// Generate a deep link for a post
  static String getPostLink(String postId) {
    return '$_baseUrl/post/$postId';
  }

  /// Share post using native share sheet
  static Future<void> sharePost(SparkPost post) async {
    final link = getPostLink(post.id);
    final text = '${post.title}\n\n"${post.content.length > 100 ? '${post.content.substring(0, 100)}...' : post.content}"\n\nby ${post.authorName}';
    
    await Share.share('$text\n\n$link');
    
    // Track share
    await ShareAnalyticsService.recordShare(
      postId: post.id,
      destinationType: 'external',
      platform: 'native_share',
    );
  }

  /// Copy post link to clipboard
  static Future<void> copyLink(BuildContext context, String postId) async {
    final link = getPostLink(postId);
    await Clipboard.setData(ClipboardData(text: link));
    HapticFeedback.lightImpact();
    
    // Track share
    await ShareAnalyticsService.recordShare(
      postId: postId,
      destinationType: 'external',
      platform: 'copy_link',
    );
    
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Link copied to clipboard'),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  /// Share to specific platform
  static Future<void> shareToTwitter(SparkPost post) async {
    try {
      final link = getPostLink(post.id);
      final text = Uri.encodeComponent('${post.title} by ${post.authorName}');
      final url = Uri.parse('https://twitter.com/intent/tweet?text=$text&url=$link');
      
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
        await ShareAnalyticsService.recordShare(
          postId: post.id,
          destinationType: 'external',
          platform: 'twitter',
        );
      } else {
        _log.warning('Cannot launch Twitter share URL', tag: _tag);
      }
    } catch (e) {
      _log.error('Twitter share failed', tag: _tag, error: e);
    }
  }

  static Future<void> shareToLinkedIn(SparkPost post) async {
    try {
      final link = getPostLink(post.id);
      final url = Uri.parse('https://www.linkedin.com/sharing/share-offsite/?url=$link');
      
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
        await ShareAnalyticsService.recordShare(
          postId: post.id,
          destinationType: 'external',
          platform: 'linkedin',
        );
      } else {
        _log.warning('Cannot launch LinkedIn share URL', tag: _tag);
      }
    } catch (e) {
      _log.error('LinkedIn share failed', tag: _tag, error: e);
    }
  }

  static Future<void> shareToWhatsApp(SparkPost post) async {
    try {
      final link = getPostLink(post.id);
      final text = Uri.encodeComponent('${post.title}\n\n${post.content.length > 100 ? '${post.content.substring(0, 100)}...' : post.content}\n\n$link');
      final url = Uri.parse('https://wa.me/?text=$text');
      
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
        await ShareAnalyticsService.recordShare(
          postId: post.id,
          destinationType: 'external',
          platform: 'whatsapp',
        );
      } else {
        _log.warning('Cannot launch WhatsApp share URL', tag: _tag);
      }
    } catch (e) {
      _log.error('WhatsApp share failed', tag: _tag, error: e);
    }
  }

  static Future<void> shareToTelegram(SparkPost post) async {
    try {
      final link = getPostLink(post.id);
      final text = Uri.encodeComponent('${post.title}\n\n$link');
      final url = Uri.parse('https://t.me/share/url?url=$link&text=$text');
      
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
        await ShareAnalyticsService.recordShare(
          postId: post.id,
          destinationType: 'external',
          platform: 'telegram',
        );
      } else {
        _log.warning('Cannot launch Telegram share URL', tag: _tag);
      }
    } catch (e) {
      _log.error('Telegram share failed', tag: _tag, error: e);
    }
  }

  /// Show share sheet with platform options
  static void showShareSheet(BuildContext context, SparkPost post) {
    HapticFeedback.mediumImpact();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _ShareSheet(post: post),
    );
  }
}

/// Share options bottom sheet
class _ShareSheet extends StatelessWidget {
  final SparkPost post;

  const _ShareSheet({required this.post});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            Text(
              'Share Post',
              style: textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),

            // Share options row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _ShareOption(
                  icon: Icons.copy_rounded,
                  label: 'Copy Link',
                  color: cs.primary,
                  onTap: () {
                    Navigator.pop(context);
                    PostSharingService.copyLink(context, post.id);
                  },
                ),
                _ShareOption(
                  icon: Icons.share_rounded,
                  label: 'Share',
                  color: Colors.blue,
                  onTap: () {
                    Navigator.pop(context);
                    PostSharingService.sharePost(post);
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Platform options
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _ShareOption(
                  icon: Icons.whatshot_rounded,
                  label: 'Twitter',
                  color: Colors.blue[400]!,
                  onTap: () {
                    Navigator.pop(context);
                    PostSharingService.shareToTwitter(post);
                  },
                ),
                _ShareOption(
                  icon: Icons.link_rounded,
                  label: 'LinkedIn',
                  color: Colors.blue[700]!,
                  onTap: () {
                    Navigator.pop(context);
                    PostSharingService.shareToLinkedIn(post);
                  },
                ),
                _ShareOption(
                  icon: Icons.chat_bubble_rounded,
                  label: 'WhatsApp',
                  color: Colors.green,
                  onTap: () {
                    Navigator.pop(context);
                    PostSharingService.shareToWhatsApp(post);
                  },
                ),
                _ShareOption(
                  icon: Icons.send_rounded,
                  label: 'Telegram',
                  color: Colors.blue,
                  onTap: () {
                    Navigator.pop(context);
                    PostSharingService.shareToTelegram(post);
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

/// Single share option button
class _ShareOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ShareOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
