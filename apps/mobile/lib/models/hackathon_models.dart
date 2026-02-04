/// Hackathon-specific models for Zone features

class HackathonTeam {
  final String id;
  final String eventId;
  final String name;
  final String? description;
  final String? projectIdea;
  final List<String> techStack;
  final List<String> lookingForRoles;
  final bool isLookingForMembers;
  final int maxMembers;
  final String createdBy;
  final DateTime createdAt;
  final int memberCount;
  final List<TeamMember> members;
  final String? chatGroupId;

  HackathonTeam({
    required this.id,
    required this.eventId,
    required this.name,
    this.description,
    this.projectIdea,
    this.techStack = const [],
    this.lookingForRoles = const [],
    this.isLookingForMembers = true,
    this.maxMembers = 5,
    required this.createdBy,
    required this.createdAt,
    this.memberCount = 0,
    this.members = const [],
    this.chatGroupId,
  });

  factory HackathonTeam.fromJson(Map<String, dynamic> json) {
    return HackathonTeam(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      projectIdea: json['project_idea'] as String?,
      techStack: List<String>.from(json['tech_stack'] ?? []),
      lookingForRoles: List<String>.from(json['looking_for_roles'] ?? []),
      isLookingForMembers: json['is_looking_for_members'] as bool? ?? true,
      maxMembers: json['max_members'] as int? ?? 5,
      createdBy: json['created_by'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      memberCount: json['member_count'] as int? ?? 0,
      members: (json['hackathon_team_members'] as List<dynamic>?)
              ?.map((m) => TeamMember.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
      chatGroupId: json['chat_group_id'] as String?,
    );
  }

  bool get hasSpace => memberCount < maxMembers;
  int get spotsLeft => maxMembers - memberCount;
}

class TeamMember {
  final String id;
  final String teamId;
  final String userId;
  final String role;
  final List<String> skills;
  final DateTime joinedAt;
  final String? userName;
  final String? userAvatar;

  TeamMember({
    required this.id,
    required this.teamId,
    required this.userId,
    this.role = 'member',
    this.skills = const [],
    required this.joinedAt,
    this.userName,
    this.userAvatar,
  });

  factory TeamMember.fromJson(Map<String, dynamic> json) {
    return TeamMember(
      id: json['id'] as String,
      teamId: json['team_id'] as String,
      userId: json['user_id'] as String,
      role: json['role'] as String? ?? 'member',
      skills: List<String>.from(json['skills'] ?? []),
      joinedAt: DateTime.parse(json['joined_at'] as String),
      userName: json['user_name'] as String?,
      userAvatar: json['user_avatar'] as String?,
    );
  }
}

class MentorSlot {
  final String id;
  final String eventId;
  final String mentorId;
  final String mentorName;
  final String? mentorAvatar;
  final List<String> expertise;
  final DateTime slotStart;
  final DateTime slotEnd;
  final String? location;
  final bool isVirtual;
  final String? meetingLink;
  final String? bookedByTeamId;
  final DateTime? bookedAt;
  final String status;
  final String? notes;

  MentorSlot({
    required this.id,
    required this.eventId,
    required this.mentorId,
    required this.mentorName,
    this.mentorAvatar,
    this.expertise = const [],
    required this.slotStart,
    required this.slotEnd,
    this.location,
    this.isVirtual = false,
    this.meetingLink,
    this.bookedByTeamId,
    this.bookedAt,
    this.status = 'available',
    this.notes,
  });

  factory MentorSlot.fromJson(Map<String, dynamic> json) {
    return MentorSlot(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      mentorId: json['mentor_id'] as String,
      mentorName: json['mentor_name'] as String,
      mentorAvatar: json['mentor_avatar'] as String?,
      expertise: List<String>.from(json['expertise'] ?? []),
      slotStart: DateTime.parse(json['slot_start'] as String),
      slotEnd: DateTime.parse(json['slot_end'] as String),
      location: json['location'] as String?,
      isVirtual: json['is_virtual'] as bool? ?? false,
      meetingLink: json['meeting_link'] as String?,
      bookedByTeamId: json['booked_by_team_id'] as String?,
      bookedAt: json['booked_at'] != null
          ? DateTime.parse(json['booked_at'] as String)
          : null,
      status: json['status'] as String? ?? 'available',
      notes: json['notes'] as String?,
    );
  }

  bool get isAvailable => status == 'available';
  bool get isBooked => status == 'booked';
  Duration get duration => slotEnd.difference(slotStart);
}

class HackathonSubmission {
  final String id;
  final String eventId;
  final String teamId;
  final String projectName;
  final String? description;
  final String? demoUrl;
  final String? repoUrl;
  final String? presentationUrl;
  final String? videoUrl;
  final List<String> screenshots;
  final List<String> techStack;
  final String? track;
  final DateTime? submittedAt;
  final bool isDraft;
  final String judgingStatus;
  final double? score;
  final String? feedback;
  final DateTime createdAt;
  final DateTime updatedAt;

  HackathonSubmission({
    required this.id,
    required this.eventId,
    required this.teamId,
    required this.projectName,
    this.description,
    this.demoUrl,
    this.repoUrl,
    this.presentationUrl,
    this.videoUrl,
    this.screenshots = const [],
    this.techStack = const [],
    this.track,
    this.submittedAt,
    this.isDraft = true,
    this.judgingStatus = 'pending',
    this.score,
    this.feedback,
    required this.createdAt,
    required this.updatedAt,
  });

  factory HackathonSubmission.fromJson(Map<String, dynamic> json) {
    return HackathonSubmission(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      teamId: json['team_id'] as String,
      projectName: json['project_name'] as String,
      description: json['description'] as String?,
      demoUrl: json['demo_url'] as String?,
      repoUrl: json['repo_url'] as String?,
      presentationUrl: json['presentation_url'] as String?,
      videoUrl: json['video_url'] as String?,
      screenshots: List<String>.from(json['screenshots'] ?? []),
      techStack: List<String>.from(json['tech_stack'] ?? []),
      track: json['track'] as String?,
      submittedAt: json['submitted_at'] != null
          ? DateTime.parse(json['submitted_at'] as String)
          : null,
      isDraft: json['is_draft'] as bool? ?? true,
      judgingStatus: json['judging_status'] as String? ?? 'pending',
      score: (json['score'] as num?)?.toDouble(),
      feedback: json['feedback'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  bool get isSubmitted => submittedAt != null && !isDraft;
  
  double get completionPercentage {
    int filled = 0;
    int total = 6;
    if (projectName.isNotEmpty) filled++;
    if (description?.isNotEmpty == true) filled++;
    if (demoUrl?.isNotEmpty == true || repoUrl?.isNotEmpty == true) filled++;
    if (techStack.isNotEmpty) filled++;
    if (screenshots.isNotEmpty || videoUrl?.isNotEmpty == true) filled++;
    if (track?.isNotEmpty == true) filled++;
    return filled / total;
  }
}

class HackathonDeadline {
  final String id;
  final String eventId;
  final String name;
  final String? description;
  final String deadlineType;
  final DateTime deadlineAt;
  final bool isMandatory;

  HackathonDeadline({
    required this.id,
    required this.eventId,
    required this.name,
    this.description,
    required this.deadlineType,
    required this.deadlineAt,
    this.isMandatory = true,
  });

  factory HackathonDeadline.fromJson(Map<String, dynamic> json) {
    return HackathonDeadline(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      deadlineType: json['deadline_type'] as String,
      deadlineAt: DateTime.parse(json['deadline_at'] as String),
      isMandatory: json['is_mandatory'] as bool? ?? true,
    );
  }

  bool get isPast => deadlineAt.isBefore(DateTime.now());
  bool get isUpcoming => !isPast;
  
  Duration get timeRemaining => deadlineAt.difference(DateTime.now());
  
  String get formattedTimeRemaining {
    final remaining = timeRemaining;
    if (remaining.isNegative) return 'Passed';
    if (remaining.inDays > 0) return '${remaining.inDays}d ${remaining.inHours % 24}h';
    if (remaining.inHours > 0) return '${remaining.inHours}h ${remaining.inMinutes % 60}m';
    return '${remaining.inMinutes}m';
  }
}
