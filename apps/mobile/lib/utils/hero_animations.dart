import 'package:flutter/material.dart';

/// Configuration for hero animations across the app
class HeroConfig {
  /// Duration for hero flight transitions
  static const Duration duration = Duration(milliseconds: 400);
  
  /// Reverse transition duration (slightly faster for snappy feel)
  static const Duration reverseDuration = Duration(milliseconds: 350);
  
  /// Default curve for hero animations
  static const Curve curve = Curves.easeOutCubic;
  
  /// Creates a consistent hero tag for event banners
  static String eventBannerTag(String eventId) => 'event_banner_$eventId';
  
  /// Creates a consistent hero tag for event titles
  static String eventTitleTag(String eventId) => 'event_title_$eventId';
  
  /// Creates a consistent hero tag for event organization logos
  static String eventOrgTag(String eventId) => 'event_org_$eventId';
  
  /// Creates a consistent hero tag for profile avatars
  static String profileAvatarTag(String profileId) => 'profile_avatar_$profileId';
  
  /// Creates a consistent hero tag for profile names
  static String profileNameTag(String profileId) => 'profile_name_$profileId';
  
  /// Creates a consistent hero tag for ticket cards
  static String ticketCardTag(String registrationId) => 'ticket_card_$registrationId';
  
  /// Creates a consistent hero tag for ticket QR codes
  static String ticketQrTag(String registrationId) => 'ticket_qr_$registrationId';
}

/// Custom flight shuttle builder for smooth hero transitions with fade effect
Widget heroFlightShuttleBuilder(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection direction,
  BuildContext fromHeroContext,
  BuildContext toHeroContext,
) {
  final Hero toHero = toHeroContext.widget as Hero;
  return FadeTransition(
    opacity: animation.drive(
      Tween<double>(begin: 0.5, end: 1.0).chain(
        CurveTween(curve: Curves.easeOut),
      ),
    ),
    child: toHero.child,
  );
}

/// Custom flight shuttle builder that maintains the child during flight
Widget materialHeroFlightShuttleBuilder(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection direction,
  BuildContext fromHeroContext,
  BuildContext toHeroContext,
) {
  final Hero hero = direction == HeroFlightDirection.push
      ? fromHeroContext.widget as Hero
      : toHeroContext.widget as Hero;
  return Material(
    color: Colors.transparent,
    child: hero.child,
  );
}

/// Animated hero wrapper with scale and fade effects
class AnimatedHero extends StatelessWidget {
  final String tag;
  final Widget child;
  final bool enabled;
  final HeroFlightShuttleBuilder? flightShuttleBuilder;
  final CreateRectTween? createRectTween;

  const AnimatedHero({
    super.key,
    required this.tag,
    required this.child,
    this.enabled = true,
    this.flightShuttleBuilder,
    this.createRectTween,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled) return child;
    
    return Hero(
      tag: tag,
      flightShuttleBuilder: flightShuttleBuilder ?? heroFlightShuttleBuilder,
      createRectTween: createRectTween ?? (begin, end) {
        return MaterialRectCenterArcTween(begin: begin, end: end);
      },
      child: child,
    );
  }
}

/// Hero wrapper for text that maintains Material context
class TextHero extends StatelessWidget {
  final String tag;
  final Widget child;
  final bool enabled;

  const TextHero({
    super.key,
    required this.tag,
    required this.child,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled) return child;
    
    return Hero(
      tag: tag,
      flightShuttleBuilder: materialHeroFlightShuttleBuilder,
      child: Material(
        color: Colors.transparent,
        child: child,
      ),
    );
  }
}

/// Hero wrapper for images with custom rect tween for smooth scaling
class ImageHero extends StatelessWidget {
  final String tag;
  final Widget child;
  final bool enabled;
  final BoxFit? placeholderFit;

  const ImageHero({
    super.key,
    required this.tag,
    required this.child,
    this.enabled = true,
    this.placeholderFit,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled) return child;
    
    return Hero(
      tag: tag,
      flightShuttleBuilder: (flightContext, animation, direction, fromHeroContext, toHeroContext) {
        final Hero toHero = toHeroContext.widget as Hero;
        return AnimatedBuilder(
          animation: animation,
          builder: (context, _) {
            return ClipRRect(
              borderRadius: BorderRadius.circular(
                Tween<double>(begin: 12, end: 0).evaluate(
                  CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
                ),
              ),
              child: toHero.child,
            );
          },
        );
      },
      child: child,
    );
  }
}
