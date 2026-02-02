import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// A list that animates its children with staggered entry animations
/// Used for settings categories and deep search results
class StaggeredSettingsList extends StatefulWidget {
  final List<Widget> children;
  final Duration staggerDuration;
  final Duration itemDuration;
  final Curve curve;
  final EdgeInsetsGeometry? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;

  const StaggeredSettingsList({
    super.key,
    required this.children,
    this.staggerDuration = const Duration(milliseconds: 50),
    this.itemDuration = const Duration(milliseconds: 300),
    this.curve = Curves.easeOutCubic,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
  });

  @override
  State<StaggeredSettingsList> createState() => _StaggeredSettingsListState();
}

class _StaggeredSettingsListState extends State<StaggeredSettingsList>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _fadeAnimations;
  late List<Animation<Offset>> _slideAnimations;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _startAnimations();
  }

  void _initAnimations() {
    _controllers = List.generate(
      widget.children.length,
      (index) => AnimationController(
        duration: widget.itemDuration,
        vsync: this,
      ),
    );

    _fadeAnimations = _controllers.map((controller) {
      return Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: controller, curve: widget.curve),
      );
    }).toList();

    _slideAnimations = _controllers.map((controller) {
      return Tween<Offset>(
        begin: const Offset(0, 0.1),
        end: Offset.zero,
      ).animate(CurvedAnimation(parent: controller, curve: widget.curve));
    }).toList();
  }

  Future<void> _startAnimations() async {
    for (var i = 0; i < _controllers.length; i++) {
      await Future.delayed(widget.staggerDuration);
      if (mounted && i < _controllers.length) {
        _controllers[i].forward();
      }
    }
  }

  @override
  void didUpdateWidget(StaggeredSettingsList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.children.length != oldWidget.children.length) {
      _disposeControllers();
      _initAnimations();
      _startAnimations();
    }
  }

  void _disposeControllers() {
    for (final controller in _controllers) {
      controller.dispose();
    }
  }

  @override
  void dispose() {
    _disposeControllers();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.shrinkWrap) {
      return ListView(
        shrinkWrap: true,
        physics: widget.physics ?? const NeverScrollableScrollPhysics(),
        padding: widget.padding,
        children: _buildChildren(),
      );
    }

    return ListView.builder(
      padding: widget.padding,
      physics: widget.physics,
      itemCount: widget.children.length,
      itemBuilder: (context, index) {
        if (index >= _fadeAnimations.length) {
          return widget.children[index];
        }
        return FadeTransition(
          opacity: _fadeAnimations[index],
          child: SlideTransition(
            position: _slideAnimations[index],
            child: widget.children[index],
          ),
        );
      },
    );
  }

  List<Widget> _buildChildren() {
    return List.generate(widget.children.length, (index) {
      if (index >= _fadeAnimations.length) {
        return widget.children[index];
      }
      return FadeTransition(
        opacity: _fadeAnimations[index],
        child: SlideTransition(
          position: _slideAnimations[index],
          child: widget.children[index],
        ),
      );
    });
  }
}

/// Individual animated settings tile for deep search results
class AnimatedSettingsTile extends StatefulWidget {
  final String categoryTitle;
  final String label;
  final String? description;
  final IconData icon;
  final Color? iconColor;
  final VoidCallback onTap;
  final String highlightQuery;
  final Widget? trailing;

  const AnimatedSettingsTile({
    super.key,
    required this.categoryTitle,
    required this.label,
    this.description,
    required this.icon,
    this.iconColor,
    required this.onTap,
    this.highlightQuery = '',
    this.trailing,
  });

  @override
  State<AnimatedSettingsTile> createState() => _AnimatedSettingsTileState();
}

class _AnimatedSettingsTileState extends State<AnimatedSettingsTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _tapController;

  @override
  void initState() {
    super.initState();
    _tapController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _tapController.dispose();
    super.dispose();
  }

  void _onTap() {
    HapticFeedback.lightImpact();
    _tapController.forward().then((_) {
      _tapController.reverse();
      widget.onTap();
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AnimatedBuilder(
      animation: _tapController,
      builder: (context, child) {
        final scale = 1.0 - (_tapController.value * 0.02);
        return Transform.scale(scale: scale, child: child);
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: InkWell(
          onTap: _onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: (widget.iconColor ?? cs.primary).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Icon(
                    widget.icon,
                    size: 20,
                    color: widget.iconColor ?? cs.primary,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Breadcrumb path
                      Text(
                        widget.categoryTitle,
                        style: context.textStyles.labelSmall?.withColor(
                          cs.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 2),
                      // Setting label with highlight
                      _buildHighlightedText(
                        widget.label,
                        widget.highlightQuery,
                        context.textStyles.bodyMedium?.semiBold,
                        cs.primary,
                      ),
                      if (widget.description != null) ...[
                        const SizedBox(height: 2),
                        _buildHighlightedText(
                          widget.description!,
                          widget.highlightQuery,
                          context.textStyles.bodySmall?.withColor(
                            cs.onSurfaceVariant,
                          ),
                          cs.primary,
                        ),
                      ],
                    ],
                  ),
                ),
                if (widget.trailing != null)
                  widget.trailing!
                else
                  Icon(
                    Icons.chevron_right,
                    size: 20,
                    color: cs.onSurfaceVariant.withOpacity(0.5),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHighlightedText(
    String text,
    String query,
    TextStyle? baseStyle,
    Color highlightColor,
  ) {
    if (query.isEmpty) {
      return Text(text, style: baseStyle);
    }

    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();
    final index = lowerText.indexOf(lowerQuery);

    if (index == -1) {
      return Text(text, style: baseStyle);
    }

    return RichText(
      text: TextSpan(
        style: baseStyle,
        children: [
          TextSpan(text: text.substring(0, index)),
          TextSpan(
            text: text.substring(index, index + query.length),
            style: baseStyle?.copyWith(
              backgroundColor: highlightColor.withOpacity(0.2),
              fontWeight: FontWeight.bold,
            ),
          ),
          TextSpan(text: text.substring(index + query.length)),
        ],
      ),
    );
  }
}

/// Settings type indicator badge
class SettingTypeBadge extends StatelessWidget {
  final String type;
  
  const SettingTypeBadge({super.key, required this.type});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    IconData icon;
    Color color;
    
    switch (type) {
      case 'toggle':
        icon = Icons.toggle_on_outlined;
        color = cs.primary;
        break;
      case 'action':
        icon = Icons.touch_app_outlined;
        color = cs.tertiary;
        break;
      case 'picker':
        icon = Icons.list_alt;
        color = cs.secondary;
        break;
      default:
        icon = Icons.info_outline;
        color = cs.onSurfaceVariant;
    }

    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.xs),
      ),
      child: Icon(icon, size: 14, color: color),
    );
  }
}
