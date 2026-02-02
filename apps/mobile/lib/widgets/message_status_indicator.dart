import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Message delivery status
enum MessageStatus {
  sending,
  sent,
  delivered,
  read,
  failed,
}

/// Animated message status indicator (checkmarks)
class MessageStatusIndicator extends StatelessWidget {
  final MessageStatus status;
  final double size;
  final Color? color;

  const MessageStatusIndicator({
    super.key,
    required this.status,
    this.size = 16,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    switch (status) {
      case MessageStatus.sending:
        return SizedBox(
          width: size,
          height: size,
          child: CircularProgressIndicator(
            strokeWidth: 1.5,
            color: color ?? theme.colorScheme.onSurface.withValues(alpha: 0.4),
          ),
        );
      
      case MessageStatus.sent:
        return Icon(
          Icons.check,
          size: size,
          color: color ?? theme.colorScheme.onSurface.withValues(alpha: 0.5),
        );
      
      case MessageStatus.delivered:
        return _DoubleCheck(
          size: size,
          color: color ?? theme.colorScheme.onSurface.withValues(alpha: 0.5),
        );
      
      case MessageStatus.read:
        return _DoubleCheck(
          size: size,
          color: color ?? theme.colorScheme.primary,
        );
      
      case MessageStatus.failed:
        return Icon(
          Icons.error_outline,
          size: size,
          color: AppColors.error,
        );
    }
  }
}

class _DoubleCheck extends StatelessWidget {
  final double size;
  final Color color;

  const _DoubleCheck({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size * 1.2,
      height: size,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            child: Icon(Icons.check, size: size, color: color),
          ),
          Positioned(
            left: size * 0.3,
            child: Icon(Icons.check, size: size, color: color),
          ),
        ],
      ),
    );
  }
}

/// Read receipts avatar stack
class ReadReceiptsAvatars extends StatelessWidget {
  final List<String> userNames;
  final List<String?> avatarUrls;
  final int maxDisplay;
  final double size;

  const ReadReceiptsAvatars({
    super.key,
    required this.userNames,
    this.avatarUrls = const [],
    this.maxDisplay = 3,
    this.size = 16,
  });

  @override
  Widget build(BuildContext context) {
    if (userNames.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final displayCount = userNames.length > maxDisplay ? maxDisplay : userNames.length;
    final extra = userNames.length - maxDisplay;

    return SizedBox(
      width: (size * 0.7) * displayCount + size,
      height: size,
      child: Stack(
        children: [
          for (int i = 0; i < displayCount; i++)
            Positioned(
              left: i * (size * 0.7),
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _avatarColor(userNames[i]),
                  border: Border.all(
                    color: theme.colorScheme.surface,
                    width: 1,
                  ),
                ),
                child: avatarUrls.length > i && avatarUrls[i] != null
                    ? ClipOval(
                        child: Image.network(
                          avatarUrls[i]!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildInitial(userNames[i]),
                        ),
                      )
                    : _buildInitial(userNames[i]),
              ),
            ),
          if (extra > 0)
            Positioned(
              left: displayCount * (size * 0.7),
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.surfaceContainerHighest,
                  border: Border.all(
                    color: theme.colorScheme.surface,
                    width: 1,
                  ),
                ),
                child: Center(
                  child: Text(
                    '+$extra',
                    style: TextStyle(
                      fontSize: size * 0.45,
                      fontWeight: FontWeight.w500,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInitial(String name) {
    return Center(
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: TextStyle(
          fontSize: size * 0.55,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
      ),
    );
  }

  Color _avatarColor(String name) {
    final hash = name.codeUnits.fold(0, (p, c) => p + c);
    final colors = [
      AppColors.indigo500,
      AppColors.teal500,
      AppColors.pink500,
      AppColors.violet500,
      AppColors.emerald500,
    ];
    return colors[hash % colors.length];
  }
}
