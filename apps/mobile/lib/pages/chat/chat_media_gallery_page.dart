import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/chat_media_models.dart';
import '../../services/chat_media_service.dart';
import '../../widgets/chat/media_gallery_viewer.dart';

/// Media gallery page with tabbed view for Photos, Videos, Documents, Links
class ChatMediaGalleryPage extends StatefulWidget {
  final String channelId;
  final String? channelName;

  const ChatMediaGalleryPage({
    super.key,
    required this.channelId,
    this.channelName,
  });

  @override
  State<ChatMediaGalleryPage> createState() => _ChatMediaGalleryPageState();
}

class _ChatMediaGalleryPageState extends State<ChatMediaGalleryPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Media data per tab
  final Map<MediaType, List<ChatMediaItem>> _mediaItems = {};
  final Map<MediaType, bool> _isLoading = {};
  final Map<MediaType, bool> _hasMore = {};
  final Map<MediaType, int> _offsets = {};

  // Selection mode
  bool _selectionMode = false;
  final Set<String> _selectedIds = {};

  // Tab configuration
  static const _tabs = [
    MediaType.photo,
    MediaType.video,
    MediaType.document,
    MediaType.link,
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);

    // Initialize state for each tab
    for (final type in _tabs) {
      _mediaItems[type] = [];
      _isLoading[type] = false;
      _hasMore[type] = true;
      _offsets[type] = 0;
    }

    // Load initial data for first tab
    _loadMedia(_tabs[0]);
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;

    final currentType = _tabs[_tabController.index];
    if (_mediaItems[currentType]!.isEmpty && !_isLoading[currentType]!) {
      _loadMedia(currentType);
    }

    // Clear selection when switching tabs
    if (_selectionMode) {
      setState(() {
        _selectedIds.clear();
        _selectionMode = false;
      });
    }
  }

  Future<void> _loadMedia(MediaType type, {bool refresh = false}) async {
    if (_isLoading[type]! && !refresh) return;
    if (!_hasMore[type]! && !refresh) return;

    setState(() {
      _isLoading[type] = true;
      if (refresh) {
        _offsets[type] = 0;
        _hasMore[type] = true;
      }
    });

    try {
      final items = await ChatMediaService.fetchChannelMedia(
        channelId: widget.channelId,
        type: type,
        limit: 50,
        offset: refresh ? 0 : _offsets[type]!,
      );

      setState(() {
        if (refresh) {
          _mediaItems[type] = items;
        } else {
          _mediaItems[type]!.addAll(items);
        }
        _offsets[type] = _offsets[type]! + items.length;
        _hasMore[type] = items.length >= 50;
        _isLoading[type] = false;
      });
    } catch (e) {
      setState(() {
        _isLoading[type] = false;
      });
    }
  }

  void _toggleSelection(ChatMediaItem item) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selectedIds.contains(item.id)) {
        _selectedIds.remove(item.id);
        if (_selectedIds.isEmpty) {
          _selectionMode = false;
        }
      } else {
        _selectedIds.add(item.id);
      }
    });
  }

  void _enterSelectionMode(ChatMediaItem item) {
    HapticFeedback.mediumImpact();
    setState(() {
      _selectionMode = true;
      _selectedIds.add(item.id);
    });
  }

  void _exitSelectionMode() {
    setState(() {
      _selectionMode = false;
      _selectedIds.clear();
    });
  }

  void _selectAll() {
    final currentType = _tabs[_tabController.index];
    setState(() {
      _selectedIds.addAll(_mediaItems[currentType]!.map((e) => e.id));
    });
  }

  Future<void> _deleteSelected() async {
    final currentType = _tabs[_tabController.index];
    final selectedItems = _mediaItems[currentType]!
        .where((item) => _selectedIds.contains(item.id))
        .toList();

    if (selectedItems.isEmpty) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Media'),
        content: Text(
          'Are you sure you want to delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final result = await ChatMediaService.instance.deleteMediaItems(selectedItems);
    final success = result.isSuccess && result.data;

    if (success && mounted) {
      setState(() {
        _mediaItems[currentType]!.removeWhere(
          (item) => _selectedIds.contains(item.id),
        );
        _selectedIds.clear();
        _selectionMode = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Deleted ${selectedItems.length} items')),
      );
    }
  }

  Future<void> _downloadSelected() async {
    final currentType = _tabs[_tabController.index];
    final selectedItems = _mediaItems[currentType]!
        .where((item) => _selectedIds.contains(item.id))
        .toList();

    if (selectedItems.isEmpty) return;

    // In a real implementation, you'd use a download service
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Downloading ${selectedItems.length} items...'),
      ),
    );

    // Simulate download
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Download complete!')),
      );
      _exitSelectionMode();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: _selectionMode
            ? Text('${_selectedIds.length} selected')
            : Text(widget.channelName ?? 'Media'),
        leading: _selectionMode
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: _exitSelectionMode,
              )
            : null,
        actions: _selectionMode
            ? [
                IconButton(
                  icon: const Icon(Icons.select_all),
                  onPressed: _selectAll,
                  tooltip: 'Select All',
                ),
                IconButton(
                  icon: const Icon(Icons.download_rounded),
                  onPressed: _downloadSelected,
                  tooltip: 'Download',
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: _deleteSelected,
                  tooltip: 'Delete',
                ),
              ]
            : null,
        bottom: TabBar(
          controller: _tabController,
          tabs: _tabs.map((type) {
            final count = _mediaItems[type]?.length ?? 0;
            return Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(type.label),
                  if (count > 0) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        count.toString(),
                        style: TextStyle(
                          fontSize: 11,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _tabs.map((type) => _buildMediaTab(type)).toList(),
      ),
    );
  }

  Widget _buildMediaTab(MediaType type) {
    final items = _mediaItems[type] ?? [];
    final isLoading = _isLoading[type] ?? false;
    final hasMore = _hasMore[type] ?? false;

    if (items.isEmpty && isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (items.isEmpty) {
      return _buildEmptyState(type);
    }

    final groups = ChatMediaService.instance.groupByDate(items);

    return RefreshIndicator(
      onRefresh: () => _loadMedia(type, refresh: true),
      child: CustomScrollView(
        slivers: [
          ...groups.map((group) => _buildDateGroup(group, type)),
          if (hasMore)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: isLoading
                      ? const CircularProgressIndicator()
                      : TextButton(
                          onPressed: () => _loadMedia(type),
                          child: const Text('Load More'),
                        ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(MediaType type) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _getTypeIcon(type),
            size: 64,
            color: Theme.of(context).colorScheme.outline,
          ),
          const SizedBox(height: 16),
          Text(
            'No ${type.label.toLowerCase()} yet',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).colorScheme.outline,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Media shared in this chat will appear here',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.outline,
                ),
          ),
        ],
      ),
    );
  }

  IconData _getTypeIcon(MediaType type) {
    switch (type) {
      case MediaType.photo:
        return Icons.photo_library_outlined;
      case MediaType.video:
        return Icons.video_library_outlined;
      case MediaType.document:
        return Icons.folder_outlined;
      case MediaType.link:
        return Icons.link_outlined;
    }
  }

  Widget _buildDateGroup(MediaDateGroup group, MediaType type) {
    return SliverMainAxisGroup(
      slivers: [
        SliverPersistentHeader(
          pinned: true,
          delegate: _DateHeaderDelegate(
            label: group.dateLabel,
            count: group.items.length,
          ),
        ),
        if (type == MediaType.photo || type == MediaType.video)
          _buildGridView(group.items, type)
        else
          _buildListView(group.items, type),
      ],
    );
  }

  Widget _buildGridView(List<ChatMediaItem> items, MediaType type) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 2,
          crossAxisSpacing: 2,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final item = items[index];
            final isSelected = _selectedIds.contains(item.id);

            return GestureDetector(
              onTap: () {
                if (_selectionMode) {
                  _toggleSelection(item);
                } else {
                  _openMediaViewer(item);
                }
              },
              onLongPress: () => _enterSelectionMode(item),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _buildMediaThumbnail(item),
                  if (type == MediaType.video)
                    Positioned(
                      bottom: 4,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          item.durationFormatted,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ),
                  if (_selectionMode)
                    Positioned(
                      top: 4,
                      right: 4,
                      child: Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? Theme.of(context).colorScheme.primary
                              : Colors.black45,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: isSelected
                            ? const Icon(
                                Icons.check,
                                size: 14,
                                color: Colors.white,
                              )
                            : null,
                      ),
                    ),
                  if (isSelected)
                    Container(
                      color: Theme.of(context)
                          .colorScheme
                          .primary
                          .withOpacity(0.3),
                    ),
                ],
              ),
            );
          },
          childCount: items.length,
        ),
      ),
    );
  }

  Widget _buildListView(List<ChatMediaItem> items, MediaType type) {
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final item = items[index];
          final isSelected = _selectedIds.contains(item.id);

          if (type == MediaType.link) {
            return _buildLinkTile(item, isSelected);
          }
          return _buildDocumentTile(item, isSelected);
        },
        childCount: items.length,
      ),
    );
  }

  Widget _buildMediaThumbnail(ChatMediaItem item) {
    final url = item.thumbnailUrl ?? item.url;

    if (url.isEmpty) {
      return Container(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        child: Icon(
          item.type == MediaType.video
              ? Icons.videocam_outlined
              : Icons.image_outlined,
          color: Theme.of(context).colorScheme.outline,
        ),
      );
    }

    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (context, url) => Container(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        child: const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        child: Icon(
          Icons.broken_image_outlined,
          color: Theme.of(context).colorScheme.outline,
        ),
      ),
    );
  }

  Widget _buildDocumentTile(ChatMediaItem item, bool isSelected) {
    final theme = Theme.of(context);

    return ListTile(
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: theme.colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          _getDocumentIcon(item.mimeType),
          color: theme.colorScheme.onPrimaryContainer,
        ),
      ),
      title: Text(
        item.fileName ?? 'Document',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        '${item.fileSizeFormatted} • ${_formatDate(item.createdAt)}',
        style: theme.textTheme.bodySmall,
      ),
      trailing: _selectionMode
          ? Checkbox(
              value: isSelected,
              onChanged: (_) => _toggleSelection(item),
            )
          : IconButton(
              icon: const Icon(Icons.download_outlined),
              onPressed: () => _downloadItem(item),
            ),
      selected: isSelected,
      onTap: () {
        if (_selectionMode) {
          _toggleSelection(item);
        } else {
          _openDocument(item);
        }
      },
      onLongPress: () => _enterSelectionMode(item),
    );
  }

  Widget _buildLinkTile(ChatMediaItem item, bool isSelected) {
    final theme = Theme.of(context);

    return ListTile(
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: theme.colorScheme.secondaryContainer,
          borderRadius: BorderRadius.circular(8),
        ),
        child: item.thumbnailUrl != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: item.thumbnailUrl!,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Icon(
                    Icons.link,
                    color: theme.colorScheme.onSecondaryContainer,
                  ),
                ),
              )
            : Icon(
                Icons.link,
                color: theme.colorScheme.onSecondaryContainer,
              ),
      ),
      title: Text(
        item.linkTitle ?? item.url,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        item.linkDomain ?? item.url,
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.primary,
        ),
      ),
      trailing: _selectionMode
          ? Checkbox(
              value: isSelected,
              onChanged: (_) => _toggleSelection(item),
            )
          : IconButton(
              icon: const Icon(Icons.open_in_new),
              onPressed: () => _openLink(item),
            ),
      selected: isSelected,
      onTap: () {
        if (_selectionMode) {
          _toggleSelection(item);
        } else {
          _openLink(item);
        }
      },
      onLongPress: () => _enterSelectionMode(item),
    );
  }

  IconData _getDocumentIcon(String? mimeType) {
    if (mimeType == null) return Icons.insert_drive_file_outlined;

    if (mimeType.contains('pdf')) return Icons.picture_as_pdf_outlined;
    if (mimeType.contains('word') || mimeType.contains('document')) {
      return Icons.description_outlined;
    }
    if (mimeType.contains('sheet') || mimeType.contains('excel')) {
      return Icons.table_chart_outlined;
    }
    if (mimeType.contains('presentation') || mimeType.contains('powerpoint')) {
      return Icons.slideshow_outlined;
    }
    if (mimeType.contains('zip') || mimeType.contains('archive')) {
      return Icons.folder_zip_outlined;
    }
    if (mimeType.contains('audio')) return Icons.audio_file_outlined;
    if (mimeType.contains('text')) return Icons.article_outlined;

    return Icons.insert_drive_file_outlined;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day) {
      return '${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    }
    return '${date.month}/${date.day}/${date.year}';
  }

  void _openMediaViewer(ChatMediaItem item) {
    final currentType = _tabs[_tabController.index];
    final items = _mediaItems[currentType] ?? [];
    final index = items.indexOf(item);
    
    MediaGalleryViewer.show(
      context,
      items: items,
      initialIndex: index >= 0 ? index : 0,
      senderName: item.senderName,
    );
  }

  void _openDocument(ChatMediaItem item) async {
    if (item.url.isEmpty) return;

    final uri = Uri.tryParse(item.url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _openLink(ChatMediaItem item) async {
    final url = item.url;
    if (url.isEmpty) return;

    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _downloadItem(ChatMediaItem item) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Downloading ${item.fileName ?? "file"}...')),
    );
  }
}

/// Sticky date header delegate
class _DateHeaderDelegate extends SliverPersistentHeaderDelegate {
  final String label;
  final int count;

  _DateHeaderDelegate({required this.label, required this.count});

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final theme = Theme.of(context);

    return Container(
      color: theme.scaffoldBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Text(
            label,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          Text(
            '$count items',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.outline,
            ),
          ),
        ],
      ),
    );
  }

  @override
  double get maxExtent => 40;

  @override
  double get minExtent => 40;

  @override
  bool shouldRebuild(covariant _DateHeaderDelegate oldDelegate) {
    return oldDelegate.label != label || oldDelegate.count != count;
  }
}
