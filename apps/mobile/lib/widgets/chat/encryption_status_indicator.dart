import 'package:flutter/material.dart';
import '../../models/encryption_models.dart';
import '../../services/e2e_encryption_service.dart';
import '../../services/key_verification_service.dart';

/// Small indicator showing encryption status in chat UI
class EncryptionStatusIndicator extends StatelessWidget {
  final EncryptionStatus status;
  final bool showLabel;
  final double iconSize;

  const EncryptionStatusIndicator({
    super.key,
    required this.status,
    this.showLabel = true,
    this.iconSize = 14,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    final (icon, color, tooltip) = switch (status) {
      EncryptionStatus.encrypted => (
          Icons.lock,
          Colors.green,
          'End-to-end encrypted',
        ),
      EncryptionStatus.transportOnly => (
          Icons.lock_open,
          colorScheme.outline,
          'Transport encryption only',
        ),
      EncryptionStatus.legacy => (
          Icons.lock_open,
          colorScheme.error.withOpacity(0.7),
          'Legacy message (unencrypted)',
        ),
      EncryptionStatus.failed => (
          Icons.error_outline,
          colorScheme.error,
          'Encryption failed',
        ),
    };

    return Tooltip(
      message: tooltip,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: iconSize, color: color),
          if (showLabel) ...[
            const SizedBox(width: 4),
            Text(
              status.shortLabel,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: color,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Banner shown in chat to indicate encryption status
class EncryptionBanner extends StatelessWidget {
  final String? recipientUserId;
  final bool isGroupChat;

  const EncryptionBanner({
    super.key,
    this.recipientUserId,
    this.isGroupChat = false,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_BannerData>(
      future: _loadBannerData(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const SizedBox.shrink();
        }

        final data = snapshot.data!;
        final colorScheme = Theme.of(context).colorScheme;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: data.isEncrypted
                ? Colors.green.withOpacity(0.1)
                : colorScheme.surfaceContainerHighest.withOpacity(0.5),
            border: Border(
              bottom: BorderSide(
                color: colorScheme.outline.withOpacity(0.1),
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                data.isEncrypted ? Icons.lock : Icons.lock_open,
                size: 14,
                color: data.isEncrypted ? Colors.green : colorScheme.outline,
              ),
              const SizedBox(width: 8),
              Text(
                data.message,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: data.isEncrypted
                          ? Colors.green.shade700
                          : colorScheme.onSurfaceVariant,
                    ),
              ),
              if (data.isVerified) ...[
                const SizedBox(width: 8),
                Icon(
                  Icons.verified,
                  size: 14,
                  color: Colors.green.shade700,
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Future<_BannerData> _loadBannerData() async {
    final encryptionService = E2EEncryptionService.instance;
    final hasKeys = await encryptionService.hasKeyPair();

    if (!hasKeys) {
      return _BannerData(
        isEncrypted: false,
        isVerified: false,
        message: 'Set up encryption to secure your messages',
      );
    }

    if (isGroupChat) {
      return _BannerData(
        isEncrypted: true,
        isVerified: false,
        message: 'Messages are end-to-end encrypted',
      );
    }

    if (recipientUserId != null) {
      final isVerified = await KeyVerificationService.instance
          .isUserVerified(recipientUserId!);
      
      return _BannerData(
        isEncrypted: true,
        isVerified: isVerified,
        message: isVerified
            ? 'Verified end-to-end encrypted'
            : 'Messages are end-to-end encrypted',
      );
    }

    return _BannerData(
      isEncrypted: true,
      isVerified: false,
      message: 'Messages are end-to-end encrypted',
    );
  }
}

class _BannerData {
  final bool isEncrypted;
  final bool isVerified;
  final String message;

  _BannerData({
    required this.isEncrypted,
    required this.isVerified,
    required this.message,
  });
}

/// Lock icon for message input field
class MessageInputEncryptionIcon extends StatelessWidget {
  final VoidCallback? onTap;

  const MessageInputEncryptionIcon({
    super.key,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: E2EEncryptionService.instance.hasKeyPair(),
      builder: (context, snapshot) {
        final hasKeys = snapshot.data ?? false;
        final colorScheme = Theme.of(context).colorScheme;

        return GestureDetector(
          onTap: onTap,
          child: Tooltip(
            message: hasKeys
                ? 'End-to-end encrypted'
                : 'Tap to set up encryption',
            child: Container(
              padding: const EdgeInsets.all(8),
              child: Icon(
                hasKeys ? Icons.lock : Icons.lock_open,
                size: 18,
                color: hasKeys ? Colors.green : colorScheme.outline,
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Verified badge for user avatars
class VerifiedBadge extends StatelessWidget {
  final String oderId;
  final double size;

  const VerifiedBadge({
    super.key,
    required this.oderId,
    this.size = 16,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: KeyVerificationService.instance.isUserVerified(oderId),
      builder: (context, snapshot) {
        if (snapshot.data != true) {
          return const SizedBox.shrink();
        }

        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
              ),
            ],
          ),
          child: Icon(
            Icons.verified,
            size: size,
            color: Colors.green,
          ),
        );
      },
    );
  }
}
