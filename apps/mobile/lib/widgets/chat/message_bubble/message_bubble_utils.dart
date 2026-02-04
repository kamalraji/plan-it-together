import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Shared utilities for message bubble components
class MessageBubbleUtils {
  MessageBubbleUtils._();

  /// Generate consistent name color based on hash
  static Color nameColor(String name) {
    final hash = name.codeUnits.fold(0, (p, c) => p + c);
    final colors = [
      AppColors.indigo500,
      AppColors.teal500,
      AppColors.pink500,
      AppColors.violet500,
      AppColors.emerald500,
      AppColors.rose500,
      AppColors.fuchsia500,
      AppColors.amber500,
    ];
    return colors[hash % colors.length];
  }

  /// Format time for message status row
  static String formatTime(DateTime dt) {
    final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final m = dt.minute.toString().padLeft(2, '0');
    final am = dt.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $am';
  }
}
