import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/space.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/pages/impact/live_now_indicator.dart';
import 'package:thittam1hub/supabase/space_service.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/enhanced_empty_state.dart';

class SpacesPage extends StatefulWidget {
  const SpacesPage({Key? key}) : super(key: key);

  @override
  State<SpacesPage> createState() => _SpacesPageState();
}

class _SpacesPageState extends State<SpacesPage> {
  final SpaceService _spaceService = SpaceService.instance;
  List<Space> _spaces = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSpaces();
  }

  Future<void> _loadSpaces() async {
    if (!_isLoading) {
      setState(() => _isLoading = true);
    }

    final result = await _spaceService.getLiveSpaces();

    if (!mounted) return;
    switch (result) {
      case Success(data: final spaces):
        setState(() {
          _spaces = spaces;
          _isLoading = false;
          _error = null;
        });
      case Failure(message: final msg):
        setState(() {
          _error = msg;
          _isLoading = false;
        });
    }
  }

  void _navigateToSpace(Space space) {
    context.go(AppRoutes.spaceDetail(space.id), extra: space);
  }

  Future<void> _showCreateSpaceDialog() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => const CreateSpaceDialog(),
    );

    if (result != null) {
      final createResult = await _spaceService.createSpace(
        result['topic'] as String,
        (result['tags'] as List).cast<String>(),
      );

      if (!mounted) return;
      switch (createResult) {
        case Success(data: final space) when space != null:
          _navigateToSpace(space);
        case Success():
          // No space returned
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to create space')),
          );
        case Failure(message: final msg):
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(msg)),
          );
      }
    }
  }

  Widget _buildErrorState() {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: cs.error),
          const SizedBox(height: 16),
          Text('Something went wrong', style: textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(_error ?? 'Unknown error', style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadSpaces,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return EnhancedEmptyState(
      icon: EmptyStateConfig.spaces.icon,
      title: EmptyStateConfig.spaces.title,
      subtitle: EmptyStateConfig.spaces.subtitle,
      primaryButtonLabel: EmptyStateConfig.spaces.buttonLabel,
      primaryButtonIcon: EmptyStateConfig.spaces.buttonIcon,
      onPrimaryAction: () {
        HapticFeedback.lightImpact();
        _showCreateSpaceDialog();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: cs.surface,
        elevation: 0,
        title: LiveNowIndicator(
          liveCount: _spaces.length,
          onTap: () { /* TODO: Scroll to live spaces */ },
        ),
        actions: [
          TextButton.icon(
            onPressed: _showCreateSpaceDialog,
            icon: const Icon(Icons.add_circle_outline),
            label: const Text('Create Space'),
            style: TextButton.styleFrom(foregroundColor: cs.primary),
          ),
        ],
      ),
      body: SafeArea(
        child: BrandedRefreshIndicator(
          onRefresh: _loadSpaces,
          child: _isLoading
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom + 16),
                  children: List.generate(4, (_) => const SpaceCardSkeleton()),
                )
              : _error != null
                  ? SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: MediaQuery.of(context).size.height * 0.7,
                        child: _buildErrorState(),
                      ),
                    )
                  : _spaces.isEmpty
                      ? SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          child: SizedBox(
                            height: MediaQuery.of(context).size.height * 0.7,
                            child: _buildEmptyState(),
                          ),
                        )
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: EdgeInsets.only(bottom: context.bottomContentPadding),
                          itemCount: _spaces.length,
                          itemBuilder: (context, index) {
                            final space = _spaces[index];
                            return FadeSlideTransition(
                              delay: staggerDelay(index),
                              child: SpaceCard(
                                space: space,
                                onTap: () => _navigateToSpace(space),
                              ),
                            );
                          },
                        ),
        ),
      ),
    );
  }
}

class CreateSpaceDialog extends StatefulWidget {
  const CreateSpaceDialog({Key? key}) : super(key: key);

  @override
  State<CreateSpaceDialog> createState() => _CreateSpaceDialogState();
}

class _CreateSpaceDialogState extends State<CreateSpaceDialog> {
  final _formKey = GlobalKey<FormState>();
  String _topic = '';
  String _tags = '';

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Create a Space'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              decoration: const InputDecoration(labelText: 'Topic'),
              validator: (value) => value!.isEmpty ? 'Please enter a topic' : null,
              onSaved: (value) => _topic = value!,
            ),
            TextFormField(
              decoration: const InputDecoration(labelText: 'Tags (comma-separated)'),
              onSaved: (value) => _tags = value!,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              _formKey.currentState!.save();
              Navigator.of(context).pop({
                'topic': _topic,
                'tags': _tags.split(',').map((e) => e.trim()).toList(),
              });
            }
          },
          child: const Text('Create'),
        ),
      ],
    );
  }
}

class SpaceCard extends StatelessWidget {
  final Space space;
  final VoidCallback onTap;

  const SpaceCard({Key? key, required this.space, required this.onTap}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                space.topic,
                style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: space.tags.map((tag) => Chip(label: Text(tag))).toList(),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  // Placeholder for speaker avatars
                  Row(
                    children: const [
                      CircleAvatar(radius: 15), 
                      SizedBox(width: -8),
                      CircleAvatar(radius: 15),
                      SizedBox(width: -8),
                      CircleAvatar(radius: 15),
                    ],
                  ),
                  const SizedBox(width: 12),
                  // Placeholder for speaker count
                  Text('15 speakers', style: textTheme.bodySmall),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: () {},
                    child: const Text('Join'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: cs.primary,
                      foregroundColor: cs.onPrimary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
