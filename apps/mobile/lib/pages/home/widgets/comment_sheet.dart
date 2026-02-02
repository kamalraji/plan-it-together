import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/spark_comment.dart';
import 'package:thittam1hub/pages/home/widgets/comment_item.dart';
import 'package:thittam1hub/pages/home/widgets/comment_skeleton.dart';
import 'package:thittam1hub/services/comment_analytics_service.dart';
import 'package:thittam1hub/services/comment_service.dart';
import 'package:thittam1hub/widgets/mention_picker.dart';
import 'package:thittam1hub/widgets/mention_text.dart';
import 'package:thittam1hub/widgets/report_comment_sheet.dart';

class CommentSheet extends StatefulWidget {
  final String postId;
  final String? postAuthorId;
  final int initialCommentCount;

  const CommentSheet({
    super.key,
    required this.postId,
    this.postAuthorId,
    required this.initialCommentCount,
  });

  @override
  State<CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends State<CommentSheet> {
  final CommentService _commentService = CommentService.instance;
  final CommentAnalyticsService _analyticsService = CommentAnalyticsService.instance;
  late final MentionHighlightController _commentController;
  final FocusNode _focusNode = FocusNode();

  List<SparkComment> _comments = [];
  Set<String> _likedCommentIds = {};
  bool _isLoading = true;
  bool _isSending = false;
  String? _replyingToId;
  String? _replyingToName;
  String? _editingCommentId;
  CommentSortOrder _sortOrder = CommentSortOrder.top;
  
  // Mention autocomplete
  List<MentionSuggestion> _mentionSuggestions = [];
  bool _showMentionPicker = false;
  bool _isLoadingMentions = false;
  Timer? _mentionDebounce;

  // Real-time subscription
  RealtimeChannel? _commentsChannel;

  @override
  void initState() {
    super.initState();
    _commentController = MentionHighlightController(
      mentionColor: Theme.of(context).colorScheme.primary,
    );
    _commentController.addListener(_onTextChanged);
    _loadComments();
    _subscribeToComments();
  }

  @override
  void dispose() {
    _commentController.removeListener(_onTextChanged);
    _commentController.dispose();
    _focusNode.dispose();
    _mentionDebounce?.cancel();
    _unsubscribeFromComments();
    super.dispose();
  }

  void _subscribeToComments() {
    _commentsChannel = _commentService.subscribeToComments(
      postId: widget.postId,
      onInsert: _handleRealtimeInsert,
      onUpdate: _handleRealtimeUpdate,
      onDelete: _handleRealtimeDelete,
    );
  }

  Future<void> _unsubscribeFromComments() async {
    if (_commentsChannel != null) {
      await _commentService.unsubscribeFromComments(_commentsChannel!);
      _commentsChannel = null;
    }
  }

  void _handleRealtimeInsert(SparkComment newComment) {
    if (!mounted) return;
    
    // Skip if we already have this comment (from optimistic update)
    final exists = _comments.any((c) => c.id == newComment.id) ||
        _comments.any((c) => c.replies.any((r) => r.id == newComment.id));
    if (exists) return;

    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    
    // Skip comments from current user (already added optimistically)
    if (newComment.userId == currentUserId) return;

    setState(() {
      if (newComment.parentId != null) {
        // It's a reply - add to parent
        final parentIdx = _comments.indexWhere((c) => c.id == newComment.parentId);
        if (parentIdx >= 0) {
          _comments[parentIdx] = _comments[parentIdx].copyWith(
            replies: [..._comments[parentIdx].replies, newComment],
          );
        }
      } else {
        // Top-level comment - add based on sort order
        if (_sortOrder == CommentSortOrder.newest) {
          _comments.insert(0, newComment);
        } else {
          _comments.add(newComment);
        }
      }
    });

    // Show subtle notification
    HapticFeedback.selectionClick();
  }

  void _handleRealtimeUpdate(SparkComment updatedComment) {
    if (!mounted) return;

    setState(() {
      // Check if it's a top-level comment
      final idx = _comments.indexWhere((c) => c.id == updatedComment.id);
      if (idx >= 0) {
        _comments[idx] = updatedComment.copyWith(
          replies: _comments[idx].replies,
        );
        return;
      }

      // Check if it's a reply
      for (var i = 0; i < _comments.length; i++) {
        final replyIdx = _comments[i].replies.indexWhere((r) => r.id == updatedComment.id);
        if (replyIdx >= 0) {
          final replies = List<SparkComment>.from(_comments[i].replies);
          replies[replyIdx] = updatedComment;
          _comments[i] = _comments[i].copyWith(replies: replies);
          return;
        }
      }
    });
  }

  void _handleRealtimeDelete(String commentId) {
    if (!mounted) return;

    setState(() {
      // Check if it's a top-level comment
      final idx = _comments.indexWhere((c) => c.id == commentId);
      if (idx >= 0) {
        _comments[idx] = _comments[idx].copyWith(
          isDeleted: true,
          content: '[deleted]',
        );
        return;
      }

      // Check if it's a reply
      for (var i = 0; i < _comments.length; i++) {
        final replyIdx = _comments[i].replies.indexWhere((r) => r.id == commentId);
        if (replyIdx >= 0) {
          final replies = List<SparkComment>.from(_comments[i].replies);
          replies[replyIdx] = replies[replyIdx].copyWith(
            isDeleted: true,
            content: '[deleted]',
          );
          _comments[i] = _comments[i].copyWith(replies: replies);
          return;
        }
      }
    });
  }

  void _onTextChanged() {
    _checkForMentionTrigger();
  }

  void _checkForMentionTrigger() {
    final text = _commentController.text;
    final selection = _commentController.selection;
    
    if (!selection.isValid || selection.start != selection.end) {
      _hideMentionPicker();
      return;
    }

    final cursorPos = selection.start;
    final textBeforeCursor = text.substring(0, cursorPos);
    
    // Find the last @ before cursor
    final lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex == -1) {
      _hideMentionPicker();
      return;
    }

    // Check if @ is start of word
    if (lastAtIndex > 0 && textBeforeCursor[lastAtIndex - 1] != ' ') {
      _hideMentionPicker();
      return;
    }

    // Check if there's a space after @
    final query = textBeforeCursor.substring(lastAtIndex + 1);
    if (query.contains(' ')) {
      _hideMentionPicker();
      return;
    }

    // Debounce the search
    _mentionDebounce?.cancel();
    _mentionDebounce = Timer(const Duration(milliseconds: 300), () {
      _searchMentions(query);
    });
  }

  Future<void> _searchMentions(String query) async {
    if (!mounted) return;
    
    setState(() {
      _isLoadingMentions = true;
      _showMentionPicker = true;
    });

    final suggestions = await _commentService.searchMentions(query);
    
    if (mounted) {
      setState(() {
        _mentionSuggestions = suggestions;
        _isLoadingMentions = false;
      });
    }
  }

  void _hideMentionPicker() {
    if (_showMentionPicker) {
      setState(() {
        _showMentionPicker = false;
        _mentionSuggestions = [];
      });
    }
  }

  void _selectMention(MentionSuggestion suggestion) {
    final text = _commentController.text;
    final selection = _commentController.selection;
    final cursorPos = selection.start;
    final textBeforeCursor = text.substring(0, cursorPos);
    final lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex == -1) return;

    final newText = text.substring(0, lastAtIndex) +
        '@${suggestion.username} ' +
        text.substring(cursorPos);
    
    _commentController.text = newText;
    _commentController.selection = TextSelection.collapsed(
      offset: lastAtIndex + suggestion.username.length + 2,
    );
    
    _hideMentionPicker();
    HapticFeedback.selectionClick();
  }

  Future<void> _loadComments() async {
    setState(() => _isLoading = true);
    
    final comments = await _commentService.getComments(
      widget.postId,
      sortOrder: _sortOrder,
    );
    
    // Load liked state
    final commentIds = <String>[];
    for (final c in comments) {
      commentIds.add(c.id);
      for (final r in c.replies) {
        commentIds.add(r.id);
      }
    }
    final likedIds = await _commentService.loadLikedComments(commentIds);
    
    if (mounted) {
      setState(() {
        _comments = comments;
        _likedCommentIds = likedIds;
        _isLoading = false;
      });
    }
  }

  Future<void> _sendComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty) return;

    setState(() => _isSending = true);
    HapticFeedback.lightImpact();

    try {
      CommentResult result;
      
      if (_editingCommentId != null) {
        result = await _commentService.editComment(_editingCommentId!, content);
      } else {
        result = await _commentService.addComment(
          widget.postId,
          content,
          parentId: _replyingToId,
        );
      }

      if (result.isSuccess && result.comment != null) {
        _commentController.clear();
        _cancelReply();
        _cancelEdit();
        
        // Track analytics
        if (_editingCommentId != null) {
          _analyticsService.trackEvent(
            event: CommentAnalyticsEvent.edited,
            commentId: result.comment!.id,
            postId: widget.postId,
          );
          // Update in place
          setState(() {
            final idx = _comments.indexWhere((c) => c.id == _editingCommentId);
            if (idx >= 0) {
              _comments[idx] = result.comment!;
            }
          });
        } else if (_replyingToId != null) {
          _analyticsService.trackEvent(
            event: CommentAnalyticsEvent.replied,
            commentId: result.comment!.id,
            postId: widget.postId,
            metadata: {'parent_id': _replyingToId},
          );
          // Add as reply
          setState(() {
            final parentIdx = _comments.indexWhere((c) => c.id == _replyingToId);
            if (parentIdx >= 0) {
              _comments[parentIdx] = _comments[parentIdx].copyWith(
                replies: [..._comments[parentIdx].replies, result.comment!],
              );
            }
          });
        } else {
          // Add as top-level
          setState(() {
            _comments.insert(0, result.comment!);
          });
        }
      } else if (result.isRateLimited) {
        _showRateLimitSnackbar(result.remainingInWindow ?? 0);
      } else {
        _showErrorSnackbar(result.error ?? 'Failed to send comment');
      }
    } catch (e) {
      _showErrorSnackbar('Failed to send comment');
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  void _showRateLimitSnackbar(int remaining) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.timer, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Slow down! $remaining comments remaining this minute.',
              ),
            ),
          ],
        ),
        backgroundColor: Colors.orange,
      ),
    );
  }

  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  void _startReply(String commentId, String authorName) {
    setState(() {
      _replyingToId = commentId;
      _replyingToName = authorName;
      _editingCommentId = null;
    });
    _focusNode.requestFocus();
  }

  void _cancelReply() {
    setState(() {
      _replyingToId = null;
      _replyingToName = null;
    });
  }

  void _startEdit(SparkComment comment) {
    setState(() {
      _editingCommentId = comment.id;
      _replyingToId = null;
      _replyingToName = null;
    });
    _commentController.text = comment.content;
    _focusNode.requestFocus();
  }

  void _cancelEdit() {
    setState(() {
      _editingCommentId = null;
    });
    _commentController.clear();
  }

  Future<void> _handleLike(String commentId) async {
    HapticFeedback.lightImpact();
    
    // Optimistic update
    final wasLiked = _likedCommentIds.contains(commentId);
    setState(() {
      if (wasLiked) {
        _likedCommentIds.remove(commentId);
      } else {
        _likedCommentIds.add(commentId);
      }
      _updateCommentLikeCount(commentId, wasLiked ? -1 : 1);
    });

    // Track analytics
    _analyticsService.trackEvent(
      event: wasLiked ? CommentAnalyticsEvent.unliked : CommentAnalyticsEvent.liked,
      commentId: commentId,
      postId: widget.postId,
    );

    final result = await _commentService.toggleLike(commentId);
    
    if (!result.success) {
      // Rollback
      setState(() {
        if (wasLiked) {
          _likedCommentIds.add(commentId);
        } else {
          _likedCommentIds.remove(commentId);
        }
        _updateCommentLikeCount(commentId, wasLiked ? 1 : -1);
      });
    }
  }

  void _updateCommentLikeCount(String commentId, int delta) {
    for (var i = 0; i < _comments.length; i++) {
      if (_comments[i].id == commentId) {
        _comments[i] = _comments[i].copyWith(
          likeCount: _comments[i].likeCount + delta,
        );
        return;
      }
      for (var j = 0; j < _comments[i].replies.length; j++) {
        if (_comments[i].replies[j].id == commentId) {
          final replies = List<SparkComment>.from(_comments[i].replies);
          replies[j] = replies[j].copyWith(
            likeCount: replies[j].likeCount + delta,
          );
          _comments[i] = _comments[i].copyWith(replies: replies);
          return;
        }
      }
    }
  }

  Future<void> _handleDelete(String commentId) async {
    final success = await _commentService.deleteComment(commentId);
    if (success) {
      _analyticsService.trackEvent(
        event: CommentAnalyticsEvent.deleted,
        commentId: commentId,
        postId: widget.postId,
      );
      setState(() {
        for (var i = 0; i < _comments.length; i++) {
          if (_comments[i].id == commentId) {
            _comments[i] = _comments[i].copyWith(
              isDeleted: true,
              content: '[deleted]',
            );
            return;
          }
        }
      });
      HapticFeedback.mediumImpact();
    } else {
      _showErrorSnackbar('Failed to delete comment');
    }
  }

  Future<void> _handlePin(String commentId) async {
    final comment = _comments.firstWhere(
      (c) => c.id == commentId,
      orElse: () => _comments.first,
    );
    final wasPinned = comment.isPinned;
    
    final success = await _commentService.togglePinComment(
      commentId,
      widget.postId,
    );
    if (success) {
      _analyticsService.trackEvent(
        event: wasPinned ? CommentAnalyticsEvent.unpinned : CommentAnalyticsEvent.pinned,
        commentId: commentId,
        postId: widget.postId,
      );
      await _loadComments(); // Reload to get updated pin state
      HapticFeedback.mediumImpact();
    }
  }

  void _handleReport(String commentId) {
    _analyticsService.trackEvent(
      event: CommentAnalyticsEvent.reported,
      commentId: commentId,
      postId: widget.postId,
    );
    ReportCommentSheet.show(context, commentId: commentId);
  }

  void _changeSortOrder(CommentSortOrder order) {
    if (_sortOrder != order) {
      HapticFeedback.selectionClick();
      setState(() => _sortOrder = order);
      _loadComments();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          _buildHeader(cs, textTheme),

          // Sorting options
          _buildSortingBar(cs, textTheme),

          // Comments List
          Expanded(
            child: _isLoading
                ? CommentListSkeleton()
                : _comments.isEmpty
                    ? _buildEmptyState(cs, textTheme)
                    : ListView.builder(
                        padding: EdgeInsets.only(bottom: 16),
                        itemCount: _comments.length,
                        itemBuilder: (context, index) {
                          final comment = _comments[index];
                          return CommentItem(
                            comment: comment,
                            isLiked: _likedCommentIds.contains(comment.id),
                            isPostAuthor: widget.postAuthorId != null,
                            currentUserId: currentUserId,
                            likedCommentIds: _likedCommentIds,
                            onReplyTap: () =>
                                _startReply(comment.id, comment.authorName),
                            onLikeTap: () => _handleLike(comment.id),
                            onReplyLikeTap: _handleLike,
                            onEditTap: comment.canEdit
                                ? () => _startEdit(comment)
                                : null,
                            onDeleteTap: () => _handleDelete(comment.id),
                            onReportTap: () => _handleReport(comment.id),
                            onPinTap: () => _handlePin(comment.id),
                          );
                        },
                      ),
          ),

          // Reply/Edit indicator
          if (_replyingToName != null || _editingCommentId != null)
            _buildContextIndicator(cs, textTheme),

          // Mention picker
          if (_showMentionPicker)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: MentionPicker(
                suggestions: _mentionSuggestions,
                onSelect: _selectMention,
                isLoading: _isLoadingMentions,
              ),
            ),

          // Input field
          _buildInputField(cs, textTheme, bottomPadding),
        ],
      ),
    );
  }

  Widget _buildHeader(ColorScheme cs, TextTheme textTheme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: cs.outlineVariant.withOpacity(0.3)),
        ),
      ),
      child: Row(
        children: [
          Text(
            'Comments',
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${_comments.length}',
              style: textTheme.labelSmall,
            ),
          ),
          const Spacer(),
          IconButton(
            icon: Icon(Icons.close, color: cs.onSurfaceVariant),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _buildSortingBar(ColorScheme cs, TextTheme textTheme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: CommentSortOrder.values.map((order) {
          final isSelected = _sortOrder == order;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(order.displayName),
              selected: isSelected,
              onSelected: (_) => _changeSortOrder(order),
              labelStyle: textTheme.labelSmall?.copyWith(
                color: isSelected ? cs.onPrimaryContainer : cs.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.w600 : null,
              ),
              backgroundColor: cs.surfaceContainerHighest,
              selectedColor: cs.primaryContainer,
              side: BorderSide.none,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              visualDensity: VisualDensity.compact,
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme textTheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 48,
            color: cs.onSurfaceVariant,
          ),
          const SizedBox(height: 12),
          Text(
            'No comments yet',
            style: textTheme.bodyLarge?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Be the first to comment!',
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContextIndicator(ColorScheme cs, TextTheme textTheme) {
    final isEditing = _editingCommentId != null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: cs.surfaceContainerHighest,
      child: Row(
        children: [
          Icon(
            isEditing ? Icons.edit : Icons.reply,
            size: 16,
            color: cs.primary,
          ),
          const SizedBox(width: 8),
          Text(
            isEditing ? 'Editing comment' : 'Replying to ',
            style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
          ),
          if (!isEditing)
            Text(
              _replyingToName!,
              style: textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          const Spacer(),
          GestureDetector(
            onTap: isEditing ? _cancelEdit : _cancelReply,
            child: Icon(Icons.close, size: 18, color: cs.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField(
      ColorScheme cs, TextTheme textTheme, double bottomPadding) {
    final charCount = _commentController.text.length;
    final isNearLimit = charCount > 900;

    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: bottomPadding > 0 ? bottomPadding : 16,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
          top: BorderSide(color: cs.outlineVariant.withOpacity(0.3)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _commentController,
                  focusNode: _focusNode,
                  decoration: InputDecoration(
                    hintText: _editingCommentId != null
                        ? 'Edit your comment...'
                        : _replyingToName != null
                            ? 'Reply to $_replyingToName...'
                            : 'Add a comment...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: cs.surfaceContainerHighest,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                  ),
                  textCapitalization: TextCapitalization.sentences,
                  maxLines: 3,
                  minLines: 1,
                  maxLength: 1000,
                  buildCounter: (context,
                          {required currentLength,
                          required isFocused,
                          maxLength}) =>
                      null, // Hide default counter
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _isSending ? null : _sendComment,
                icon: _isSending
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(_editingCommentId != null ? Icons.check : Icons.send),
                style: IconButton.styleFrom(
                  backgroundColor: cs.primary,
                  foregroundColor: cs.onPrimary,
                ),
              ),
            ],
          ),
          if (isNearLimit)
            Padding(
              padding: const EdgeInsets.only(top: 4, right: 56),
              child: Text(
                '${1000 - charCount} characters left',
                style: textTheme.labelSmall?.copyWith(
                  color: charCount > 950 ? Colors.red : cs.onSurfaceVariant,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
