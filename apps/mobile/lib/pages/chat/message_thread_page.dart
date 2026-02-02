/// Message thread page for 1:1, channel, and group conversations.
/// 
/// Features:
/// - Real-time message streaming via [MessageThreadController]
/// - Typing indicators and read receipts
/// - Message reactions and replies
/// - Media attachments (images, GIFs, voice)
/// - Offline message queue with retry
/// - Scroll-to-message with highlight animation
/// 
/// Deep-linkable via `/chat/:channelId` or `/chat/group/:groupId`.
library message_thread_page;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/models/premium_models.dart';
import 'package:thittam1hub/services/chat_offline_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/typing_indicator.dart';
import 'package:thittam1hub/widgets/emoji_picker_sheet.dart';
import 'package:thittam1hub/widgets/gif_picker_sheet.dart';
import 'package:thittam1hub/pages/chat/group_settings_page.dart';
import 'package:thittam1hub/pages/chat/message_thread_controller.dart';
import 'package:thittam1hub/widgets/chat/message_search_sheet.dart';
import 'package:thittam1hub/widgets/chat/pinned_message_bar.dart';
import 'package:thittam1hub/widgets/chat/starred_messages_sheet.dart';
import 'package:thittam1hub/widgets/chat/enhanced_message_bubble.dart';
import 'package:thittam1hub/widgets/chat/message_actions_sheet.dart';
import 'package:thittam1hub/widgets/chat/pending_message_bubble.dart';
import 'package:thittam1hub/widgets/chat/chat_connection_banner.dart';
// Extracted widgets
import 'package:thittam1hub/pages/chat/widgets/thread_app_bar.dart';
import 'package:thittam1hub/pages/chat/widgets/group_app_bar.dart';
import 'package:thittam1hub/pages/chat/widgets/glass_composer.dart';
import 'package:thittam1hub/pages/chat/widgets/message_thread_widgets.dart';

class MessageThreadPage extends StatefulWidget {
  final String channelId;
  final WorkspaceChannel? channel;
  final String? dmUserId;
  final String? dmUserName;
  final String? dmUserAvatar;
  // Group chat support
  final String? groupId;
  final ChatGroup? group;
  
  const MessageThreadPage({
    super.key,
    required this.channelId,
    this.channel,
    this.dmUserId,
    this.dmUserName,
    this.dmUserAvatar,
    this.groupId,
    this.group,
  });
  
  bool get isGroup => groupId != null;
  
  @override
  State<MessageThreadPage> createState() => _MessageThreadPageState();
}

class _MessageThreadPageState extends State<MessageThreadPage> with TickerProviderStateMixin {
  final TextEditingController _input = TextEditingController();
  final ScrollController _scroll = ScrollController();
  final FocusNode _focusNode = FocusNode();
  
  late final MessageThreadController _controller;
  
  bool _sending = false;
  bool _showAttachments = false;
  
  // Message keys for scroll-to-message functionality
  final Map<String, GlobalKey> _messageKeys = {};
  
  // Highlighted message state
  String? _highlightedMessageId;
  late final AnimationController _highlightController;
  late final Animation<double> _highlightAnimation;
  
  // Animation controllers
  late final AnimationController _composerController;
  late final Animation<double> _composerAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = MessageThreadController(
      channelId: widget.channelId,
      groupId: widget.groupId,
    );
    _controller.addListener(_onControllerChanged);
    
    _highlightController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _highlightAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.6), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 0.6, end: 1.0), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 40),
    ]).animate(CurvedAnimation(
      parent: _highlightController,
      curve: Curves.easeInOut,
    ));
    _highlightController.addStatusListener(_onHighlightAnimationComplete);
    
    _composerController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _composerAnimation = CurvedAnimation(
      parent: _composerController,
      curve: Curves.easeOut,
    );
    _composerController.forward();
  }
  
  void _onHighlightAnimationComplete(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      setState(() => _highlightedMessageId = null);
    }
  }
  
  void _onControllerChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _controller.removeListener(_onControllerChanged);
    _controller.dispose();
    _highlightController.removeStatusListener(_onHighlightAnimationComplete);
    _highlightController.dispose();
    _composerController.dispose();
    _input.dispose();
    _scroll.dispose();
    _focusNode.dispose();
    _messageKeys.clear();
    super.dispose();
  }

  Future<void> _onSend() async {
    if (_input.text.trim().isEmpty) return;
    
    final content = _input.text.trim();
    _input.clear();
    
    HapticFeedback.lightImpact();
    setState(() => _sending = true);
    
    try {
      final result = await _controller.sendMessage(content);
      _scrollToBottom();
      
      if (mounted) {
        _handleSendResult(result, content);
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _handleSendResult(SendResult result, String content) {
    if (result == SendResult.success || result == SendResult.empty) {
      return;
    }
    
    if (result is SendQueued) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.cloud_queue, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text(result.isOnline 
                  ? 'Message queued, will retry shortly'
                  : 'Offline - message will be sent when connected'),
            ],
          ),
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else if (result is SendFailed) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Failed to send message'),
          action: SnackBarAction(
            label: 'Retry',
            onPressed: () {
              _input.text = result.content;
              _onSend();
            },
          ),
        ),
      );
    }
  }

  void _onTyping() => _controller.onTyping();

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent + 100,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _onReaction(String messageId, String emoji) async {
    HapticFeedback.mediumImpact();
    await _controller.toggleReaction(messageId, emoji);
  }

  @override
  Widget build(BuildContext context) {
    final channel = widget.channel;
    final isDM = widget.dmUserId != null;
    final isGroup = widget.isGroup;
    
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // App Bar
            _buildAppBar(isGroup, isDM, channel),
            
            // Connection status banner
            const ChatConnectionBanner(),
            
            // Pinned messages bar
            if (_controller.pinnedMessages.isNotEmpty)
              PinnedMessageBar(
                message: _controller.pinnedMessages.first,
                pinnedCount: _controller.pinnedMessages.length,
                onTap: () => _scrollToMessage(_controller.pinnedMessages.first.id),
                onClose: () => _unpinMessage(_controller.pinnedMessages.first.id),
              ),
            
            // Messages
            Expanded(child: _buildMessageList()),
            
            // Typing indicator
            if (_controller.typingUsers.isNotEmpty)
              TypingIndicator(
                userName: _controller.typingUsers.keys.first,
                showName: true,
              ),
            
            // Composer
            _buildComposer(isGroup, isDM, channel),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(bool isGroup, bool isDM, WorkspaceChannel? channel) {
    if (isGroup) {
      return GroupAppBar(
        group: widget.group,
        groupId: widget.groupId!,
        onSettingsTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => GroupSettingsPage(groupId: widget.groupId!),
            ),
          );
        },
        onSearchTap: () => _showSearchSheet(context),
        onStarredTap: () => _showStarredSheet(context),
      );
    }
    
    return ThreadAppBar(
      channel: channel,
      channelId: widget.channelId,
      dmUserName: widget.dmUserName,
      dmUserAvatar: widget.dmUserAvatar,
      onSearchTap: () => _showSearchSheet(context),
      onStarredTap: () => _showStarredSheet(context),
    );
  }

  Widget _buildMessageList() {
    return StreamBuilder<List<Message>>(
      stream: _controller.messageStream,
      builder: (context, snapshot) {
        final messages = snapshot.data ?? [];
        
        if (messages.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _controller.loadReactionsAndReceipts(messages);
            _controller.extractLinkPreviews(messages);
            _scrollToBottom();
          });
        }
        
        if (messages.isEmpty && _controller.pendingMessages.isEmpty) {
          return const EmptyThread();
        }
        
        final allItems = _controller.buildMessageList(messages);
        
        return ListView.builder(
          controller: _scroll,
          padding: EdgeInsets.symmetric(
            horizontal: context.horizontalPadding,
            vertical: AppSpacing.md,
          ),
          itemCount: allItems.length,
          itemBuilder: (context, index) => _buildMessageItem(allItems[index]),
        );
      },
    );
  }

  Widget _buildMessageItem(dynamic item) {
    if (item is DateSeparator) {
      return DateSeparatorWidget(date: item.date);
    }
    
    if (item is PendingMessage) {
      return PendingMessageBubble(
        message: item,
        onRetry: () => _controller.retryMessage(item.id),
        onCancel: () => _controller.cancelMessage(item.id),
      );
    }
    
    if (item is Message) {
      return _buildMessage(item);
    }
    
    return const SizedBox.shrink();
  }

  Widget _buildMessage(Message item) {
    _messageKeys.putIfAbsent(item.id, () => GlobalKey());
    final messageKey = _messageKeys[item.id]!;
    
    final memberRoleStr = _controller.getMemberRole(item.senderId);
    final memberRole = memberRoleStr != null 
        ? GroupMemberRole.fromString(memberRoleStr)
        : null;
    
    final isHighlighted = _highlightedMessageId == item.id;
    final theme = Theme.of(context);
    
    return AnimatedBuilder(
      animation: _highlightAnimation,
      builder: (context, child) {
        return Container(
          key: messageKey,
          decoration: isHighlighted
              ? BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(
                    _highlightAnimation.value * 0.2,
                  ),
                  borderRadius: BorderRadius.circular(12),
                )
              : null,
          child: child,
        );
      },
      child: EnhancedMessageBubble(
        message: item,
        reactions: _controller.reactions[item.id] ?? [],
        readBy: _controller.readReceipts[item.id] ?? [],
        isStarred: _controller.starredMessageIds.contains(item.id),
        linkPreview: _controller.linkPreviews[item.id],
        senderRole: memberRole,
        onReactionTap: (emoji) => _onReaction(item.id, emoji),
        onLongPress: () => _showMessageActionsSheet(item),
        onStar: () => _starMessage(item.id),
        onUnstar: () => _unstarMessage(item.id),
        onPin: () => _pinMessage(item.id),
        onUnpin: () => _unpinMessage(item.id),
        onDelete: () => _deleteMessage(item.id),
        onDeleteForEveryone: () => _deleteMessageForEveryone(item.id),
      ),
    );
  }

  Widget _buildComposer(bool isGroup, bool isDM, WorkspaceChannel? channel) {
    // Check if user can send messages (for groups with admin-only restriction)
    if (isGroup && !_controller.canSendMessages) {
      return Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
            ),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.lock_outline,
              size: 18,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'Only admins can send messages',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }
    
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, 1),
        end: Offset.zero,
      ).animate(_composerAnimation),
      child: GlassComposer(
        controller: _input,
        focusNode: _focusNode,
        hintLabel: isGroup 
            ? widget.group?.name ?? 'group'
            : (isDM ? '@${widget.dmUserName ?? 'Direct'}' : '#${channel?.name ?? 'channel'}'),
        onSend: _onSend,
        onChanged: (_) => _onTyping(),
        sending: _sending,
        showAttachments: _showAttachments,
        onToggleAttachments: () => setState(() => _showAttachments = !_showAttachments),
        onEmojiTap: () => showEmojiPicker(
          context,
          onEmojiSelected: (emoji) {
            final text = _input.text;
            final selection = _input.selection;
            final newText = text.replaceRange(
              selection.start,
              selection.end,
              emoji,
            );
            _input.text = newText;
            _input.selection = TextSelection.collapsed(
              offset: selection.start + emoji.length,
            );
          },
        ),
        onGifTap: () => _showGifPicker(context),
      ),
    );
  }
  
  void _showSearchSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => MessageSearchSheet(
        channelId: widget.channelId,
        onMessageTap: (message) {
          Navigator.pop(context);
          _scrollToMessage(message.id);
        },
      ),
    );
  }
  
  void _showStarredSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StarredMessagesSheet(
        channelId: widget.channelId,
        onMessageTap: (message) {
          Navigator.pop(context);
          _scrollToMessage(message.id);
        },
        onUnstar: (messageId) async {
          await _controller.unstarMessage(messageId);
        },
      ),
    );
  }
  
  Future<void> _scrollToMessage(String messageId) async {
    final messageKey = _messageKeys[messageId];
    
    if (messageKey?.currentContext != null) {
      await _scrollToMessageKey(messageKey!, messageId);
    } else {
      HapticFeedback.lightImpact();
      await Future.delayed(const Duration(milliseconds: 100));
      
      final retryKey = _messageKeys[messageId];
      if (retryKey?.currentContext != null) {
        await _scrollToMessageKey(retryKey!, messageId);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.search_off, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('Message not found in current view'),
              ],
            ),
            behavior: SnackBarBehavior.floating,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }
  
  Future<void> _scrollToMessageKey(GlobalKey key, String messageId) async {
    final context = key.currentContext;
    if (context == null) return;
    
    final renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null) return;
    
    final scrollableContext = _scroll.position.context.storageContext;
    final scrollableRenderBox = scrollableContext.findRenderObject() as RenderBox?;
    if (scrollableRenderBox == null) return;
    
    final messagePosition = renderBox.localToGlobal(
      Offset.zero,
      ancestor: scrollableRenderBox,
    );
    
    final viewportHeight = _scroll.position.viewportDimension;
    final messageHeight = renderBox.size.height;
    final currentScroll = _scroll.offset;
    final targetScroll = currentScroll + messagePosition.dy - (viewportHeight / 2) + (messageHeight / 2);
    
    final clampedScroll = targetScroll.clamp(
      _scroll.position.minScrollExtent,
      _scroll.position.maxScrollExtent,
    );
    
    await _scroll.animateTo(
      clampedScroll,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    );
    
    HapticFeedback.mediumImpact();
    setState(() => _highlightedMessageId = messageId);
    _highlightController.reset();
    _highlightController.forward();
  }
  
  Future<void> _pinMessage(String messageId) async {
    final success = await _controller.pinMessage(messageId);
    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Message pinned')),
      );
    }
  }
  
  Future<void> _unpinMessage(String messageId) async {
    final success = await _controller.unpinMessage(messageId);
    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Message unpinned')),
      );
    }
  }
  
  Future<void> _starMessage(String messageId) async {
    final success = await _controller.starMessage(messageId);
    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Message starred')),
      );
    }
  }
  
  Future<void> _unstarMessage(String messageId) async {
    final success = await _controller.unstarMessage(messageId);
    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Message unstarred')),
      );
    }
  }
  
  Future<void> _deleteMessage(String messageId) async {
    final success = await _controller.deleteMessageForMe(messageId);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(success ? 'Message deleted for you' : 'Failed to delete message')),
      );
    }
  }
  
  Future<void> _deleteMessageForEveryone(String messageId) async {
    final result = await _controller.deleteMessageForEveryone(messageId);
    if (mounted) {
      final message = switch (result) {
        DeleteResult.success => 'Message deleted for everyone',
        DeleteResult.tooOld => 'Could not delete - message may be too old',
        DeleteResult.failed => 'Failed to delete message',
      };
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }
  
  void _showMessageActionsSheet(Message message) {
    final isPinned = _controller.pinnedMessages.any((m) => m.id == message.id);
    final isStarred = _controller.starredMessageIds.contains(message.id);
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => MessageActionsSheet(
        message: message,
        isPinned: isPinned,
        isStarred: isStarred,
        onReaction: (emoji) {
          Navigator.pop(context);
          _onReaction(message.id, emoji);
        },
        onReply: () {
          Navigator.pop(context);
          _input.text = '@${message.senderName} ';
          _focusNode.requestFocus();
        },
        onCopy: () {
          Navigator.pop(context);
          Clipboard.setData(ClipboardData(text: message.content));
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Message copied')),
          );
        },
        onPin: () {
          Navigator.pop(context);
          if (isPinned) {
            _unpinMessage(message.id);
          } else {
            _pinMessage(message.id);
          }
        },
        onStar: () {
          Navigator.pop(context);
          if (isStarred) {
            _unstarMessage(message.id);
          } else {
            _starMessage(message.id);
          }
        },
        onDelete: SupabaseConfig.auth.currentUser?.id == message.senderId
            ? () async {
                Navigator.pop(context);
                await _deleteMessage(message.id);
              }
            : null,
        onDeleteForEveryone: SupabaseConfig.auth.currentUser?.id == message.senderId
            ? () async {
                Navigator.pop(context);
                await _deleteMessageForEveryone(message.id);
              }
            : null,
      ),
    );
  }

  void _showGifPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => GifPickerSheet(
        onGifSelected: (gif) async {
          Navigator.pop(context);
          setState(() => _sending = true);
          try {
            await _controller.sendGif(gif.fullUrl);
            _scrollToBottom();
          } finally {
            if (mounted) setState(() => _sending = false);
          }
        },
      ),
    );
  }
}
