import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/services/followers_service.dart';
import 'package:thittam1hub/supabase/premium_service.dart';
import 'package:thittam1hub/widgets/styled_empty_state.dart';

/// Premium feature screen showing users who have sent follow requests
class WhoLikedYouPage extends StatefulWidget {
  const WhoLikedYouPage({Key? key}) : super(key: key);

  @override
  State<WhoLikedYouPage> createState() => _WhoLikedYouPageState();
}

class _WhoLikedYouPageState extends State<WhoLikedYouPage> {
  final FollowersService _followersService = FollowersService.instance;
  final PremiumService _premiumService = PremiumService.instance;
  
  List<FollowRequest> _requests = [];
  bool _isLoading = true;
  bool _isPremium = false;
  UserSubscription? _subscription;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    final sub = await _premiumService.getMySubscription();
    final requests = await _followersService.getPendingRequests();
    
    if (mounted) {
      setState(() {
        _subscription = sub;
        _isPremium = sub?.isPremium ?? false;
        _requests = requests;
        _isLoading = false;
      });
    }
  }

  void _showUpgradePrompt() {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _UpgradeSheet(
        likeCount: _requests.length,
        onUpgrade: () async {
          Navigator.pop(context);
          final success = await _premiumService.upgradeToPremium(PlanType.premium);
          if (success && mounted) {
            _loadData();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Welcome to Premium!')),
            );
          }
        },
      ),
    );
  }

  Future<void> _onAccept(FollowRequest request) async {
    HapticFeedback.mediumImpact();
    try {
      await _followersService.acceptFollowRequest(request.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${request.requesterName} is now following you!')),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to accept follow request')),
        );
      }
    }
  }

  Future<void> _onDecline(FollowRequest request) async {
    HapticFeedback.lightImpact();
    try {
      await _followersService.declineFollowRequest(request.id);
      if (mounted) {
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to decline follow request')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Who Liked You'),
            if (_requests.isNotEmpty) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: cs.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_requests.length}',
                  style: textTheme.labelSmall?.copyWith(color: cs.onPrimary),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (!_isPremium && _requests.isNotEmpty)
            TextButton.icon(
              onPressed: _showUpgradePrompt,
              icon: const Icon(Icons.star, size: 18),
              label: const Text('Upgrade'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _requests.isEmpty
              ? StyledEmptyState.noData(
                  icon: Icons.favorite_outline,
                  title: 'No likes yet',
                  message: "When someone wants to follow you, they'll appear here.",
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: _requests.length,
                  itemBuilder: (context, index) {
                    final request = _requests[index];
                    return _isPremium
                        ? _RevealedProfileCard(
                            request: request,
                            onAccept: () => _onAccept(request),
                            onDecline: () => _onDecline(request),
                            onTap: () {
                              context.push(AppRoutes.impactProfile(request.requesterId));
                            },
                          )
                        : _BlurredProfileCard(
                            request: request,
                            onTap: _showUpgradePrompt,
                          );
                  },
                ),
    );
  }
}

/// Revealed profile card for premium users
class _RevealedProfileCard extends StatelessWidget {
  final FollowRequest request;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onTap;

  const _RevealedProfileCard({
    required this.request,
    required this.onAccept,
    required this.onDecline,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: cs.shadow.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
            // Profile image
              if (request.requesterAvatar != null)
                Image.network(
                  request.requesterAvatar!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _AvatarPlaceholder(name: request.requesterName),
                )
              else
                _AvatarPlaceholder(name: request.requesterName),

              // Gradient overlay
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.7),
                    ],
                    stops: const [0.5, 1.0],
                  ),
                ),
              ),

              // "Wants to follow you" badge
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: cs.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.person_add, size: 12, color: Colors.white),
                      const SizedBox(width: 4),
                      Text(
                        'Follow',
                        style: textTheme.labelSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Name and headline
              Positioned(
                left: 12,
                right: 12,
                bottom: 60,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.requesterName,
                      style: textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (request.requesterHeadline != null) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          request.requesterHeadline!,
                          style: textTheme.labelSmall?.copyWith(color: Colors.white70),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Action buttons
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: onDecline,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.2),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                        child: const Icon(Icons.close, size: 20),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: onAccept,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: cs.primary,
                          foregroundColor: cs.onPrimary,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                        child: const Icon(Icons.check, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Blurred profile card for free users
class _BlurredProfileCard extends StatelessWidget {
  final FollowRequest request;
  final VoidCallback onTap;

  const _BlurredProfileCard({
    required this.request,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: cs.shadow.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Blurred profile image
              if (request.requesterAvatar != null)
                ImageFiltered(
                  imageFilter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                  child: Image.network(
                    request.requesterAvatar!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _AvatarPlaceholder(name: request.requesterName),
                  ),
                )
              else
                ImageFiltered(
                  imageFilter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                  child: _AvatarPlaceholder(name: request.requesterName),
                ),

              // Dark overlay
              Container(color: Colors.black.withOpacity(0.3)),

              // Lock icon
              Center(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.lock,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ),

              // Blurred name
              Positioned(
                left: 12,
                right: 12,
                bottom: 40,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 20,
                      width: 100,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 14,
                      width: 60,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),

              // Upgrade prompt
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [cs.primary, cs.secondary],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.star, color: Colors.white, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Upgrade to reveal',
                        style: textTheme.labelMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Avatar placeholder when no image available
class _AvatarPlaceholder extends StatelessWidget {
  final String name;

  const _AvatarPlaceholder({required this.name});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    
    return Container(
      color: cs.primaryContainer,
      child: Center(
        child: Text(
          initial,
          style: Theme.of(context).textTheme.displayLarge?.copyWith(
            color: cs.onPrimaryContainer,
          ),
        ),
      ),
    );
  }
}

/// Upgrade bottom sheet
class _UpgradeSheet extends StatelessWidget {
  final int likeCount;
  final VoidCallback onUpgrade;

  const _UpgradeSheet({
    required this.likeCount,
    required this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.onSurfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          
          // Star icon
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.amber, Colors.orange],
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.star, color: Colors.white, size: 40),
          ),
          const SizedBox(height: 20),
          
          Text(
            '$likeCount people want to follow you!',
            style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          
          Text(
            'Upgrade to Premium to see who wants to follow you and accept instantly.',
            style: textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          
          // Features list
          _FeatureRow(icon: Icons.visibility, text: 'See everyone who liked you'),
          _FeatureRow(icon: Icons.bolt, text: 'Unlimited rewinds'),
          _FeatureRow(icon: Icons.star, text: '10 Super Likes per day'),
          _FeatureRow(icon: Icons.rocket_launch, text: '5 Profile Boosts per month'),
          
          const SizedBox(height: 24),
          
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onUpgrade,
              style: ElevatedButton.styleFrom(
                backgroundColor: cs.primary,
                foregroundColor: cs.onPrimary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Upgrade to Premium'),
            ),
          ),
          
          const SizedBox(height: 12),
          
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Maybe later'),
          ),
          
          SizedBox(height: MediaQuery.of(context).padding.bottom),
        ],
      ),
    );
  }
}

/// Feature row in upgrade sheet
class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _FeatureRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: cs.primary, size: 20),
          const SizedBox(width: 12),
          Text(text, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
