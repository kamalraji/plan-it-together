import 'package:flutter/foundation.dart';

/// Validation result for a single field
class FieldValidationResult {
  final String fieldName;
  final String? errorMessage;
  final bool isValid;

  const FieldValidationResult({
    required this.fieldName,
    this.errorMessage,
  }) : isValid = errorMessage == null;

  const FieldValidationResult.valid(this.fieldName)
      : errorMessage = null,
        isValid = true;
}

/// Complete profile validation result
class ProfileValidationResult {
  final List<FieldValidationResult> fieldResults;
  final bool isValid;

  ProfileValidationResult(this.fieldResults)
      : isValid = fieldResults.every((r) => r.isValid);

  List<FieldValidationResult> get errors =>
      fieldResults.where((r) => !r.isValid).toList();

  String? getError(String fieldName) {
    final result = fieldResults.firstWhere(
      (r) => r.fieldName == fieldName,
      orElse: () => FieldValidationResult.valid(fieldName),
    );
    return result.errorMessage;
  }
}

/// Service for comprehensive profile field validation
class ProfileValidationService {
  // Regex patterns
  static final _emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
  static final _urlRegex = RegExp(
    r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$',
    caseSensitive: false,
  );
  static final _phoneRegex = RegExp(r'^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$');
  static final _linkedinRegex = RegExp(
    r'^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$',
    caseSensitive: false,
  );
  static final _twitterRegex = RegExp(
    r'^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]+\/?$',
    caseSensitive: false,
  );
  static final _githubRegex = RegExp(
    r'^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$',
    caseSensitive: false,
  );

  /// Validates all profile fields and returns comprehensive results
  ProfileValidationResult validateProfile({
    required String? fullName,
    required String? username,
    required String? bio,
    required String? organization,
    required String? phone,
    required String? website,
    required String? linkedinUrl,
    required String? twitterUrl,
    required String? githubUrl,
    bool usernameAvailable = true,
    bool canChangeUsername = true,
  }) {
    final results = <FieldValidationResult>[
      validateFullName(fullName),
      validateUsername(username, usernameAvailable, canChangeUsername),
      validateBio(bio),
      validateOrganization(organization),
      validatePhone(phone),
      validateWebsite(website),
      validateLinkedIn(linkedinUrl),
      validateTwitter(twitterUrl),
      validateGitHub(githubUrl),
    ];

    return ProfileValidationResult(results);
  }

  /// Validates full name field
  FieldValidationResult validateFullName(String? value) {
    const fieldName = 'fullName';
    final trimmed = value?.trim() ?? '';

    if (trimmed.isEmpty) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Full name is required',
      );
    }

    if (trimmed.length < 2) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Name must be at least 2 characters',
      );
    }

    if (trimmed.length > 100) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Name must be less than 100 characters',
      );
    }

    // Check for valid name characters (letters, spaces, hyphens, dots, apostrophes)
    final namePattern = RegExp(r"^[a-zA-Z\s\-\.']+$");
    if (!namePattern.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Name contains invalid characters',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }

  /// Validates username field
  FieldValidationResult validateUsername(
    String? value,
    bool isAvailable,
    bool canChange,
  ) {
    const fieldName = 'username';
    final trimmed = value?.trim() ?? '';

    // Empty username is allowed
    if (trimmed.isEmpty) {
      return const FieldValidationResult.valid(fieldName);
    }

    if (!canChange) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Username change is currently locked',
      );
    }

    if (trimmed.length < 3) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Username must be at least 3 characters',
      );
    }

    if (trimmed.length > 30) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Username must be less than 30 characters',
      );
    }

    // Must start with letter
    if (!RegExp(r'^[a-zA-Z]').hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Username must start with a letter',
      );
    }

    // Only alphanumeric and underscores
    if (!RegExp(r'^[a-zA-Z][a-zA-Z0-9_]*$').hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Username can only contain letters, numbers, and underscores',
      );
    }

    if (!isAvailable) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'This username is already taken',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }

  /// Validates bio field
  FieldValidationResult validateBio(String? value) {
    const fieldName = 'bio';
    final trimmed = value?.trim() ?? '';

    if (trimmed.isEmpty) {
      return const FieldValidationResult.valid(fieldName);
    }

    if (trimmed.length > 500) {
      return FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Bio must be less than 500 characters (${trimmed.length}/500)',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }

  /// Validates organization field
  FieldValidationResult validateOrganization(String? value) {
    const fieldName = 'organization';
    final trimmed = value?.trim() ?? '';

    if (trimmed.isEmpty) {
      return const FieldValidationResult.valid(fieldName);
    }

    if (trimmed.length > 120) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Organization name must be less than 120 characters',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }

  /// Validates phone field
  FieldValidationResult validatePhone(String? value) {
    const fieldName = 'phone';
    final trimmed = value?.trim() ?? '';

    if (trimmed.isEmpty) {
      return const FieldValidationResult.valid(fieldName);
    }

    if (!_phoneRegex.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Please enter a valid phone number',
      );
    }

    if (trimmed.replaceAll(RegExp(r'[^\d]'), '').length < 7) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Phone number must have at least 7 digits',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }

  /// Validates website URL
  FieldValidationResult validateWebsite(String? value) {
    const fieldName = 'website';
    final trimmed = value?.trim() ?? '';

    if (trimmed.isEmpty) {
      return const FieldValidationResult.valid(fieldName);
    }

    if (!_urlRegex.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Please enter a valid URL (include https://)',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }

  /// Validates LinkedIn URL
  FieldValidationResult validateLinkedIn(String? value) {
    const fieldName = 'linkedinUrl';
    final trimmed = value?.trim() ?? '';

    if (trimmed.isEmpty) {
      return const FieldValidationResult.valid(fieldName);
    }

    if (!_urlRegex.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Please enter a valid URL',
      );
    }

    if (!_linkedinRegex.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Please enter a valid LinkedIn profile URL',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }

  /// Validates Twitter/X URL
  FieldValidationResult validateTwitter(String? value) {
    const fieldName = 'twitterUrl';
    final trimmed = value?.trim() ?? '';

    if (trimmed.isEmpty) {
      return const FieldValidationResult.valid(fieldName);
    }

    if (!_urlRegex.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Please enter a valid URL',
      );
    }

    if (!_twitterRegex.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Please enter a valid X/Twitter profile URL',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }

  /// Validates GitHub URL
  FieldValidationResult validateGitHub(String? value) {
    const fieldName = 'githubUrl';
    final trimmed = value?.trim() ?? '';

    if (trimmed.isEmpty) {
      return const FieldValidationResult.valid(fieldName);
    }

    if (!_urlRegex.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Please enter a valid URL',
      );
    }

    if (!_githubRegex.hasMatch(trimmed)) {
      return const FieldValidationResult(
        fieldName: fieldName,
        errorMessage: 'Please enter a valid GitHub profile URL',
      );
    }

    return const FieldValidationResult.valid(fieldName);
  }
}
