import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/services/organizer_application_service.dart';

/// Document type options for verification
enum DocumentType {
  businessLicense('business_license', 'Business License', Icons.business),
  registrationCert('registration_cert', 'Registration Certificate', Icons.verified),
  taxId('tax_id', 'Tax ID / GST', Icons.receipt_long),
  identity('identity', 'Government ID', Icons.badge);

  final String value;
  final String label;
  final IconData icon;

  const DocumentType(this.value, this.label, this.icon);

  static DocumentType? fromValue(String? value) {
    if (value == null) return null;
    return DocumentType.values.firstWhere(
      (t) => t.value == value,
      orElse: () => DocumentType.identity,
    );
  }
}

/// Uploaded document details callback
typedef DocumentUploadResult = ({String url, String type, String name});

/// Card for uploading and displaying verification documents
class DocumentUploadCard extends StatefulWidget {
  final String? currentDocumentUrl;
  final String? documentType;
  final String? documentName;
  final ValueChanged<DocumentUploadResult> onUploaded;
  final VoidCallback? onRemove;
  final bool isRequired;
  final String title;
  final String subtitle;

  const DocumentUploadCard({
    super.key,
    this.currentDocumentUrl,
    this.documentType,
    this.documentName,
    required this.onUploaded,
    this.onRemove,
    this.isRequired = true,
    this.title = 'Verification Document',
    this.subtitle = 'Upload a document to verify your organization',
  });

  @override
  State<DocumentUploadCard> createState() => _DocumentUploadCardState();
}

class _DocumentUploadCardState extends State<DocumentUploadCard> {
  final _applicationService = OrganizerApplicationService.instance;
  
  bool _isUploading = false;
  double _uploadProgress = 0;
  String? _error;
  DocumentType? _selectedType;

  @override
  void initState() {
    super.initState();
    _selectedType = DocumentType.fromValue(widget.documentType);
  }

  Future<void> _pickAndUploadDocument() async {
    if (_selectedType == null) {
      setState(() => _error = 'Please select a document type first');
      return;
    }

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        withData: true,
      );

      if (result == null || result.files.isEmpty) return;

      final file = result.files.first;
      if (file.bytes == null) {
        setState(() => _error = 'Failed to read file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setState(() => _error = 'File size must be under 5MB');
        return;
      }

      setState(() {
        _isUploading = true;
        _uploadProgress = 0;
        _error = null;
      });

      // Simulate upload progress
      for (var i = 0; i < 10; i++) {
        await Future.delayed(const Duration(milliseconds: 50));
        if (!mounted) return;
        setState(() => _uploadProgress = (i + 1) / 10);
      }

      // Upload document
      final mimeType = _getMimeType(file.extension ?? 'pdf');
      final uploadResult = await _applicationService.uploadDocument(
        bytes: file.bytes!,
        fileName: file.name,
        mimeType: mimeType,
      );

      if (!mounted) return;

      if (uploadResult.isSuccess && uploadResult.data != null) {
        HapticFeedback.mediumImpact();
        widget.onUploaded((
          url: uploadResult.data!,
          type: _selectedType!.value,
          name: file.name,
        ));
      } else {
        setState(() => _error = uploadResult.error ?? 'Upload failed');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Failed to upload document');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
          _uploadProgress = 0;
        });
      }
    }
  }

  String _getMimeType(String extension) {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }

  Future<void> _confirmRemove() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Document'),
        content: const Text('Are you sure you want to remove this document?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed == true && widget.onRemove != null) {
      HapticFeedback.lightImpact();
      widget.onRemove!();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hasDocument = widget.currentDocumentUrl != null;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Icon(
                    Icons.upload_file,
                    size: 18,
                    color: cs.primary,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            widget.title,
                            style: context.textStyles.titleSmall?.semiBold,
                          ),
                          if (widget.isRequired) ...[
                            const SizedBox(width: 4),
                            Text(
                              '*',
                              style: TextStyle(color: cs.error),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.subtitle,
                        style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.md),

            // Document type selector
            if (!hasDocument) ...[
              Text(
                'Document Type',
                style: context.textStyles.labelMedium?.withColor(cs.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: DocumentType.values.map((type) {
                  final isSelected = _selectedType == type;
                  return ChoiceChip(
                    label: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          type.icon,
                          size: 16,
                          color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
                        ),
                        const SizedBox(width: 6),
                        Text(type.label),
                      ],
                    ),
                    selected: isSelected,
                    onSelected: (selected) {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _selectedType = selected ? type : null;
                        _error = null;
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.md),
            ],

            // Upload area or document preview
            if (hasDocument)
              _buildDocumentPreview(cs)
            else
              _buildUploadArea(cs),

            // Error message
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Icon(Icons.error_outline, size: 16, color: cs.error),
                  const SizedBox(width: 6),
                  Text(
                    _error!,
                    style: context.textStyles.bodySmall?.withColor(cs.error),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildUploadArea(ColorScheme cs) {
    return InkWell(
      onTap: _isUploading ? null : _pickAndUploadDocument,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: cs.outline.withOpacity(0.3),
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          children: [
            if (_isUploading) ...[
              SizedBox(
                width: 48,
                height: 48,
                child: CircularProgressIndicator(
                  value: _uploadProgress,
                  strokeWidth: 3,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Uploading... ${(_uploadProgress * 100).toInt()}%',
                style: context.textStyles.bodyMedium,
              ),
            ] else ...[
              Icon(
                Icons.cloud_upload_outlined,
                size: 40,
                color: cs.primary.withOpacity(0.6),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Tap to upload',
                style: context.textStyles.bodyMedium?.semiBold,
              ),
              const SizedBox(height: 4),
              Text(
                'PDF, JPG, PNG • Max 5MB',
                style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentPreview(ColorScheme cs) {
    final docType = DocumentType.fromValue(widget.documentType);
    final fileName = widget.documentName ?? 'Document';
    final isPdf = fileName.toLowerCase().endsWith('.pdf');

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.success.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.success.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          // Document icon
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(
              isPdf ? Icons.picture_as_pdf : Icons.image,
              size: 24,
              color: isPdf ? Colors.red : cs.primary,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          // Document info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fileName,
                  style: context.textStyles.bodyMedium?.semiBold,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (docType != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    docType.label,
                    style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                  ),
                ],
              ],
            ),
          ),
          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle, size: 14, color: AppColors.success),
                const SizedBox(width: 4),
                Text(
                  'Uploaded',
                  style: context.textStyles.labelSmall?.withColor(AppColors.success),
                ),
              ],
            ),
          ),
          // Remove button
          if (widget.onRemove != null) ...[
            const SizedBox(width: AppSpacing.sm),
            IconButton(
              icon: Icon(Icons.close, size: 20, color: cs.error),
              onPressed: _confirmRemove,
              visualDensity: VisualDensity.compact,
            ),
          ],
        ],
      ),
    );
  }
}
