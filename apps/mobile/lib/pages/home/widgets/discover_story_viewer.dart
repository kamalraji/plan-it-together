import 'package:flutter/material.dart';
import 'package:thittam1hub/models/impact_profile.dart';

class DiscoverStoryViewer extends StatefulWidget {
  final List<ImpactProfile> profiles;
  final int initialIndex;
  final Function(String userId) onFollow;
  final Function(String userId) onSkip;
  final Function(String userId) onViewProfile;

  const DiscoverStoryViewer({
    Key? key,
    required this.profiles,
    this.initialIndex = 0,
    required this.onFollow,
    required this.onSkip,
    required this.onViewProfile,
  }) : super(key: key);

  @override
  State<DiscoverStoryViewer> createState() => _DiscoverStoryViewerState();
}

class _DiscoverStoryViewerState extends State<DiscoverStoryViewer>
    with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _progressController;
  int _currentIndex = 0;
  static const _storyDuration = Duration(seconds: 5);

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _progressController = AnimationController(
      vsync: this,
      duration: _storyDuration,
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _nextStory();
        }
      });
    _progressController.forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  void _nextStory() {
    if (_currentIndex < widget.profiles.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      Navigator.pop(context);
    }
  }

  void _previousStory() {
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _onPageChanged(int index) {
    setState(() => _currentIndex = index);
    _progressController.reset();
    _progressController.forward();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapUp: (details) {
          final screenWidth = MediaQuery.of(context).size.width;
          if (details.globalPosition.dx < screenWidth / 3) {
            _previousStory();
          } else if (details.globalPosition.dx > screenWidth * 2 / 3) {
            _nextStory();
          } else {
            // Center tap - pause/resume
            if (_progressController.isAnimating) {
              _progressController.stop();
            } else {
              _progressController.forward();
            }
          }
        },
        child: Stack(
          children: [
            // Profile pages
            PageView.builder(
              controller: _pageController,
              onPageChanged: _onPageChanged,
              itemCount: widget.profiles.length,
              itemBuilder: (context, index) {
                final profile = widget.profiles[index];
                return _ProfileStoryPage(
                  profile: profile,
                  onFollow: () => widget.onFollow(profile.userId),
                  onSkip: () {
                    widget.onSkip(profile.userId);
                    _nextStory();
                  },
                  onViewProfile: () => widget.onViewProfile(profile.userId),
                );
              },
            ),

            // Progress bars at top
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                child: Row(
                  children: List.generate(widget.profiles.length, (index) {
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2),
                        child: AnimatedBuilder(
                          animation: _progressController,
                          builder: (context, child) {
                            double progress = 0;
                            if (index < _currentIndex) {
                              progress = 1;
                            } else if (index == _currentIndex) {
                              progress = _progressController.value;
                            }
                            return LinearProgressIndicator(
                              value: progress,
                              backgroundColor: Colors.white.withValues(alpha: 0.3),
                              valueColor: AlwaysStoppedAnimation(Colors.white),
                              minHeight: 3,
                              borderRadius: BorderRadius.circular(2),
                            );
                          },
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ),

            // Close button
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox(width: 40),
                    Text(
                      'Discover People',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileStoryPage extends StatelessWidget {
  final ImpactProfile profile;
  final VoidCallback onFollow;
  final VoidCallback onSkip;
  final VoidCallback onViewProfile;

  const _ProfileStoryPage({
    required this.profile,
    required this.onFollow,
    required this.onSkip,
    required this.onViewProfile,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.3),
            Colors.black.withValues(alpha: 0.7),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Background image
          if (profile.avatarUrl != null)
            Positioned.fill(
              child: Image.network(
                profile.avatarUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: Colors.grey[900],
                  child: Icon(Icons.person, size: 120, color: Colors.grey[700]),
                ),
              ),
            )
          else
            Positioned.fill(
              child: Container(
                color: Colors.grey[900],
                child: Icon(Icons.person, size: 120, color: Colors.grey[700]),
              ),
            ),

          // Gradient overlay
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.8),
                  ],
                  stops: const [0.5, 1.0],
                ),
              ),
            ),
          ),

          // Profile info at bottom
          Positioned(
            left: 20,
            right: 20,
            bottom: 120,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name and match score
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        profile.fullName,
                        style: textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.purple, Colors.pink],
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${profile.impactScore}% Match',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Headline
                Text(
                  profile.headline,
                  style: textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
                const SizedBox(height: 12),

                // Tags/interests
                if (profile.interests.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: profile.interests.take(4).map((interest) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          interest,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
              ],
            ),
          ),

          // Action buttons at bottom
          Positioned(
            left: 20,
            right: 20,
            bottom: 40,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Skip button
                _ActionButton(
                  icon: Icons.close,
                  color: Colors.grey[800]!,
                  onTap: onSkip,
                ),
                // View profile button
                _ActionButton(
                  icon: Icons.person,
                  color: Colors.blue,
                  onTap: onViewProfile,
                ),
                // Follow button
                _ActionButton(
                  icon: Icons.favorite,
                  color: Colors.pink,
                  onTap: onFollow,
                  isLarge: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool isLarge;

  const _ActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
    this.isLarge = false,
  });

  @override
  Widget build(BuildContext context) {
    final size = isLarge ? 64.0 : 52.0;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.4),
              blurRadius: 12,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: isLarge ? 32 : 26,
        ),
      ),
    );
  }
}
