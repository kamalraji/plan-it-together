import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/qr_code_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart' hide QrCodeSkeleton;
import 'package:thittam1hub/widgets/qr_code_display.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';

import 'package:thittam1hub/services/logging_service.dart';

/// Profile QR Code screen
/// Displays a scannable QR code that links to the user's public profile
class QrCodePage extends StatefulWidget {
  const QrCodePage({super.key});

  @override
  State<QrCodePage> createState() => _QrCodePageState();
}

class _QrCodePageState extends State<QrCodePage> {
  static final _log = LoggingService.instance;
  static const String _tag = 'QrCodePage';
  
  final _profileService = ProfileService.instance;
  String? _userId;
  String _fullName = 'User';
  String? _headline;
  String? _avatarUrl;
  String? _email;
  String? _organization;
  bool _isLoading = true;
  bool _isBright = false;
  bool _isVCard = false; // Toggle between profile link and vCard

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final profile = await _profileService.getUserProfile(userId);
      if (profile != null && mounted) {
        setState(() {
          _userId = userId;
          _fullName = profile.fullName ?? 'User';
          _headline = profile.bio; // Use bio as headline
          _avatarUrl = profile.avatarUrl;
          _email = SupabaseConfig.auth.currentUser?.email;
          _organization = profile.organization;
          _isLoading = false;
        });
      } else if (mounted) {
        setState(() {
          _userId = userId;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load profile: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _userId = userId;
          _isLoading = false;
        });
      }
    }
  }

  String get _qrData {
    if (_userId == null) return '';

    if (_isVCard) {
      return QrCodeService.generateVCard(
        fullName: _fullName,
        email: _email,
        organization: _organization,
        title: _headline,
      );
    }

    return QrCodeService.generateProfileQrData(_userId!);
  }

  String get _profileUrl {
    if (_userId == null) return '';
    return QrCodeService.getShortProfileUrl(_userId!);
  }

  Future<void> _copyToClipboard() async {
    if (_userId == null) return;

    final textToCopy = _isVCard ? 'vCard Contact' : _profileUrl;
    await Clipboard.setData(ClipboardData(text: _isVCard ? _qrData : _profileUrl));
    HapticFeedback.lightImpact();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isVCard ? 'vCard copied to clipboard' : 'Profile URL copied'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  Future<void> _shareQrCode() async {
    if (_userId == null) return;
    HapticFeedback.lightImpact();

    if (_isVCard) {
      await Share.share(
        _qrData,
        subject: 'Contact Card - $_fullName',
      );
    } else {
      await Share.share(
        'Connect with $_fullName on Thittam1Hub!\n\n${_headline ?? 'Check out my profile!'}\n\n$_profileUrl',
        subject: 'Connect with $_fullName',
      );
    }
  }

  void _toggleBrightness() {
    HapticFeedback.lightImpact();
    setState(() => _isBright = !_isBright);
  }

  void _toggleFormat() {
    HapticFeedback.lightImpact();
    setState(() => _isVCard = !_isVCard);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile QR'),
        actions: [
          if (_userId != null) ...[
            IconButton(
              icon: const Icon(Icons.share),
              onPressed: _shareQrCode,
              tooltip: 'Share',
            ),
            IconButton(
              icon: Icon(
                _isBright ? Icons.brightness_high : Icons.brightness_medium,
              ),
              onPressed: _toggleBrightness,
              tooltip: _isBright ? 'Normal brightness' : 'Boost brightness',
            ),
          ],
        ],
      ),
      body: _isLoading
          ? Padding(
              padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: AppSpacing.xl),
              child: const Center(
                child: QrCodeSkeleton(),
              ),
            )
          : _userId == null
              ? _buildErrorState(cs)
              : _buildContent(cs),
    );
  }

  Widget _buildErrorState(ColorScheme cs) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 64, color: cs.error),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Unable to generate QR code',
              style: context.textStyles.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Please try again later',
              style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton.icon(
              onPressed: () {
                setState(() => _isLoading = true);
                _loadProfile();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(ColorScheme cs) {
    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: AppSpacing.xl),
      child: Column(
        children: [
          // Profile preview card
          FadeSlideTransition(
            child: _ProfilePreviewCard(
              avatarUrl: _avatarUrl,
              fullName: _fullName,
              headline: _headline,
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // QR Code
          FadeSlideTransition(
            delay: const Duration(milliseconds: 100),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: _isBright ? Colors.white : cs.surface,
                borderRadius: BorderRadius.circular(AppRadius.xl),
                border: Border.all(
                  color: _isBright
                      ? Colors.grey.shade200
                      : cs.outlineVariant.withValues(alpha: 0.5),
                ),
                boxShadow: [
                  BoxShadow(
                    color: _isBright
                        ? Colors.black.withValues(alpha: 0.15)
                        : Colors.black.withValues(alpha: 0.05),
                    blurRadius: _isBright ? 30 : 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  QrCodeDisplay(
                    data: _qrData,
                    size: 220,
                    brightMode: _isBright,
                    showShadow: false,
                    padding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: AppSpacing.md),

                  // Format toggle
                  _FormatToggle(
                    isVCard: _isVCard,
                    onToggle: _toggleFormat,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // Instruction & URL preview
          FadeSlideTransition(
            delay: const Duration(milliseconds: 200),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: cs.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _isVCard ? Icons.contact_phone : Icons.qr_code_scanner,
                        size: 16,
                        color: cs.primary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isVCard
                            ? 'Scan to save contact'
                            : 'Scan to view my profile',
                        style: context.textStyles.labelMedium?.withColor(cs.primary),
                      ),
                    ],
                  ),
                ),

                if (!_isVCard) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    _profileUrl,
                    style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.xl),

          // Action buttons
          FadeSlideTransition(
            delay: const Duration(milliseconds: 300),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _copyToClipboard,
                    icon: const Icon(Icons.copy),
                    label: Text(_isVCard ? 'Copy vCard' : 'Copy URL'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _shareQrCode,
                    icon: const Icon(Icons.share),
                    label: const Text('Share'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Profile preview card showing avatar, name, and headline
class _ProfilePreviewCard extends StatelessWidget {
  final String? avatarUrl;
  final String fullName;
  final String? headline;

  const _ProfilePreviewCard({
    this.avatarUrl,
    required this.fullName,
    this.headline,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          StyledAvatar(
            url: avatarUrl,
            name: fullName,
            size: 48,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fullName,
                  style: context.textStyles.titleMedium?.bold,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (headline != null && headline!.isNotEmpty)
                  Text(
                    headline!,
                    style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          Icon(
            Icons.verified_user,
            color: cs.primary,
            size: 20,
          ),
        ],
      ),
    );
  }
}

/// Format toggle between Profile Link and vCard
class _FormatToggle extends StatelessWidget {
  final bool isVCard;
  final VoidCallback onToggle;

  const _FormatToggle({
    required this.isVCard,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ToggleButton(
            label: 'Profile Link',
            icon: Icons.link,
            isSelected: !isVCard,
            onTap: isVCard ? onToggle : null,
          ),
          _ToggleButton(
            label: 'Contact Card',
            icon: Icons.contact_phone,
            isSelected: isVCard,
            onTap: !isVCard ? onToggle : null,
          ),
        ],
      ),
    );
  }
}

class _ToggleButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback? onTap;

  const _ToggleButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? cs.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: context.textStyles.labelSmall?.copyWith(
                color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
