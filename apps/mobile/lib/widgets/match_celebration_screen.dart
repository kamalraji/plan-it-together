import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/widgets/confetti_overlay.dart';

/// Full-screen match celebration overlay when two users mutually connect
class MatchCelebrationScreen extends StatefulWidget {
  final ImpactProfile currentUser;
  final ImpactProfile matchedUser;
  final int matchScore;
  final VoidCallback onStartChat;
  final VoidCallback onKeepSwiping;

  const MatchCelebrationScreen({
    Key? key,
    required this.currentUser,
    required this.matchedUser,
    required this.matchScore,
    required this.onStartChat,
    required this.onKeepSwiping,
  }) : super(key: key);

  @override
  State<MatchCelebrationScreen> createState() => _MatchCelebrationScreenState();
}

class _MatchCelebrationScreenState extends State<MatchCelebrationScreen>
    with TickerProviderStateMixin {
  late AnimationController _entranceController;
  late AnimationController _heartController;
  late AnimationController _titleController;
  late AnimationController _buttonsController;
  late AnimationController _floatingHeartsController;
  
  late Animation<double> _blurAnimation;
  late Animation<double> _backgroundOpacity;
  late Animation<double> _photoScale;
  late Animation<double> _titleScale;
  late Animation<double> _buttonsOpacity;
  
  final List<_FloatingHeart> _floatingHearts = [];
  final math.Random _random = math.Random();
  bool _showConfetti = false;

  @override
  void initState() {
    super.initState();
    
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    
    _heartController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    
    _titleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    
    _buttonsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    
    _floatingHeartsController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );
    
    _blurAnimation = Tween<double>(begin: 0, end: 15).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOut),
    );
    
    _backgroundOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOut),
    );
    
    _photoScale = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _heartController, curve: Curves.elasticOut),
    );
    
    _titleScale = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _titleController, curve: Curves.bounceOut),
    );
    
    _buttonsOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _buttonsController, curve: Curves.easeOut),
    );
    
    _generateFloatingHearts();
    _startAnimationSequence();
  }

  void _generateFloatingHearts() {
    _floatingHearts.clear();
    for (int i = 0; i < 15; i++) {
      _floatingHearts.add(_FloatingHeart(
        startX: _random.nextDouble(),
        speed: 0.3 + _random.nextDouble() * 0.7,
        size: 16 + _random.nextDouble() * 20,
        delay: _random.nextDouble(),
        swayAmount: 20 + _random.nextDouble() * 40,
        color: [
          const Color(0xFFE91E63),
          const Color(0xFFF06292),
          const Color(0xFFFF80AB),
          const Color(0xFFEC407A),
        ][_random.nextInt(4)],
      ));
    }
  }

  void _startAnimationSequence() async {
    HapticFeedback.heavyImpact();
    
    // Start background blur
    _entranceController.forward();
    
    await Future.delayed(const Duration(milliseconds: 300));
    
    // Show photos with bounce
    _heartController.forward();
    
    await Future.delayed(const Duration(milliseconds: 400));
    
    // Show title
    _titleController.forward();
    HapticFeedback.mediumImpact();
    
    // Start floating hearts
    _floatingHeartsController.repeat();
    
    await Future.delayed(const Duration(milliseconds: 300));
    
    // Show confetti
    setState(() => _showConfetti = true);
    
    await Future.delayed(const Duration(milliseconds: 400));
    
    // Show buttons
    _buttonsController.forward();
  }

  @override
  void dispose() {
    _entranceController.dispose();
    _heartController.dispose();
    _titleController.dispose();
    _buttonsController.dispose();
    _floatingHeartsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final size = MediaQuery.of(context).size;
    
    return Material(
      color: Colors.transparent,
      child: Stack(
        children: [
          // Blurred background
          AnimatedBuilder(
            animation: _entranceController,
            builder: (context, child) {
              return BackdropFilter(
                filter: ImageFilter.blur(
                  sigmaX: _blurAnimation.value,
                  sigmaY: _blurAnimation.value,
                ),
                child: Container(
                  color: Colors.black.withOpacity(_backgroundOpacity.value * 0.7),
                ),
              );
            },
          ),
          
          // Floating hearts
          AnimatedBuilder(
            animation: _floatingHeartsController,
            builder: (context, child) {
              return Stack(
                children: _floatingHearts.map((heart) {
                  final adjustedProgress = ((_floatingHeartsController.value + heart.delay) % 1.0);
                  final yPosition = size.height * (1 - adjustedProgress);
                  final xOffset = math.sin(adjustedProgress * math.pi * 4) * heart.swayAmount;
                  final opacity = math.sin(adjustedProgress * math.pi);
                  
                  return Positioned(
                    left: heart.startX * size.width + xOffset - heart.size / 2,
                    top: yPosition,
                    child: Opacity(
                      opacity: opacity.clamp(0.0, 0.8),
                      child: Icon(
                        Icons.favorite,
                        color: heart.color,
                        size: heart.size,
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
          
          // Main content
          SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(flex: 2),
                
                // Profile photos with hearts
                AnimatedBuilder(
                  animation: _heartController,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _photoScale.value,
                      child: _buildProfilePhotos(cs),
                    );
                  },
                ),
                
                const SizedBox(height: 40),
                
                // "It's a Match!" title
                AnimatedBuilder(
                  animation: _titleController,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _titleScale.value,
                      child: Column(
                        children: [
                          ShaderMask(
                            shaderCallback: (bounds) => const LinearGradient(
                              colors: [
                                Color(0xFFE91E63),
                                Color(0xFFFF4081),
                                Color(0xFFE91E63),
                              ],
                            ).createShader(bounds),
                            child: const Text(
                              "It's a Match! 💕",
                              style: TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'You and ${widget.matchedUser.fullName} liked each other',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  cs.primary.withOpacity(0.8),
                                  cs.primary,
                                ],
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.favorite, color: Colors.white, size: 18),
                                const SizedBox(width: 6),
                                Text(
                                  '${widget.matchScore}% Match',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                
                const Spacer(),
                
                // Action buttons
                AnimatedBuilder(
                  animation: _buttonsController,
                  builder: (context, child) {
                    return Opacity(
                      opacity: _buttonsOpacity.value,
                      child: Transform.translate(
                        offset: Offset(0, 50 * (1 - _buttonsOpacity.value)),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: Column(
                            children: [
                              // Start Chatting button
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    HapticFeedback.selectionClick();
                                    widget.onStartChat();
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: cs.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(30),
                                    ),
                                    elevation: 8,
                                    shadowColor: cs.primary.withOpacity(0.5),
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.chat_bubble_rounded),
                                      SizedBox(width: 8),
                                      Text(
                                        'Start Chatting',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              // Keep Swiping button
                              TextButton(
                                onPressed: () {
                                  HapticFeedback.lightImpact();
                                  widget.onKeepSwiping();
                                },
                                child: Text(
                                  'Keep Swiping',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.8),
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
                
                const Spacer(),
              ],
            ),
          ),
          
          // Confetti overlay
          ConfettiOverlay(
            isPlaying: _showConfetti,
            style: ConfettiStyle.burst,
            particleCount: 100,
            duration: const Duration(seconds: 3),
            onComplete: () => setState(() => _showConfetti = false),
          ),
        ],
      ),
    );
  }

  Widget _buildProfilePhotos(ColorScheme cs) {
    return SizedBox(
      height: 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Current user photo (left)
          Positioned(
            left: 40,
            child: _buildProfilePhoto(
              widget.currentUser.avatarUrl,
              widget.currentUser.fullName,
              cs.primary,
            ),
          ),
          
          // Matched user photo (right)
          Positioned(
            right: 40,
            child: _buildProfilePhoto(
              widget.matchedUser.avatarUrl,
              widget.matchedUser.fullName,
              const Color(0xFFE91E63),
            ),
          ),
          
          // Heart in the middle
          AnimatedBuilder(
            animation: _heartController,
            builder: (context, child) {
              final pulse = math.sin(_heartController.value * math.pi * 4);
              return Transform.scale(
                scale: 1 + pulse * 0.1,
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFE91E63), Color(0xFFFF4081)],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFE91E63).withOpacity(0.5),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.favorite,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildProfilePhoto(String? avatarUrl, String name, Color borderColor) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: borderColor, width: 4),
        boxShadow: [
          BoxShadow(
            color: borderColor.withOpacity(0.4),
            blurRadius: 20,
            spreadRadius: 5,
          ),
        ],
      ),
      child: CircleAvatar(
        radius: 60,
        backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
        backgroundColor: borderColor.withOpacity(0.3),
        child: avatarUrl == null
            ? Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: const TextStyle(fontSize: 40, color: Colors.white),
              )
            : null,
      ),
    );
  }
}

class _FloatingHeart {
  final double startX;
  final double speed;
  final double size;
  final double delay;
  final double swayAmount;
  final Color color;

  _FloatingHeart({
    required this.startX,
    required this.speed,
    required this.size,
    required this.delay,
    required this.swayAmount,
    required this.color,
  });
}

/// Result class for mutual match detection
class MutualMatchResult {
  final ImpactProfile profile;
  final int matchScore;

  MutualMatchResult({
    required this.profile,
    required this.matchScore,
  });
}
