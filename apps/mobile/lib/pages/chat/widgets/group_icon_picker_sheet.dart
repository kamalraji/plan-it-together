import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import '../../../theme.dart';
import '../../../widgets/styled_bottom_sheet.dart';

/// Premium group icon picker bottom sheet
/// Features: camera, gallery, and gradient initial options
class GroupIconPickerSheet extends StatelessWidget {
  final Function(Uint8List bytes, String fileName) onImageSelected;
  final Function(Color color1, Color color2, String initial) onGradientSelected;
  final String? initialLetter;

  const GroupIconPickerSheet({
    super.key,
    required this.onImageSelected,
    required this.onGradientSelected,
    this.initialLetter,
  });

  static Future<void> show({
    required BuildContext context,
    required Function(Uint8List bytes, String fileName) onImageSelected,
    required Function(Color color1, Color color2, String initial) onGradientSelected,
    String? initialLetter,
  }) {
    return showStyledBottomSheet(
      context: context,
      title: 'Choose Group Photo',
      child: GroupIconPickerSheet(
        onImageSelected: onImageSelected,
        onGradientSelected: onGradientSelected,
        initialLetter: initialLetter,
      ),
    );
  }

  Future<void> _pickFromCamera(BuildContext context) async {
    Navigator.pop(context);
    
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );

    if (image != null) {
      final bytes = await image.readAsBytes();
      if (bytes.length <= 2 * 1024 * 1024) {
        onImageSelected(bytes, image.name);
      }
    }
  }

  Future<void> _pickFromGallery(BuildContext context) async {
    Navigator.pop(context);
    
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );

    if (image != null) {
      final bytes = await image.readAsBytes();
      if (bytes.length <= 2 * 1024 * 1024) {
        onImageSelected(bytes, image.name);
      }
    }
  }

  void _selectGradient(BuildContext context, _GradientOption option) {
    HapticFeedback.selectionClick();
    Navigator.pop(context);
    onGradientSelected(option.color1, option.color2, initialLetter ?? 'G');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Source options
        Row(
          children: [
            Expanded(
              child: _SourceOption(
                icon: Icons.camera_alt_rounded,
                label: 'Camera',
                color: AppColors.violet500,
                onTap: () => _pickFromCamera(context),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _SourceOption(
                icon: Icons.photo_library_rounded,
                label: 'Gallery',
                color: AppColors.emerald500,
                onTap: () => _pickFromGallery(context),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),

        // Gradient options title
        Text(
          'Or choose a gradient',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: cs.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: AppSpacing.md),

        // Gradient grid
        GridView.count(
          crossAxisCount: 4,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppSpacing.md,
          crossAxisSpacing: AppSpacing.md,
          children: _gradientOptions.map((option) {
            return _GradientOptionTile(
              option: option,
              initial: initialLetter ?? 'G',
              onTap: () => _selectGradient(context, option),
            );
          }).toList(),
        ),
        const SizedBox(height: AppSpacing.md),
      ],
    );
  }
}

class _SourceOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SourceOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: cs.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GradientOption {
  final Color color1;
  final Color color2;

  const _GradientOption(this.color1, this.color2);
}

final _gradientOptions = [
  _GradientOption(AppColors.violet500, AppColors.violet700),
  _GradientOption(AppColors.blue500, AppColors.blue700),
  _GradientOption(AppColors.emerald500, AppColors.teal500),
  _GradientOption(AppColors.pink500, AppColors.pink700),
  _GradientOption(AppColors.amber500, AppColors.amber700),
  _GradientOption(AppColors.teal500, AppColors.emerald500),
  _GradientOption(AppColors.rose500, AppColors.pink500),
  _GradientOption(AppColors.slate500, AppColors.slate700),
];

class _GradientOptionTile extends StatefulWidget {
  final _GradientOption option;
  final String initial;
  final VoidCallback onTap;

  const _GradientOptionTile({
    required this.option,
    required this.initial,
    required this.onTap,
  });

  @override
  State<_GradientOptionTile> createState() => _GradientOptionTileState();
}

class _GradientOptionTileState extends State<_GradientOptionTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.9).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [widget.option.color1, widget.option.color2],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            boxShadow: [
              BoxShadow(
                color: widget.option.color1.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Center(
            child: Text(
              widget.initial.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
