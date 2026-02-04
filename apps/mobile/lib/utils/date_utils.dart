import 'package:flutter/material.dart';

/// Returns a time-based greeting
String getGreeting() {
  final hour = DateTime.now().hour;
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/// Returns the greeting icon based on time of day
IconData getGreetingIcon() {
  final hour = DateTime.now().hour;
  if (hour < 6) return Icons.bedtime_rounded;
  if (hour < 12) return Icons.wb_sunny_rounded;
  if (hour < 17) return Icons.wb_cloudy_rounded;
  if (hour < 21) return Icons.nights_stay_rounded;
  return Icons.auto_awesome_rounded;
}

/// Returns the greeting icon color based on time of day
Color getGreetingIconColor() {
  final hour = DateTime.now().hour;
  if (hour < 6) return Colors.indigo;
  if (hour < 12) return Colors.orange;
  if (hour < 17) return Colors.amber;
  if (hour < 21) return Colors.deepPurple;
  return Colors.purple;
}
