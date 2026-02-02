import '../models/organizer_application.dart';
import '../utils/url_utils.dart';

/// Validation service for organizer applications.
/// 
/// Follows ProfileValidationService pattern with:
/// - Per-field validation with clear error messages
/// - Per-step composite validation
/// - Real-time validation support with debouncing hints
class OrganizerApplicationValidationService {
  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  static const int _minOrgNameLength = 2;
  static const int _maxOrgNameLength = 100;
  static const int _minDescriptionLength = 50;
  static const int _maxDescriptionLength = 1000;
  static const int _maxExperienceLength = 2000;
  static const int _maxPortfolioLinks = 5;

  // ===========================================================================
  // STEP 1: ORGANIZATION DETAILS
  // ===========================================================================

  /// Validate organization name
  FieldValidationResult validateOrganizationName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return FieldValidationResult.invalid(
        'Organization name is required',
        field: 'organization_name',
      );
    }

    final trimmed = value.trim();
    
    if (trimmed.length < _minOrgNameLength) {
      return FieldValidationResult.invalid(
        'Name must be at least $_minOrgNameLength characters',
        field: 'organization_name',
      );
    }

    if (trimmed.length > _maxOrgNameLength) {
      return FieldValidationResult.invalid(
        'Name cannot exceed $_maxOrgNameLength characters',
        field: 'organization_name',
      );
    }

    // Check for suspicious patterns
    if (RegExp(r'^[0-9]+$').hasMatch(trimmed)) {
      return FieldValidationResult.invalid(
        'Organization name cannot be only numbers',
        field: 'organization_name',
      );
    }

    return FieldValidationResult.valid(field: 'organization_name');
  }

  /// Validate organization type selection
  FieldValidationResult validateOrganizationType(OrganizationType? value) {
    if (value == null) {
      return FieldValidationResult.invalid(
        'Please select your organization type',
        field: 'organization_type',
      );
    }
    return FieldValidationResult.valid(field: 'organization_type');
  }

  /// Validate organization website (optional but must be valid if provided)
  FieldValidationResult validateOrganizationWebsite(String? value) {
    if (value == null || value.trim().isEmpty) {
      return FieldValidationResult.valid(field: 'organization_website'); // Optional
    }

    final trimmed = value.trim();
    
    if (!UrlUtils.isValidUrl(trimmed)) {
      return FieldValidationResult.invalid(
        'Please enter a valid website URL',
        field: 'organization_website',
      );
    }

    return FieldValidationResult.valid(field: 'organization_website');
  }

  /// Validate organization description
  FieldValidationResult validateOrganizationDescription(String? value) {
    if (value == null || value.trim().isEmpty) {
      return FieldValidationResult.invalid(
        'Please describe your organization',
        field: 'organization_description',
      );
    }

    final trimmed = value.trim();
    
    if (trimmed.length < _minDescriptionLength) {
      return FieldValidationResult.invalid(
        'Description must be at least $_minDescriptionLength characters (${trimmed.length}/$_minDescriptionLength)',
        field: 'organization_description',
      );
    }

    if (trimmed.length > _maxDescriptionLength) {
      return FieldValidationResult.invalid(
        'Description cannot exceed $_maxDescriptionLength characters',
        field: 'organization_description',
      );
    }

    return FieldValidationResult.valid(field: 'organization_description');
  }

  // ===========================================================================
  // STEP 2: EXPERIENCE
  // ===========================================================================

  /// Validate past events count selection
  FieldValidationResult validatePastEventsCount(PastEventsCount? value) {
    // Optional field
    return FieldValidationResult.valid(field: 'past_events_count');
  }

  /// Validate event types selection
  FieldValidationResult validateEventTypes(List<String>? value) {
    // Optional but encouraged
    if (value == null || value.isEmpty) {
      return FieldValidationResult.warning(
        'Adding event types helps us understand your experience',
        field: 'event_types',
      );
    }
    return FieldValidationResult.valid(field: 'event_types');
  }

  /// Validate experience description
  FieldValidationResult validateExperienceDescription(String? value) {
    if (value == null || value.trim().isEmpty) {
      return FieldValidationResult.valid(field: 'experience_description'); // Optional
    }

    final trimmed = value.trim();
    
    if (trimmed.length > _maxExperienceLength) {
      return FieldValidationResult.invalid(
        'Experience description cannot exceed $_maxExperienceLength characters',
        field: 'experience_description',
      );
    }

    return FieldValidationResult.valid(field: 'experience_description');
  }

  /// Validate portfolio links
  FieldValidationResult validatePortfolioLinks(List<String>? value) {
    if (value == null || value.isEmpty) {
      return FieldValidationResult.valid(field: 'portfolio_links'); // Optional
    }

    if (value.length > _maxPortfolioLinks) {
      return FieldValidationResult.invalid(
        'Maximum $_maxPortfolioLinks portfolio links allowed',
        field: 'portfolio_links',
      );
    }

    for (int i = 0; i < value.length; i++) {
      final link = value[i].trim();
      if (link.isNotEmpty && !UrlUtils.isValidUrl(link)) {
        return FieldValidationResult.invalid(
          'Portfolio link ${i + 1} is not a valid URL',
          field: 'portfolio_links',
        );
      }
    }

    return FieldValidationResult.valid(field: 'portfolio_links');
  }

  // ===========================================================================
  // STEP 3: DOCUMENTS
  // ===========================================================================

  /// Validate verification document
  FieldValidationResult validateVerificationDocument(
    String? url,
    VerificationDocumentType? type,
  ) {
    if (url == null || url.isEmpty) {
      return FieldValidationResult.invalid(
        'Please upload a verification document',
        field: 'verification_document',
      );
    }

    if (type == null) {
      return FieldValidationResult.invalid(
        'Please select the document type',
        field: 'verification_document_type',
      );
    }

    return FieldValidationResult.valid(field: 'verification_document');
  }

  // ===========================================================================
  // COMPOSITE VALIDATION
  // ===========================================================================

  /// Validate all fields for a specific step
  ApplicationValidationResult validateStep(int step, Map<String, dynamic> data) {
    final results = <FieldValidationResult>[];

    switch (step) {
      case 1:
        results.add(validateOrganizationName(data['organization_name'] as String?));
        results.add(validateOrganizationType(
          data['organization_type'] is OrganizationType
              ? data['organization_type'] as OrganizationType
              : OrganizationType.fromString(data['organization_type'] as String?),
        ));
        results.add(validateOrganizationWebsite(data['organization_website'] as String?));
        results.add(validateOrganizationDescription(data['organization_description'] as String?));
        break;
        
      case 2:
        results.add(validatePastEventsCount(
          data['past_events_count'] is PastEventsCount
              ? data['past_events_count'] as PastEventsCount
              : PastEventsCount.fromString(data['past_events_count'] as String?),
        ));
        results.add(validateEventTypes(
          (data['event_types'] as List?)?.cast<String>(),
        ));
        results.add(validateExperienceDescription(data['experience_description'] as String?));
        results.add(validatePortfolioLinks(
          (data['portfolio_links'] as List?)?.cast<String>(),
        ));
        break;
        
      case 3:
        results.add(validateVerificationDocument(
          data['verification_document_url'] as String?,
          data['verification_document_type'] is VerificationDocumentType
              ? data['verification_document_type'] as VerificationDocumentType
              : VerificationDocumentType.fromString(data['verification_document_type'] as String?),
        ));
        break;
    }

    return ApplicationValidationResult(
      fieldResults: results,
      step: step,
    );
  }

  /// Validate entire application for submission
  ApplicationValidationResult validateForSubmission(OrganizerApplication app) {
    final results = <FieldValidationResult>[];

    // Step 1 validations
    results.add(validateOrganizationName(app.organizationName));
    results.add(validateOrganizationType(app.organizationType));
    results.add(validateOrganizationWebsite(app.organizationWebsite));
    results.add(validateOrganizationDescription(app.organizationDescription));

    // Step 2 validations (mostly optional)
    results.add(validatePastEventsCount(app.pastEventsCount));
    results.add(validateEventTypes(app.eventTypes));
    results.add(validateExperienceDescription(app.experienceDescription));
    results.add(validatePortfolioLinks(app.portfolioLinks));

    // Step 3 validations
    results.add(validateVerificationDocument(
      app.verificationDocumentUrl,
      app.verificationDocumentType,
    ));

    // Find first step with errors
    int errorStep = 0;
    final step1Errors = results.take(4).any((r) => !r.isValid);
    final step3Errors = results.last.isValid == false;
    
    if (step1Errors) {
      errorStep = 1;
    } else if (step3Errors) {
      errorStep = 3;
    }

    return ApplicationValidationResult(
      fieldResults: results,
      step: errorStep,
    );
  }
}

// =============================================================================
// VALIDATION RESULT MODELS
// =============================================================================

/// Result of validating a single field
class FieldValidationResult {
  final String field;
  final bool isValid;
  final String? errorMessage;
  final String? warningMessage;
  final ValidationSeverity severity;

  const FieldValidationResult._({
    required this.field,
    required this.isValid,
    this.errorMessage,
    this.warningMessage,
    required this.severity,
  });

  factory FieldValidationResult.valid({required String field}) {
    return FieldValidationResult._(
      field: field,
      isValid: true,
      severity: ValidationSeverity.none,
    );
  }

  factory FieldValidationResult.invalid(
    String message, {
    required String field,
  }) {
    return FieldValidationResult._(
      field: field,
      isValid: false,
      errorMessage: message,
      severity: ValidationSeverity.error,
    );
  }

  factory FieldValidationResult.warning(
    String message, {
    required String field,
  }) {
    return FieldValidationResult._(
      field: field,
      isValid: true, // Warnings don't block
      warningMessage: message,
      severity: ValidationSeverity.warning,
    );
  }

  bool get hasWarning => warningMessage != null;
  bool get hasError => errorMessage != null;
  String? get message => errorMessage ?? warningMessage;
  /// Alias for errorMessage for form validation compatibility
  String? get error => errorMessage;
}

/// Severity level for validation feedback
enum ValidationSeverity {
  none,
  warning,
  error,
}

/// Result of validating multiple fields (step or entire form)
class ApplicationValidationResult {
  final List<FieldValidationResult> fieldResults;
  final int step;

  const ApplicationValidationResult({
    required this.fieldResults,
    required this.step,
  });

  /// Whether all fields are valid
  bool get isValid => fieldResults.every((r) => r.isValid);

  /// Whether there are any warnings
  bool get hasWarnings => fieldResults.any((r) => r.hasWarning);

  /// Get all error messages
  List<String> get errorMessages => 
      fieldResults.where((r) => r.hasError).map((r) => r.errorMessage!).toList();

  /// Get all warning messages
  List<String> get warningMessages =>
      fieldResults.where((r) => r.hasWarning).map((r) => r.warningMessage!).toList();

  /// Get first error field (for focus)
  String? get firstErrorField =>
      fieldResults.where((r) => r.hasError).map((r) => r.field).firstOrNull;

  /// Get validation result for specific field
  FieldValidationResult? getFieldResult(String field) =>
      fieldResults.where((r) => r.field == field).firstOrNull;
}
