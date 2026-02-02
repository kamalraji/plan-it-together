import 'package:flutter/foundation.dart';

@immutable
class PortfolioProject {
  final String id;
  final String userId;
  final String title;
  final String? description;
  final String? imageUrl;
  final String? projectUrl;
  final List<String> skills;
  final DateTime? projectDate;
  final DateTime createdAt;

  const PortfolioProject({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.imageUrl,
    this.projectUrl,
    required this.skills,
    this.projectDate,
    required this.createdAt,
  });

  factory PortfolioProject.fromMap(Map<String, dynamic> map) {
    return PortfolioProject(
      id: map['id'] as String,
      userId: map['user_id'] as String,
      title: map['title'] as String? ?? '',
      description: map['description'] as String?,
      imageUrl: map['image_url'] as String?,
      projectUrl: map['project_url'] as String?,
      skills: List<String>.from(map['skills'] ?? []),
      projectDate: map['project_date'] != null ? DateTime.tryParse(map['project_date']) : null,
      createdAt: DateTime.tryParse(map['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'description': description,
      'image_url': imageUrl,
      'project_url': projectUrl,
      'skills': skills,
      'project_date': projectDate?.toIso8601String().split('T').first,
    };
  }

  PortfolioProject copyWith({
    String? id,
    String? userId,
    String? title,
    String? description,
    String? imageUrl,
    String? projectUrl,
    List<String>? skills,
    DateTime? projectDate,
    DateTime? createdAt,
  }) {
    return PortfolioProject(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      projectUrl: projectUrl ?? this.projectUrl,
      skills: skills ?? this.skills,
      projectDate: projectDate ?? this.projectDate,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
