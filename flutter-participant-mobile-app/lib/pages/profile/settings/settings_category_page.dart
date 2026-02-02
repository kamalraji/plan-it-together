import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Base scaffold for all settings category pages
class SettingsCategoryPage extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  const SettingsCategoryPage({
    super.key,
    required this.title,
    required this.children,
    this.actions,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: actions,
      ),
      body: ListView(
        padding: EdgeInsets.symmetric(
          horizontal: context.horizontalPadding,
          vertical: AppSpacing.md,
        ),
        children: children,
      ),
      floatingActionButton: floatingActionButton,
    );
  }
}
