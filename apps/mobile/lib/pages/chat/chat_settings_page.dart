import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/chat_settings_section.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/pages/chat/settings/chat_notifications_tab.dart';
import 'package:thittam1hub/pages/chat/settings/chat_theme_tab.dart';
import 'package:thittam1hub/pages/chat/settings/chat_security_tab.dart';
import 'package:thittam1hub/pages/chat/settings/chat_accessibility_tab.dart';
import 'package:thittam1hub/pages/chat/settings/chat_backup_tab.dart';
import 'package:thittam1hub/pages/chat/settings/chat_storage_tab.dart';

/// Chat Settings tab categories with searchable keywords
class _ChatSettingsTab {
  final String id;
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final List<String> keywords;

  const _ChatSettingsTab({
    required this.id,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    this.keywords = const [],
  });
}

/// Enhanced Chat Settings page with tabbed deep linking and search
class ChatSettingsPage extends StatefulWidget {
  final String? initialTab;
  final String? channelId;
  final String? channelName;
  final bool isDM;

  const ChatSettingsPage({
    super.key,
    this.initialTab,
    this.channelId,
    this.channelName,
    this.isDM = false,
  });

  @override
  State<ChatSettingsPage> createState() => _ChatSettingsPageState();
}

class _ChatSettingsPageState extends State<ChatSettingsPage> {
  String? _selectedTab;
  final _searchController = TextEditingController();
  String _searchQuery = '';
  bool _isSearching = false;

  static const _tabCategories = [
    _ChatSettingsTab(
      id: 'notifications',
      icon: Icons.notifications_outlined,
      title: 'Notifications',
      subtitle: 'Mute, sound, vibrate',
      color: AppColors.violet500,
      keywords: ['mute', 'sound', 'vibrate', 'alert', 'preview', 'mentions', 'push'],
    ),
    _ChatSettingsTab(
      id: 'theme',
      icon: Icons.palette_outlined,
      title: 'Chat Theme',
      subtitle: 'Colors, bubbles, fonts',
      color: AppColors.pink500,
      keywords: ['background', 'accent', 'color', 'bubble', 'font', 'size', 'dark', 'light'],
    ),
    _ChatSettingsTab(
      id: 'security',
      icon: Icons.security_outlined,
      title: 'Security & Privacy',
      subtitle: 'Encryption, lock, receipts',
      color: AppColors.emerald500,
      keywords: ['encryption', 'lock', 'pin', 'biometric', 'disappearing', 'screenshot', 'typing', 'read receipts', 'block'],
    ),
    _ChatSettingsTab(
      id: 'accessibility',
      icon: Icons.accessibility_new,
      title: 'Accessibility',
      subtitle: 'Contrast, touch, reader',
      color: AppColors.amber500,
      keywords: ['contrast', 'touch', 'screen reader', 'bold', 'text size', 'motion', 'reduce'],
    ),
    _ChatSettingsTab(
      id: 'backup',
      icon: Icons.cloud_outlined,
      title: 'Backup & Restore',
      subtitle: 'Auto-backup, recovery',
      color: AppColors.teal500,
      keywords: ['backup', 'restore', 'auto', 'schedule', 'frequency', 'password', 'encrypt', 'recovery'],
    ),
    _ChatSettingsTab(
      id: 'storage',
      icon: Icons.photo_library_outlined,
      title: 'Media & Storage',
      subtitle: 'Cache, downloads, clear',
      color: AppColors.indigo500,
      keywords: ['storage', 'cache', 'media', 'download', 'clear', 'gallery', 'photos', 'videos'],
    ),
  ];

  List<_ChatSettingsTab> get _filteredCategories {
    if (_searchQuery.isEmpty) return _tabCategories;
    final query = _searchQuery.toLowerCase();
    return _tabCategories.where((tab) {
      return tab.title.toLowerCase().contains(query) ||
          tab.subtitle.toLowerCase().contains(query) ||
          tab.keywords.any((k) => k.contains(query));
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _selectedTab = widget.initialTab;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _navigateToTab(String tabId) {
    setState(() => _selectedTab = tabId);
    
    // Use type-safe enum-based navigation
    final section = ChatSettingsSection.fromId(tabId);
    final newUrl = AppRoutes.chatSettingsWithSection(
      section,
      channelId: widget.channelId,
      channelName: widget.channelName,
      isDM: widget.isDM,
    );
    
    if (context.showMasterDetail) {
      context.replace(newUrl);
    } else {
      context.push(newUrl);
    }
    HapticFeedback.selectionClick();
  }

  Widget _buildTabContent(String? tabId) {
    switch (tabId) {
      case 'notifications':
        return ChatNotificationsTab(
          channelId: widget.channelId,
          channelName: widget.channelName,
          isDM: widget.isDM,
        );
      case 'theme':
        return const ChatThemeTab();
      case 'security':
        return ChatSecurityTab(
          channelId: widget.channelId,
          channelName: widget.channelName,
          isDM: widget.isDM,
        );
      case 'accessibility':
        return const ChatAccessibilityTab();
      case 'backup':
        return const ChatBackupTab();
      case 'storage':
        return ChatStorageTab(
          channelId: widget.channelId,
          channelName: widget.channelName,
        );
      default:
        return _buildCategoryIndex();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isMasterDetail = context.showMasterDetail;

    // On mobile with a tab selected, show tab content directly
    if (!isMasterDetail && _selectedTab != null) {
      final tab = _tabCategories.firstWhere(
        (t) => t.id == _selectedTab,
        orElse: () => _tabCategories.first,
      );
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 20),
            onPressed: () => context.pop(),
          ),
          title: Text(tab.title),
        ),
        body: _buildTabContent(_selectedTab),
      );
    }

    // Tablet: master-detail layout
    if (isMasterDetail) {
      return Scaffold(
        body: Row(
          children: [
            // Sidebar
            SizedBox(
              width: 280,
              child: _buildSidebar(cs),
            ),
            // Content
            Expanded(
              child: Column(
                children: [
                  _buildDetailAppBar(cs),
                  Expanded(child: _buildTabContent(_selectedTab)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Mobile: category index with search
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => context.pop(),
        ),
        title: _isSearching
            ? _ChatSettingsSearchField(
                controller: _searchController,
                onChanged: (value) => setState(() => _searchQuery = value),
                onClose: () {
                  setState(() {
                    _isSearching = false;
                    _searchQuery = '';
                    _searchController.clear();
                  });
                },
              )
            : Text(widget.channelId != null ? 'Chat Settings' : 'Chat Preferences'),
        actions: [
          if (!_isSearching)
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () => setState(() => _isSearching = true),
              tooltip: 'Search settings',
            ),
        ],
      ),
      body: _buildCategoryIndex(),
    );
  }

  Widget _buildSidebar(ColorScheme cs) {
    return Container(
      decoration: BoxDecoration(
        color: cs.surfaceContainerLowest,
        border: Border(
          right: BorderSide(color: cs.outlineVariant.withOpacity(0.5)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with search
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, size: 20),
                  onPressed: () => context.pop(),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _isSearching
                      ? _ChatSettingsSearchField(
                          controller: _searchController,
                          onChanged: (value) => setState(() => _searchQuery = value),
                          onClose: () {
                            setState(() {
                              _isSearching = false;
                              _searchQuery = '';
                              _searchController.clear();
                            });
                          },
                        )
                      : Text(
                          'Settings',
                          style: context.textStyles.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
                if (!_isSearching)
                  IconButton(
                    icon: const Icon(Icons.search, size: 20),
                    onPressed: () => setState(() => _isSearching = true),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Search results label
          if (_isSearching && _searchQuery.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
              child: Text(
                '${_filteredCategories.length} result${_filteredCategories.length == 1 ? '' : 's'}',
                style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
              ),
            ),

          // Category list
          Expanded(
            child: _filteredCategories.isEmpty
                ? _buildEmptySearchState(cs)
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                    itemCount: _filteredCategories.length,
                    itemBuilder: (context, index) {
                      final tab = _filteredCategories[index];
                      final isSelected = _selectedTab == tab.id;
                      return _CategoryTile(
                        tab: tab,
                        isSelected: isSelected,
                        onTap: () => _navigateToTab(tab.id),
                        highlightQuery: _searchQuery,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailAppBar(ColorScheme cs) {
    final selectedCategory = _selectedTab != null
        ? _tabCategories.firstWhere(
            (t) => t.id == _selectedTab,
            orElse: () => _tabCategories.first,
          )
        : null;

    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
          bottom: BorderSide(color: cs.outlineVariant.withOpacity(0.5)),
        ),
      ),
      child: Row(
        children: [
          if (selectedCategory != null) ...[
            Icon(selectedCategory.icon, color: selectedCategory.color, size: 24),
            const SizedBox(width: AppSpacing.md),
            Text(
              selectedCategory.title,
              style: context.textStyles.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ] else
            Text(
              'Select a category',
              style: context.textStyles.titleMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCategoryIndex() {
    final cs = Theme.of(context).colorScheme;

    return ListView(
      padding: EdgeInsets.symmetric(
        horizontal: context.horizontalPadding,
        vertical: AppSpacing.md,
      ),
      children: [
        // Search results label (mobile)
        if (_isSearching && _searchQuery.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: Text(
              '${_filteredCategories.length} result${_filteredCategories.length == 1 ? '' : 's'} for "$_searchQuery"',
              style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
            ),
          ),
        ],

        // Empty state or categories
        if (_filteredCategories.isEmpty && _isSearching)
          _buildEmptySearchState(cs)
        else
          ...List.generate(_filteredCategories.length, (index) {
            final tab = _filteredCategories[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: _CategoryTile(
                tab: tab,
                isSelected: false,
                onTap: () => _navigateToTab(tab.id),
                showChevron: true,
                highlightQuery: _searchQuery,
              ),
            );
          }),
      ],
    );
  }

  Widget _buildEmptySearchState(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl * 2),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 48,
            color: cs.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'No settings found',
            style: context.textStyles.titleMedium?.withColor(cs.onSurfaceVariant),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Try a different search term',
            style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant.withOpacity(0.7)),
          ),
        ],
      ),
    );
  }
}

/// Category tile widget with keyword highlighting
class _CategoryTile extends StatelessWidget {
  final _ChatSettingsTab tab;
  final bool isSelected;
  final VoidCallback onTap;
  final bool showChevron;
  final String highlightQuery;

  const _CategoryTile({
    required this.tab,
    required this.isSelected,
    required this.onTap,
    this.showChevron = false,
    this.highlightQuery = '',
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
      child: Material(
        color: isSelected ? cs.primaryContainer.withOpacity(0.5) : Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: tab.color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Icon(tab.icon, color: tab.color, size: 20),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHighlightedText(
                        tab.title,
                        highlightQuery,
                        context.textStyles.bodyMedium?.copyWith(
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                        ),
                        cs.primary,
                      ),
                      const SizedBox(height: 2),
                      _buildHighlightedText(
                        tab.subtitle,
                        highlightQuery,
                        context.textStyles.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                        cs.primary,
                      ),
                    ],
                  ),
                ),
                if (showChevron)
                  Icon(Icons.chevron_right, color: cs.onSurfaceVariant, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHighlightedText(String text, String query, TextStyle? baseStyle, Color highlightColor) {
    if (query.isEmpty) {
      return Text(text, style: baseStyle);
    }

    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();
    final index = lowerText.indexOf(lowerQuery);

    if (index == -1) {
      return Text(text, style: baseStyle);
    }

    return RichText(
      text: TextSpan(
        style: baseStyle,
        children: [
          TextSpan(text: text.substring(0, index)),
          TextSpan(
            text: text.substring(index, index + query.length),
            style: baseStyle?.copyWith(
              backgroundColor: highlightColor.withOpacity(0.2),
              fontWeight: FontWeight.bold,
            ),
          ),
          TextSpan(text: text.substring(index + query.length)),
        ],
      ),
    );
  }
}

/// Search field widget for chat settings
class _ChatSettingsSearchField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClose;

  const _ChatSettingsSearchField({
    required this.controller,
    required this.onChanged,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      autofocus: true,
      style: context.textStyles.bodyMedium,
      decoration: InputDecoration(
        hintText: 'Search chat settings...',
        hintStyle: context.textStyles.bodyMedium?.withColor(
          Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        border: InputBorder.none,
        suffixIcon: IconButton(
          icon: const Icon(Icons.close, size: 20),
          onPressed: onClose,
        ),
      ),
    );
  }
}
