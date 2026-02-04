import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:thittam1hub/theme.dart';

import 'package:thittam1hub/services/logging_service.dart';

/// Preset gradient themes for cover banners
class CoverGradientTheme {
  final String name;
  final List<Color> colors;
  final String id;

  const CoverGradientTheme({
    required this.name,
    required this.colors,
    required this.id,
  });

  static const List<CoverGradientTheme> presets = [
    CoverGradientTheme(
      id: 'sunset',
      name: 'Sunset',
      colors: [Color(0xFFFF6B6B), Color(0xFFFFE66D)],
    ),
    CoverGradientTheme(
      id: 'ocean',
      name: 'Ocean',
      colors: [Color(0xFF4FACFE), Color(0xFF00F2FE)],
    ),
    CoverGradientTheme(
      id: 'forest',
      name: 'Forest',
      colors: [Color(0xFF11998E), Color(0xFF38EF7D)],
    ),
    CoverGradientTheme(
      id: 'lavender',
      name: 'Lavender',
      colors: [Color(0xFFA18CD1), Color(0xFFFBC2EB)],
    ),
    CoverGradientTheme(
      id: 'coral',
      name: 'Coral',
      colors: [Color(0xFFFF9A8B), Color(0xFFFF6A88)],
    ),
    CoverGradientTheme(
      id: 'midnight',
      name: 'Midnight',
      colors: [Color(0xFF232526), Color(0xFF414345)],
    ),
  ];
}

/// Bottom sheet for selecting cover image or gradient theme
class CoverImagePickerSheet extends StatelessWidget {
  static const String _tag = 'CoverImagePickerSheet';
  static final _log = LoggingService.instance;
  
  final String? currentImageUrl;
  final String? currentGradientId;
  final Function(String gradientId) onSelectGradient;
  final Function(Uint8List imageBytes, String fileName) onSelectImage;
  final VoidCallback? onRemove;

  const CoverImagePickerSheet({
    super.key,
    this.currentImageUrl,
    this.currentGradientId,
    required this.onSelectGradient,
    required this.onSelectImage,
    this.onRemove,
  });

  Future<void> _pickImage(BuildContext context) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 600,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        final bytes = await pickedFile.readAsBytes();
        final fileName = 'cover_${DateTime.now().millisecondsSinceEpoch}.jpg';
        onSelectImage(bytes, fileName);
        if (context.mounted) Navigator.pop(context);
      }
    } catch (e) {
      _log.error('Failed to pick image: $e', tag: _tag);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick image: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.outline.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Title
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Choose Cover',
              style: context.textStyles.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          // Preset themes section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PRESET THEMES',
                  style: context.textStyles.labelSmall?.copyWith(
                    color: cs.onSurfaceVariant,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: CoverGradientTheme.presets.map((theme) {
                    final isSelected = currentGradientId == theme.id;
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        onSelectGradient(theme.id);
                        Navigator.pop(context);
                      },
                      child: Column(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: theme.colors,
                              ),
                              borderRadius: BorderRadius.circular(12),
                              border: isSelected
                                  ? Border.all(color: cs.primary, width: 3)
                                  : null,
                              boxShadow: [
                                BoxShadow(
                                  color: theme.colors.first.withValues(alpha: 0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: isSelected
                                ? Center(
                                    child: Icon(
                                      Icons.check,
                                      color: Colors.white,
                                      size: 24,
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            theme.name,
                            style: context.textStyles.labelSmall?.copyWith(
                              color: isSelected ? cs.primary : cs.onSurfaceVariant,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Custom upload button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _pickImage(context),
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Upload Custom Photo'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ),
          // Remove option
          if (currentImageUrl != null || currentGradientId != null) ...[
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    onRemove?.call();
                    Navigator.pop(context);
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.error,
                  ),
                  child: const Text('Remove Cover'),
                ),
              ),
            ),
          ],
          SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
        ],
      ),
    );
  }
}

/// Helper to show the cover image picker sheet
void showCoverImagePicker({
  required BuildContext context,
  String? currentImageUrl,
  String? currentGradientId,
  required Function(String gradientId) onSelectGradient,
  required Function(Uint8List imageBytes, String fileName) onSelectImage,
  VoidCallback? onRemove,
}) {
  final isTablet = MediaQuery.of(context).size.width >= 600;
  final screenHeight = MediaQuery.of(context).size.height;
  
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    constraints: isTablet ? BoxConstraints(
      maxHeight: screenHeight * 0.5,
      maxWidth: 500,
    ) : null,
    builder: (context) => Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: isTablet ? 500 : double.infinity),
        child: CoverImagePickerSheet(
          currentImageUrl: currentImageUrl,
          currentGradientId: currentGradientId,
          onSelectGradient: onSelectGradient,
          onSelectImage: onSelectImage,
          onRemove: onRemove,
        ),
      ),
    ),
  );
}
