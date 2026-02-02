import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
export 'package:provider/provider.dart' show ReadContext, WatchContext;
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/zone_team_member.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/utils/zone_validators.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/widgets/styled_empty_state.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';

/// Zone Management Page for organizers - uses Provider and Result pattern
class ZoneManagementPage extends StatefulWidget {
  final String eventId;
  final String eventName;

  const ZoneManagementPage({
    Key? key,
    required this.eventId,
    required this.eventName,
  }) : super(key: key);

  @override
  State<ZoneManagementPage> createState() => _ZoneManagementPageState();
}

class _ZoneManagementPageState extends State<ZoneManagementPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final service = context.read<ZoneStateService>();
    await Future.wait([
      service.loadAllSessions(widget.eventId),
      service.loadAllPolls(widget.eventId),
      service.loadAllAnnouncements(widget.eventId),
      service.loadAttendees(widget.eventId),
      service.loadTeamMembers(widget.eventId),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    // Granular loading state selector - only rebuilds when loading state changes
    return Selector<ZoneStateService, bool>(
      selector: (_, s) => s.isLoadingSessions || s.isLoadingPolls || s.isLoadingAnnouncements || s.isLoadingTeam,
      builder: (context, isLoading, _) {
        return Scaffold(
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          appBar: AppBar(
            backgroundColor: cs.surface,
            elevation: 0,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Zone Management',
                    style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                Text(widget.eventName,
                    style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded),
                onPressed: _loadData,
                tooltip: 'Refresh',
              ),
            ],
            // Tab counts with isolated Selector
            bottom: _TabBarWithCounts(tabController: _tabController),
          ),
          body: isLoading
              ? _buildLoadingState()
              : Column(
                  children: [
                    // Stats header with isolated Selector
                    const _StatsHeaderSelector(),
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _SessionsTabSelector(
                            eventId: widget.eventId,
                            onConfirmDelete: _confirmDeleteSession,
                          ),
                          _PollsTabSelector(
                            eventId: widget.eventId,
                            onConfirmDelete: _confirmDeletePoll,
                          ),
                          _AnnouncementsTabSelector(
                            eventId: widget.eventId,
                            onConfirmDelete: _confirmDeleteAnnouncement,
                          ),
                          _TeamTabSelector(
                            eventId: widget.eventId,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
          floatingActionButton: AnimatedBuilder(
            animation: _tabController,
            builder: (context, child) {
              // Hide FAB on Team tab (index 3)
              if (_tabController.index == 3) return const SizedBox.shrink();
              return FloatingActionButton.extended(
                onPressed: () => _showCreateSheet(context.read<ZoneStateService>()),
                icon: const Icon(Icons.add_rounded),
                label: Text(_getCreateLabel()),
                backgroundColor: cs.primary,
                foregroundColor: cs.onPrimary,
              );
            },
          ),
        );
      },
    );
  }

  // Old tab-building methods removed - now using Selector widgets (_StatsHeaderSelector, _SessionsTabSelector, etc.)

  Widget _buildLoadingState() => ListView(
        padding: const EdgeInsets.all(16),
        children: List.generate(4, (_) => const Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: ShimmerLoading(child: SizedBox(height: 100, width: double.infinity)),
        )),
      );

  // _buildEmptyState removed - now using _TabEmptyState widget

  String _getCreateLabel() => ['Add Session', 'Create Poll', 'New Update', ''][_tabController.index];

  void _showCreateSheet(ZoneStateService service) {
    // Team tab (index 3) has no create action
    if (_tabController.index == 3) return;
    
    HapticFeedback.lightImpact();
    switch (_tabController.index) {
      case 0: _showSessionSheet(service); break;
      case 1: _showPollSheet(service); break;
      case 2: _showAnnouncementSheet(service); break;
    }
  }

  void _showSessionSheet(ZoneStateService service) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _SessionFormSheet(
        onSave: (data) async {
          final result = await service.createSession(
            eventId: widget.eventId,
            title: data['title'],
            description: data['description'],
            speakerName: data['speakerName'],
            room: data['room'],
            startTime: data['startTime'],
            endTime: data['endTime'],
          );
          return result is Success;
        },
      ),
    );
  }

  void _showPollSheet(ZoneStateService service) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PollFormSheet(
        onSave: (data) async {
          final result = await service.createPoll(
            eventId: widget.eventId,
            question: data['question'],
            options: data['options'],
          );
          return result is Success;
        },
      ),
    );
  }

  void _showAnnouncementSheet(ZoneStateService service) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AnnouncementFormSheet(
        onSave: (data) async {
          final result = await service.createAnnouncement(
            eventId: widget.eventId,
            title: data['title'],
            content: data['content'],
            type: data['type'] ?? 'info',
            isPinned: data['isPinned'] ?? false,
          );
          return result is Success;
        },
      ),
    );
  }

  Future<void> _confirmDeleteSession(ZoneStateService service, EventSession session) async {
    final confirmed = await _showDeleteDialog('Delete Session?', 'Delete "${session.title}"?');
    if (confirmed == true) {
      await service.deleteSession(session.id, widget.eventId);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Session deleted')));
    }
  }

  Future<void> _confirmDeletePoll(ZoneStateService service, EventPoll poll) async {
    final confirmed = await _showDeleteDialog('Delete Poll?', 'All votes will be lost.');
    if (confirmed == true) {
      await service.deletePoll(poll.id, widget.eventId);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Poll deleted')));
    }
  }

  Future<void> _confirmDeleteAnnouncement(ZoneStateService service, EventAnnouncement ann) async {
    final confirmed = await _showDeleteDialog('Delete Announcement?', 'Delete "${ann.title}"?');
    if (confirmed == true) {
      await service.deleteAnnouncement(ann.id, widget.eventId);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Announcement deleted')));
    }
  }

  Future<bool?> _showDeleteDialog(String title, String content) => showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(title),
          content: Text(content),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
              child: const Text('Delete'),
            ),
          ],
        ),
      );
}

// ============ Granular Selector Widgets for Performance ============

/// Tab bar with isolated count selectors - only rebuilds when counts change
class _TabBarWithCounts extends StatelessWidget implements PreferredSizeWidget {
  final TabController tabController;
  const _TabBarWithCounts({required this.tabController});

  @override
  Size get preferredSize => const Size.fromHeight(48);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Selector<ZoneStateService, ({int sessions, int polls, int announcements, int team})>(
      selector: (_, s) => (
        sessions: s.allSessions.length,
        polls: s.allPolls.items.length,
        announcements: s.allAnnouncements.length,
        team: s.teamMemberCount,
      ),
      builder: (context, counts, _) => TabBar(
        controller: tabController,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        tabs: [
          Tab(icon: const Icon(Icons.event_note_rounded, size: 20),
              text: 'Sessions (${counts.sessions})'),
          Tab(icon: const Icon(Icons.poll_rounded, size: 20),
              text: 'Polls (${counts.polls})'),
          Tab(icon: const Icon(Icons.campaign_rounded, size: 20),
              text: 'Updates (${counts.announcements})'),
          Tab(icon: const Icon(Icons.people_rounded, size: 20),
              text: 'Team (${counts.team})'),
        ],
        labelColor: cs.primary,
        unselectedLabelColor: cs.onSurfaceVariant,
        indicatorColor: cs.primary,
        labelStyle: textTheme.labelSmall,
      ),
    );
  }
}

/// Stats header with isolated rebuild - only updates when stats change
class _StatsHeaderSelector extends StatelessWidget {
  const _StatsHeaderSelector();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Selector<ZoneStateService, ({int attendees, int sessions, int activePolls})>(
      selector: (_, s) => (
        attendees: s.attendeeCount,
        sessions: s.allSessions.length,
        activePolls: s.allPolls.items.where((p) => p.isActive).length,
      ),
      builder: (context, stats, _) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cs.primaryContainer.withOpacity(0.3),
          border: Border(bottom: BorderSide(color: cs.outlineVariant.withOpacity(0.2))),
        ),
        child: Row(
          children: [
            _StatChip(icon: Icons.people_rounded, value: '${stats.attendees}', label: 'Checked In', color: cs.primary),
            const SizedBox(width: 12),
            _StatChip(icon: Icons.event_note_rounded, value: '${stats.sessions}', label: 'Sessions', color: cs.tertiary),
            const SizedBox(width: 12),
            _StatChip(icon: Icons.poll_rounded, value: '${stats.activePolls}', label: 'Active Polls', color: cs.secondary),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _StatChip({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
            Text(label, style: TextStyle(fontSize: 10, color: color.withOpacity(0.8))),
          ],
        ),
      ),
    );
  }
}

/// Sessions tab with isolated data selector
class _SessionsTabSelector extends StatelessWidget {
  final String eventId;
  final Future<void> Function(ZoneStateService, EventSession) onConfirmDelete;

  const _SessionsTabSelector({
    required this.eventId,
    required this.onConfirmDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Selector<ZoneStateService, List<EventSession>>(
      selector: (_, s) => s.allSessions,
      builder: (context, sessions, _) {
        if (sessions.isEmpty) {
          return StyledEmptyState(
            icon: Icons.event_note_rounded,
            title: 'No Sessions Yet',
            subtitle: 'Create sessions for the Zone schedule.',
          );
        }
        final service = context.read<ZoneStateService>();
        return RefreshIndicator(
          onRefresh: () => service.loadAllSessions(eventId),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: sessions.length,
            itemBuilder: (context, index) => _SessionCard(
              session: sessions[index],
              onStatusChange: (status) async {
                await service.updateSession(
                  sessionId: sessions[index].id,
                  eventId: eventId,
                  status: status,
                );
              },
              onDelete: () => onConfirmDelete(service, sessions[index]),
            ),
          ),
        );
      },
    );
  }
}

/// Polls tab with isolated data selector
class _PollsTabSelector extends StatelessWidget {
  final String eventId;
  final Future<void> Function(ZoneStateService, EventPoll) onConfirmDelete;

  const _PollsTabSelector({
    required this.eventId,
    required this.onConfirmDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Selector<ZoneStateService, List<EventPoll>>(
      selector: (_, s) => s.allPolls.items,
      builder: (context, polls, _) {
        if (polls.isEmpty) {
          return StyledEmptyState(
            icon: Icons.poll_rounded,
            title: 'No Polls Yet',
            subtitle: 'Create polls to engage attendees.',
          );
        }
        final service = context.read<ZoneStateService>();
        return RefreshIndicator(
          onRefresh: () => service.loadAllPolls(eventId),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: polls.length,
            itemBuilder: (context, index) => _PollCard(
              poll: polls[index],
              onClose: () async {
                await service.closePoll(polls[index].id, eventId);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Poll closed')),
                  );
                }
              },
              onDelete: () => onConfirmDelete(service, polls[index]),
            ),
          ),
        );
      },
    );
  }
}

/// Announcements tab with isolated data selector
class _AnnouncementsTabSelector extends StatelessWidget {
  final String eventId;
  final Future<void> Function(ZoneStateService, EventAnnouncement) onConfirmDelete;

  const _AnnouncementsTabSelector({
    required this.eventId,
    required this.onConfirmDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Selector<ZoneStateService, List<EventAnnouncement>>(
      selector: (_, s) => s.allAnnouncements,
      builder: (context, announcements, _) {
        if (announcements.isEmpty) {
          return StyledEmptyState(
            icon: Icons.campaign_rounded,
            title: 'No Announcements Yet',
            subtitle: 'Create announcements for attendees.',
          );
        }
        final service = context.read<ZoneStateService>();
        return RefreshIndicator(
          onRefresh: () => service.loadAllAnnouncements(eventId),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: announcements.length,
            itemBuilder: (context, index) => _AnnouncementCard(
              announcement: announcements[index],
              onTogglePin: () async {
                await service.toggleAnnouncementPin(
                  announcements[index].id,
                  !announcements[index].isPinned,
                  eventId,
                );
              },
              onDelete: () => onConfirmDelete(service, announcements[index]),
            ),
          ),
        );
      },
    );
  }
}

/// Team tab with isolated data selector - read-only roster display
class _TeamTabSelector extends StatelessWidget {
  final String eventId;

  const _TeamTabSelector({required this.eventId});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Selector<ZoneStateService, List<ZoneTeamMember>>(
      selector: (_, s) => s.teamMembers,
      builder: (context, members, _) {
        if (members.isEmpty) {
          return StyledEmptyState(
            icon: Icons.people_outline_rounded,
            title: 'No Team Members',
            subtitle: 'Team members are managed in the Organizer Dashboard.',
          );
        }
        
        // Group members by workspace
        final grouped = <String, List<ZoneTeamMember>>{};
        for (final member in members) {
          grouped.putIfAbsent(member.workspaceName, () => []).add(member);
        }
        
        final service = context.read<ZoneStateService>();
        return RefreshIndicator(
          onRefresh: () => service.loadTeamMembers(eventId),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Info banner
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: cs.primaryContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: cs.primary.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: cs.primary, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Team management is available in the Organizer Dashboard',
                        style: TextStyle(color: cs.onSurface, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              // Grouped team members
              ...grouped.entries.map((entry) => _WorkspaceTeamSection(
                workspaceName: entry.key,
                members: entry.value,
              )),
            ],
          ),
        );
      },
    );
  }
}

/// Section for a workspace's team members
class _WorkspaceTeamSection extends StatelessWidget {
  final String workspaceName;
  final List<ZoneTeamMember> members;

  const _WorkspaceTeamSection({
    required this.workspaceName,
    required this.members,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Workspace header
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              Icon(Icons.folder_rounded, size: 18, color: cs.primary),
              const SizedBox(width: 8),
              Text(
                workspaceName,
                style: textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: cs.onSurface,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${members.length}',
                  style: textTheme.labelSmall?.copyWith(
                    color: cs.onPrimaryContainer,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
        // Member cards
        ...members.map((member) => _TeamMemberCard(member: member)),
        const SizedBox(height: 16),
      ],
    );
  }
}

/// Individual team member card
class _TeamMemberCard extends StatelessWidget {
  final ZoneTeamMember member;

  const _TeamMemberCard({required this.member});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: StyledAvatar(
          imageUrl: member.avatarUrl,
          name: member.displayName,
          size: 40,
        ),
        title: Text(
          member.displayName,
          style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        subtitle: member.joinedAt != null
            ? Text(
                'Joined ${_formatDate(member.joinedAt!)}',
                style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
              )
            : null,
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: _getRoleColor(member.role, cs).withOpacity(0.15),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _getRoleColor(member.role, cs).withOpacity(0.3)),
          ),
          child: Text(
            member.roleLabel,
            style: textTheme.labelSmall?.copyWith(
              color: _getRoleColor(member.role, cs),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Color _getRoleColor(String role, ColorScheme cs) {
    switch (role.toUpperCase()) {
      case 'OWNER':
        return cs.primary;
      case 'ADMIN':
        return cs.tertiary;
      case 'CONTENT_MANAGER':
        return cs.secondary;
      case 'VOLUNTEER':
        return cs.outline;
      default:
        return cs.onSurfaceVariant;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inDays == 0) return 'today';
    if (diff.inDays == 1) return 'yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}

// Simplified card widgets for brevity
class _SessionCard extends StatelessWidget {
  final EventSession session;
  final ValueChanged<String> onStatusChange;
  final VoidCallback onDelete;
  const _SessionCard({required this.session, required this.onStatusChange, required this.onDelete});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Text(session.title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${session.speakerName ?? "TBD"} • ${session.room ?? "TBD"}'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Chip(label: Text(session.status.toUpperCase()), visualDensity: VisualDensity.compact),
            IconButton(icon: Icon(Icons.delete, color: cs.error, size: 20), onPressed: onDelete),
          ],
        ),
      ),
    );
  }
}

class _PollCard extends StatelessWidget {
  final EventPoll poll;
  final VoidCallback onClose;
  final VoidCallback onDelete;
  const _PollCard({required this.poll, required this.onClose, required this.onDelete});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Text(poll.question, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${poll.totalVotes} votes • ${poll.isActive ? "Active" : "Closed"}'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (poll.isActive) TextButton(onPressed: onClose, child: const Text('Close')),
            IconButton(icon: Icon(Icons.delete, color: cs.error, size: 20), onPressed: onDelete),
          ],
        ),
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final EventAnnouncement announcement;
  final VoidCallback onTogglePin;
  final VoidCallback onDelete;
  const _AnnouncementCard({required this.announcement, required this.onTogglePin, required this.onDelete});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(announcement.typeIcon, color: cs.primary),
        title: Text(announcement.title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(announcement.content, maxLines: 2, overflow: TextOverflow.ellipsis),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(announcement.isPinned ? Icons.push_pin : Icons.push_pin_outlined,
                  color: announcement.isPinned ? cs.primary : cs.onSurfaceVariant, size: 20),
              onPressed: onTogglePin,
            ),
            IconButton(icon: Icon(Icons.delete, color: cs.error, size: 20), onPressed: onDelete),
          ],
        ),
      ),
    );
  }
}

// Form sheets with validation
class _SessionFormSheet extends StatefulWidget {
  final Future<bool> Function(Map<String, dynamic>) onSave;
  const _SessionFormSheet({required this.onSave});
  @override
  State<_SessionFormSheet> createState() => _SessionFormSheetState();
}

class _SessionFormSheetState extends State<_SessionFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _speakerCtrl = TextEditingController();
  final _roomCtrl = TextEditingController();
  DateTime _start = DateTime.now().add(const Duration(hours: 1));
  DateTime _end = DateTime.now().add(const Duration(hours: 2));
  bool _loading = false;
  String? _timeError;

  @override
  void dispose() { _titleCtrl.dispose(); _descCtrl.dispose(); _speakerCtrl.dispose(); _roomCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    _timeError = ZoneValidators.validateSessionTimes(_start, _end);
    setState(() {});
    if (!_formKey.currentState!.validate() || _timeError != null) return;
    setState(() => _loading = true);
    
    // Sanitize all inputs before saving
    final success = await widget.onSave({
      'title': ZoneValidators.sanitize(_titleCtrl.text),
      'description': _descCtrl.text.trim().isEmpty 
          ? null 
          : ZoneValidators.sanitize(_descCtrl.text),
      'speakerName': _speakerCtrl.text.trim().isEmpty 
          ? null 
          : ZoneValidators.sanitize(_speakerCtrl.text),
      'room': _roomCtrl.text.trim().isEmpty 
          ? null 
          : ZoneValidators.sanitize(_roomCtrl.text),
      'startTime': _start, 
      'endTime': _end,
    });
    if (mounted) { 
      setState(() => _loading = false); 
      if (success) Navigator.pop(context); 
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(color: cs.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(20))),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            const Text('Create Session', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            const SizedBox(height: 20),
            TextFormField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title *'), validator: ZoneValidators.validateSessionTitle),
            const SizedBox(height: 12),
            TextFormField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2, validator: ZoneValidators.validateSessionDescription),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: TextFormField(controller: _speakerCtrl, decoration: const InputDecoration(labelText: 'Speaker'), validator: ZoneValidators.validateSpeakerName)),
              const SizedBox(width: 12),
              Expanded(child: TextFormField(controller: _roomCtrl, decoration: const InputDecoration(labelText: 'Room'), validator: ZoneValidators.validateRoom)),
            ]),
            if (_timeError != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_timeError!, style: TextStyle(color: cs.error))),
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: FilledButton(onPressed: _loading ? null : _submit, child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create Session'))),
          ]),
        ),
      ),
    );
  }
}

class _PollFormSheet extends StatefulWidget {
  final Future<bool> Function(Map<String, dynamic>) onSave;
  const _PollFormSheet({required this.onSave});
  @override
  State<_PollFormSheet> createState() => _PollFormSheetState();
}

class _PollFormSheetState extends State<_PollFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _questionCtrl = TextEditingController();
  final List<TextEditingController> _optionCtrls = [TextEditingController(), TextEditingController()];
  bool _loading = false;
  String? _optionsError;

  @override
  void dispose() { _questionCtrl.dispose(); for (final c in _optionCtrls) c.dispose(); super.dispose(); }

  Future<void> _submit() async {
    final options = _optionCtrls
        .map((c) => ZoneValidators.sanitize(c.text))
        .where((t) => t.isNotEmpty)
        .toList();
    _optionsError = ZoneValidators.validatePollOptions(options);
    setState(() {});
    if (!_formKey.currentState!.validate() || _optionsError != null) return;
    setState(() => _loading = true);
    final success = await widget.onSave({
      'question': ZoneValidators.sanitize(_questionCtrl.text), 
      'options': options,
    });
    if (mounted) { 
      setState(() => _loading = false); 
      if (success) Navigator.pop(context); 
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(color: cs.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(20))),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            const Text('Create Poll', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            const SizedBox(height: 20),
            TextFormField(controller: _questionCtrl, decoration: const InputDecoration(labelText: 'Question *'), validator: ZoneValidators.validatePollQuestion),
            const SizedBox(height: 16),
            ...List.generate(_optionCtrls.length, (i) => Padding(padding: const EdgeInsets.only(bottom: 8), child: TextFormField(controller: _optionCtrls[i], decoration: InputDecoration(labelText: 'Option ${i + 1}')))),
            if (_optionsError != null) Text(_optionsError!, style: TextStyle(color: cs.error)),
            if (_optionCtrls.length < 6) TextButton.icon(onPressed: () => setState(() => _optionCtrls.add(TextEditingController())), icon: const Icon(Icons.add), label: const Text('Add Option')),
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: FilledButton(onPressed: _loading ? null : _submit, child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create Poll'))),
          ]),
        ),
      ),
    );
  }
}

class _AnnouncementFormSheet extends StatefulWidget {
  final Future<bool> Function(Map<String, dynamic>) onSave;
  const _AnnouncementFormSheet({required this.onSave});
  @override
  State<_AnnouncementFormSheet> createState() => _AnnouncementFormSheetState();
}

class _AnnouncementFormSheetState extends State<_AnnouncementFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  String _type = 'info';
  bool _isPinned = false;
  bool _loading = false;

  @override
  void dispose() { _titleCtrl.dispose(); _contentCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final success = await widget.onSave({
      'title': ZoneValidators.sanitize(_titleCtrl.text), 
      'content': ZoneValidators.sanitize(_contentCtrl.text), 
      'type': _type, 
      'isPinned': _isPinned,
    });
    if (mounted) { 
      setState(() => _loading = false); 
      if (success) Navigator.pop(context); 
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(color: cs.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(20))),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            const Text('New Announcement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            const SizedBox(height: 20),
            TextFormField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title *'), validator: ZoneValidators.validateAnnouncementTitle),
            const SizedBox(height: 12),
            TextFormField(controller: _contentCtrl, decoration: const InputDecoration(labelText: 'Content *'), maxLines: 3, validator: ZoneValidators.validateAnnouncementContent),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: const [
                DropdownMenuItem(value: 'info', child: Text('Info')),
                DropdownMenuItem(value: 'alert', child: Text('Alert')),
                DropdownMenuItem(value: 'update', child: Text('Update')),
              ],
              onChanged: (v) => setState(() => _type = v ?? 'info'),
            ),
            SwitchListTile(title: const Text('Pin Announcement'), value: _isPinned, onChanged: (v) => setState(() => _isPinned = v)),
            const SizedBox(height: 16),
            SizedBox(width: double.infinity, child: FilledButton(onPressed: _loading ? null : _submit, child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create Announcement'))),
          ]),
        ),
      ),
    );
  }
}
