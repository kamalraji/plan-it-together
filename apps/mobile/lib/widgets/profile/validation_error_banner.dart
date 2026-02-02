import 'package:flutter/material.dart';
import 'package:thittam1hub/services/profile_validation_service.dart';
import 'package:thittam1hub/theme.dart';

/// Displays validation errors in a banner format
class ValidationErrorBanner extends StatelessWidget {
  final ProfileValidationResult validationResult;
  final VoidCallback? onDismiss;

  const ValidationErrorBanner({
    super.key,
    required this.validationResult,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final errors = validationResult.errors;

    if (errors.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cs.errorContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: cs.error.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Icon(
                  Icons.error_outline,
                  color: cs.error,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${errors.length} field${errors.length > 1 ? 's' : ''} need${errors.length == 1 ? 's' : ''} attention',
                    style: context.textStyles.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: cs.onErrorContainer,
                    ),
                  ),
                ),
                if (onDismiss != null)
                  GestureDetector(
                    onTap: onDismiss,
                    child: Icon(
                      Icons.close,
                      size: 18,
                      color: cs.onErrorContainer.withOpacity(0.7),
                    ),
                  ),
              ],
            ),
          ),
          
          Divider(
            height: 1,
            color: cs.error.withOpacity(0.2),
          ),
          
          // Error list
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(12),
            itemCount: errors.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final error = errors[index];
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: cs.error.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: cs.error,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getFieldDisplayName(error.fieldName),
                          style: context.textStyles.labelMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: cs.onErrorContainer,
                          ),
                        ),
                        Text(
                          error.errorMessage ?? '',
                          style: context.textStyles.bodySmall?.copyWith(
                            color: cs.onErrorContainer.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  String _getFieldDisplayName(String fieldName) {
    switch (fieldName) {
      case 'fullName':
        return 'Full Name';
      case 'username':
        return 'Username';
      case 'bio':
        return 'Bio';
      case 'organization':
        return 'Organization';
      case 'phone':
        return 'Phone';
      case 'website':
        return 'Website';
      case 'linkedinUrl':
        return 'LinkedIn';
      case 'twitterUrl':
        return 'X/Twitter';
      case 'githubUrl':
        return 'GitHub';
      default:
        return fieldName;
    }
  }
}

/// Inline validation error display
class InlineValidationError extends StatelessWidget {
  final String? errorMessage;

  const InlineValidationError({
    super.key,
    this.errorMessage,
  });

  @override
  Widget build(BuildContext context) {
    if (errorMessage == null || errorMessage!.isEmpty) {
      return const SizedBox.shrink();
    }

    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(top: 6, left: 12),
      child: Row(
        children: [
          Icon(
            Icons.info_outline,
            size: 14,
            color: cs.error,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              errorMessage!,
              style: TextStyle(
                fontSize: 12,
                color: cs.error,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
