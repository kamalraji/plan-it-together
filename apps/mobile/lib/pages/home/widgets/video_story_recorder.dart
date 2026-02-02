import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:thittam1hub/services/video_story_service.dart';

/// Bottom sheet for recording or selecting video stories
class VideoStoryRecorder extends StatefulWidget {
  final Function(String videoUrl, String? caption)? onStoryCreated;
  
  const VideoStoryRecorder({
    Key? key,
    this.onStoryCreated,
  }) : super(key: key);

  @override
  State<VideoStoryRecorder> createState() => _VideoStoryRecorderState();
  
  static Future<void> show(BuildContext context, {
    Function(String videoUrl, String? caption)? onStoryCreated,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => VideoStoryRecorder(onStoryCreated: onStoryCreated),
    );
  }
}

class _VideoStoryRecorderState extends State<VideoStoryRecorder> {
  final _videoStoryService = VideoStoryService();
  final _captionController = TextEditingController();
  
  XFile? _selectedVideo;
  Uint8List? _videoBytes;
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  String? _error;

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }

  Future<void> _recordVideo() async {
    HapticFeedback.mediumImpact();
    final video = await _videoStoryService.recordVideo();
    if (video != null) {
      await _processVideo(video);
    }
  }

  Future<void> _pickFromGallery() async {
    HapticFeedback.mediumImpact();
    final video = await _videoStoryService.pickVideoFromGallery();
    if (video != null) {
      await _processVideo(video);
    }
  }

  Future<void> _processVideo(XFile video) async {
    try {
      setState(() {
        _error = null;
        _selectedVideo = video;
      });
      
      final bytes = await _videoStoryService.validateVideo(video);
      setState(() {
        _videoBytes = bytes;
      });
    } on VideoValidationError catch (e) {
      setState(() {
        _error = e.message;
        _selectedVideo = null;
        _videoBytes = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to process video';
        _selectedVideo = null;
        _videoBytes = null;
      });
    }
  }

  Future<void> _uploadStory() async {
    if (_videoBytes == null || _selectedVideo == null) return;
    
    HapticFeedback.mediumImpact();
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
      _error = null;
    });

    try {
      // Upload video
      final videoUrl = await _videoStoryService.uploadVideoStory(
        bytes: _videoBytes!,
        fileName: _selectedVideo!.name,
        onProgress: (progress) {
          setState(() => _uploadProgress = progress * 0.8); // 80% for upload
        },
      );

      setState(() => _uploadProgress = 0.9);

      // Create story record
      final story = await _videoStoryService.createVideoStory(
        videoUrl: videoUrl,
        caption: _captionController.text.trim().isEmpty 
            ? null 
            : _captionController.text.trim(),
      );

      setState(() => _uploadProgress = 1.0);

      if (story != null) {
        HapticFeedback.heavyImpact();
        widget.onStoryCreated?.call(videoUrl, _captionController.text.trim());
        if (mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Story posted! 🎬'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to upload story. Please try again.';
        _isUploading = false;
      });
    }
  }

  void _clearSelection() {
    HapticFeedback.lightImpact();
    setState(() {
      _selectedVideo = null;
      _videoBytes = null;
      _error = null;
      _captionController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(bottom: bottomPadding),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Icon(Icons.video_camera_front_rounded, color: cs.primary),
                const SizedBox(width: 12),
                Text(
                  _selectedVideo != null ? 'Add Caption' : 'Create Video Story',
                  style: textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (_selectedVideo != null)
                  IconButton(
                    onPressed: _clearSelection,
                    icon: Icon(Icons.close_rounded, color: cs.onSurfaceVariant),
                    tooltip: 'Clear selection',
                  ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Error message
          if (_error != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.errorContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline_rounded, color: cs.error, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: textTheme.bodySmall?.copyWith(color: cs.error),
                    ),
                  ),
                ],
              ),
            ),

          if (_error != null) const SizedBox(height: 16),

          // Content based on state
          if (_selectedVideo == null)
            _buildSourceSelection(cs, textTheme)
          else
            _buildCaptionInput(cs, textTheme),

          // Upload button
          if (_selectedVideo != null)
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isUploading ? null : _uploadStory,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: cs.primary,
                    foregroundColor: cs.onPrimary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isUploading
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                value: _uploadProgress,
                                color: cs.onPrimary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text('Uploading ${(_uploadProgress * 100).toInt()}%'),
                          ],
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.upload_rounded),
                            SizedBox(width: 8),
                            Text('Share Story'),
                          ],
                        ),
                ),
              ),
            ),

          // Bottom spacing
          SizedBox(height: _selectedVideo == null ? 20 : 0),
        ],
      ),
    );
  }

  Widget _buildSourceSelection(ColorScheme cs, TextTheme textTheme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          // Duration hint
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: cs.primaryContainer.withOpacity(0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.timer_outlined, size: 18, color: cs.primary),
                const SizedBox(width: 8),
                Text(
                  'Max 30 seconds • Disappears in 24h',
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Record button
          _SourceOption(
            icon: Icons.videocam_rounded,
            label: 'Record Video',
            description: 'Use your camera to record',
            color: Colors.red,
            onTap: _recordVideo,
          ),
          const SizedBox(height: 12),

          // Gallery button
          _SourceOption(
            icon: Icons.photo_library_rounded,
            label: 'Choose from Gallery',
            description: 'Select an existing video',
            color: cs.primary,
            onTap: _pickFromGallery,
          ),
        ],
      ),
    );
  }

  Widget _buildCaptionInput(ColorScheme cs, TextTheme textTheme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Video preview placeholder
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: cs.outline.withOpacity(0.2),
              ),
            ),
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.videocam_rounded,
                        size: 40,
                        color: cs.primary.withOpacity(0.6),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _selectedVideo?.name ?? 'Video selected',
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.check, size: 14, color: Colors.white),
                        const SizedBox(width: 4),
                        Text(
                          'Ready',
                          style: textTheme.labelSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Caption input
          TextField(
            controller: _captionController,
            maxLength: 100,
            maxLines: 2,
            style: textTheme.bodyMedium,
            decoration: InputDecoration(
              hintText: 'Add a caption... (optional)',
              hintStyle: textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              filled: true,
              fillColor: cs.surfaceContainerHighest.withOpacity(0.5),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.all(16),
              counterStyle: textTheme.labelSmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SourceOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final String description;
  final Color color;
  final VoidCallback onTap;

  const _SourceOption({
    required this.icon,
    required this.label,
    required this.description,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: cs.surfaceContainerHighest.withOpacity(0.5),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      description,
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: cs.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
