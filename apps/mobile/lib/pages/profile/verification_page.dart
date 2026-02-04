import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/supabase/verification_service.dart';

/// Profile verification page with multiple verification options
class VerificationPage extends StatefulWidget {
  const VerificationPage({Key? key}) : super(key: key);

  @override
  State<VerificationPage> createState() => _VerificationPageState();
}

class _VerificationPageState extends State<VerificationPage> {
  final VerificationService _verificationService = VerificationService.instance;
  final TextEditingController _linkedInController = TextEditingController();
  final TextEditingController _githubController = TextEditingController();
  
  UserVerificationStatus? _status;
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  @override
  void dispose() {
    _linkedInController.dispose();
    _githubController.dispose();
    super.dispose();
  }

  Future<void> _loadStatus() async {
    setState(() => _isLoading = true);
    final result = await _verificationService.getVerificationStatus();
    if (mounted) {
      setState(() {
        _status = result.dataOrNull;
        _isLoading = false;
      });
    }
  }

  Future<void> _submitSelfie() async {
    HapticFeedback.mediumImpact();
    
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      imageQuality: 85,
    );
    
    if (image == null) return;
    
    final file = File(image.path);
    final validResult = await _verificationService.validateSelfieQuality(file);
    final isValid = validResult.isSuccess && validResult.data == true;
    
    if (!isValid && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please take a clearer photo')),
      );
      return;
    }
    
    setState(() => _isSubmitting = true);
    
    final result = await _verificationService.submitSelfieVerification(file);
    
    if (mounted) {
      setState(() => _isSubmitting = false);
      if (result.isSuccess && result.data == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Selfie submitted for verification! 📸')),
        );
        _loadStatus();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.errorMessage ?? 'Failed to submit selfie')),
        );
      }
    }
  }

  Future<void> _submitLinkedIn() async {
    final url = _linkedInController.text.trim();
    if (url.isEmpty || !url.contains('linkedin.com')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid LinkedIn URL')),
      );
      return;
    }
    
    HapticFeedback.mediumImpact();
    setState(() => _isSubmitting = true);
    
    final result = await _verificationService.linkLinkedIn(url);
    
    if (mounted) {
      setState(() => _isSubmitting = false);
      Navigator.pop(context); // Close dialog
      if (result.isSuccess && result.data == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('LinkedIn submitted for verification!')),
        );
        _linkedInController.clear();
        _loadStatus();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.errorMessage ?? 'Failed to submit LinkedIn')),
        );
      }
    }
  }

  Future<void> _submitGitHub() async {
    final username = _githubController.text.trim();
    if (username.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your GitHub username')),
      );
      return;
    }
    
    HapticFeedback.mediumImpact();
    setState(() => _isSubmitting = true);
    
    final result = await _verificationService.linkGitHub(username);
    
    if (mounted) {
      setState(() => _isSubmitting = false);
      Navigator.pop(context); // Close dialog
      if (result.isSuccess && result.data == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('GitHub submitted for verification! 🐙')),
        );
        _githubController.clear();
        _loadStatus();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.errorMessage ?? 'Failed to submit GitHub')),
        );
      }
    }
  }

  Future<void> _verifyEmail() async {
    HapticFeedback.mediumImpact();
    setState(() => _isSubmitting = true);
    
    final result = await _verificationService.verifyEmail();
    
    if (mounted) {
      setState(() => _isSubmitting = false);
      if (result.isSuccess && result.data == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Email verified! 📧')),
        );
        _loadStatus();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.errorMessage ?? 'Please confirm your email first')),
        );
      }
    }
  }

  void _showLinkedInDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.work, color: Color(0xFF0A66C2)),
            SizedBox(width: 12),
            Text('LinkedIn Verification'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter your LinkedIn profile URL to verify your professional identity.'),
            const SizedBox(height: 16),
            TextField(
              controller: _linkedInController,
              decoration: const InputDecoration(
                hintText: 'https://linkedin.com/in/yourprofile',
                prefixIcon: Icon(Icons.link),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.url,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _submitLinkedIn,
            child: _isSubmitting 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _showGitHubDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.code, color: Color(0xFF6e5494)),
            SizedBox(width: 12),
            Text('GitHub Verification'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter your GitHub username to verify your developer identity.'),
            const SizedBox(height: 16),
            TextField(
              controller: _githubController,
              decoration: const InputDecoration(
                hintText: 'your-username',
                prefixIcon: Icon(Icons.alternate_email),
                prefixText: 'github.com/',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _submitGitHub,
            child: _isSubmitting 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Submit'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile Verification'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.symmetric(horizontal: MediaQuery.of(context).size.width < 600 ? 16.0 : (MediaQuery.of(context).size.width < 1200 ? 24.0 : 32.0), vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status banner
                  if (_status?.isVerified == true)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.verified, color: Colors.green),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Verified Profile',
                                  style: textTheme.titleMedium?.copyWith(
                                    color: Colors.green,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'Your profile is verified and trusted',
                                  style: textTheme.bodySmall?.copyWith(color: Colors.green),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cs.primaryContainer.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.shield_outlined, color: cs.primary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Get Verified',
                                  style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  'Verified profiles get 3x more followers',
                                  style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 24),
                  Text(
                    'Verification Options',
                    style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  // Selfie Verification
                  _VerificationOption(
                    icon: Icons.camera_alt,
                    iconColor: Colors.blue,
                    title: 'Selfie Verification',
                    description: 'Take a selfie to prove you\'re real',
                    isVerified: _status?.hasType(VerificationType.selfie) ?? false,
                    isPending: _status?.verifications.any((v) => 
                      v.type == VerificationType.selfie && v.status == VerificationStatus.pending) ?? false,
                    onTap: _submitSelfie,
                  ),

                  const SizedBox(height: 12),

                  // LinkedIn Verification
                  _VerificationOption(
                    icon: Icons.work,
                    iconColor: const Color(0xFF0A66C2),
                    title: 'LinkedIn',
                    description: 'Verify your professional identity',
                    isVerified: _status?.hasType(VerificationType.linkedin) ?? false,
                    isPending: _status?.verifications.any((v) => 
                      v.type == VerificationType.linkedin && v.status == VerificationStatus.pending) ?? false,
                    onTap: _showLinkedInDialog,
                  ),

                  const SizedBox(height: 12),

                  // GitHub Verification
                  _VerificationOption(
                    icon: Icons.code,
                    iconColor: const Color(0xFF6e5494),
                    title: 'GitHub',
                    description: 'Show your developer credentials',
                    isVerified: _status?.hasType(VerificationType.github) ?? false,
                    isPending: _status?.verifications.any((v) => 
                      v.type == VerificationType.github && v.status == VerificationStatus.pending) ?? false,
                    onTap: _showGitHubDialog,
                  ),

                  const SizedBox(height: 12),

                  // Email Verification
                  _VerificationOption(
                    icon: Icons.email,
                    iconColor: Colors.orange,
                    title: 'Email',
                    description: 'Verify your email address',
                    isVerified: _status?.hasType(VerificationType.email) ?? false,
                    isPending: false,
                    onTap: _verifyEmail,
                  ),

                  const SizedBox(height: 32),

                  // Benefits section
                  Text(
                    'Why Get Verified?',
                    style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  
                  _BenefitItem(
                    icon: Icons.trending_up,
                    text: 'Appear higher in search results',
                  ),
                  _BenefitItem(
                    icon: Icons.favorite,
                    text: 'Get 3x more profile views',
                  ),
                  _BenefitItem(
                    icon: Icons.verified_user,
                    text: 'Build trust with followers',
                  ),
                  _BenefitItem(
                    icon: Icons.star,
                    text: 'Stand out with verification badge',
                  ),
                ],
              ),
            ),
    );
  }
}

/// Verification option card
class _VerificationOption extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;
  final bool isVerified;
  final bool isPending;
  final VoidCallback onTap;

  const _VerificationOption({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.description,
    required this.isVerified,
    required this.isPending,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: isVerified || isPending ? null : onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      description,
                      style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              if (isVerified)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check, color: Colors.green, size: 16),
                      SizedBox(width: 4),
                      Text('Verified', style: TextStyle(color: Colors.green, fontSize: 12)),
                    ],
                  ),
                )
              else if (isPending)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.schedule, color: Colors.orange, size: 16),
                      SizedBox(width: 4),
                      Text('Pending', style: TextStyle(color: Colors.orange, fontSize: 12)),
                    ],
                  ),
                )
              else
                Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}

/// Benefit list item
class _BenefitItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const _BenefitItem({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: cs.primary, size: 20),
          const SizedBox(width: 12),
          Text(text, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
