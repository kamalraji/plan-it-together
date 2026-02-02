import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'dart:async';

import 'package:thittam1hub/services/logging_service.dart';
/// Bottom sheet for searching messages within a channel
class MessageSearchSheet extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'MessageSearchSheet';

  final String channelId;
  final Function(Message) onMessageTap;

  const MessageSearchSheet({
    super.key,
    required this.channelId,
    required this.onMessageTap,
  });

  static Future<void> show(
    BuildContext context, {
    required String channelId,
    required Function(Message) onMessageTap,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MessageSearchSheet(
        channelId: channelId,
        onMessageTap: onMessageTap,
      ),
    );
  }

  @override
  State<MessageSearchSheet> createState() => _MessageSearchSheetState();
}

class _MessageSearchSheetState extends State<MessageSearchSheet> {
  static const String _tag = 'MessageSearchSheet';
  static final _log = LoggingService.instance;
  
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();
  List<Message> _results = [];
  bool _isSearching = false;
  Timer? _debounce;
  
  // Filter state
  String _filter = 'all'; // all, media, links

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _results = []);
      return;
    }

    setState(() => _isSearching = true);
    
    try {
      final results = await ChatService.searchMessages(
        channelId: widget.channelId,
        query: query.trim(),
        filter: _filter,
      );
      
      if (mounted) {
        setState(() {
          _results = results;
          _isSearching = false;
        });
      }
    } catch (e) {
      _log.error('Search error: $e', tag: _tag);
      if (mounted) setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.onSurface.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Search Messages',
                  style: context.textStyles.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close, color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ),

          // Search Input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: cs.outline.withOpacity(0.3)),
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _focusNode,
                onChanged: _onSearchChanged,
                style: context.textStyles.bodyMedium,
                decoration: InputDecoration(
                  hintText: 'Search by message or @username...',
                  hintStyle: context.textStyles.bodyMedium?.copyWith(
                    color: cs.onSurface.withOpacity(0.4),
                  ),
                  prefixIcon: Icon(Icons.search, color: cs.onSurfaceVariant),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _results = []);
                          },
                          icon: Icon(Icons.clear, size: 18, color: cs.onSurfaceVariant),
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ),
          
          // Filter chips
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _FilterChip(
                  label: 'All',
                  icon: Icons.chat_bubble_outline,
                  isSelected: _filter == 'all',
                  onTap: () {
                    setState(() => _filter = 'all');
                    _performSearch(_searchController.text);
                  },
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Media',
                  icon: Icons.image_outlined,
                  isSelected: _filter == 'media',
                  onTap: () {
                    setState(() => _filter = 'media');
                    _performSearch(_searchController.text);
                  },
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Links',
                  icon: Icons.link,
                  isSelected: _filter == 'links',
                  onTap: () {
                    setState(() => _filter = 'links');
                    _performSearch(_searchController.text);
                  },
                ),
              ],
            ),
          ),
          
          // Divider
          Divider(color: cs.outline.withOpacity(0.2), height: 1),
          
          // Results
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator())
                : _results.isEmpty
                    ? _buildEmptyState(cs)
                    : ListView.builder(
                        padding: EdgeInsets.only(bottom: bottomPadding + 16),
                        itemCount: _results.length,
                        itemBuilder: (context, index) => _SearchResultTile(
                          message: _results[index],
                          searchQuery: _searchController.text,
                          onTap: () {
                            HapticFeedback.selectionClick();
                            Navigator.pop(context);
                            widget.onMessageTap(_results[index]);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs) {
    final hasQuery = _searchController.text.isNotEmpty;
    
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            hasQuery ? Icons.search_off : Icons.search,
            size: 56,
            color: cs.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            hasQuery ? 'No messages found' : 'Start typing to search',
            style: context.textStyles.titleMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          if (hasQuery)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Try a different search term or filter',
                style: context.textStyles.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant.withOpacity(0.7),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.icon,
    required this.isSelected,
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
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? cs.primary : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? cs.primary : cs.outline.withOpacity(0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  final Message message;
  final String searchQuery;
  final VoidCallback onTap;

  const _SearchResultTile({
    required this.message,
    required this.searchQuery,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            CircleAvatar(
              radius: 20,
              backgroundColor: cs.primary.withOpacity(0.1),
              backgroundImage: message.senderAvatar != null
                  ? NetworkImage(message.senderAvatar!)
                  : null,
              child: message.senderAvatar == null
                  ? Text(
                      (message.senderName ?? 'U')[0].toUpperCase(),
                      style: TextStyle(
                        color: cs.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        message.senderName ?? 'Unknown',
                        style: context.textStyles.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatTime(message.sentAt),
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  _HighlightedText(
                    text: message.content,
                    highlight: searchQuery,
                    style: context.textStyles.bodyMedium?.copyWith(
                      color: cs.onSurface.withOpacity(0.8),
                    ),
                    highlightStyle: context.textStyles.bodyMedium?.copyWith(
                      color: cs.primary,
                      fontWeight: FontWeight.w600,
                      backgroundColor: cs.primary.withOpacity(0.1),
                    ),
                  ),
                ],
              ),
            ),
            
            // Navigate arrow
            Icon(
              Icons.chevron_right,
              color: cs.onSurfaceVariant.withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final m = dt.minute.toString().padLeft(2, '0');
      final am = dt.hour >= 12 ? 'PM' : 'AM';
      return '$h:$m $am';
    }
    final diff = now.difference(dt);
    if (diff.inDays == 1) return 'Yesterday';
    return '${dt.month}/${dt.day}/${dt.year}';
  }
}

class _HighlightedText extends StatelessWidget {
  final String text;
  final String highlight;
  final TextStyle? style;
  final TextStyle? highlightStyle;

  const _HighlightedText({
    required this.text,
    required this.highlight,
    this.style,
    this.highlightStyle,
  });

  @override
  Widget build(BuildContext context) {
    if (highlight.isEmpty) {
      return Text(text, style: style, maxLines: 2, overflow: TextOverflow.ellipsis);
    }

    final lowerText = text.toLowerCase();
    final lowerHighlight = highlight.toLowerCase();
    final spans = <TextSpan>[];
    
    int start = 0;
    int index = lowerText.indexOf(lowerHighlight);
    
    while (index >= 0 && index < text.length) {
      // Add text before match
      if (index > start) {
        spans.add(TextSpan(text: text.substring(start, index), style: style));
      }
      
      // Add highlighted match
      final end = index + highlight.length;
      spans.add(TextSpan(text: text.substring(index, end), style: highlightStyle));
      
      start = end;
      index = lowerText.indexOf(lowerHighlight, start);
    }
    
    // Add remaining text
    if (start < text.length) {
      spans.add(TextSpan(text: text.substring(start), style: style));
    }

    return RichText(
      text: TextSpan(children: spans),
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
    );
  }
}
