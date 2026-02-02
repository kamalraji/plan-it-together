import 'package:flutter/foundation.dart';

@immutable
class WorkExperience {
  final String id;
  final String userId;
  final String title;
  final String company;
  final String? companyLogoUrl;
  final String? location;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isCurrent;
  final String? description;
  final DateTime createdAt;

  const WorkExperience({
    required this.id,
    required this.userId,
    required this.title,
    required this.company,
    this.companyLogoUrl,
    this.location,
    required this.startDate,
    this.endDate,
    required this.isCurrent,
    this.description,
    required this.createdAt,
  });

  factory WorkExperience.fromMap(Map<String, dynamic> map) {
    return WorkExperience(
      id: map['id'] as String,
      userId: map['user_id'] as String,
      title: map['title'] as String? ?? '',
      company: map['company'] as String? ?? '',
      companyLogoUrl: map['company_logo_url'] as String?,
      location: map['location'] as String?,
      startDate: DateTime.tryParse(map['start_date'] ?? '') ?? DateTime.now(),
      endDate: map['end_date'] != null ? DateTime.tryParse(map['end_date']) : null,
      isCurrent: map['is_current'] as bool? ?? false,
      description: map['description'] as String?,
      createdAt: DateTime.tryParse(map['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'company': company,
      'company_logo_url': companyLogoUrl,
      'location': location,
      'start_date': startDate.toIso8601String().split('T').first,
      'end_date': endDate?.toIso8601String().split('T').first,
      'is_current': isCurrent,
      'description': description,
    };
  }

  /// Calculate duration string like "2 years 3 months"
  String get durationString {
    final end = endDate ?? DateTime.now();
    final months = (end.year - startDate.year) * 12 + (end.month - startDate.month);
    
    if (months < 1) return 'Less than a month';
    if (months < 12) return '$months month${months > 1 ? 's' : ''}';
    
    final years = months ~/ 12;
    final remainingMonths = months % 12;
    
    if (remainingMonths == 0) return '$years year${years > 1 ? 's' : ''}';
    return '$years year${years > 1 ? 's' : ''} $remainingMonths month${remainingMonths > 1 ? 's' : ''}';
  }

  /// Format date range string like "Jan 2022 - Present"
  String get dateRangeString {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final start = '${months[startDate.month - 1]} ${startDate.year}';
    final end = isCurrent ? 'Present' : '${months[endDate!.month - 1]} ${endDate!.year}';
    return '$start - $end';
  }

  WorkExperience copyWith({
    String? id,
    String? userId,
    String? title,
    String? company,
    String? companyLogoUrl,
    String? location,
    DateTime? startDate,
    DateTime? endDate,
    bool? isCurrent,
    String? description,
    DateTime? createdAt,
  }) {
    return WorkExperience(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      company: company ?? this.company,
      companyLogoUrl: companyLogoUrl ?? this.companyLogoUrl,
      location: location ?? this.location,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      isCurrent: isCurrent ?? this.isCurrent,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
