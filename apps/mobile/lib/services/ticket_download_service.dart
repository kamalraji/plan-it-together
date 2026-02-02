import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/models/user_ticket.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for downloading ticket cards as PNG images
class TicketDownloadService {
  static const String _tag = 'TicketDownloadService';
  static final _log = LoggingService.instance;
  /// Capture a widget using GlobalKey and save as PNG
  static Future<Uint8List?> captureWidget(GlobalKey key) async {
    try {
      final boundary = key.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return null;

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (e) {
      _log.error('Failed to capture widget', tag: _tag, error: e);
      return null;
    }
  }

  /// Generate a downloadable ticket image from ticket data
  static Future<Uint8List?> generateTicketImage(UserTicket ticket) async {
    try {
      // Canvas dimensions for a horizontal ticket
      const width = 800.0;
      const height = 280.0;

      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder, Rect.fromLTWH(0, 0, width, height));

      // Draw the ticket
      await _drawTicketCard(canvas, ticket, width, height);

      final picture = recorder.endRecording();
      final image = await picture.toImage(width.toInt(), height.toInt());
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (e) {
      _log.error('Failed to generate ticket image', tag: _tag, error: e);
      return null;
    }
  }

  /// Draw ticket card on canvas
  static Future<void> _drawTicketCard(
    Canvas canvas,
    UserTicket ticket,
    double width,
    double height,
  ) async {
    // Background gradient
    final bgRect = Rect.fromLTWH(0, 0, width, height);
    final bgGradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        AppColors.primary,
        AppColors.primary.withValues(alpha: 0.8),
      ],
    );
    canvas.drawRect(bgRect, Paint()..shader = bgGradient.createShader(bgRect));

    // Stub section (left side with QR)
    const stubWidth = 200.0;
    final stubRect = RRect.fromLTRBR(16, 16, stubWidth, height - 16, const Radius.circular(12));
    canvas.drawRRect(stubRect, Paint()..color = Colors.white.withValues(alpha: 0.1));

    // Decorative circles at stub edge
    for (int i = 0; i < 8; i++) {
      final cy = 40.0 + (i * 28.0);
      canvas.drawCircle(
        Offset(stubWidth, cy),
        6,
        Paint()..color = AppColors.primary,
      );
    }

    // Details section (non-const calculation)
    // ignore: prefer_const_declarations
    final double detailsWidth = width - stubWidth - 60;
    final detailsRect = RRect.fromLTRBR(
      stubWidth + 30,
      16,
      width - 16,
      height - 16,
      const Radius.circular(12),
    );
    canvas.drawRRect(detailsRect, Paint()..color = Colors.white.withValues(alpha: 0.08));

    // === Draw Stub Content ===
    // Ticket tier badge
    final tierPainter = TextPainter(
      text: TextSpan(
        text: ticket.tierName.toUpperCase(),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
    
    final tierBgRect = RRect.fromLTRBR(
      (stubWidth - tierPainter.width - 16) / 2,
      30,
      (stubWidth + tierPainter.width + 16) / 2,
      50,
      const Radius.circular(4),
    );
    canvas.drawRRect(tierBgRect, Paint()..color = Colors.white.withValues(alpha: 0.25));
    tierPainter.paint(canvas, Offset((stubWidth - tierPainter.width) / 2, 35));

    // QR code placeholder area (white box)
    const qrSize = 120.0;
    final qrRect = RRect.fromLTRBR(
      (stubWidth - qrSize) / 2,
      70,
      (stubWidth + qrSize) / 2,
      70 + qrSize,
      const Radius.circular(8),
    );
    canvas.drawRRect(qrRect, Paint()..color = Colors.white);

    // Draw QR code
    await _drawQrCode(canvas, ticket.ticketQrCode, (stubWidth - qrSize) / 2 + 10, 80, qrSize - 20);

    // Ticket ID
    final ticketId = 'ID ${ticket.registrationId.substring(0, 6).toUpperCase()}';
    final idPainter = TextPainter(
      text: TextSpan(
        text: ticketId,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.8),
          fontSize: 10,
          letterSpacing: 0.5,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
    idPainter.paint(canvas, Offset((stubWidth - idPainter.width) / 2, 200));

    // Admit count
    final admitText = 'Admit ${ticket.quantity}';
    final admitPainter = TextPainter(
      text: TextSpan(
        text: admitText,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
    admitPainter.paint(canvas, Offset((stubWidth - admitPainter.width) / 2, 230));

    // === Draw Details Content ===
    final detailsX = stubWidth + 60.0;

    // Organization name
    final orgPainter = TextPainter(
      text: TextSpan(
        text: ticket.organizationName.toUpperCase(),
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.6),
          fontSize: 10,
          letterSpacing: 1,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
    orgPainter.paint(canvas, Offset(detailsX, 24));

    // Event name (bold, multi-line)
    final eventPainter = TextPainter(
      text: TextSpan(
        text: ticket.eventName.toUpperCase(),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 24,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
          height: 1.1,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
      maxLines: 2,
      ellipsis: '...',
    )..layout(maxWidth: detailsWidth - 40);
    eventPainter.paint(canvas, Offset(detailsX, 44));

    // Date and time boxes
    final dateFormat = DateFormat('dd.MM');
    final timeFormat = DateFormat('HH:mm');
    
    _drawInfoBox(canvas, detailsX, height - 80, dateFormat.format(ticket.startDate), DateFormat('yyyy').format(ticket.startDate));
    _drawInfoBox(canvas, detailsX + 80, height - 80, timeFormat.format(ticket.startDate), ticket.modeLabel);

    // Status badge
    final statusColor = ticket.statusColor;
    final statusText = ticket.statusLabel.toUpperCase();
    final statusPainter = TextPainter(
      text: TextSpan(
        text: statusText,
        style: TextStyle(
          color: statusColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
    
    final statusRect = RRect.fromLTRBR(
      width - statusPainter.width - 50,
      height - 60,
      width - 20,
      height - 30,
      const Radius.circular(4),
    );
    canvas.drawRRect(statusRect, Paint()..color = statusColor.withValues(alpha: 0.2));
    canvas.drawRRect(
      statusRect,
      Paint()
        ..color = statusColor.withValues(alpha: 0.5)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );
    
    // Status dot
    canvas.drawCircle(
      Offset(width - statusPainter.width - 40, height - 45),
      4,
      Paint()..color = statusColor,
    );
    
    statusPainter.paint(canvas, Offset(width - statusPainter.width - 30, height - 50));
  }

  /// Draw an info box (for date/time)
  static void _drawInfoBox(Canvas canvas, double x, double y, String primary, String secondary) {
    final boxRect = RRect.fromLTRBR(x, y, x + 70, y + 50, const Radius.circular(4));
    canvas.drawRRect(boxRect, Paint()..color = Colors.white.withValues(alpha: 0.1));

    final primaryPainter = TextPainter(
      text: TextSpan(
        text: primary,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
    primaryPainter.paint(canvas, Offset(x + (70 - primaryPainter.width) / 2, y + 8));

    final secondaryPainter = TextPainter(
      text: TextSpan(
        text: secondary,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.6),
          fontSize: 10,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
    secondaryPainter.paint(canvas, Offset(x + (70 - secondaryPainter.width) / 2, y + 30));
  }

  /// Draw a simple QR code pattern
  static Future<void> _drawQrCode(Canvas canvas, String data, double x, double y, double size) async {
    try {
      // Create QR painter
      final qrPainter = QrPainter(
        data: data,
        version: QrVersions.auto,
        gapless: true,
        color: Colors.black,
        emptyColor: Colors.white,
      );

      // Use the paint method with canvas
      final qrImage = await qrPainter.toImage(size);
      canvas.drawImage(qrImage, Offset(x, y), Paint());
    } catch (e) {
      _log.warning('Failed to draw QR', tag: _tag, error: e);
      // Fallback: draw a placeholder
      canvas.drawRect(
        Rect.fromLTWH(x, y, size, size),
        Paint()..color = Colors.grey.shade300,
      );
    }
  }

  /// Save ticket image to downloads folder
  static Future<String?> saveToDownloads(Uint8List imageBytes, String eventName) async {
    try {
      // Request storage permission on Android
      if (Platform.isAndroid) {
        final status = await Permission.storage.request();
        if (!status.isGranted) {
          return null;
        }
      }

      // Get downloads directory
      Directory? directory;
      if (Platform.isAndroid) {
        directory = Directory('/storage/emulated/0/Download');
        if (!await directory.exists()) {
          directory = await getExternalStorageDirectory();
        }
      } else if (Platform.isIOS) {
        directory = await getApplicationDocumentsDirectory();
      }

      if (directory == null) return null;

      // Create filename
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final sanitizedName = eventName.replaceAll(RegExp(r'[^\w\s-]'), '').trim().replaceAll(' ', '_');
      final filename = 'ticket_${sanitizedName}_$timestamp.png';
      final path = '${directory.path}/$filename';

      // Write file
      final file = File(path);
      await file.writeAsBytes(imageBytes);

      _log.info('Ticket saved', tag: _tag, metadata: {'path': path});
      return path;
    } catch (e) {
      _log.error('Failed to save ticket', tag: _tag, error: e);
      return null;
    }
  }

  /// Share ticket image
  static Future<void> shareTicket(Uint8List imageBytes, String eventName) async {
    try {
      // Save to temp directory first
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final sanitizedName = eventName.replaceAll(RegExp(r'[^\w\s-]'), '').trim().replaceAll(' ', '_');
      final path = '${tempDir.path}/ticket_${sanitizedName}_$timestamp.png';
      
      final file = File(path);
      await file.writeAsBytes(imageBytes);

      await Share.shareXFiles(
        [XFile(path)],
        text: 'My ticket for $eventName',
        subject: 'Event Ticket',
      );
    } catch (e) {
      _log.error('Failed to share ticket', tag: _tag, error: e);
    }
  }

  /// Download and share ticket for a UserTicket
  static Future<bool> downloadTicket(UserTicket ticket, {bool share = false}) async {
    try {
      final imageBytes = await generateTicketImage(ticket);
      if (imageBytes == null) return false;

      if (share) {
        await shareTicket(imageBytes, ticket.eventName);
        return true;
      } else {
        final path = await saveToDownloads(imageBytes, ticket.eventName);
        return path != null;
      }
    } catch (e) {
      _log.error('Failed to download ticket', tag: _tag, error: e);
      return false;
    }
  }
}