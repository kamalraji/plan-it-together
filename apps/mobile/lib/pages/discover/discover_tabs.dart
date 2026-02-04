import 'package:flutter/material.dart';

/// Valid view options for the Discover page
enum DiscoverView {
  events,
  products,
}

extension DiscoverViewExtension on DiscoverView {
  String get displayName {
    switch (this) {
      case DiscoverView.events:
        return 'Events';
      case DiscoverView.products:
        return 'Products';
    }
  }

  IconData get icon {
    switch (this) {
      case DiscoverView.events:
        return Icons.event_outlined;
      case DiscoverView.products:
        return Icons.inventory_2_outlined;
    }
  }
  
  IconData get selectedIcon {
    switch (this) {
      case DiscoverView.events:
        return Icons.event;
      case DiscoverView.products:
        return Icons.inventory_2;
    }
  }

  String get queryValue {
    switch (this) {
      case DiscoverView.events:
        return 'events';
      case DiscoverView.products:
        return 'products';
    }
  }

  static DiscoverView fromString(String? value) {
    if (value == null || value.isEmpty) return DiscoverView.events;
    switch (value.toLowerCase()) {
      case 'products':
        return DiscoverView.products;
      default:
        return DiscoverView.events;
    }
  }
}

/// Segmented tab selector for Discover page views
/// Follows Material 3 segmented button pattern with proper accessibility
class DiscoverTabSelector extends StatelessWidget {
  const DiscoverTabSelector({
    super.key,
    required this.currentView,
    required this.onViewChanged,
    this.compact = false,
  });
  
  final DiscoverView currentView;
  final ValueChanged<DiscoverView> onViewChanged;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Container(
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: DiscoverView.values.map((view) {
          final isSelected = view == currentView;
          return _TabButton(
            view: view,
            isSelected: isSelected,
            compact: compact,
            onTap: () => onViewChanged(view),
          );
        }).toList(),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.view,
    required this.isSelected,
    required this.compact,
    required this.onTap,
  });
  
  final DiscoverView view;
  final bool isSelected;
  final bool compact;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Semantics(
      selected: isSelected,
      button: true,
      label: '${view.displayName} tab',
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 12 : 16,
            vertical: compact ? 8 : 10,
          ),
          decoration: BoxDecoration(
            color: isSelected ? cs.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isSelected ? view.selectedIcon : view.icon,
                size: compact ? 16 : 18,
                color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
              ),
              SizedBox(width: compact ? 6 : 8),
              Text(
                view.displayName,
                style: TextStyle(
                  fontSize: compact ? 12 : 13,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected ? cs.onPrimary : cs.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
