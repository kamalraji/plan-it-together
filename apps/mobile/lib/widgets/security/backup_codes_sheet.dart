import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Bottom sheet for viewing and regenerating backup codes
class BackupCodesSheet extends StatefulWidget {
  final List<String>? existingCodes;
  final VoidCallback? onRegenerate;

  const BackupCodesSheet({
    super.key,
    this.existingCodes,
    this.onRegenerate,
  });

  @override
  State<BackupCodesSheet> createState() => _BackupCodesSheetState();
}

class _BackupCodesSheetState extends State<BackupCodesSheet> {
  late List<String> _codes;
  bool _isLoading = false;
  bool _codesRevealed = false;

  @override
  void initState() {
    super.initState();
    _codes = widget.existingCodes ?? _generateCodes();
  }

  List<String> _generateCodes() {
    final random = Random.secure();
    return List.generate(10, (_) {
      return List.generate(8, (_) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return chars[random.nextInt(chars.length)];
      }).join();
    });
  }

  Future<void> _regenerateCodes() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Regenerate Backup Codes?'),
        content: const Text(
          'This will invalidate all your existing backup codes. '
          'Make sure to save the new codes in a safe place.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Regenerate'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);
      
      // Simulate API call delay
      await Future.delayed(const Duration(seconds: 1));
      
      setState(() {
        _codes = _generateCodes();
        _codesRevealed = true;
        _isLoading = false;
      });

      widget.onRegenerate?.call();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('New backup codes generated'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  Future<void> _copyAllCodes() async {
    final codesText = _codes.asMap().entries.map((e) => 
      '${e.key + 1}. ${e.value}'
    ).join('\n');
    
    await Clipboard.setData(ClipboardData(text: codesText));
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All backup codes copied to clipboard')),
      );
    }
  }

  Future<void> _downloadCodes() async {
    // In a real app, this would download a text file
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Download feature coming soon')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
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
                  child: Icon(Icons.vpn_key, color: cs.primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Backup Codes',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${_codes.length} codes available',
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
          
          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Info card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: cs.primaryContainer.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline, color: cs.primary),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Use these codes to sign in if you lose access to your authenticator app. Each code can only be used once.',
                                  style: TextStyle(
                                    color: cs.onPrimaryContainer,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Reveal/Hide toggle
                        if (!_codesRevealed) ...[
                          Center(
                            child: Column(
                              children: [
                                Icon(
                                  Icons.visibility_off,
                                  size: 48,
                                  color: cs.onSurfaceVariant,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Codes are hidden for security',
                                  style: TextStyle(color: cs.onSurfaceVariant),
                                ),
                                const SizedBox(height: 16),
                                FilledButton.icon(
                                  onPressed: () => setState(() => _codesRevealed = true),
                                  icon: const Icon(Icons.visibility),
                                  label: const Text('Reveal Codes'),
                                ),
                              ],
                            ),
                          ),
                        ] else ...[
                          // Codes grid
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: cs.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: cs.outline.withOpacity(0.3)),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    TextButton.icon(
                                      onPressed: () => setState(() => _codesRevealed = false),
                                      icon: const Icon(Icons.visibility_off, size: 18),
                                      label: const Text('Hide'),
                                    ),
                                  ],
                                ),
                                GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    childAspectRatio: 2.5,
                                    crossAxisSpacing: 12,
                                    mainAxisSpacing: 8,
                                  ),
                                  itemCount: _codes.length,
                                  itemBuilder: (context, index) {
                                    return Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 8,
                                      ),
                                      decoration: BoxDecoration(
                                        color: cs.surface,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: cs.outline.withOpacity(0.2),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Text(
                                            '${index + 1}.',
                                            style: TextStyle(
                                              color: cs.onSurfaceVariant,
                                              fontSize: 12,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              _codes[index],
                                              style: const TextStyle(
                                                fontFamily: 'monospace',
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 1,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),

                        // Action buttons
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _copyAllCodes,
                                icon: const Icon(Icons.copy, size: 18),
                                label: const Text('Copy All'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _downloadCodes,
                                icon: const Icon(Icons.download, size: 18),
                                label: const Text('Download'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Regenerate button
                        OutlinedButton.icon(
                          onPressed: _regenerateCodes,
                          icon: Icon(Icons.refresh, color: cs.error),
                          label: Text(
                            'Regenerate Codes',
                            style: TextStyle(color: cs.error),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: cs.error),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Warning
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.amber.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.amber.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.warning_amber, color: Colors.amber.shade700),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Store these codes securely. Anyone with access to these codes can access your account.',
                                  style: TextStyle(
                                    color: Colors.amber.shade800,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
