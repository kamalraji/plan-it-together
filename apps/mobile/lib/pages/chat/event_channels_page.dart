import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/services/supabase_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_widgets.dart';
import 'package:thittam1hub/widgets/chat/channel_list_tile.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';

/// Event-specific channel list for participants.
/// 
/// Shows only channels the participant has access to for a specific event,
/// organized by category (Announcements, Sessions, Networking, etc.)
class EventChannelsPage extends StatefulWidget {
  final String eventId;
  final String eventName;
  
  const EventChannelsPage({
    super.key,
    required this.eventId,
    required this.eventName,
  });
  
  @override
  State<EventChannelsPage> createState() => _EventChannelsPageState();
}

class _EventChannelsPageState extends State<EventChannelsPage> {
  final _supabase = SupabaseService.instance.client;
  
  bool _loading = true;
  String? _error;
  List<ChannelCategory> _categories = [];
  Map<String, int> _unreadCounts = {};
  
  @override
  void initState() {
    super.initState();
    _loadChannels();
  }
  
  Future<void> _loadChannels() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });
      
      final response = await _supabase.functions.invoke(
        'participant-channels-api',
        body: {
          'action': 'list',
          'eventId': widget.eventId,
        },
      );
      
      if (response.data == null) {
        throw Exception('Failed to load channels');
      }
      
      final data = response.data as Map<String, dynamic>;
      final channels = (data['channels'] as List? ?? [])
          .map((c) => ParticipantChannel.fromJson(c))
          .toList();
      
      // Group by category
      final categoryMap = <String, List<ParticipantChannel>>{};
      for (final channel in channels) {
        final category = _inferCategory(channel);
        categoryMap.putIfAbsent(category, () => []).add(channel);
      }
      
      // Build sorted categories
      final categories = <ChannelCategory>[];
      final categoryOrder = ['ANNOUNCEMENTS', 'GENERAL', 'SESSIONS', 'NETWORKING', 'SUPPORT'];
      
      for (final name in categoryOrder) {
        if (categoryMap.containsKey(name)) {
          categories.add(ChannelCategory(
            name: name,
            channels: categoryMap[name]!,
          ));
        }
      }
      
      // Add any remaining categories
      for (final entry in categoryMap.entries) {
        if (!categoryOrder.contains(entry.key)) {
          categories.add(ChannelCategory(
            name: entry.key,
            channels: entry.value,
          ));
        }
      }
      
      // Get unread counts
      final unreadResponse = await _supabase.functions.invoke(
        'participant-channels-api',
        body: {
          'action': 'unread-counts',
          'eventId': widget.eventId,
        },
      );
      
      final unreadData = unreadResponse.data as Map<String, dynamic>?;
      final unreadCounts = <String, int>{};
      if (unreadData != null && unreadData['counts'] != null) {
        for (final entry in (unreadData['counts'] as Map).entries) {
          unreadCounts[entry.key] = entry.value as int;
        }
      }
      
      if (mounted) {
        setState(() {
          _categories = categories;
          _unreadCounts = unreadCounts;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Failed to load channels: $e');
      if (mounted) {
        setState(() {
          _error = 'Failed to load channels';
          _loading = false;
        });
      }
    }
  }
  
  String _inferCategory(ParticipantChannel channel) {
    final name = channel.name.toLowerCase();
    
    if (name.startsWith('announce-') || channel.type == 'announcement') {
      return 'ANNOUNCEMENTS';
    } else if (name.startsWith('session-')) {
      return 'SESSIONS';
    } else if (name.startsWith('network-') || name.contains('network')) {
      return 'NETWORKING';
    } else if (name.startsWith('help-') || name.contains('support') || name.contains('help')) {
      return 'SUPPORT';
    } else {
      return 'GENERAL';
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.eventName, style: context.textStyles.titleMedium),
            Text(
              'Event Channels',
              style: context.textStyles.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: _showSearchSheet,
            tooltip: 'Search channels',
          ),
        ],
      ),
      body: _buildBody(theme),
    );
  }
  
  Widget _buildBody(ThemeData theme) {
    if (_loading) {
      return const Center(child: StyledLoadingIndicator());
    }
    
    if (_error != null) {
      return EnhancedEmptyState(
        icon: Icons.error_outline_rounded,
        title: 'Unable to Load',
        subtitle: _error,
        actionLabel: 'Try Again',
        onAction: _loadChannels,
      );
    }
    
    if (_categories.isEmpty) {
      return EnhancedEmptyState(
        icon: Icons.forum_outlined,
        title: 'No Channels Yet',
        subtitle: 'Channels will appear here when the organizer sets them up',
      );
    }
    
    return BrandedRefreshIndicator(
      onRefresh: _loadChannels,
      child: ListView.builder(
        padding: EdgeInsets.symmetric(
          horizontal: context.horizontalPadding,
          vertical: 16,
        ),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          return _buildCategorySection(theme, category);
        },
      ),
    );
  }
  
  Widget _buildCategorySection(ThemeData theme, ChannelCategory category) {
    final totalUnread = category.channels.fold<int>(
      0, 
      (sum, ch) => sum + (_unreadCounts[ch.id] ?? 0),
    );
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8, top: 16),
          child: Row(
            children: [
              Icon(
                _getCategoryIcon(category.name),
                size: 18,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                _formatCategoryName(category.name),
                style: context.textStyles.labelLarge?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (totalUnread > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    totalUnread.toString(),
                    style: context.textStyles.labelSmall?.copyWith(
                      color: theme.colorScheme.onPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        ...category.channels.map((channel) => _buildChannelTile(theme, channel)),
      ],
    );
  }
  
  Widget _buildChannelTile(ThemeData theme, ParticipantChannel channel) {
    final unread = _unreadCounts[channel.id] ?? 0;
    final isAnnouncement = channel.type == 'announcement' || 
                           channel.name.startsWith('announce-');
    
    return StyledCard(
      margin: const EdgeInsets.only(bottom: 8),
      onTap: () => _openChannel(channel),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Channel icon
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isAnnouncement 
                    ? theme.colorScheme.primaryContainer
                    : theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isAnnouncement ? Icons.campaign_rounded : Icons.tag_rounded,
                color: isAnnouncement 
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurfaceVariant,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            
            // Channel info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (isAnnouncement)
                        Padding(
                          padding: const EdgeInsets.only(right: 4),
                          child: Icon(
                            Icons.volume_up_rounded,
                            size: 14,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      Expanded(
                        child: Text(
                          _formatChannelName(channel.name),
                          style: context.textStyles.bodyMedium?.copyWith(
                            fontWeight: unread > 0 ? FontWeight.w600 : null,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (channel.description != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      channel.description!,
                      style: context.textStyles.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            
            // Unread badge
            if (unread > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  unread > 99 ? '99+' : unread.toString(),
                  style: context.textStyles.labelSmall?.copyWith(
                    color: theme.colorScheme.onPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            
            // Read-only indicator
            if (!channel.canWrite) ...[
              const SizedBox(width: 8),
              Icon(
                Icons.visibility_outlined,
                size: 16,
                color: theme.colorScheme.outline,
              ),
            ],
            
            const SizedBox(width: 4),
            Icon(
              Icons.chevron_right_rounded,
              color: theme.colorScheme.outline,
            ),
          ],
        ),
      ),
    );
  }
  
  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'ANNOUNCEMENTS':
        return Icons.campaign_rounded;
      case 'SESSIONS':
        return Icons.event_rounded;
      case 'NETWORKING':
        return Icons.people_rounded;
      case 'SUPPORT':
        return Icons.help_outline_rounded;
      case 'GENERAL':
      default:
        return Icons.forum_rounded;
    }
  }
  
  String _formatCategoryName(String category) {
    return category[0].toUpperCase() + category.substring(1).toLowerCase();
  }
  
  String _formatChannelName(String name) {
    // Remove prefix and format
    final prefixes = ['announce-', 'session-', 'network-', 'help-', 'booth-'];
    String formatted = name;
    
    for (final prefix in prefixes) {
      if (name.startsWith(prefix)) {
        formatted = name.substring(prefix.length);
        break;
      }
    }
    
    // Replace dashes with spaces and title case
    return formatted
        .split('-')
        .map((word) => word.isEmpty ? '' : word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }
  
  void _openChannel(ParticipantChannel channel) {
    HapticFeedback.lightImpact();
    context.push(
      '/chat/event/${widget.eventId}/channel/${channel.id}',
      extra: {
        'channelName': channel.name,
        'canWrite': channel.canWrite,
        'isAnnouncement': channel.type == 'announcement',
      },
    );
  }
  
  void _showSearchSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ChannelSearchSheet(
        channels: _categories.expand((c) => c.channels).toList(),
        onSelect: _openChannel,
      ),
    );
  }
}

/// Category grouping for channels
class ChannelCategory {
  final String name;
  final List<ParticipantChannel> channels;
  
  ChannelCategory({required this.name, required this.channels});
}

/// Participant channel model
class ParticipantChannel {
  final String id;
  final String name;
  final String? description;
  final String type;
  final bool canRead;
  final bool canWrite;
  
  ParticipantChannel({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.canRead,
    required this.canWrite,
  });
  
  factory ParticipantChannel.fromJson(Map<String, dynamic> json) {
    return ParticipantChannel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      type: json['type'] as String? ?? 'general',
      canRead: json['can_read'] as bool? ?? true,
      canWrite: json['can_write'] as bool? ?? false,
    );
  }
}

/// Bottom sheet for searching channels
class ChannelSearchSheet extends StatefulWidget {
  final List<ParticipantChannel> channels;
  final void Function(ParticipantChannel) onSelect;
  
  const ChannelSearchSheet({
    super.key,
    required this.channels,
    required this.onSelect,
  });
  
  @override
  State<ChannelSearchSheet> createState() => _ChannelSearchSheetState();
}

class _ChannelSearchSheetState extends State<ChannelSearchSheet> {
  final _searchController = TextEditingController();
  List<ParticipantChannel> _filtered = [];
  
  @override
  void initState() {
    super.initState();
    _filtered = widget.channels;
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
  
  void _onSearch(String query) {
    final q = query.toLowerCase().trim();
    setState(() {
      if (q.isEmpty) {
        _filtered = widget.channels;
      } else {
        _filtered = widget.channels.where((ch) {
          return ch.name.toLowerCase().contains(q) ||
                 (ch.description?.toLowerCase().contains(q) ?? false);
        }).toList();
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GlassmorphismBottomSheet(
      child: DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.4,
        maxChildSize: 0.95,
        builder: (context, scrollController) {
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: StyledSearchField(
                  controller: _searchController,
                  onChanged: _onSearch,
                  hintText: 'Search channels...',
                  autofocus: true,
                ),
              ),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _filtered.length,
                  itemBuilder: (context, index) {
                    final channel = _filtered[index];
                    return ListTile(
                      leading: Icon(
                        channel.type == 'announcement' 
                            ? Icons.campaign_rounded 
                            : Icons.tag_rounded,
                        color: theme.colorScheme.primary,
                      ),
                      title: Text(channel.name),
                      subtitle: channel.description != null 
                          ? Text(channel.description!, maxLines: 1, overflow: TextOverflow.ellipsis)
                          : null,
                      onTap: () {
                        Navigator.pop(context);
                        widget.onSelect(channel);
                      },
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
