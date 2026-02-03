import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// Emoji categories with emojis
class EmojiCategory {
  final String name;
  final IconData icon;
  final List<String> emojis;

  const EmojiCategory({
    required this.name,
    required this.icon,
    required this.emojis,
  });
}

/// Standard emoji categories
final List<EmojiCategory> emojiCategories = [
  const EmojiCategory(
    name: 'Smileys',
    icon: Icons.emoji_emotions_outlined,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷',
    ],
  ),
  const EmojiCategory(
    name: 'Gestures',
    icon: Icons.back_hand_outlined,
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤝', '👏',
      '🙌', '👐', '🤲', '🤞', '✌️', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚',
      '🖐️', '✋', '🖖', '💪', '🦾', '🙏', '✍️', '🤳',
    ],
  ),
  const EmojiCategory(
    name: 'Hearts',
    icon: Icons.favorite_outline,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '❤️‍🔥', '❤️‍🩹', '♥️', '🫀', '💌',
    ],
  ),
  const EmojiCategory(
    name: 'Objects',
    icon: Icons.lightbulb_outline,
    emojis: [
      '💡', '🔥', '⭐', '🌟', '✨', '💫', '🎉', '🎊',
      '🎁', '🏆', '🥇', '🥈', '🥉', '🎯', '🚀', '💻',
      '📱', '⌨️', '🖥️', '📷', '📸', '🎮', '🎧', '🎤',
      '📚', '📖', '✏️', '📝', '📌', '📎', '🔗', '💼',
    ],
  ),
  const EmojiCategory(
    name: 'Symbols',
    icon: Icons.tag,
    emojis: [
      '✅', '❌', '❓', '❗', '💯', '🔴', '🟠', '🟡',
      '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '▶️', '⏸️',
      '⏹️', '⏺️', '⏭️', '⏮️', '🔀', '🔁', '🔂', '🔄',
      '➕', '➖', '✖️', '➗', '💲', '💱', '™️', '©️',
    ],
  ),
];

/// Recently used emojis (could be persisted)
List<String> recentEmojis = ['👍', '❤️', '😂', '🔥', '✅', '🎉', '💯', '🚀'];

/// Emoji picker bottom sheet
class EmojiPickerSheet extends StatefulWidget {
  final Function(String emoji) onEmojiSelected;

  const EmojiPickerSheet({
    super.key,
    required this.onEmojiSelected,
  });

  @override
  State<EmojiPickerSheet> createState() => _EmojiPickerSheetState();
}

class _EmojiPickerSheetState extends State<EmojiPickerSheet>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: emojiCategories.length + 1, // +1 for recent
      vsync: this,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  List<String> _getFilteredEmojis(List<String> emojis) {
    if (_searchQuery.isEmpty) return emojis;
    // Simple filter - in real app would use emoji descriptions
    return emojis;
  }

  void _onEmojiTap(String emoji) {
    HapticFeedback.lightImpact();
    
    // Add to recent
    if (!recentEmojis.contains(emoji)) {
      recentEmojis.insert(0, emoji);
      if (recentEmojis.length > 16) {
        recentEmojis = recentEmojis.take(16).toList();
      }
    }
    
    widget.onEmojiSelected(emoji);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.45,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.outline.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          // Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'Search emoji...',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: theme.colorScheme.surfaceContainerHighest,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Category tabs
          TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorSize: TabBarIndicatorSize.label,
            labelColor: theme.colorScheme.primary,
            unselectedLabelColor: theme.colorScheme.onSurface.withValues(alpha: 0.5),
            tabs: [
              const Tab(icon: Icon(Icons.history, size: 20)),
              ...emojiCategories.map((cat) => Tab(icon: Icon(cat.icon, size: 20))),
            ],
          ),
          
          // Emoji grid
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Recent
                _buildEmojiGrid(recentEmojis),
                // Categories
                ...emojiCategories.map((cat) => _buildEmojiGrid(_getFilteredEmojis(cat.emojis))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmojiGrid(List<String> emojis) {
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 8,
        mainAxisSpacing: 4,
        crossAxisSpacing: 4,
      ),
      itemCount: emojis.length,
      itemBuilder: (context, index) {
        return GestureDetector(
          onTap: () => _onEmojiTap(emojis[index]),
          child: Center(
            child: Text(
              emojis[index],
              style: const TextStyle(fontSize: 28),
            ),
          ),
        );
      },
    );
  }
}

/// Show emoji picker as bottom sheet
Future<void> showEmojiPicker(
  BuildContext context, {
  required Function(String emoji) onEmojiSelected,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => EmojiPickerSheet(onEmojiSelected: onEmojiSelected),
  );
}
