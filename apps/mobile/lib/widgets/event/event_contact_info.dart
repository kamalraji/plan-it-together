import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thittam1hub/theme.dart';

/// Displays event contact information with actionable items
class EventContactInfo extends StatelessWidget {
  final String? email;
  final String? phone;
  final String? website;

  const EventContactInfo({
    super.key,
    this.email,
    this.phone,
    this.website,
  });

  bool get hasContactInfo => email != null || phone != null || website != null;

  @override
  Widget build(BuildContext context) {
    if (!hasContactInfo) return const SizedBox.shrink();

    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Contact',
          style: text.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: cs.outline),
          ),
          child: Column(
            children: [
              if (email != null)
                _ContactTile(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: email!,
                  onTap: () => _launchUrl('mailto:$email'),
                  onLongPress: () => _copyToClipboard(context, email!),
                ),
              if (email != null && (phone != null || website != null))
                Divider(height: 1, color: cs.outline),
              if (phone != null)
                _ContactTile(
                  icon: Icons.phone_outlined,
                  label: 'Phone',
                  value: phone!,
                  onTap: () => _launchUrl('tel:$phone'),
                  onLongPress: () => _copyToClipboard(context, phone!),
                ),
              if (phone != null && website != null)
                Divider(height: 1, color: cs.outline),
              if (website != null)
                _ContactTile(
                  icon: Icons.language,
                  label: 'Website',
                  value: _formatWebsite(website!),
                  onTap: () => _launchUrl(website!),
                  onLongPress: () => _copyToClipboard(context, website!),
                ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatWebsite(String url) {
    return url
        .replaceFirst(RegExp(r'^https?://'), '')
        .replaceFirst(RegExp(r'^www\.'), '')
        .replaceFirst(RegExp(r'/$'), '');
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _copyToClipboard(BuildContext context, String value) {
    Clipboard.setData(ClipboardData(text: value));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Copied to clipboard'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _ContactTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return InkWell(
      onTap: onTap,
      onLongPress: onLongPress,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: cs.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 20, color: cs.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: text.labelSmall?.copyWith(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: text.bodyMedium?.copyWith(
                      color: cs.primary,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
          ],
        ),
      ),
    );
  }
}
