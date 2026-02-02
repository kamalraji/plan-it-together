import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/share_destination.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/share_destination_service.dart';
import 'package:thittam1hub/services/message_forwarding_service.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';

/// Bottom sheet for forwarding messages to multiple destinations
class ForwardMessageSheet extends StatefulWidget {
  final Message message;

  const ForwardMessageSheet({super.key, required this.message});

  /// Show the forward sheet
  static void show(BuildContext context, Message message) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => ForwardMessageSheet(message: message),
    );
  }

  @override
  State<ForwardMessageSheet> createState() => _ForwardMessageSheetState();
}

class _ForwardMessageSheetState extends State<ForwardMessageSheet> {
  List<ShareDestination> _recentDestinations = [];
  List<ShareDestination> _searchResults = [];
  final Set<ShareDestination> _selectedDestinations = {};
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = true;
  bool _isForwarding = false;

  @override
  void initState() {
    super.initState();
    _loadRecentDestinations();
  }

  @override
  void dispose() {
    _searchController.dispose();
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

  Future<void> _forwardToSelected() async {
    if (_selectedDestinations.isEmpty) return;

    setState(() => _isForwarding = true);
    HapticFeedback.mediumImpact();

    final resultsResult = await MessageForwardingService.instance.forwardToMultipleDestinations(
      message: widget.message,
      destinations: _selectedDestinations.toList(),
    );
    final results = resultsResult.isSuccess ? resultsResult.data : <String, bool>{};

    if (mounted) {
      Navigator.pop(context);
      
      final successCount = results.values.where((v) => v).length;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Forwarded to $successCount conversation${successCount != 1 ? 's' : ''}'),
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
                  Icon(Icons.forward_rounded, size: 20, color: cs.primary),
                  const SizedBox(width: 8),
                  Text(
                    'Forward Message',
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

            // Message Preview Card
            _MessagePreviewCard(message: widget.message),
            const SizedBox(height: 16),

            // Send To Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Icon(Icons.send_rounded, size: 16, color: cs.primary),
                  const SizedBox(width: 8),
                  Text(
                    'Forward to',
                    style: textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Recent Destinations
            _isLoading
                ? const SizedBox(
                    height: 80,
                    child: Center(child: CircularProgressIndicator.adaptive()),
                  )
                : _recentDestinations.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Text(
                          'No recent conversations',
                          style: textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
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

            // Forward Button
            if (_selectedDestinations.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _isForwarding ? null : _forwardToSelected,
                    icon: _isForwarding
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.forward_rounded),
                    label: Text(
                      'Forward to ${_selectedDestinations.length} conversation${_selectedDestinations.length != 1 ? 's' : ''}',
                    ),
                  ),
                ),
              ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

/// Compact message preview card
class _MessagePreviewCard extends StatelessWidget {
  final Message message;

  const _MessagePreviewCard({required this.message});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final hasAttachments = message.attachments.isNotEmpty;
    final attachmentIcon = hasAttachments ? _getAttachmentIcon() : null;

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
          // Message type icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: cs.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              hasAttachments ? attachmentIcon : Icons.chat_bubble_outline_rounded,
              color: cs.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          // Message info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.senderName,
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  message.content.isEmpty && hasAttachments
                      ? '${message.attachments.length} attachment${message.attachments.length != 1 ? 's' : ''}'
                      : message.content.length > 60
                          ? '${message.content.substring(0, 60)}...'
                          : message.content,
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          // Forwarded badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: cs.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.forward_rounded, size: 12, color: cs.primary),
                const SizedBox(width: 4),
                Text(
                  'Forward',
                  style: textTheme.labelSmall?.copyWith(
                    color: cs.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _getAttachmentIcon() {
    if (message.attachments.isEmpty) return Icons.attach_file_rounded;
    final type = message.attachments.first.type;
    switch (type) {
      case 'image':
        return Icons.image_rounded;
      case 'video':
        return Icons.videocam_rounded;
      case 'audio':
        return Icons.audiotrack_rounded;
      case 'document':
        return Icons.description_rounded;
      default:
        return Icons.attach_file_rounded;
    }
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
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: destinations.length,
        itemBuilder: (context, index) {
          final dest = destinations[index];
          final isSelected = selectedDestinations.contains(dest);
          return _DestinationCircle(
            destination: dest,
            isSelected: isSelected,
            onTap: () => onToggle(dest),
          );
        },
      ),
    );
  }
}

/// Circular destination avatar for quick selection
class _DestinationCircle extends StatelessWidget {
  final ShareDestination destination;
  final bool isSelected;
  final VoidCallback onTap;

  const _DestinationCircle({
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
      child: Container(
        width: 70,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? cs.primary : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: _buildAvatar(cs),
                ),
                if (isSelected)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: cs.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: cs.surface, width: 2),
                      ),
                      child: const Icon(Icons.check, size: 12, color: Colors.white),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              destination.name,
              style: textTheme.labelSmall?.copyWith(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
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

  Widget _buildAvatar(ColorScheme cs) {
    if (destination.type == ShareDestinationType.channel) {
      return Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: cs.primaryContainer,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            '#',
            style: TextStyle(
              color: cs.onPrimaryContainer,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      );
    }

    return StyledAvatar(
      imageUrl: destination.avatarUrl,
      name: destination.name,
      size: 48,
    );
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
      contentPadding: EdgeInsets.zero,
      leading: _buildLeading(cs),
      title: Text(
        destination.name,
        style: textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: destination.subtitle != null
          ? Text(
              destination.subtitle!,
              style: textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            )
          : null,
      trailing: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isSelected ? cs.primary : Colors.transparent,
          shape: BoxShape.circle,
          border: Border.all(
            color: isSelected ? cs.primary : cs.outline,
            width: 2,
          ),
        ),
        child: isSelected
            ? const Icon(Icons.check, size: 14, color: Colors.white)
            : null,
      ),
    );
  }

  Widget _buildLeading(ColorScheme cs) {
    if (destination.type == ShareDestinationType.channel) {
      return Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: cs.primaryContainer,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(
            '#',
            style: TextStyle(
              color: cs.onPrimaryContainer,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      );
    }

    return StyledAvatar(
      imageUrl: destination.avatarUrl,
      name: destination.name,
      size: 40,
    );
  }
}
