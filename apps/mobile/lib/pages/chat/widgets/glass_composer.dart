import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Glassmorphism message composer widget.
/// 
/// Features:
/// - Frosted glass background effect
/// - Attachment options panel (photo, GIF, file)
/// - Emoji picker integration
/// - Send button with loading state
class GlassComposer extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String hintLabel;
  final VoidCallback onSend;
  final ValueChanged<String>? onChanged;
  final bool sending;
  final bool showAttachments;
  final VoidCallback onToggleAttachments;
  final VoidCallback onEmojiTap;
  final VoidCallback onGifTap;
  final VoidCallback? onPhotoTap;
  final VoidCallback? onFileTap;

  const GlassComposer({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.hintLabel,
    required this.onSend,
    this.onChanged,
    this.sending = false,
    this.showAttachments = false,
    required this.onToggleAttachments,
    required this.onEmojiTap,
    required this.onGifTap,
    this.onPhotoTap,
    this.onFileTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface.withValues(alpha: 0.85),
            border: Border(
              top: BorderSide(
                color: theme.colorScheme.outline.withValues(alpha: 0.15),
              ),
            ),
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Attachment options
                _AttachmentOptionsPanel(
                  show: showAttachments,
                  onPhotoTap: onPhotoTap ?? () {},
                  onGifTap: onGifTap,
                  onFileTap: onFileTap ?? () {},
                ),
                
                // Main composer row
                _ComposerRow(
                  controller: controller,
                  focusNode: focusNode,
                  hintLabel: hintLabel,
                  onSend: onSend,
                  onChanged: onChanged,
                  sending: sending,
                  showAttachments: showAttachments,
                  onToggleAttachments: onToggleAttachments,
                  onEmojiTap: onEmojiTap,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Attachment options panel
class _AttachmentOptionsPanel extends StatelessWidget {
  final bool show;
  final VoidCallback onPhotoTap;
  final VoidCallback onGifTap;
  final VoidCallback onFileTap;

  const _AttachmentOptionsPanel({
    required this.show,
    required this.onPhotoTap,
    required this.onGifTap,
    required this.onFileTap,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedCrossFade(
      firstChild: const SizedBox.shrink(),
      secondChild: Container(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            AttachmentOption(
              icon: Icons.image_outlined,
              label: 'Photo',
              color: AppColors.indigo500,
              onTap: onPhotoTap,
            ),
            const SizedBox(width: 12),
            AttachmentOption(
              icon: Icons.gif_box_outlined,
              label: 'GIF',
              color: AppColors.pink500,
              onTap: onGifTap,
            ),
            const SizedBox(width: 12),
            AttachmentOption(
              icon: Icons.attach_file,
              label: 'File',
              color: AppColors.teal500,
              onTap: onFileTap,
            ),
          ],
        ),
      ),
      crossFadeState: show
          ? CrossFadeState.showSecond
          : CrossFadeState.showFirst,
      duration: const Duration(milliseconds: 200),
    );
  }
}

/// Main composer row with toggle, text field, and send button
class _ComposerRow extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String hintLabel;
  final VoidCallback onSend;
  final ValueChanged<String>? onChanged;
  final bool sending;
  final bool showAttachments;
  final VoidCallback onToggleAttachments;
  final VoidCallback onEmojiTap;

  const _ComposerRow({
    required this.controller,
    required this.focusNode,
    required this.hintLabel,
    required this.onSend,
    this.onChanged,
    required this.sending,
    required this.showAttachments,
    required this.onToggleAttachments,
    required this.onEmojiTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Attachment toggle
        _AttachmentToggleButton(
          showAttachments: showAttachments,
          onTap: onToggleAttachments,
        ),
        const SizedBox(width: 8),
        
        // Text field
        Expanded(
          child: _ComposerTextField(
            controller: controller,
            focusNode: focusNode,
            hintLabel: hintLabel,
            onSend: onSend,
            onChanged: onChanged,
            onEmojiTap: onEmojiTap,
          ),
        ),
        const SizedBox(width: 8),
        
        // Send button
        _SendButton(
          onTap: sending ? null : onSend,
          sending: sending,
        ),
      ],
    );
  }
}

/// Attachment toggle button
class _AttachmentToggleButton extends StatelessWidget {
  final bool showAttachments;
  final VoidCallback onTap;

  const _AttachmentToggleButton({
    required this.showAttachments,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: showAttachments
              ? theme.colorScheme.primary.withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          showAttachments ? Icons.close : Icons.add,
          color: showAttachments
              ? theme.colorScheme.primary
              : theme.colorScheme.onSurface.withValues(alpha: 0.5),
          size: 22,
        ),
      ),
    );
  }
}

/// Composer text field with emoji button
class _ComposerTextField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String hintLabel;
  final VoidCallback onSend;
  final ValueChanged<String>? onChanged;
  final VoidCallback onEmojiTap;

  const _ComposerTextField({
    required this.controller,
    required this.focusNode,
    required this.hintLabel,
    required this.onSend,
    this.onChanged,
    required this.onEmojiTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              onChanged: onChanged,
              onSubmitted: (_) => onSend(),
              textInputAction: TextInputAction.send,
              maxLines: 4,
              minLines: 1,
              style: context.textStyles.bodyMedium,
              decoration: InputDecoration(
                hintText: 'Message $hintLabel',
                hintStyle: context.textStyles.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),
          GestureDetector(
            onTap: onEmojiTap,
            child: Padding(
              padding: const EdgeInsets.only(right: 8, bottom: 10),
              child: Icon(
                Icons.emoji_emotions_outlined,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                size: 22,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Send button with loading state
class _SendButton extends StatelessWidget {
  final VoidCallback? onTap;
  final bool sending;

  const _SendButton({
    required this.onTap,
    required this.sending,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.primary,
              theme.colorScheme.primary.withValues(alpha: 0.8),
            ],
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.primary.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: sending
            ? const Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
              )
            : const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
      ),
    );
  }
}

/// Attachment option button
class AttachmentOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  
  const AttachmentOption({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
