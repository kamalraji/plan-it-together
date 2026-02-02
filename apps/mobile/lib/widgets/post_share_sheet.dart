import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/share_destination.dart';
import 'package:thittam1hub/services/share_destination_service.dart';
import 'package:thittam1hub/services/post_sharing_service.dart';
import 'package:thittam1hub/supabase/spark_service.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';

/// Modern post share sheet with in-app and external destinations
class PostShareSheet extends StatefulWidget {
  final SparkPost post;

  const PostShareSheet({super.key, required this.post});

  /// Show the share sheet
  static void show(BuildContext context, SparkPost post) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => PostShareSheet(post: post),
    );
  }

  @override
  State<PostShareSheet> createState() => _PostShareSheetState();
}

class _PostShareSheetState extends State<PostShareSheet> {
  List<ShareDestination> _recentDestinations = [];
  List<ShareDestination> _searchResults = [];
  final Set<ShareDestination> _selectedDestinations = {};
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  bool _isLoading = true;
  bool _isSending = false;
  bool _showMessageInput = false;

  @override
  void initState() {
    super.initState();
    _loadRecentDestinations();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadRecentDestinations() async {
    final destinations = await ShareDestinationService.fetchRecentDestinations();
    if (mounted) {
      setState(() {
        _recentDestinations = destinations;
        _isLoading = false;
      });
    }
  }

  Future<void> _searchDestinations(String query) async {
    if (query.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }

    final results = await ShareDestinationService.fetchSearchResults(query);
    if (mounted) {
      setState(() => _searchResults = results);
    }
  }

  void _toggleDestination(ShareDestination dest) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selectedDestinations.contains(dest)) {
        _selectedDestinations.remove(dest);
      } else {
        _selectedDestinations.add(dest);
      }
    });
  }

  Future<void> _sendToSelected() async {
    if (_selectedDestinations.isEmpty) return;

    setState(() => _isSending = true);
    HapticFeedback.mediumImpact();

    final shareResult = await ShareDestinationService.instance.shareToMultipleDestinations(
      post: widget.post,
      destinations: _selectedDestinations.toList(),
      message: _messageController.text.isNotEmpty ? _messageController.text : null,
    );

    final results = shareResult.isSuccess ? shareResult.data : <String, bool>{};

    if (mounted) {
      Navigator.pop(context);
      
      final successCount = results.values.where((v) => v).length;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Shared to $successCount conversation${successCount != 1 ? 's' : ''}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomPadding),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text(
                    'Share Post',
                    style: textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  if (_selectedDestinations.isNotEmpty)
                    TextButton(
                      onPressed: () => setState(() => _selectedDestinations.clear()),
                      child: Text('Clear (${_selectedDestinations.length})'),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Post Preview Card
            _PostPreviewCard(post: widget.post),
            const SizedBox(height: 16),

            // Send To Section (In-App)
            if (_recentDestinations.isNotEmpty || _isLoading) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Icon(Icons.send_rounded, size: 16, color: cs.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Send to',
                      style: textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _isLoading
                  ? const SizedBox(
                      height: 80,
                      child: Center(child: CircularProgressIndicator.adaptive()),
                    )
                  : _RecentDestinationsRow(
                      destinations: _recentDestinations,
                      selectedDestinations: _selectedDestinations,
                      onToggle: _toggleDestination,
                    ),
              const SizedBox(height: 12),

              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: TextField(
                  controller: _searchController,
                  onChanged: _searchDestinations,
                  decoration: InputDecoration(
                    hintText: 'Search people, groups, channels...',
                    prefixIcon: const Icon(Icons.search_rounded),
                    filled: true,
                    fillColor: cs.surfaceContainerHighest.withOpacity(0.5),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),

              // Search Results
              if (_searchResults.isNotEmpty) ...[
                const SizedBox(height: 8),
                SizedBox(
                  height: 150,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: _searchResults.length,
                    itemBuilder: (context, index) {
                      final dest = _searchResults[index];
                      final isSelected = _selectedDestinations.contains(dest);
                      return _DestinationTile(
                        destination: dest,
                        isSelected: isSelected,
                        onTap: () => _toggleDestination(dest),
                      );
                    },
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ],

            // Optional Message Input
            if (_selectedDestinations.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GestureDetector(
                  onTap: () => setState(() => _showMessageInput = !_showMessageInput),
                  child: Row(
                    children: [
                      Icon(
                        _showMessageInput ? Icons.keyboard_hide_rounded : Icons.edit_rounded,
                        size: 16,
                        color: cs.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _showMessageInput ? 'Hide message' : 'Add a message',
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (_showMessageInput) ...[
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: TextField(
                    controller: _messageController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: 'Write a message...',
                      filled: true,
                      fillColor: cs.surfaceContainerHighest.withOpacity(0.5),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
            ],

            // Send Button (when destinations selected)
            if (_selectedDestinations.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _isSending ? null : _sendToSelected,
                    icon: _isSending
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send_rounded),
                    label: Text(
                      'Send to ${_selectedDestinations.length} conversation${_selectedDestinations.length != 1 ? 's' : ''}',
                    ),
                  ),
                ),
              ),

            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 16),

            // External Share Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Icon(Icons.share_rounded, size: 16, color: cs.primary),
                  const SizedBox(width: 8),
                  Text(
                    'Share to',
                    style: textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // External Platform Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _ExternalShareButton(
                    icon: Icons.copy_rounded,
                    label: 'Copy',
                    color: cs.primary,
                    onTap: () {
                      Navigator.pop(context);
                      PostSharingService.copyLink(context, widget.post.id);
                    },
                  ),
                  _ExternalShareButton(
                    icon: Icons.ios_share_rounded,
                    label: 'Share',
                    color: Colors.blue,
                    onTap: () {
                      Navigator.pop(context);
                      PostSharingService.sharePost(widget.post);
                    },
                  ),
                  _ExternalShareButton(
                    icon: Icons.alternate_email_rounded,
                    label: 'X',
                    color: Colors.black87,
                    onTap: () {
                      Navigator.pop(context);
                      PostSharingService.shareToTwitter(widget.post);
                    },
                  ),
                  _ExternalShareButton(
                    icon: Icons.work_rounded,
                    label: 'LinkedIn',
                    color: const Color(0xFF0A66C2),
                    onTap: () {
                      Navigator.pop(context);
                      PostSharingService.shareToLinkedIn(widget.post);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _ExternalShareButton(
                    icon: Icons.chat_rounded,
                    label: 'WhatsApp',
                    color: const Color(0xFF25D366),
                    onTap: () {
                      Navigator.pop(context);
                      PostSharingService.shareToWhatsApp(widget.post);
                    },
                  ),
                  _ExternalShareButton(
                    icon: Icons.send_rounded,
                    label: 'Telegram',
                    color: const Color(0xFF0088CC),
                    onTap: () {
                      Navigator.pop(context);
                      PostSharingService.shareToTelegram(widget.post);
                    },
                  ),
                  const SizedBox(width: 64), // Spacer
                  const SizedBox(width: 64), // Spacer
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

/// Compact post preview card
class _PostPreviewCard extends StatelessWidget {
  final SparkPost post;

  const _PostPreviewCard({required this.post});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          // Post type icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: cs.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.article_rounded,
              color: cs.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          // Post info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.title,
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${post.content.length > 50 ? '${post.content.substring(0, 50)}...' : post.content} — ${post.authorName}',
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (post.imageUrl != null) ...[
            const SizedBox(width: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.network(
                post.imageUrl!,
                width: 40,
                height: 40,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Horizontal scrollable recent destinations row
class _RecentDestinationsRow extends StatelessWidget {
  final List<ShareDestination> destinations;
  final Set<ShareDestination> selectedDestinations;
  final void Function(ShareDestination) onToggle;

  const _RecentDestinationsRow({
    required this.destinations,
    required this.selectedDestinations,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 80,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: destinations.length,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final dest = destinations[index];
          final isSelected = selectedDestinations.contains(dest);
          return _DestinationAvatar(
            destination: dest,
            isSelected: isSelected,
            onTap: () => onToggle(dest),
          );
        },
      ),
    );
  }
}

/// Circular avatar for destination
class _DestinationAvatar extends StatelessWidget {
  final ShareDestination destination;
  final bool isSelected;
  final VoidCallback onTap;

  const _DestinationAvatar({
    required this.destination,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 60,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: isSelected
                        ? Border.all(color: cs.primary, width: 2)
                        : null,
                  ),
                  child: StyledAvatar(
                    size: 48,
                    imageUrl: destination.avatarUrl,
                    name: destination.name,
                  ),
                ),
                // Type badge
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      shape: BoxShape.circle,
                      border: Border.all(color: cs.surface, width: 2),
                    ),
                    child: Center(
                      child: _getTypeIcon(destination.type, cs),
                    ),
                  ),
                ),
                // Selection checkmark
                if (isSelected)
                  Positioned(
                    left: 0,
                    top: 0,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: cs.primary,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.check_rounded,
                        size: 12,
                        color: cs.onPrimary,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              destination.name,
              style: textTheme.bodySmall?.copyWith(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : null,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _getTypeIcon(ShareDestinationType type, ColorScheme cs) {
    switch (type) {
      case ShareDestinationType.dm:
        return Icon(Icons.person_rounded, size: 10, color: cs.onPrimaryContainer);
      case ShareDestinationType.group:
        return Icon(Icons.group_rounded, size: 10, color: cs.onPrimaryContainer);
      case ShareDestinationType.channel:
        return Icon(Icons.tag_rounded, size: 10, color: cs.onPrimaryContainer);
    }
  }
}

/// List tile for search results
class _DestinationTile extends StatelessWidget {
  final ShareDestination destination;
  final bool isSelected;
  final VoidCallback onTap;

  const _DestinationTile({
    required this.destination,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return ListTile(
      onTap: onTap,
      leading: StyledAvatar(
        size: 40,
        imageUrl: destination.avatarUrl,
        name: destination.name,
      ),
      title: Text(
        destination.name,
        style: textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        destination.subtitle ?? destination.typeLabel,
        style: textTheme.bodySmall?.copyWith(
          color: cs.onSurfaceVariant,
        ),
      ),
      trailing: isSelected
          ? Icon(Icons.check_circle_rounded, color: cs.primary)
          : Icon(Icons.circle_outlined, color: cs.outline),
      contentPadding: EdgeInsets.zero,
      dense: true,
    );
  }
}

/// External platform share button
class _ExternalShareButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ExternalShareButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
