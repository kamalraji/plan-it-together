import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import '../../models/hackathon_models.dart';
import '../../supabase/hackathon_service.dart';
import '../../theme.dart';
import '../styled_card.dart';
import '../styled_chip.dart';
import '../styled_button.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Hackathon-specific Zone card with team finder, submission tracker, and mentor booking
class HackathonZoneCard extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'HackathonZoneCard';

  final String eventId;
  final VoidCallback? onTeamUpdated;

  const HackathonZoneCard({
    super.key,
    required this.eventId,
    this.onTeamUpdated,
  });

  @override
  State<HackathonZoneCard> createState() => _HackathonZoneCardState();
}

class _HackathonZoneCardState extends State<HackathonZoneCard> {
  static const String _tag = 'HackathonZoneCard';
  static final _log = LoggingService.instance;
  
  final HackathonService _service = HackathonService.instance;

  bool _isLoading = true;
  HackathonTeam? _userTeam;
  List<HackathonTeam> _teamsLookingForMembers = [];
  List<MentorSlot> _availableSlots = [];
  HackathonSubmission? _submission;
  HackathonDeadline? _nextDeadline;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _service.getUserTeam(widget.eventId),
        _service.getTeamsLookingForMembers(widget.eventId),
        _service.getAvailableMentorSlots(widget.eventId),
        _service.getNextDeadline(widget.eventId),
      ]);

      _userTeam = results[0] as HackathonTeam?;
      _teamsLookingForMembers = results[1] as List<HackathonTeam>;
      _availableSlots = results[2] as List<MentorSlot>;
      _nextDeadline = results[3] as HackathonDeadline?;

      // Load submission if user has a team
      if (_userTeam != null) {
        final submissionResult = await _service.getTeamSubmission(widget.eventId, _userTeam!.id);
        _submission = submissionResult.isSuccess ? submissionResult.data : null;
      }
    } catch (e) {
      _log.error('Error loading hackathon data: $e', tag: _tag);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading) {
      return const StyledCard(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Deadline Alert
        if (_nextDeadline != null) _buildDeadlineAlert(cs),

        const SizedBox(height: 16),

        // Team Status / Finder
        _buildTeamSection(cs),

        const SizedBox(height: 16),

        // Submission Tracker (if has team)
        if (_userTeam != null) _buildSubmissionTracker(cs),

        if (_userTeam != null) const SizedBox(height: 16),

        // Mentor Slots
        _buildMentorSection(cs),
      ],
    );
  }

  Widget _buildDeadlineAlert(ColorScheme cs) {
    final deadline = _nextDeadline!;
    final isUrgent = deadline.timeRemaining.inHours < 2;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isUrgent
              ? [cs.error.withOpacity(0.15), cs.errorContainer.withOpacity(0.1)]
              : [
                  cs.tertiary.withOpacity(0.15),
                  cs.tertiaryContainer.withOpacity(0.1)
                ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isUrgent
              ? cs.error.withOpacity(0.3)
              : cs.tertiary.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (isUrgent ? cs.error : cs.tertiary).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isUrgent ? Icons.warning_rounded : Icons.timer_outlined,
              color: isUrgent ? cs.error : cs.tertiary,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  deadline.name,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: cs.onSurface,
                  ),
                ),
                Text(
                  deadline.formattedTimeRemaining,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: isUrgent ? cs.error : cs.tertiary,
                  ),
                ),
              ],
            ),
          ),
          if (deadline.deadlineType == 'final_submission' && _userTeam != null)
            StyledButton(
              onPressed: () {
                // Navigate to submission
              },
              label: 'Submit',
              icon: Icons.upload_rounded,
              variant: isUrgent ? StyledButtonVariant.danger : StyledButtonVariant.primary,
              size: ButtonSize.small,
            ),
        ],
      ),
    );
  }

  Widget _buildTeamSection(ColorScheme cs) {
    if (_userTeam != null) {
      return _buildMyTeamCard(cs);
    }
    return _buildTeamFinder(cs);
  }

  Widget _buildMyTeamCard(ColorScheme cs) {
    final team = _userTeam!;

    return StyledCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.groups_rounded, color: cs.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      team.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '${team.memberCount}/${team.maxMembers} members',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                    ),
                  ],
                ),
              ),
              // Team Chat Button
              IconButton(
                onPressed: () => _openTeamChat(),
                tooltip: 'Team Chat',
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: cs.secondary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.chat_bubble_outline_rounded,
                    color: cs.secondary,
                    size: 20,
                  ),
                ),
              ),
              IconButton(
                onPressed: () {
                  // Navigate to team details
                },
                icon: const Icon(Icons.arrow_forward_ios_rounded, size: 18),
              ),
            ],
          ),
          if (team.techStack.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: team.techStack
                  .take(4)
                  .map((tech) => StyledChip(
                        label: tech,
                        size: ChipSize.small,
                        variant: ChipVariant.secondary,
                      ))
                  .toList(),
            ),
          ],
          if (team.isLookingForMembers && team.hasSpace) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: cs.tertiary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.person_add_rounded, size: 16, color: cs.tertiary),
                  const SizedBox(width: 6),
                  Text(
                    'Looking for ${team.spotsLeft} more',
                    style: TextStyle(
                      color: cs.tertiary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// Opens the team chat - creates chat group if needed (for legacy teams)
  Future<void> _openTeamChat() async {
    if (_userTeam == null) return;

    try {
      String? chatGroupId = _userTeam!.chatGroupId;
      
      // For legacy teams without chat groups, create one
      if (chatGroupId == null) {
        final result = await _service.getOrCreateTeamChatGroup(_userTeam!.id);
        chatGroupId = result.isSuccess ? result.data : null;
        // Reload data to get updated team with chat_group_id
        _loadData();
      }

      if (mounted && chatGroupId != null) {
        context.push(AppRoutes.chatGroup(chatGroupId));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to open team chat: $e')),
        );
      }
    }
  }

  Widget _buildTeamFinder(ColorScheme cs) {
    return StyledCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.tertiary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.group_add_rounded, color: cs.tertiary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Find a Team',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '${_teamsLookingForMembers.length} teams looking for members',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                    ),
                  ],
                ),
              ),
              StyledButton(
                onPressed: () {
                  // Show create team dialog
                  _showCreateTeamDialog();
                },
                label: 'Create',
                icon: Icons.add_rounded,
                variant: StyledButtonVariant.outlined,
                size: ButtonSize.small,
              ),
            ],
          ),
          if (_teamsLookingForMembers.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            ...(_teamsLookingForMembers.take(3).map((team) => _buildTeamTile(team, cs))),
            if (_teamsLookingForMembers.length > 3) ...[
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: () {
                    // Show all teams
                  },
                  child: Text(
                    'View all ${_teamsLookingForMembers.length} teams',
                    style: TextStyle(color: cs.primary),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildTeamTile(HackathonTeam team, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: cs.primaryContainer,
            radius: 20,
            child: Text(
              team.name.substring(0, 1).toUpperCase(),
              style: TextStyle(
                color: cs.onPrimaryContainer,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  team.name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (team.lookingForRoles.isNotEmpty)
                  Text(
                    'Looking for: ${team.lookingForRoles.take(2).join(", ")}',
                    style: TextStyle(
                      color: cs.onSurfaceVariant,
                      fontSize: 12,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          StyledButton(
            onPressed: () async {
              await _service.joinTeam(team.id);
              _loadData();
              widget.onTeamUpdated?.call();
            },
            label: 'Join',
            size: ButtonSize.small,
            variant: StyledButtonVariant.secondary,
          ),
        ],
      ),
    );
  }

  Widget _buildSubmissionTracker(ColorScheme cs) {
    final progress = _submission?.completionPercentage ?? 0.0;
    final isSubmitted = _submission?.isSubmitted ?? false;

    return StyledCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isSubmitted
                      ? Colors.green.withOpacity(0.15)
                      : cs.secondary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isSubmitted
                      ? Icons.check_circle_rounded
                      : Icons.upload_file_rounded,
                  color: isSubmitted ? Colors.green : cs.secondary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isSubmitted ? 'Submitted!' : 'Submission',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      isSubmitted
                          ? _submission!.projectName
                          : '${(progress * 100).toInt()}% complete',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                    ),
                  ],
                ),
              ),
              StyledButton(
                onPressed: () {
                  // Navigate to submission editor
                },
                label: isSubmitted ? 'View' : 'Edit',
                icon: isSubmitted ? Icons.visibility : Icons.edit,
                variant: StyledButtonVariant.outlined,
                size: ButtonSize.small,
              ),
            ],
          ),
          if (!isSubmitted) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 8,
                backgroundColor: cs.surfaceContainerHighest,
                valueColor: AlwaysStoppedAnimation(
                  progress < 0.5
                      ? cs.error
                      : progress < 1.0
                          ? cs.tertiary
                          : Colors.green,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildChecklistItem(
                  'Project Name',
                  _submission?.projectName.isNotEmpty ?? false,
                  cs,
                ),
                _buildChecklistItem(
                  'Description',
                  _submission?.description?.isNotEmpty ?? false,
                  cs,
                ),
                _buildChecklistItem(
                  'Demo/Repo',
                  (_submission?.demoUrl?.isNotEmpty ?? false) ||
                      (_submission?.repoUrl?.isNotEmpty ?? false),
                  cs,
                ),
                _buildChecklistItem(
                  'Tech Stack',
                  _submission?.techStack.isNotEmpty ?? false,
                  cs,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildChecklistItem(String label, bool isComplete, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isComplete
            ? Colors.green.withOpacity(0.15)
            : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isComplete ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 16,
            color: isComplete ? Colors.green : cs.onSurfaceVariant,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isComplete ? Colors.green : cs.onSurfaceVariant,
              fontWeight: isComplete ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMentorSection(ColorScheme cs) {
    return StyledCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.support_agent_rounded, color: Colors.orange),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Mentor Sessions',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '${_availableSlots.length} slots available',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                    ),
                  ],
                ),
              ),
              if (_userTeam != null)
                StyledButton(
                  onPressed: () {
                    // Show mentor booking sheet
                    _showMentorBookingSheet();
                  },
                  label: 'Book',
                  icon: Icons.calendar_month_rounded,
                  variant: StyledButtonVariant.secondary,
                  size: ButtonSize.small,
                ),
            ],
          ),
          if (_availableSlots.isNotEmpty) ...[
            const SizedBox(height: 16),
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _availableSlots.take(5).length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final slot = _availableSlots[index];
                  return _buildMentorSlotCard(slot, cs);
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMentorSlotCard(MentorSlot slot, ColorScheme cs) {
    final timeFormat = '${slot.slotStart.hour}:${slot.slotStart.minute.toString().padLeft(2, '0')}';

    return Container(
      width: 140,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: Colors.orange.withOpacity(0.2),
                backgroundImage: slot.mentorAvatar != null
                    ? NetworkImage(slot.mentorAvatar!)
                    : null,
                child: slot.mentorAvatar == null
                    ? Text(
                        slot.mentorName.substring(0, 1),
                        style: const TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),
              const Spacer(),
              if (slot.isVirtual)
                Icon(Icons.videocam_rounded, size: 16, color: cs.primary),
            ],
          ),
          const Spacer(),
          Text(
            slot.mentorName,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            timeFormat,
            style: TextStyle(
              color: cs.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateTeamDialog() {
    showDialog(
      context: context,
      builder: (context) => _CreateTeamDialog(
        eventId: widget.eventId,
        service: _service,
        onCreated: () {
          _loadData();
          widget.onTeamUpdated?.call();
        },
      ),
    );
  }

  void _showMentorBookingSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _MentorBookingSheet(
        slots: _availableSlots,
        teamId: _userTeam!.id,
        service: _service,
        onBooked: _loadData,
      ),
    );
  }
}

// ==================== DIALOGS ====================

class _CreateTeamDialog extends StatefulWidget {
  final String eventId;
  final HackathonService service;
  final VoidCallback onCreated;

  const _CreateTeamDialog({
    required this.eventId,
    required this.service,
    required this.onCreated,
  });

  @override
  State<_CreateTeamDialog> createState() => _CreateTeamDialogState();
}

class _CreateTeamDialogState extends State<_CreateTeamDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _ideaController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _ideaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AlertDialog(
      title: const Text('Create Team'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Team Name',
                  hintText: 'Enter a creative team name',
                ),
                validator: (v) =>
                    v?.isEmpty == true ? 'Team name required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  hintText: 'Brief team description',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _ideaController,
                decoration: const InputDecoration(
                  labelText: 'Project Idea',
                  hintText: 'What are you building?',
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _isLoading ? null : _createTeam,
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Create'),
        ),
      ],
    );
  }

  Future<void> _createTeam() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await widget.service.createTeam(
        eventId: widget.eventId,
        name: _nameController.text,
        description: _descriptionController.text,
        projectIdea: _ideaController.text,
      );
      if (mounted) {
        Navigator.pop(context);
        widget.onCreated();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
    if (mounted) setState(() => _isLoading = false);
  }
}

class _MentorBookingSheet extends StatelessWidget {
  final List<MentorSlot> slots;
  final String teamId;
  final HackathonService service;
  final VoidCallback onBooked;

  const _MentorBookingSheet({
    required this.slots,
    required this.teamId,
    required this.service,
    required this.onBooked,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.outline.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.support_agent_rounded, color: cs.primary),
                const SizedBox(width: 12),
                const Text(
                  'Book Mentor Session',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.all(16),
              itemCount: slots.length,
              itemBuilder: (context, index) {
                final slot = slots[index];
                return _buildSlotTile(context, slot, cs);
              },
            ),
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
        ],
      ),
    );
  }

  Widget _buildSlotTile(BuildContext context, MentorSlot slot, ColorScheme cs) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.orange.withOpacity(0.2),
          backgroundImage:
              slot.mentorAvatar != null ? NetworkImage(slot.mentorAvatar!) : null,
          child: slot.mentorAvatar == null
              ? Text(
                  slot.mentorName.substring(0, 1),
                  style: const TextStyle(color: Colors.orange),
                )
              : null,
        ),
        title: Text(slot.mentorName),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${slot.slotStart.hour}:${slot.slotStart.minute.toString().padLeft(2, '0')} - ${slot.slotEnd.hour}:${slot.slotEnd.minute.toString().padLeft(2, '0')}',
            ),
            if (slot.expertise.isNotEmpty)
              Text(
                slot.expertise.take(2).join(', '),
                style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12),
              ),
          ],
        ),
        trailing: FilledButton.tonal(
          onPressed: () async {
            await service.bookMentorSlot(slot.id, teamId);
            Navigator.pop(context);
            onBooked();
          },
          child: const Text('Book'),
        ),
      ),
    );
  }
}
