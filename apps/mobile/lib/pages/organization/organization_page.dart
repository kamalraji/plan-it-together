import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thittam1hub/models/organization_detail.dart';
import 'package:thittam1hub/models/product.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/organization_service.dart';
import 'package:thittam1hub/services/product_service.dart';
import 'package:thittam1hub/widgets/product_card.dart';
import 'package:thittam1hub/widgets/event_card.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/nav.dart';

class OrganizationPage extends StatefulWidget {
  final String slug;
  final Organization? organization; // For hero animation transition
  
  const OrganizationPage({
    super.key,
    required this.slug,
    this.organization,
  });

  @override
  State<OrganizationPage> createState() => _OrganizationPageState();
}

class _OrganizationPageState extends State<OrganizationPage> with SingleTickerProviderStateMixin {
  final OrganizationService _orgService = OrganizationService.instance;
  final ProductService _productService = ProductService();
  
  late TabController _tabController;
  
  OrganizationDetail? _organization;
  List<Product> _products = [];
  List<Product> _featuredProducts = [];
  List<Event> _events = [];
  List<String> _categories = [];
  String? _selectedCategory;
  
  bool _isLoading = true;
  bool _isLoadingProducts = true;
  bool _isLoadingEvents = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadOrganization();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrganization() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    final result = await _orgService.getOrganizationBySlug(widget.slug);
    
    if (!mounted) return;
    
    if (result case Success(:final data)) {
      if (data == null) {
        setState(() {
          _error = 'Organization not found';
          _isLoading = false;
        });
        return;
      }
      
      setState(() {
        _organization = data;
        _isLoading = false;
      });
      
      // Load products and events in parallel
      _loadProducts();
      _loadEvents();
    } else if (result case Failure(:final message)) {
      setState(() {
        _error = message;
        _isLoading = false;
      });
    }
  }

  Future<void> _loadProducts() async {
    if (_organization == null) return;
    
    setState(() => _isLoadingProducts = true);
    
    // Load products and categories in parallel
    final results = await Future.wait([
      _productService.getProductsByOrganization(_organization!.id),
      _productService.getFeaturedProducts(_organization!.id),
      _productService.getProductCategories(_organization!.id),
    ]);
    
    if (!mounted) return;
    
    if (results[0] case Success<List<Product>>(:final data)) {
      _products = data;
    }
    
    if (results[1] case Success<List<Product>>(:final data)) {
      _featuredProducts = data;
    }
    
    if (results[2] case Success<List<String>>(:final data)) {
      _categories = data;
    }
    
    setState(() => _isLoadingProducts = false);
  }

  Future<void> _loadEvents() async {
    if (_organization == null) return;
    
    setState(() => _isLoadingEvents = true);
    
    final result = await _orgService.getUpcomingEvents(_organization!.id);
    
    if (!mounted) return;
    
    if (result case Success(:final data)) {
      setState(() {
        _events = data;
        _isLoadingEvents = false;
      });
    } else {
      setState(() => _isLoadingEvents = false);
    }
  }

  void _filterByCategory(String? category) {
    setState(() => _selectedCategory = category);
  }

  List<Product> get _filteredProducts {
    if (_selectedCategory == null) return _products;
    return _products.where((p) => p.category == _selectedCategory).toList();
  }

  Future<void> _openWebsite() async {
    final url = _organization?.website;
    if (url == null) return;
    
    final uri = Uri.tryParse(url.startsWith('http') ? url : 'https://$url');
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openEmail() async {
    final email = _organization?.email;
    if (email == null) return;
    
    final uri = Uri.parse('mailto:$email');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _shareOrganization() {
    if (_organization == null) return;
    
    HapticFeedback.lightImpact();
    
    final org = _organization!;
    final deepLink = 'https://thittam1hub.app/org/${org.slug}';
    final shareText = '${org.name}${org.description != null ? ' - ${org.description}' : ''}\n\n$deepLink';
    
    Share.share(
      shareText,
      subject: org.name,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline, size: 64, color: AppColors.error.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text(_error!, style: text.bodyLarge, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: _loadOrganization,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final org = _organization!;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          // Banner + Header
          SliverAppBar(
            pinned: true,
            expandedHeight: 180,
            leading: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                onPressed: () => context.pop(),
              ),
            ),
            actions: [
              Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.share, color: Colors.white, size: 20),
                  onPressed: _shareOrganization,
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Banner image or gradient
                  if (org.bannerUrl != null && org.bannerUrl!.isNotEmpty)
                    Image.network(
                      org.bannerUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildGradientBanner(org),
                    )
                  else
                    _buildGradientBanner(org),
                  // Gradient overlay for better text visibility
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.7),
                        ],
                        stops: const [0.4, 1.0],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Organization info section
          SliverToBoxAdapter(
            child: Container(
              color: cs.surface,
              child: Column(
                children: [
                  // Logo positioned over banner
                  Transform.translate(
                    offset: const Offset(0, -44),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          // Logo with border
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: cs.surface, width: 4),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.12),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: CircleAvatar(
                              radius: 44,
                              backgroundColor: cs.surface,
                              backgroundImage: org.logoUrl != null && org.logoUrl!.isNotEmpty
                                  ? NetworkImage(org.logoUrl!)
                                  : null,
                              child: org.logoUrl == null || org.logoUrl!.isEmpty
                                  ? Text(
                                      org.name.substring(0, 1).toUpperCase(),
                                      style: text.headlineLarge?.copyWith(
                                        color: cs.primary,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    )
                                  : null,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Content below logo
                  Transform.translate(
                    offset: const Offset(0, -28),
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Name + Verified badge
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  org.name,
                                  style: text.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                              ),
                              if (org.isVerified)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.success.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.verified, size: 14, color: AppColors.success),
                                      const SizedBox(width: 3),
                                      Text(
                                        'Verified',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.success,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          // Category chip
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: cs.primary.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: cs.primary.withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.business_outlined, size: 14, color: cs.primary),
                                const SizedBox(width: 5),
                                Text(
                                  org.category.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: cs.primary,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Stats row - cleaner design
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              _StatBadge(
                                icon: Icons.event_outlined,
                                value: org.eventCount.toString(),
                                label: 'Events',
                              ),
                              const SizedBox(width: 12),
                              _StatBadge(
                                icon: Icons.inventory_2_outlined,
                                value: org.productCount.toString(),
                                label: 'Products',
                              ),
                              const Spacer(),
                              // Action buttons
                              if (org.website != null)
                                _CompactActionButton(
                                  icon: Icons.language,
                                  onTap: _openWebsite,
                                ),
                              if (org.email != null) ...[
                                const SizedBox(width: 8),
                                _CompactActionButton(
                                  icon: Icons.email_outlined,
                                  onTap: _openEmail,
                                ),
                              ],
                            ],
                          ),
                          // Description (collapsed by default)
                          if (org.description != null && org.description!.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'About',
                                    style: text.labelMedium?.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    org.description!,
                                    style: text.bodySmall?.copyWith(
                                      color: cs.onSurface.withValues(alpha: 0.8),
                                      height: 1.5,
                                    ),
                                    maxLines: 3,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Tab bar - cleaner design
          SliverPersistentHeader(
            pinned: true,
            delegate: _StickyTabBarDelegate(
              TabBar(
                controller: _tabController,
                labelColor: cs.primary,
                unselectedLabelColor: AppColors.textMuted,
                indicatorColor: cs.primary,
                indicatorWeight: 2,
                indicatorSize: TabBarIndicatorSize.label,
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'Products'),
                  Tab(text: 'Events'),
                ],
              ),
              cs.surface,
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            // Products tab
            _buildProductsTab(),
            // Events tab
            _buildEventsTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildGradientBanner(OrganizationDetail org) {
    // Parse organization colors or use defaults
    Color primary = AppColors.violet500;
    Color secondary = AppColors.indigo500;
    
    if (org.primaryColor != null) {
      try {
        primary = Color(int.parse(org.primaryColor!.replaceFirst('#', '0xFF')));
      } catch (_) {}
    }
    if (org.secondaryColor != null) {
      try {
        secondary = Color(int.parse(org.secondaryColor!.replaceFirst('#', '0xFF')));
      } catch (_) {}
    }
    
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primary, secondary],
        ),
      ),
    );
  }

  Widget _buildProductsTab() {
    if (_isLoadingProducts) {
      return _buildProductsShimmer();
    }
    
    if (_products.isEmpty) {
      return _buildEmptyState(
        icon: Icons.inventory_2_outlined,
        title: 'No products yet',
        subtitle: 'This organization hasn\'t added any products',
      );
    }

    return CustomScrollView(
      slivers: [
        // Featured products section
        if (_featuredProducts.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  const Icon(Icons.star, size: 20, color: AppColors.amber500),
                  const SizedBox(width: 8),
                  Text(
                    'Featured',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 160,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _featuredProducts.length,
                itemBuilder: (context, index) => FeaturedProductCard(
                  product: _featuredProducts[index],
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
        // Category filter
        if (_categories.isNotEmpty)
          SliverToBoxAdapter(
            child: SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _categories.length + 1,
                itemBuilder: (context, index) {
                  final isAll = index == 0;
                  final category = isAll ? null : _categories[index - 1];
                  final isSelected = _selectedCategory == category;
                  
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(isAll ? 'All' : category!),
                      selected: isSelected,
                      onSelected: (_) => _filterByCategory(category),
                      selectedColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
                      checkmarkColor: Theme.of(context).colorScheme.primary,
                      labelStyle: TextStyle(
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected 
                            ? Theme.of(context).colorScheme.primary 
                            : AppColors.textMuted,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        // Products grid
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.85,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) => ProductCard(product: _filteredProducts[index]),
              childCount: _filteredProducts.length,
            ),
          ),
        ),
        // Bottom padding
        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
  }

  Widget _buildEventsTab() {
    if (_isLoadingEvents) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        itemBuilder: (context, index) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: ShimmerPlaceholder(
            height: 200,
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
        ),
      );
    }
    
    if (_events.isEmpty) {
      return _buildEmptyState(
        icon: Icons.event_busy_outlined,
        title: 'No upcoming events',
        subtitle: 'Check back later for new events',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _events.length,
      itemBuilder: (context, index) {
        final event = _events[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: EventCard(
            event: event,
            tiers: const [],
            saved: false,
            onTap: () => context.push(AppRoutes.eventDetail(event.id), extra: event),
            onToggleSave: () {},
          ),
        );
      },
    );
  }

  Widget _buildProductsShimmer() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: 6,
      itemBuilder: (context, index) => ShimmerPlaceholder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 40,
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ==========================
// HELPER WIDGETS
// ==========================

class _CompactActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  
  const _CompactActionButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Material(
      color: cs.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, size: 18, color: cs.primary),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBadge extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  
  const _StatBadge({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: cs.outline.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: cs.primary),
          const SizedBox(width: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color backgroundColor;
  
  _StickyTabBarDelegate(this.tabBar, this.backgroundColor);

  @override
  double get minExtent => tabBar.preferredSize.height;
  
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: backgroundColor,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(covariant _StickyTabBarDelegate oldDelegate) {
    return tabBar != oldDelegate.tabBar || backgroundColor != oldDelegate.backgroundColor;
  }
}
