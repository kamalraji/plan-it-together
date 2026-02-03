import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/models/user_ticket.dart';
import 'package:thittam1hub/services/ticket_download_service.dart';
import 'package:thittam1hub/services/ticket_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/widgets/ticket/ticket_widgets.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Ticket detail page with event-specific QR code
class TicketDetailPage extends StatefulWidget {
  final String registrationId;
  final UserTicket? ticket;

  const TicketDetailPage({
    super.key,
    required this.registrationId,
    this.ticket,
  });

  @override
  State<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends State<TicketDetailPage> {
  // Logging
  static final _log = LoggingService.instance;
  static const String _tag = 'TicketDetailPage';
  
  final _ticketService = TicketService();
  final GlobalKey _ticketCardKey = GlobalKey();
  UserTicket? _ticket;
  bool _isLoading = true;
  bool _isBright = false;
  bool _isFullScreen = false;
  bool _isDownloading = false;

  @override
  void initState() {
    super.initState();
    if (widget.ticket != null) {
      _ticket = widget.ticket;
      _isLoading = false;
    } else {
      _loadTicket();
    }
  }

  Future<void> _loadTicket({bool showLoading = true}) async {
    if (showLoading && mounted) {
      setState(() => _isLoading = true);
    }
    try {
      final ticket = await _ticketService.getTicketById(widget.registrationId);
      if (mounted) {
        setState(() {
          _ticket = ticket;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load ticket: $e', tag: _tag);
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _refreshTicket() async {
    HapticFeedback.mediumImpact();
    await _loadTicket(showLoading: false);
  }

  void _toggleBrightness() {
    HapticFeedback.lightImpact();
    setState(() => _isBright = !_isBright);
  }

  void _toggleFullScreen() {
    HapticFeedback.mediumImpact();
    setState(() => _isFullScreen = !_isFullScreen);
    if (_isFullScreen) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    } else {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    }
  }

  Future<void> _shareTicket() async {
    if (_ticket == null) return;
    HapticFeedback.lightImpact();

    final dateFormat = DateFormat('EEEE, MMMM d, yyyy');
    final timeFormat = DateFormat('h:mm a');

    await Share.share(
      '''🎫 My Event Ticket

📌 ${_ticket!.eventName}
🏢 ${_ticket!.organizationName}
📅 ${dateFormat.format(_ticket!.startDate)}
🕐 ${timeFormat.format(_ticket!.startDate)}
🎟️ ${_ticket!.tierName} × ${_ticket!.quantity}

Ticket Code: ${_ticket!.ticketQrCode}

Get your ticket on Thittam1Hub!''',
      subject: 'Event Ticket - ${_ticket!.eventName}',
    );
  }

  Future<void> _copyQrCode() async {
    if (_ticket == null) return;
    HapticFeedback.mediumImpact();
    await Clipboard.setData(ClipboardData(text: _ticket!.ticketQrCode));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Ticket code copied to clipboard'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  Future<void> _downloadTicket() async {
    if (_ticket == null || _isDownloading) return;
    
    setState(() => _isDownloading = true);
    HapticFeedback.mediumImpact();
    
    try {
      // Try to capture the widget first
      final imageBytes = await TicketDownloadService.captureWidget(_ticketCardKey);
      
      if (imageBytes != null) {
        final fileName = 'ticket_${_ticket!.eventName.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}_${DateTime.now().millisecondsSinceEpoch}.png';
        final savedPath = await TicketDownloadService.saveToDownloads(imageBytes, fileName);
        
        if (mounted) {
          if (savedPath != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    const Expanded(child: Text('Ticket saved to downloads')),
                    TextButton(
                      onPressed: () => TicketDownloadService.shareTicket(
                        imageBytes,
                        _ticket!.eventName,
                      ),
                      child: const Text('Share', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
                backgroundColor: AppColors.success,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                duration: const Duration(seconds: 4),
              ),
            );
          } else {
            // Fallback: Share instead of save
            await TicketDownloadService.shareTicket(imageBytes, _ticket!.eventName);
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Failed to capture ticket. Please try again.'),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      }
    } catch (e) {
      _log.error('Download ticket error: $e', tag: _tag);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to download ticket'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ticket')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_ticket == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ticket')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 64, color: cs.error),
              const SizedBox(height: AppSpacing.md),
              Text('Ticket not found', style: context.textStyles.titleMedium),
            ],
          ),
        ),
      );
    }

    final ticket = _ticket!;

    if (_isFullScreen) {
      return _buildFullScreenQR(ticket, cs, isDark);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Event Ticket'),
        actions: [
          IconButton(
            icon: _isDownloading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.download),
            onPressed: _isDownloading ? null : _downloadTicket,
            tooltip: 'Download Ticket',
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _shareTicket,
            tooltip: 'Share Ticket',
          ),
          IconButton(
            icon: Icon(
                _isBright ? Icons.brightness_high : Icons.brightness_medium),
            onPressed: _toggleBrightness,
            tooltip: _isBright ? 'Normal brightness' : 'Boost brightness',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshTicket,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: AppSpacing.md),
        child: Column(
          children: [
            // Countdown timer for upcoming events
            if (ticket.isUpcoming)
              FadeSlideTransition(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: CountdownTimer(
                    targetDate: ticket.startDate,
                    compact: false,
                  ),
                ),
              ),
            
            // Check-in status card
            FadeSlideTransition(
              delay: const Duration(milliseconds: 50),
              child: Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: CheckinStatusCard(ticket: ticket),
              ),
            ),

            // Hero ticket card - wrapped in RepaintBoundary for screenshot
            RepaintBoundary(
              key: _ticketCardKey,
              child: Hero(
                tag: HeroConfig.ticketCardTag(ticket.registrationId),
                child: _TicketDetailCard(
                  ticket: ticket,
                  isBright: _isBright,
                  onQrTap: _toggleFullScreen,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // Quick actions bar
            FadeSlideTransition(
              delay: const Duration(milliseconds: 100),
              child: TicketQuickActions(
                ticket: ticket,
                onDownload: _downloadTicket,
                onShare: _shareTicket,
                isDownloading: _isDownloading,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Event details
            FadeSlideTransition(
              delay: const Duration(milliseconds: 150),
              child: _EventDetailsCard(ticket: ticket),
            ),
            const SizedBox(height: AppSpacing.md),

            // Ticket info
            FadeSlideTransition(
              delay: const Duration(milliseconds: 200),
              child: _TicketInfoCard(ticket: ticket),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Action buttons - Enhanced layout
            FadeSlideTransition(
              delay: const Duration(milliseconds: 250),
              child: Column(
                children: [
                  // Add to Calendar button
                  AddToCalendarButton(ticket: ticket),
                  const SizedBox(height: AppSpacing.sm),
                  // Download button (full width, prominent)
                  FilledButton.icon(
                    onPressed: _isDownloading ? null : _downloadTicket,
                    icon: _isDownloading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.download),
                    label: Text(_isDownloading ? 'Saving...' : 'Save to Gallery'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      backgroundColor: AppColors.success,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  // Copy and Share row
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _copyQrCode,
                          icon: const Icon(Icons.copy),
                          label: const Text('Copy Code'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(48),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _shareTicket,
                          icon: const Icon(Icons.share),
                          label: const Text('Share'),
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(48),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            
            // Important notes section
            FadeSlideTransition(
              delay: const Duration(milliseconds: 300),
              child: _ImportantNotesCard(ticket: ticket),
            ),
          ],
        ),
        ),
      ),
    );
  }

  Widget _buildFullScreenQR(UserTicket ticket, ColorScheme cs, bool isDark) {
    return Scaffold(
      backgroundColor:
          _isBright ? Colors.white : (isDark ? Colors.black : cs.surface),
      body: GestureDetector(
        onTap: _toggleFullScreen,
        child: Container(
          width: double.infinity,
          height: double.infinity,
          color: _isBright ? Colors.white : Colors.transparent,
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Event name
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                  child: Text(
                    ticket.eventName,
                    style: context.textStyles.titleLarge?.bold?.copyWith(
                      color: _isBright ? Colors.black : cs.onSurface,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  ticket.organizationName,
                  style: context.textStyles.bodyMedium?.copyWith(
                    color: _isBright ? Colors.grey[600] : cs.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // Large QR code
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.xl),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black
                            .withValues(alpha: _isBright ? 0.15 : 0.1),
                        blurRadius: 30,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: QrImageView(
                    data: ticket.ticketQrCode,
                    version: QrVersions.auto,
                    size: MediaQuery.of(context).size.width * 0.7,
                    backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Colors.black,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // Tier badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: cs.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.local_activity, size: 18, color: cs.primary),
                      const SizedBox(width: 6),
                      Text(
                        '${ticket.tierName} × ${ticket.quantity}',
                        style: context.textStyles.labelLarge?.copyWith(
                          color: cs.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // Tap to close hint
                Text(
                  'Tap anywhere to close',
                  style: context.textStyles.bodySmall?.copyWith(
                    color: _isBright ? Colors.grey : cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Ticket detail card with QR code
class _TicketDetailCard extends StatelessWidget {
  final UserTicket ticket;
  final bool isBright;
  final VoidCallback onQrTap;

  const _TicketDetailCard({
    required this.ticket,
    required this.isBright,
    required this.onQrTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.xl),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : Colors.white.withValues(alpha: 0.95),
            borderRadius: BorderRadius.circular(AppRadius.xl),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.15)
                  : Colors.black.withValues(alpha: 0.08),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.15),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            children: [
              // QR code section
              GestureDetector(
                onTap: onQrTap,
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: isBright ? Colors.white : null,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(AppRadius.xl),
                    ),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black
                                  .withValues(alpha: isBright ? 0.15 : 0.08),
                              blurRadius: 20,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: QrImageView(
                          data: ticket.ticketQrCode,
                          version: QrVersions.auto,
                          size: 200,
                          backgroundColor: Colors.white,
                          eyeStyle: const QrEyeStyle(
                            eyeShape: QrEyeShape.square,
                            color: Colors.black,
                          ),
                          dataModuleStyle: const QrDataModuleStyle(
                            dataModuleShape: QrDataModuleShape.square,
                            color: Colors.black,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: cs.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.fullscreen,
                                size: 16, color: cs.onSurfaceVariant),
                            const SizedBox(width: 4),
                            Text(
                              'Tap for full screen',
                              style: context.textStyles.labelSmall
                                  ?.withColor(cs.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Perforated divider
              _buildPerforatedDivider(cs, isDark),

              // Event info footer
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  children: [
                    Text(
                      ticket.eventName,
                      style: context.textStyles.titleMedium?.bold,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      ticket.organizationName,
                      style: context.textStyles.bodySmall
                          ?.withColor(cs.onSurfaceVariant),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    _StatusBadge(ticket: ticket),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPerforatedDivider(ColorScheme cs, bool isDark) {
    return Stack(
      children: [
        Positioned(
          left: -12,
          top: -12,
          child: Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A1A1A) : cs.surfaceContainer,
              shape: BoxShape.circle,
            ),
          ),
        ),
        Positioned(
          right: -12,
          top: -12,
          child: Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A1A1A) : cs.surfaceContainer,
              shape: BoxShape.circle,
            ),
          ),
        ),
        Container(
          height: 1,
          margin: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            children: List.generate(
              40,
              (i) => Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 1),
                  height: 1,
                  color: i.isEven
                      ? cs.outline.withValues(alpha: 0.3)
                      : Colors.transparent,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Status badge
class _StatusBadge extends StatelessWidget {
  final UserTicket ticket;

  const _StatusBadge({required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: ticket.statusColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(
          color: ticket.statusColor.withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: ticket.statusColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            ticket.statusLabel,
            style: context.textStyles.labelSmall?.copyWith(
              color: ticket.statusColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Event details card
class _EventDetailsCard extends StatelessWidget {
  final UserTicket ticket;

  const _EventDetailsCard({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final dateFormat = DateFormat('EEEE, MMMM d, yyyy');
    final timeFormat = DateFormat('h:mm a');

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Event Details',
            style: context.textStyles.titleSmall?.bold,
          ),
          const SizedBox(height: AppSpacing.md),
          _DetailRow(
            icon: Icons.calendar_today_outlined,
            label: 'Date',
            value: dateFormat.format(ticket.startDate),
          ),
          const SizedBox(height: AppSpacing.sm),
          _DetailRow(
            icon: Icons.schedule,
            label: 'Time',
            value:
                '${timeFormat.format(ticket.startDate)} - ${timeFormat.format(ticket.endDate)}',
          ),
          const SizedBox(height: AppSpacing.sm),
          _DetailRow(
            icon: ticket.modeIcon,
            label: 'Mode',
            value: ticket.modeLabel,
          ),
          const SizedBox(height: AppSpacing.sm),
          _DetailRow(
            icon: Icons.business,
            label: 'Organizer',
            value: ticket.organizationName,
          ),
        ],
      ),
    );
  }
}

/// Ticket info card
class _TicketInfoCard extends StatelessWidget {
  final UserTicket ticket;

  const _TicketInfoCard({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final dateFormat = DateFormat('MMM d, yyyy • h:mm a');

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Ticket Information',
            style: context.textStyles.titleSmall?.bold,
          ),
          const SizedBox(height: AppSpacing.md),
          _DetailRow(
            icon: Icons.local_activity,
            label: 'Tier',
            value: ticket.tierName,
          ),
          const SizedBox(height: AppSpacing.sm),
          _DetailRow(
            icon: Icons.confirmation_number,
            label: 'Quantity',
            value: '${ticket.quantity} ticket${ticket.quantity > 1 ? 's' : ''}',
          ),
          const SizedBox(height: AppSpacing.sm),
          _DetailRow(
            icon: Icons.payments_outlined,
            label: 'Amount',
            value: ticket.isFree
                ? 'Free'
                : '${ticket.currency} ${ticket.totalAmount.toStringAsFixed(0)}',
          ),
          const SizedBox(height: AppSpacing.sm),
          _DetailRow(
            icon: Icons.receipt_long_outlined,
            label: 'Purchased',
            value: dateFormat.format(ticket.purchasedAt),
          ),
        ],
      ),
    );
  }
}

/// Detail row widget
class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: cs.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: cs.primary),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: context.textStyles.labelSmall
                    ?.withColor(cs.onSurfaceVariant),
              ),
              Text(
                value,
                style: context.textStyles.bodyMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Important notes card with accessibility and event-specific tips
class _ImportantNotesCard extends StatelessWidget {
  final UserTicket ticket;

  const _ImportantNotesCard({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.info.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.info.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, size: 20, color: AppColors.info),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Important Information',
                style: context.textStyles.titleSmall?.copyWith(
                  color: AppColors.info,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _NoteItem(
            icon: Icons.qr_code_scanner,
            text: 'Have your QR code ready for check-in at the venue',
          ),
          const SizedBox(height: AppSpacing.sm),
          _NoteItem(
            icon: Icons.photo_camera_outlined,
            text: 'Screenshots of QR codes are accepted',
          ),
          if (ticket.mode.name == 'ONLINE')
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.sm),
              child: _NoteItem(
                icon: Icons.videocam_outlined,
                text: 'Join link will be shared via email before the event',
              ),
            ),
          if (ticket.mode.name == 'OFFLINE' || ticket.mode.name == 'HYBRID')
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.sm),
              child: _NoteItem(
                icon: Icons.badge_outlined,
                text: 'Carry a valid ID for verification',
              ),
            ),
          const SizedBox(height: AppSpacing.sm),
          _NoteItem(
            icon: Icons.help_outline,
            text: 'Contact the organizer for any queries',
          ),
        ],
      ),
    );
  }
}

class _NoteItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const _NoteItem({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: cs.onSurfaceVariant),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            text,
            style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
          ),
        ),
      ],
    );
  }
}
