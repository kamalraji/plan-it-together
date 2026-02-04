import 'package:flutter/material.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/offline_action_queue.dart';
import 'package:thittam1hub/theme.dart';

/// Banner that shows connection status and pending message count
class ChatConnectionBanner extends StatefulWidget {
  final bool showPendingCount;
  
  const ChatConnectionBanner({
    super.key,
    this.showPendingCount = true,
  });

  @override
  State<ChatConnectionBanner> createState() => _ChatConnectionBannerState();
}

class _ChatConnectionBannerState extends State<ChatConnectionBanner>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _slideAnimation;
  late final Animation<double> _fadeAnimation;
  
  bool _isOnline = true;
  int _pendingCount = 0;
  SyncStatus _syncStatus = SyncStatus.idle;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _slideAnimation = Tween<double>(begin: -1.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _isOnline = ConnectivityService.instance.isOnline;
    _pendingCount = OfflineActionQueue.instance.pendingCount;
    _syncStatus = OfflineActionQueue.instance.syncStatus;
    
    if (!_isOnline || _pendingCount > 0) {
      _controller.forward();
    }

    OfflineActionQueue.instance.addOnQueueChangedListener(_onQueueChanged);
    OfflineActionQueue.instance.addOnStatusChangedListener(_onStatusChanged);
  }

  void _onQueueChanged() {
    if (!mounted) return;
    final newCount = OfflineActionQueue.instance.pendingCount;
    final wasVisible = !_isOnline || _pendingCount > 0;
    final shouldBeVisible = !_isOnline || newCount > 0;
    
    setState(() => _pendingCount = newCount);
    
    if (shouldBeVisible && !wasVisible) {
      _controller.forward();
    } else if (!shouldBeVisible && wasVisible) {
      _controller.reverse();
    }
  }

  void _onStatusChanged(SyncStatus status) {
    if (!mounted) return;
    setState(() => _syncStatus = status);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _checkConnectivity();
  }

  void _checkConnectivity() {
    final wasOnline = _isOnline;
    _isOnline = ConnectivityService.instance.isOnline;
    
    if (!_isOnline && wasOnline) {
      _controller.forward();
    } else if (_isOnline && !wasOnline && _pendingCount == 0) {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    OfflineActionQueue.instance.removeOnQueueChangedListener(_onQueueChanged);
    OfflineActionQueue.instance.removeOnStatusChangedListener(_onStatusChanged);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        if (_controller.value == 0) return const SizedBox.shrink();
        
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, -1),
            end: Offset.zero,
          ).animate(_slideAnimation),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                color: _bannerColor(colors),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: SafeArea(
                bottom: false,
                child: Row(
                  children: [
                    _buildIcon(colors),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _title,
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: _textColor(colors),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (_subtitle != null)
                            Text(
                              _subtitle!,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: _textColor(colors).withOpacity(0.8),
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (_isOnline && _pendingCount > 0)
                      TextButton(
                        onPressed: () => OfflineActionQueue.instance.forceSyncNow(),
                        style: TextButton.styleFrom(
                          foregroundColor: _textColor(colors),
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm,
                          ),
                        ),
                        child: const Text('Sync Now'),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildIcon(ColorScheme colors) {
    if (!_isOnline) {
      return Icon(
        Icons.cloud_off,
        size: 20,
        color: _textColor(colors),
      );
    }
    
    switch (_syncStatus) {
      case SyncStatus.syncing:
        return SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: _textColor(colors),
          ),
        );
      case SyncStatus.retrying:
        return Icon(
          Icons.sync,
          size: 20,
          color: _textColor(colors),
        );
      case SyncStatus.failed:
        return Icon(
          Icons.error_outline,
          size: 20,
          color: _textColor(colors),
        );
      default:
        return Icon(
          Icons.cloud_queue,
          size: 20,
          color: _textColor(colors),
        );
    }
  }

  Color _bannerColor(ColorScheme colors) {
    if (!_isOnline) {
      return colors.errorContainer;
    }
    switch (_syncStatus) {
      case SyncStatus.failed:
        return colors.errorContainer;
      case SyncStatus.syncing:
      case SyncStatus.retrying:
        return colors.primaryContainer;
      default:
        return colors.secondaryContainer;
    }
  }

  Color _textColor(ColorScheme colors) {
    if (!_isOnline) {
      return colors.onErrorContainer;
    }
    switch (_syncStatus) {
      case SyncStatus.failed:
        return colors.onErrorContainer;
      case SyncStatus.syncing:
      case SyncStatus.retrying:
        return colors.onPrimaryContainer;
      default:
        return colors.onSecondaryContainer;
    }
  }

  String get _title {
    if (!_isOnline) {
      return 'You\'re offline';
    }
    switch (_syncStatus) {
      case SyncStatus.syncing:
        return 'Syncing messages...';
      case SyncStatus.retrying:
        return 'Retrying failed messages...';
      case SyncStatus.failed:
        return 'Some messages failed to send';
      default:
        return '$_pendingCount pending';
    }
  }

  String? get _subtitle {
    if (!_isOnline) {
      return _pendingCount > 0 
          ? '$_pendingCount message${_pendingCount == 1 ? '' : 's'} queued'
          : 'Messages will be sent when you reconnect';
    }
    if (_syncStatus == SyncStatus.failed) {
      return 'Tap "Sync Now" to retry';
    }
    return null;
  }
}
