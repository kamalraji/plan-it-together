import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../../services/encrypted_attachment_service.dart';
import '../../theme.dart';

/// Widget that displays encrypted attachments with decrypt-on-demand
class EncryptedAttachmentViewer extends StatefulWidget {
  final String encryptedUrl;
  final String encryptedFileKey;
  final String senderPublicKey;
  final String mimeType;
  final String fileName;
  final int? originalSize;
  final VoidCallback? onDecrypted;

  const EncryptedAttachmentViewer({
    super.key,
    required this.encryptedUrl,
    required this.encryptedFileKey,
    required this.senderPublicKey,
    required this.mimeType,
    required this.fileName,
    this.originalSize,
    this.onDecrypted,
  });

  @override
  State<EncryptedAttachmentViewer> createState() => _EncryptedAttachmentViewerState();
}

class _EncryptedAttachmentViewerState extends State<EncryptedAttachmentViewer> {
  DecryptionState _state = DecryptionState.locked;
  Uint8List? _decryptedData;
  String? _error;

  bool get _isImage => widget.mimeType.startsWith('image/');

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: _handleTap,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _buildContent(cs),
      ),
    );
  }

  Widget _buildContent(ColorScheme cs) {
    switch (_state) {
      case DecryptionState.locked:
        return _buildLockedState(cs);
      case DecryptionState.decrypting:
        return _buildDecryptingState(cs);
      case DecryptionState.decrypted:
        return _buildDecryptedContent(cs);
      case DecryptionState.failed:
        return _buildFailedState(cs);
    }
  }

  Widget _buildLockedState(ColorScheme cs) {
    return Container(
      key: const ValueKey('locked'),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withOpacity(0.2)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.lock,
                  size: 24,
                  color: Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.fileName,
                      style: context.textStyles.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(
                          _getFileIcon(),
                          size: 12,
                          color: cs.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatSize(widget.originalSize ?? 0),
                          style: context.textStyles.labelSmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.lock,
                                size: 10,
                                color: Colors.green,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'E2E',
                                style: context.textStyles.labelSmall?.copyWith(
                                  color: Colors.green,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 9,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.touch_app, color: Colors.green),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Tap to decrypt and view',
            style: context.textStyles.labelSmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDecryptingState(ColorScheme cs) {
    return Container(
      key: const ValueKey('decrypting'),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withOpacity(0.2)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(height: 16),
          Text(
            'Decrypting...',
            style: context.textStyles.labelMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDecryptedContent(ColorScheme cs) {
    if (_decryptedData == null) {
      return _buildFailedState(cs);
    }

    if (_isImage) {
      return ClipRRect(
        key: const ValueKey('decrypted_image'),
        borderRadius: BorderRadius.circular(12),
        child: Image.memory(
          _decryptedData!,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFailedState(cs),
        ),
      );
    }

    // For non-image files, show download/open button
    return Container(
      key: const ValueKey('decrypted_file'),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.lock_open,
              size: 24,
              color: Colors.green,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.fileName,
                  style: context.textStyles.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'Decrypted • ${_formatSize(_decryptedData!.length)}',
                  style: context.textStyles.labelSmall?.copyWith(
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.save_alt),
            onPressed: _saveFile,
            color: Colors.green,
          ),
        ],
      ),
    );
  }

  Widget _buildFailedState(ColorScheme cs) {
    return Container(
      key: const ValueKey('failed'),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.errorContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.error.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(Icons.error_outline, color: cs.error),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _error ?? 'Failed to decrypt',
                  style: context.textStyles.bodySmall?.copyWith(
                    color: cs.onErrorContainer,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _decrypt,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  void _handleTap() {
    if (_state == DecryptionState.locked) {
      _decrypt();
    }
  }

  Future<void> _decrypt() async {
    setState(() {
      _state = DecryptionState.decrypting;
      _error = null;
    });

    try {
      final result = await EncryptedAttachmentService.instance.downloadAndDecrypt(
        encryptedUrl: widget.encryptedUrl,
        encryptedFileKey: widget.encryptedFileKey,
        senderPublicKey: widget.senderPublicKey,
      );

      if (result != null) {
        setState(() {
          _decryptedData = result.bytes;
          _state = DecryptionState.decrypted;
        });
        widget.onDecrypted?.call();
      } else {
        setState(() {
          _error = 'Decryption failed';
          _state = DecryptionState.failed;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _state = DecryptionState.failed;
      });
    }
  }

  Future<void> _saveFile() async {
    if (_decryptedData == null) return;
    
    try {
      final result = await Share.shareXFiles(
        [XFile.fromData(_decryptedData!, name: widget.fileName, mimeType: widget.mimeType)],
        subject: widget.fileName,
      );
      
      if (result.status == ShareResultStatus.success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('File shared successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to share file: $e')),
        );
      }
    }
  }

  IconData _getFileIcon() {
    if (_isImage) return Icons.image;
    if (widget.mimeType.startsWith('video/')) return Icons.videocam;
    if (widget.mimeType.startsWith('audio/')) return Icons.audio_file;
    if (widget.mimeType.contains('pdf')) return Icons.picture_as_pdf;
    return Icons.insert_drive_file;
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

enum DecryptionState {
  locked,
  decrypting,
  decrypted,
  failed,
}
