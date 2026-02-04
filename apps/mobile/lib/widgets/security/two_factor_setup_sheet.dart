import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Bottom sheet for setting up Two-Factor Authentication
class TwoFactorSetupSheet extends StatefulWidget {
  final VoidCallback? onSuccess;

  const TwoFactorSetupSheet({super.key, this.onSuccess});

  @override
  State<TwoFactorSetupSheet> createState() => _TwoFactorSetupSheetState();
}

class _TwoFactorSetupSheetState extends State<TwoFactorSetupSheet> {
  int _currentStep = 0;
  bool _isLoading = false;
  String? _errorMessage;
  
  // MFA enrollment data
  String? _factorId;
  String? _challengeId;
  String? _qrCodeUri;
  String? _secretKey;
  List<String> _backupCodes = [];
  
  final _verificationController = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _startEnrollment();
  }

  @override
  void dispose() {
    _verificationController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _startEnrollment() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Start MFA enrollment with Supabase
      final response = await Supabase.instance.client.auth.mfa.enroll(
        factorType: FactorType.totp,
        issuer: 'Thittam1Hub',
        friendlyName: 'Authenticator App',
      );

      setState(() {
        _factorId = response.id;
        // Safely access nullable TOTP properties
        _qrCodeUri = response.totp?.qrCode;
        _secretKey = response.totp?.secret;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to start 2FA setup. Please try again.';
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyCode() async {
    final code = _verificationController.text.trim();
    if (code.length != 6) {
      setState(() => _errorMessage = 'Please enter a 6-digit code');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Challenge the factor
      final challengeResponse = await Supabase.instance.client.auth.mfa.challenge(
        factorId: _factorId!,
      );
      _challengeId = challengeResponse.id;

      // Verify the code
      await Supabase.instance.client.auth.mfa.verify(
        factorId: _factorId!,
        challengeId: _challengeId!,
        code: code,
      );

      // Generate backup codes
      _generateBackupCodes();

      setState(() {
        _currentStep = 2; // Move to backup codes step
        _isLoading = false;
      });
    } on AuthException catch (e) {
      setState(() {
        _errorMessage = e.message;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Invalid verification code. Please try again.';
        _isLoading = false;
      });
    }
  }

  void _generateBackupCodes() {
    final random = Random.secure();
    _backupCodes = List.generate(10, (_) {
      return List.generate(8, (_) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return chars[random.nextInt(chars.length)];
      }).join();
    });
  }

  Future<void> _copyBackupCodes() async {
    final codesText = _backupCodes.join('\n');
    await Clipboard.setData(ClipboardData(text: codesText));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Backup codes copied to clipboard')),
      );
    }
  }

  void _completeSetup() {
    widget.onSuccess?.call();
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.security, color: cs.primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Two-Factor Authentication',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Step ${_currentStep + 1} of 3',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // Progress indicator
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                _buildStepIndicator(0, 'Scan QR', cs),
                Expanded(child: _buildStepConnector(0, cs)),
                _buildStepIndicator(1, 'Verify', cs),
                Expanded(child: _buildStepConnector(1, cs)),
                _buildStepIndicator(2, 'Backup', cs),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _buildStepContent(cs),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String label, ColorScheme cs) {
    final isActive = _currentStep >= step;
    final isCurrent = _currentStep == step;

    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? cs.primary : cs.surfaceContainerHighest,
            border: isCurrent
                ? Border.all(color: cs.primary, width: 2)
                : null,
          ),
          child: Center(
            child: isActive && !isCurrent
                ? Icon(Icons.check, size: 18, color: cs.onPrimary)
                : Text(
                    '${step + 1}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isActive ? cs.onPrimary : cs.onSurfaceVariant,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: isActive ? cs.primary : cs.onSurfaceVariant,
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildStepConnector(int beforeStep, ColorScheme cs) {
    final isActive = _currentStep > beforeStep;
    return Container(
      height: 2,
      margin: const EdgeInsets.only(bottom: 20),
      color: isActive ? cs.primary : cs.surfaceContainerHighest,
    );
  }

  Widget _buildStepContent(ColorScheme cs) {
    switch (_currentStep) {
      case 0:
        return _buildScanQRStep(cs);
      case 1:
        return _buildVerifyStep(cs);
      case 2:
        return _buildBackupCodesStep(cs);
      default:
        return const SizedBox();
    }
  }

  Widget _buildScanQRStep(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Error message
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.errorContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: cs.error, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: cs.error, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          Text(
            'Scan QR Code',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Open your authenticator app and scan this QR code',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // QR Code placeholder (In production, render actual QR from _qrCodeUri)
          Center(
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: cs.outline.withOpacity(0.3)),
              ),
              child: _qrCodeUri != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        _qrCodeUri!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildQRPlaceholder(cs),
                      ),
                    )
                  : _buildQRPlaceholder(cs),
            ),
          ),
          const SizedBox(height: 24),

          // Manual entry option
          if (_secretKey != null) ...[
            ExpansionTile(
              title: const Text('Can\'t scan? Enter code manually'),
              tilePadding: EdgeInsets.zero,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Secret Key',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 8),
                      SelectableText(
                        _secretKey!,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontFamily: 'monospace',
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: _secretKey!));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Secret key copied')),
                          );
                        },
                        icon: const Icon(Icons.copy, size: 18),
                        label: const Text('Copy Key'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 32),

          // Next button
          FilledButton(
            onPressed: () => setState(() => _currentStep = 1),
            child: const Text('I\'ve Scanned the QR Code'),
          ),
        ],
      ),
    );
  }

  Widget _buildQRPlaceholder(ColorScheme cs) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.qr_code_2, size: 80, color: cs.primary),
          const SizedBox(height: 8),
          Text(
            'QR Code',
            style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifyStep(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Error message
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.errorContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: cs.error, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: cs.error, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          Text(
            'Enter Verification Code',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Enter the 6-digit code from your authenticator app',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          // Code input
          TextField(
            controller: _verificationController,
            focusNode: _focusNode,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            maxLength: 6,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              letterSpacing: 8,
              fontWeight: FontWeight.bold,
            ),
            decoration: InputDecoration(
              hintText: '000000',
              counterText: '',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            onChanged: (value) {
              if (value.length == 6) {
                _verifyCode();
              }
            },
          ),
          const SizedBox(height: 24),

          // Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _currentStep = 0),
                  child: const Text('Back'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _verifyCode,
                  child: const Text('Verify'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBackupCodesStep(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Success indicator
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '2FA has been enabled! Save your backup codes below.',
                    style: TextStyle(color: Colors.green),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Text(
            'Backup Codes',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Save these codes in a secure place. Each code can only be used once.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          // Backup codes grid
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: _backupCodes.map((code) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: cs.outline.withOpacity(0.3)),
                  ),
                  child: Text(
                    code,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),

          // Copy button
          OutlinedButton.icon(
            onPressed: _copyBackupCodes,
            icon: const Icon(Icons.copy),
            label: const Text('Copy All Codes'),
          ),
          const SizedBox(height: 24),

          // Warning
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber, color: Colors.orange),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'If you lose access to your authenticator app, you\'ll need these codes to log in.',
                    style: TextStyle(
                      color: Colors.orange.shade800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Complete button
          FilledButton(
            onPressed: _completeSetup,
            child: const Text('I\'ve Saved My Backup Codes'),
          ),
        ],
      ),
    );
  }
}
