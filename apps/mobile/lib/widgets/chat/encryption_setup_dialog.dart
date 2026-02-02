import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/e2e_encryption_service.dart';
import '../glassmorphism_bottom_sheet.dart';

/// Dialog for first-time encryption key setup
class EncryptionSetupDialog extends StatefulWidget {
  final VoidCallback? onComplete;

  const EncryptionSetupDialog({
    super.key,
    this.onComplete,
  });

  static Future<bool?> show(BuildContext context, {VoidCallback? onComplete}) {
    return showGlassBottomSheet<bool>(
      context: context,
      title: 'Secure Your Messages',
      isDismissible: false,
      enableDrag: false,
      maxHeight: 0.75,
      child: EncryptionSetupDialog(onComplete: onComplete),
    );
  }

  @override
  State<EncryptionSetupDialog> createState() => _EncryptionSetupDialogState();
}

class _EncryptionSetupDialogState extends State<EncryptionSetupDialog> {
  SetupStep _currentStep = SetupStep.intro;
  bool _isLoading = false;
  String? _error;
  double _progress = 0.0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildProgressIndicator(colorScheme),
        const SizedBox(height: 24),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _buildStepContent(colorScheme),
        ),
      ],
    );
  }

  Widget _buildProgressIndicator(ColorScheme colorScheme) {
    return Column(
      children: [
        Row(
          children: [
            _buildStepDot(colorScheme, 0, 'Generate'),
            Expanded(child: _buildStepLine(colorScheme, 0)),
            _buildStepDot(colorScheme, 1, 'Store'),
            Expanded(child: _buildStepLine(colorScheme, 1)),
            _buildStepDot(colorScheme, 2, 'Upload'),
            Expanded(child: _buildStepLine(colorScheme, 2)),
            _buildStepDot(colorScheme, 3, 'Complete'),
          ],
        ),
      ],
    );
  }

  Widget _buildStepDot(ColorScheme colorScheme, int step, String label) {
    final isActive = _currentStep.index >= step;
    final isComplete = _currentStep.index > step;

    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isComplete
                ? Colors.green
                : isActive
                    ? colorScheme.primary
                    : colorScheme.surfaceContainerHighest,
            border: Border.all(
              color: isActive ? colorScheme.primary : colorScheme.outline.withOpacity(0.3),
              width: 2,
            ),
          ),
          child: Center(
            child: isComplete
                ? const Icon(Icons.check, size: 16, color: Colors.white)
                : Text(
                    '${step + 1}',
                    style: TextStyle(
                      color: isActive ? colorScheme.onPrimary : colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: isActive ? colorScheme.primary : colorScheme.onSurfaceVariant,
              ),
        ),
      ],
    );
  }

  Widget _buildStepLine(ColorScheme colorScheme, int afterStep) {
    final isComplete = _currentStep.index > afterStep;
    return Container(
      height: 2,
      margin: const EdgeInsets.only(bottom: 20),
      color: isComplete ? Colors.green : colorScheme.outline.withOpacity(0.3),
    );
  }

  Widget _buildStepContent(ColorScheme colorScheme) {
    switch (_currentStep) {
      case SetupStep.intro:
        return _buildIntroStep(colorScheme);
      case SetupStep.generating:
        return _buildGeneratingStep(colorScheme);
      case SetupStep.storing:
        return _buildStoringStep(colorScheme);
      case SetupStep.uploading:
        return _buildUploadingStep(colorScheme);
      case SetupStep.complete:
        return _buildCompleteStep(colorScheme);
    }
  }

  Widget _buildIntroStep(ColorScheme colorScheme) {
    return Column(
      key: const ValueKey('intro'),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: colorScheme.primaryContainer.withOpacity(0.3),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.lock_outline,
            size: 64,
            color: colorScheme.primary,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'End-to-End Encryption',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Your messages will be encrypted so that only you and your recipients can read them. Not even we can access your conversations.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 8),
        _buildFeatureRow(colorScheme, Icons.key, 'Unique encryption keys for your device'),
        _buildFeatureRow(colorScheme, Icons.security, 'Military-grade AES-256 encryption'),
        _buildFeatureRow(colorScheme, Icons.visibility_off, 'Only you can read your messages'),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _startSetup,
            child: const Text('Set Up Encryption'),
          ),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Skip for Now'),
        ),
      ],
    );
  }

  Widget _buildFeatureRow(ColorScheme colorScheme, IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGeneratingStep(ColorScheme colorScheme) {
    return _buildLoadingStep(
      key: const ValueKey('generating'),
      colorScheme: colorScheme,
      icon: Icons.vpn_key,
      title: 'Generating Keys',
      subtitle: 'Creating your unique encryption keys...',
    );
  }

  Widget _buildStoringStep(ColorScheme colorScheme) {
    return _buildLoadingStep(
      key: const ValueKey('storing'),
      colorScheme: colorScheme,
      icon: Icons.save,
      title: 'Storing Securely',
      subtitle: 'Saving your private key to secure storage...',
    );
  }

  Widget _buildUploadingStep(ColorScheme colorScheme) {
    return _buildLoadingStep(
      key: const ValueKey('uploading'),
      colorScheme: colorScheme,
      icon: Icons.cloud_upload,
      title: 'Uploading Public Key',
      subtitle: 'Sharing your public key so others can message you...',
    );
  }

  Widget _buildLoadingStep({
    required Key key,
    required ColorScheme colorScheme,
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Column(
      key: key,
      children: [
        const SizedBox(height: 40),
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 100,
              height: 100,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                value: _progress > 0 ? _progress : null,
              ),
            ),
            Icon(icon, size: 40, color: colorScheme.primary),
          ],
        ),
        const SizedBox(height: 32),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
          textAlign: TextAlign.center,
        ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.error, color: colorScheme.error, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _error!,
                    style: TextStyle(color: colorScheme.onErrorContainer),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: _startSetup,
            child: const Text('Retry'),
          ),
        ],
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildCompleteStep(ColorScheme colorScheme) {
    return Column(
      key: const ValueKey('complete'),
      children: [
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle,
            size: 64,
            color: Colors.green,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'You\'re All Set!',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Your messages are now protected with end-to-end encryption. Only you and your recipients can read them.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainerHighest.withOpacity(0.5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: colorScheme.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Verify contacts by comparing safety numbers to ensure maximum security.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              widget.onComplete?.call();
              Navigator.of(context).pop(true);
            },
            child: const Text('Start Messaging'),
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Future<void> _startSetup() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _currentStep = SetupStep.generating;
      _progress = 0.0;
    });

    try {
      final encryptionService = E2EEncryptionService.instance;
      
      // Step 1: Generate key pair
      await Future.delayed(const Duration(milliseconds: 500));
      setState(() => _progress = 0.25);
      
      final keyPairResult = await encryptionService.generateKeyPair();
      if (!keyPairResult.isSuccess) {
        throw Exception(keyPairResult.errorMessage ?? 'Failed to generate key pair');
      }
      final keyPair = keyPairResult.data;
      
      // Step 2: Store private key
      setState(() {
        _currentStep = SetupStep.storing;
        _progress = 0.5;
      });
      await Future.delayed(const Duration(milliseconds: 300));
      
      final storeResult = await encryptionService.storeKeyPair(keyPair);
      if (!storeResult.isSuccess) {
        throw Exception(storeResult.errorMessage ?? 'Failed to store key pair');
      }
      
      // Step 3: Upload public key
      setState(() {
        _currentStep = SetupStep.uploading;
        _progress = 0.75;
      });
      await Future.delayed(const Duration(milliseconds: 300));
      
      final uploadedResult = await encryptionService.uploadPublicKey();
      final uploaded = uploadedResult.isSuccess ? uploadedResult.data : false;
      
      if (!uploaded) {
        throw Exception('Failed to upload public key');
      }
      
      // Complete
      setState(() {
        _currentStep = SetupStep.complete;
        _progress = 1.0;
        _isLoading = false;
      });
      
      HapticFeedback.heavyImpact();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }
}

enum SetupStep {
  intro,
  generating,
  storing,
  uploading,
  complete,
}
