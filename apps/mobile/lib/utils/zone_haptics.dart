import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Industrial-grade haptic feedback patterns for Zone interactions.
/// Provides consistent tactile feedback across all engagement actions.
class ZoneHaptics {
  ZoneHaptics._();

  // ============= BASIC PATTERNS =============

  /// Light tap feedback - for selections, toggles.
  static void selectionClick() {
    HapticFeedback.selectionClick();
  }

  /// Light impact - for bookmarks, minor actions.
  static void lightImpact() {
    HapticFeedback.lightImpact();
  }

  /// Medium impact - for submissions, confirmations.
  static void mediumImpact() {
    HapticFeedback.mediumImpact();
  }

  /// Heavy impact - for major achievements, errors.
  static void heavyImpact() {
    HapticFeedback.heavyImpact();
  }

  // ============= ZONE-SPECIFIC PATTERNS =============

  /// Poll vote feedback - crisp selection click.
  static void pollVote() {
    selectionClick();
  }

  /// Bookmark session - light confirmation.
  static void bookmarkSession() {
    lightImpact();
  }

  /// Submit question - medium confirmation.
  static void submitQuestion() {
    mediumImpact();
  }

  /// Upvote action - light tap.
  static void upvote() {
    selectionClick();
  }

  /// Check-in success - strong confirmation.
  static void checkIn() {
    heavyImpact();
  }

  /// Earn points - celebratory double tap.
  static Future<void> earnPoints() async {
    heavyImpact();
    await Future.delayed(const Duration(milliseconds: 100));
    lightImpact();
  }

  /// Badge unlock - triumphant pattern.
  static Future<void> unlockBadge() async {
    heavyImpact();
    await Future.delayed(const Duration(milliseconds: 80));
    mediumImpact();
    await Future.delayed(const Duration(milliseconds: 80));
    heavyImpact();
  }

  /// Challenge complete - success burst.
  static Future<void> challengeComplete() async {
    mediumImpact();
    await Future.delayed(const Duration(milliseconds: 120));
    heavyImpact();
  }

  /// Leaderboard rank up - ascending pattern.
  static Future<void> rankUp() async {
    lightImpact();
    await Future.delayed(const Duration(milliseconds: 60));
    mediumImpact();
    await Future.delayed(const Duration(milliseconds: 60));
    heavyImpact();
  }

  /// Error feedback - sharp double tap.
  static Future<void> error() async {
    heavyImpact();
    await Future.delayed(const Duration(milliseconds: 50));
    heavyImpact();
  }

  /// Refresh complete - subtle confirmation.
  static void refreshComplete() {
    lightImpact();
  }
}
