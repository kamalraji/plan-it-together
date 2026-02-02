import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:crypto/crypto.dart';
import '../../models/encryption_models.dart';
import '../../services/e2e_encryption_service.dart';
import '../../services/key_verification_service.dart';
import '../qr_code_display.dart';
import '../qr_scanner_sheet.dart';
import '../glassmorphism_bottom_sheet.dart';

/// Dialog for verifying encryption keys between users
class KeyVerificationDialog extends StatefulWidget {
  final String recipientUserId;
  final String recipientName;
  final String? recipientAvatarUrl;

  const KeyVerificationDialog({
    super.key,
    required this.recipientUserId,
    required this.recipientName,
    this.recipientAvatarUrl,
  });

  static Future<bool?> show(
    BuildContext context, {
    required String recipientUserId,
    required String recipientName,
    String? recipientAvatarUrl,
  }) {
    return showGlassBottomSheet<bool>(
      context: context,
      title: 'Verify Encryption',
      maxHeight: 0.85,
      child: KeyVerificationDialog(
        recipientUserId: recipientUserId,
        recipientName: recipientName,
        recipientAvatarUrl: recipientAvatarUrl,
      ),
    );
  }

  @override
  State<KeyVerificationDialog> createState() => _KeyVerificationDialogState();
}

class _KeyVerificationDialogState extends State<KeyVerificationDialog>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  String? _safetyNumber;
  String? _qrData;
  bool _isLoading = true;
  bool _isVerified = false;
  String? _error;
  
  UserKeyBundle? _myKeyBundle;
  UserKeyBundle? _theirKeyBundle;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadKeys();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadKeys() async {
    try {
      final encryptionService = E2EEncryptionService.instance;
      
      // Get my public key
      final myPublicKey = await encryptionService.getPublicKey();
      final myKeyId = await encryptionService.getKeyId();
      
      if (myPublicKey == null || myKeyId == null) {
        setState(() {
          _error = 'Your encryption keys are not set up';
          _isLoading = false;
        });
        return;
      }
      
      // Fetch recipient's public key
      final theirBundleResult = await encryptionService.fetchUserPublicKey(widget.recipientUserId);
      if (!theirBundleResult.isSuccess) {
        setState(() {
          _error = 'Failed to fetch ${widget.recipientName}\'s public key';
          _isLoading = false;
        });
        return;
      }
      final theirBundle = theirBundleResult.data;

      if (theirBundle == null) {
        setState(() {
          _error = '${widget.recipientName} has not set up encryption yet';
          _isLoading = false;
        });
        return;
      }
      
      // Generate safety number
      final safetyNumber = encryptionService.generateSafetyNumber(
        myPublicKey,
        base64Decode(theirBundle.publicKey),
      );
      
      // Create QR data (JSON with both public keys)
      final qrData = jsonEncode({
        'type': 'key_verification',
        'version': 1,
        'my_key': base64Encode(myPublicKey),
        'their_key': theirBundle.publicKey,
        'safety_number': safetyNumber,
      });
      
      setState(() {
        _myKeyBundle = UserKeyBundle(
          oderId: '', // Current user
          publicKey: base64Encode(myPublicKey),
          keyId: myKeyId,
          createdAt: DateTime.now(),
        );
        _theirKeyBundle = theirBundle;
        _safetyNumber = safetyNumber;
        _qrData = qrData;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load encryption keys: $e';
        _isLoading = false;
      });
    }
  }

  void _copySafetyNumber() {
    if (_safetyNumber != null) {
      Clipboard.setData(ClipboardData(text: _safetyNumber!));
      HapticFeedback.lightImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Safety number copied'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _markAsVerified() async {
    HapticFeedback.mediumImpact();
    
    // Persist verification status securely
    try {
      await KeyVerificationService.instance.markUserVerified(widget.recipientUserId);
      setState(() => _isVerified = true);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.recipientName} marked as verified'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save verification: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (_isLoading) {
      return const SizedBox(
        height: 300,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return _buildErrorState(colorScheme);
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildHeader(colorScheme),
        const SizedBox(height: 16),
        _buildTabBar(colorScheme),
        const SizedBox(height: 16),
        SizedBox(
          height: 380,
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildSafetyNumberTab(colorScheme),
              _buildQRCodeTab(colorScheme),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _buildVerifyButton(colorScheme),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildErrorState(ColorScheme colorScheme) {
    return SizedBox(
      height: 200,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(color: colorScheme.error),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ColorScheme colorScheme) {
    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundImage: widget.recipientAvatarUrl != null
              ? NetworkImage(widget.recipientAvatarUrl!)
              : null,
          backgroundColor: colorScheme.primaryContainer,
          child: widget.recipientAvatarUrl == null
              ? Text(
                  widget.recipientName.isNotEmpty
                      ? widget.recipientName[0].toUpperCase()
                      : '?',
                  style: TextStyle(
                    color: colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.bold,
                  ),
                )
              : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.recipientName,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Row(
                children: [
                  Icon(
                    _isVerified ? Icons.verified : Icons.shield_outlined,
                    size: 14,
                    color: _isVerified ? Colors.green : colorScheme.outline,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _isVerified ? 'Verified' : 'Not verified',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: _isVerified ? Colors.green : colorScheme.outline,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTabBar(ColorScheme colorScheme) {
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(10),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        labelColor: colorScheme.onPrimaryContainer,
        unselectedLabelColor: colorScheme.onSurfaceVariant,
        tabs: const [
          Tab(text: 'Safety Number'),
          Tab(text: 'QR Code'),
        ],
      ),
    );
  }

  Widget _buildSafetyNumberTab(ColorScheme colorScheme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHighest.withOpacity(0.3),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: colorScheme.outline.withOpacity(0.2),
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.fingerprint,
                  size: 48,
                  color: colorScheme.primary,
                ),
                const SizedBox(height: 16),
                Text(
                  'Safety Number',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Compare this number with ${widget.recipientName} to verify your encryption is secure.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                _buildSafetyNumberGrid(colorScheme),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: _copySafetyNumber,
                  icon: const Icon(Icons.copy, size: 18),
                  label: const Text('Copy'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoCard(
            colorScheme,
            Icons.info_outline,
            'How to verify',
            'Meet in person or use a trusted channel to compare safety numbers. If they match, your messages are truly private.',
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyNumberGrid(ColorScheme colorScheme) {
    if (_safetyNumber == null) return const SizedBox.shrink();
    
    // Split safety number into groups of 5 for better readability
    final groups = <String>[];
    for (var i = 0; i < _safetyNumber!.length; i += 5) {
      final end = (i + 5 < _safetyNumber!.length) ? i + 5 : _safetyNumber!.length;
      groups.add(_safetyNumber!.substring(i, end));
    }
    
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: groups.map((group) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: colorScheme.outline.withOpacity(0.3),
            ),
          ),
          child: Text(
            group,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQRCodeTab(ColorScheme colorScheme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHighest.withOpacity(0.3),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: colorScheme.outline.withOpacity(0.2),
              ),
            ),
            child: Column(
              children: [
                Text(
                  'Scan to Verify',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Have ${widget.recipientName} scan this code, or scan theirs.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                if (_qrData != null)
                  QrCodeDisplay(
                    data: _qrData!,
                    size: 200,
                    showShadow: true,
                  )
                else
                  const QrCodeSkeleton(size: 200),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _scanQRCode,
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Scan Their Code'),
          ),
          const SizedBox(height: 16),
          _buildInfoCard(
            colorScheme,
            Icons.security,
            'Why verify?',
            'Verification ensures no one is intercepting your messages. Once verified, you\'ll see a verified badge.',
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(
    ColorScheme colorScheme,
    IconData icon,
    String title,
    String description,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifyButton(ColorScheme colorScheme) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: _markAsVerified,
        icon: const Icon(Icons.verified_user),
        label: const Text('Mark as Verified'),
        style: FilledButton.styleFrom(
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Future<void> _scanQRCode() async {
    final scannedData = await QRScannerSheet.show(
      context,
      title: 'Scan Verification Code',
      subtitle: 'Scan ${widget.recipientName}\'s QR code to verify encryption',
    );

    if (scannedData == null || !mounted) return;

    // Show processing indicator
    setState(() => _isLoading = true);

    try {
      // Verify the scanned QR code using KeyVerificationService
      final verificationResult = await KeyVerificationService.instance.verifyQRCode(
        scannedData,
        widget.recipientUserId,
      );

      if (!mounted) return;

      if (verificationResult.isSuccess && verificationResult.data!.isSuccess) {
        // Verification successful - mark as verified
        await KeyVerificationService.instance.markUserVerified(widget.recipientUserId);
        
        HapticFeedback.heavyImpact();
        setState(() {
          _isVerified = true;
          _isLoading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.verified, color: Colors.white),
                const SizedBox(width: 12),
                Text('${widget.recipientName} verified successfully!'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );

        // Close dialog with success
        Navigator.of(context).pop(true);
      } else {
        // Verification failed
        HapticFeedback.heavyImpact();
        setState(() => _isLoading = false);

        final errorMessage = verificationResult.isSuccess
            ? verificationResult.data!.message
            : 'Verification failed';

        _showVerificationFailedDialog(errorMessage);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to process QR code: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showVerificationFailedDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 48),
        title: const Text('Verification Failed'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.security, color: Colors.orange, size: 20),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'This may indicate a security issue. Verify in person if possible.',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              _scanQRCode(); // Try again
            },
            child: const Text('Scan Again'),
          ),
        ],
      ),
    );
  }
}
