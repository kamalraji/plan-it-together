import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/supabase/spark_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

/// Unified search bottom sheet for the home page
class HomeSearchSheet extends StatefulWidget {
  const HomeSearchSheet({Key? key}) : super(key: key);

  static void show(BuildContext context) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const HomeSearchSheet(),
    );
  }

  @override
  State<HomeSearchSheet> createState() => _HomeSearchSheetState();
}

class _HomeSearchSheetState extends State<HomeSearchSheet>
    with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();
  late TabController _tabController;
  Timer? _debounce;
  
  bool _isLoading = false;
  List<SparkPost> _posts = [];
  List<_SearchPerson> _people = [];
  List<String> _tags = [];
  List<String> _recentSearches = ['Flutter', 'AI', 'Startup', 'Networking'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    _tabController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      if (query.isNotEmpty) {
        _performSearch(query);
      } else {
        setState(() {
          _posts = [];
          _people = [];
          _tags = [];
        });
      }
    });
  }

  Future<void> _performSearch(String query) async {
    setState(() => _isLoading = true);
    
    try {
      // Simulate search - in real app, call actual search services
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Mock results for demo
      if (mounted) {
        setState(() {
          _posts = []; // Would call SparkService.searchPosts(query)
          _people = []; // Would call ProfileService.searchPeople(query)
          _tags = ['#$query', '#${query}Dev', '#${query}Community'];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onRecentTap(String query) {
    _searchController.text = query;
    _performSearch(query);
  }

  void _clearRecent() {
    HapticFeedback.lightImpact();
    setState(() => _recentSearches = []);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          // Handle and search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(
              children: [
                // Handle bar
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: cs.outline.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),

                // Search field
                Container(
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: TextField(
                    controller: _searchController,
                    focusNode: _focusNode,
                    onChanged: _onSearchChanged,
                    style: textTheme.bodyLarge,
                    decoration: InputDecoration(
                      hintText: 'Search posts, people, tags...',
                      hintStyle: TextStyle(color: cs.onSurfaceVariant),
                      prefixIcon: Icon(Icons.search_rounded, color: cs.outline),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(Icons.close_rounded, color: cs.outline),
                              onPressed: () {
                                _searchController.clear();
                                setState(() {
                                  _posts = [];
                                  _people = [];
                                  _tags = [];
                                });
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Tab bar
          if (_searchController.text.isNotEmpty)
            TabBar(
              controller: _tabController,
              labelColor: cs.primary,
              unselectedLabelColor: cs.onSurfaceVariant,
              indicatorColor: cs.primary,
              indicatorSize: TabBarIndicatorSize.label,
              tabs: const [
                Tab(text: 'Posts'),
                Tab(text: 'People'),
                Tab(text: 'Tags'),
              ],
            ),

          // Content
          Expanded(
            child: _searchController.text.isEmpty
                ? _buildRecentSearches()
                : _isLoading
                    ? _buildLoadingSkeleton()
                    : TabBarView(
                        controller: _tabController,
                        children: [
                          _buildPostsTab(),
                          _buildPeopleTab(),
                          _buildTagsTab(),
                        ],
                      ),
          ),

          SizedBox(height: bottomPadding),
        ],
      ),
    );
  }

  Widget _buildRecentSearches() {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (_recentSearches.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_rounded, size: 48, color: cs.outline),
            const SizedBox(height: 12),
            Text(
              'Start typing to search',
              style: textTheme.bodyLarge?.copyWith(color: cs.onSurfaceVariant),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Searches',
                style: textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: cs.onSurfaceVariant,
                ),
              ),
              TextButton(
                onPressed: _clearRecent,
                child: Text(
                  'Clear All',
                  style: TextStyle(color: cs.primary, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _recentSearches.map((search) {
              return GestureDetector(
                onTap: () => _onRecentTap(search),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.history_rounded, size: 16, color: cs.outline),
                      const SizedBox(width: 6),
                      Text(
                        search,
                        style: TextStyle(color: cs.onSurface),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              ShimmerPlaceholder(width: 48, height: 48, isCircle: true),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerPlaceholder(
                      width: 150,
                      height: 14,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 6),
                    ShimmerPlaceholder(
                      width: 100,
                      height: 12,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPostsTab() {
    final cs = Theme.of(context).colorScheme;
    
    if (_posts.isEmpty) {
      return _buildEmptyState(
        icon: Icons.article_outlined,
        message: 'No posts found',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _posts.length,
      itemBuilder: (context, index) {
        final post = _posts[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundImage: post.authorAvatar != null
                ? NetworkImage(post.authorAvatar!)
                : null,
            child: post.authorAvatar == null
                ? Icon(Icons.person, color: cs.outline)
                : null,
          ),
          title: Text(post.title),
          subtitle: Text(post.authorName),
          onTap: () {
            Navigator.pop(context);
            // Navigate to post detail
          },
        );
      },
    );
  }

  Widget _buildPeopleTab() {
    final cs = Theme.of(context).colorScheme;
    
    if (_people.isEmpty) {
      return _buildEmptyState(
        icon: Icons.people_outlined,
        message: 'No people found',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _people.length,
      itemBuilder: (context, index) {
        final person = _people[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundImage: person.avatarUrl != null
                ? NetworkImage(person.avatarUrl!)
                : null,
            child: person.avatarUrl == null
                ? Icon(Icons.person, color: cs.outline)
                : null,
          ),
          title: Text(person.name),
          subtitle: Text(person.headline),
          onTap: () {
            Navigator.pop(context);
            context.push(AppRoutes.publicProfile(person.id));
          },
        );
      },
    );
  }

  Widget _buildTagsTab() {
    final cs = Theme.of(context).colorScheme;
    
    if (_tags.isEmpty) {
      return _buildEmptyState(
        icon: Icons.tag_rounded,
        message: 'No tags found',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _tags.length,
      itemBuilder: (context, index) {
        final tag = _tags[index];
        return ListTile(
          leading: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: cs.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.tag_rounded, color: cs.primary),
          ),
          title: Text(tag),
          subtitle: Text('Trending'),
          onTap: () {
            Navigator.pop(context);
            // Filter feed by tag
          },
        );
      },
    );
  }

  Widget _buildEmptyState({required IconData icon, required String message}) {
    final cs = Theme.of(context).colorScheme;
    
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48, color: cs.outline),
          const SizedBox(height: 12),
          Text(
            message,
            style: TextStyle(color: cs.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

/// Simple person search result model
class _SearchPerson {
  final String id;
  final String name;
  final String headline;
  final String? avatarUrl;

  _SearchPerson({
    required this.id,
    required this.name,
    required this.headline,
    this.avatarUrl,
  });
}
