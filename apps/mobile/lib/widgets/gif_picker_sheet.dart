import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/services/giphy_service.dart';
import 'package:thittam1hub/theme.dart';

class GifPickerSheet extends StatefulWidget {
  final Function(GiphyGif) onGifSelected;

  const GifPickerSheet({
    super.key,
    required this.onGifSelected,
  });

  @override
  State<GifPickerSheet> createState() => _GifPickerSheetState();
}

class _GifPickerSheetState extends State<GifPickerSheet> {
  final GiphyService _giphyService = GiphyService.instance;
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<GiphyGif> _gifs = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String _currentQuery = '';
  Timer? _debounceTimer;
  int _offset = 0;
  static const int _limit = 25;

  @override
  void initState() {
    super.initState();
    _loadTrending();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadTrending() async {
    setState(() {
      _isLoading = true;
      _offset = 0;
    });
    
    final result = await _giphyService.getTrending(limit: _limit);
    
    if (mounted) {
      setState(() {
        _gifs = result.isSuccess ? result.data : [];
        _isLoading = false;
        _currentQuery = '';
      });
    }
  }

  Future<void> _search(String query) async {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () async {
      if (!mounted) return;
      
      setState(() {
        _isLoading = true;
        _offset = 0;
        _currentQuery = query;
      });
      
      final result = query.isEmpty
          ? await _giphyService.getTrending(limit: _limit)
          : await _giphyService.search(query, limit: _limit);
      
      if (mounted) {
        setState(() {
          _gifs = result.isSuccess ? result.data : [];
          _isLoading = false;
        });
      }
    });
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || _isLoading) return;
    
    setState(() => _isLoadingMore = true);
    
    _offset += _limit;
    final result = _currentQuery.isEmpty
        ? await _giphyService.getTrending(limit: _limit, offset: _offset)
        : await _giphyService.search(_currentQuery, limit: _limit, offset: _offset);
    
    if (mounted) {
      setState(() {
        if (result.isSuccess) {
          _gifs.addAll(result.data);
        }
        _isLoadingMore = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final size = MediaQuery.of(context).size;
    
    return Container(
      height: size.height * 0.7,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Choose a GIF',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                // Powered by Giphy badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Powered by ',
                        style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant),
                      ),
                      Text(
                        'GIPHY',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: cs.primary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchController,
              onChanged: _search,
              decoration: InputDecoration(
                hintText: 'Search GIFs...',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _loadTrending();
                        },
                      )
                    : null,
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
          
          const SizedBox(height: 12),
          
          // GIF Grid
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _gifs.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.gif_box_outlined, size: 48, color: cs.outline),
                            const SizedBox(height: 8),
                            Text(
                              'No GIFs found',
                              style: TextStyle(color: cs.outline),
                            ),
                          ],
                        ),
                      )
                    : GridView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(12),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 8,
                          crossAxisSpacing: 8,
                          childAspectRatio: 1.0,
                        ),
                        itemCount: _gifs.length + (_isLoadingMore ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index >= _gifs.length) {
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            );
                          }
                          
                          final gif = _gifs[index];
                          return _GifTile(
                            gif: gif,
                            onTap: () => widget.onGifSelected(gif),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _GifTile extends StatelessWidget {
  final GiphyGif gif;
  final VoidCallback onTap;

  const _GifTile({
    required this.gif,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Container(
          color: cs.surfaceContainerHighest,
          child: CachedNetworkImage(
            imageUrl: gif.previewUrl,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
              color: cs.surfaceContainerHighest,
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
            errorWidget: (context, url, error) => Container(
              color: cs.surfaceContainerHighest,
              child: Icon(Icons.broken_image_outlined, color: cs.outline),
            ),
          ),
        ),
      ),
    );
  }
}
