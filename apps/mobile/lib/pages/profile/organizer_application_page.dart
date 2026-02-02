import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/models/organizer_application.dart';
import 'package:thittam1hub/services/organizer_application_service.dart';
import 'package:thittam1hub/services/organizer_application_draft_service.dart';
import 'package:thittam1hub/services/organizer_application_validation_service.dart';
import 'package:thittam1hub/widgets/organizer/step_progress_indicator.dart';
import 'package:thittam1hub/widgets/organizer/document_upload_card.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';

/// Multi-step organizer application form
class OrganizerApplicationPage extends StatefulWidget {
  final int? initialStep;

  const OrganizerApplicationPage({super.key, this.initialStep});

  @override
  State<OrganizerApplicationPage> createState() => _OrganizerApplicationPageState();
}

class _OrganizerApplicationPageState extends State<OrganizerApplicationPage> {
  final _applicationService = OrganizerApplicationService.instance;
  final _draftService = OrganizerApplicationDraftService();
  final _validationService = OrganizerApplicationValidationService();

  final _pageController = PageController();
  
  // Form keys
  final _step1FormKey = GlobalKey<FormState>();
  final _step2FormKey = GlobalKey<FormState>();

  // Step 1 controllers
  final _orgNameController = TextEditingController();
  final _orgWebsiteController = TextEditingController();
  final _orgDescriptionController = TextEditingController();

  // Step 2 controllers
  final _experienceDescController = TextEditingController();
  final _portfolioLinksController = TextEditingController();

  // State
  OrganizerApplication? _application;
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isSubmitting = false;
  int _currentStep = 0;
  String? _error;

  // Step 1 selections
  OrganizationType? _selectedOrgType;
  OrganizationSize? _selectedOrgSize;

  // Step 2 selections
  PastEventsCount? _selectedPastEvents;
  LargestEventSize? _selectedLargestEvent;
  List<EventTypeOption> _selectedEventTypes = [];

  // Step 3 document
  String? _documentUrl;
  String? _documentType;
  String? _documentName;

  // Auto-save timer
  Timer? _autoSaveTimer;
  bool _hasUnsavedChanges = false;

  // Field validation errors
  final Map<String, String?> _fieldErrors = {};

  static const _steps = [
    StepInfo(title: 'Organization', icon: Icons.business),
    StepInfo(title: 'Experience', icon: Icons.event),
    StepInfo(title: 'Documents', icon: Icons.upload_file),
    StepInfo(title: 'Review', icon: Icons.check_circle),
  ];

  @override
  void initState() {
    super.initState();
    _loadApplication();
    _startAutoSave();
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    _pageController.dispose();
    _orgNameController.dispose();
    _orgWebsiteController.dispose();
    _orgDescriptionController.dispose();
    _experienceDescController.dispose();
    _portfolioLinksController.dispose();
    super.dispose();
  }

  void _startAutoSave() {
    _autoSaveTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_hasUnsavedChanges && !_isSaving) {
        _saveDraft();
      }
    });
  }

  Future<void> _loadApplication() async {
    setState(() => _isLoading = true);

    try {
      final result = await _applicationService.getCurrentApplication();
      
      if (result.isSuccess) {
        if (result.data != null) {
          _populateFromApplication(result.data!);
        } else {
          // Create new application
          final createResult = await _applicationService.createApplication();
          if (createResult.isSuccess && createResult.data != null) {
            _populateFromApplication(createResult.data!);
          } else {
            setState(() => _error = createResult.error ?? 'Failed to create application');
          }
        }
      } else {
        setState(() => _error = result.error);
      }
    } finally {
      setState(() => _isLoading = false);
      
      // Navigate to initial step if provided
      if (widget.initialStep != null && widget.initialStep! < _steps.length) {
        _goToStep(widget.initialStep!);
      }
    }
  }

  void _populateFromApplication(OrganizerApplication app) {
    setState(() {
      _application = app;
      
      // Step 1
      _orgNameController.text = app.organizationName;
      _orgWebsiteController.text = app.organizationWebsite ?? '';
      _orgDescriptionController.text = app.organizationDescription ?? '';
      _selectedOrgType = app.organizationType;
      _selectedOrgSize = app.organizationSize;
      
      // Step 2
      _experienceDescController.text = app.experienceDescription ?? '';
      _portfolioLinksController.text = app.portfolioLinks.join('\n');
      _selectedPastEvents = app.pastEventsCount;
      _selectedLargestEvent = app.largestEventSize;
      _selectedEventTypes = app.eventTypes
          .map((e) => EventTypeOption.fromString(e))
          .whereType<EventTypeOption>()
          .toList();
      
      // Step 3
      _documentUrl = app.verificationDocumentUrl;
      _documentType = app.verificationDocumentType?.toDbString();
    });
  }

  void _goToStep(int step) {
    if (step < 0 || step >= _steps.length) return;
    
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
    setState(() => _currentStep = step);
  }

  void _nextStep() {
    // Validate current step
    if (!_validateCurrentStep()) {
      HapticFeedback.heavyImpact();
      return;
    }

    HapticFeedback.selectionClick();
    _saveDraft();
    
    if (_currentStep < _steps.length - 1) {
      _goToStep(_currentStep + 1);
    }
  }

  void _previousStep() {
    HapticFeedback.selectionClick();
    if (_currentStep > 0) {
      _goToStep(_currentStep - 1);
    }
  }

  bool _validateCurrentStep() {
    switch (_currentStep) {
      case 0:
        final valid = _step1FormKey.currentState?.validate() ?? false;
        if (!valid) return false;
        if (_selectedOrgType == null) {
          setState(() => _fieldErrors['orgType'] = 'Please select organization type');
          return false;
        }
        return true;
      case 1:
        final valid = _step2FormKey.currentState?.validate() ?? false;
        if (!valid) return false;
        if (_selectedEventTypes.isEmpty) {
          setState(() => _fieldErrors['eventTypes'] = 'Please select at least one event type');
          return false;
        }
        return true;
      case 2:
        if (_documentUrl == null) {
          SettingsFeedback.showError(context, 'Please upload a verification document');
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  Future<void> _saveDraft() async {
    if (_application == null || _isSaving) return;

    setState(() => _isSaving = true);

    final updates = _buildUpdates();
    final result = await _applicationService.updateStep(_application!.id, updates);

    setState(() {
      _isSaving = false;
      if (result.isSuccess && result.data != null) {
        _application = result.data;
        _hasUnsavedChanges = false;
      }
    });
  }

  Map<String, dynamic> _buildUpdates() {
    return {
      // Step 1
      'organization_name': _orgNameController.text.trim(),
      'organization_type': _selectedOrgType?.value,
      'organization_website': _orgWebsiteController.text.trim().isEmpty 
          ? null 
          : _orgWebsiteController.text.trim(),
      'organization_size': _selectedOrgSize?.value,
      'organization_description': _orgDescriptionController.text.trim().isEmpty 
          ? null 
          : _orgDescriptionController.text.trim(),
      
      // Step 2
      'past_events_count': _selectedPastEvents?.value,
      'event_types': _selectedEventTypes.map((e) => e.value).toList(),
      'largest_event_size': _selectedLargestEvent?.value,
      'experience_description': _experienceDescController.text.trim().isEmpty 
          ? null 
          : _experienceDescController.text.trim(),
      'portfolio_links': _portfolioLinksController.text.trim().isEmpty 
          ? [] 
          : _portfolioLinksController.text.trim().split('\n').where((l) => l.isNotEmpty).toList(),
      
      // Step 3
      'verification_document_url': _documentUrl,
      'verification_document_type': _documentType,
    };
  }

  Future<void> _submitApplication() async {
    if (_application == null) return;

    // Final validation
    for (var i = 0; i < 3; i++) {
      _goToStep(i);
      await Future.delayed(const Duration(milliseconds: 100));
      if (!_validateCurrentStep()) {
        HapticFeedback.heavyImpact();
        SettingsFeedback.showError(context, 'Please complete step ${i + 1}');
        return;
      }
    }

    // Confirm submission
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit Application?'),
        content: const Text(
          'Once submitted, you won\'t be able to edit your application until it\'s reviewed. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isSubmitting = true);

    // Save draft first
    await _saveDraft();

    // Submit
    final result = await _applicationService.submitApplication(_application!.id);

    setState(() => _isSubmitting = false);

    if (result.isSuccess) {
      HapticFeedback.heavyImpact();
      if (mounted) {
        SettingsFeedback.showSuccess(context, 'Application submitted successfully!');
        context.pop();
      }
    } else {
      if (mounted) {
        SettingsFeedback.showError(context, result.error ?? 'Submission failed');
      }
    }
  }

  void _onFieldChanged() {
    setState(() => _hasUnsavedChanges = true);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return PopScope(
      canPop: !_hasUnsavedChanges,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        
        final shouldPop = await _showDiscardDialog();
        if (shouldPop && mounted) {
          context.pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Become an Organizer'),
          actions: [
            if (_isSaving)
              const Padding(
                padding: EdgeInsets.all(AppSpacing.md),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            else if (_hasUnsavedChanges)
              TextButton(
                onPressed: _saveDraft,
                child: const Text('Save'),
              ),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildErrorState(cs)
                : _buildContent(cs),
      ),
    );
  }

  Widget _buildErrorState(ColorScheme cs) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: cs.error),
            const SizedBox(height: AppSpacing.md),
            Text(
              _error!,
              style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton(
              onPressed: _loadApplication,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(ColorScheme cs) {
    return Column(
      children: [
        // Step progress indicator
        StepProgressIndicator(
          steps: _steps,
          currentStep: _currentStep,
          onStepTapped: _goToStep,
        ),
        
        const Divider(height: 1),
        
        // Step content
        Expanded(
          child: PageView(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            onPageChanged: (page) => setState(() => _currentStep = page),
            children: [
              _buildStep1Organization(cs),
              _buildStep2Experience(cs),
              _buildStep3Documents(cs),
              _buildStep4Review(cs),
            ],
          ),
        ),
        
        // Bottom navigation
        _buildBottomNavigation(cs),
      ],
    );
  }

  Widget _buildStep1Organization(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Form(
        key: _step1FormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tell us about your organization',
              style: context.textStyles.titleMedium?.semiBold,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'This helps us understand who you are and what kind of events you\'ll be organizing.',
              style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.xl),

            // Organization name
            TextFormField(
              controller: _orgNameController,
              decoration: const InputDecoration(
                labelText: 'Organization Name *',
                hintText: 'Enter your organization or business name',
                prefixIcon: Icon(Icons.business),
              ),
              validator: (v) => _validationService.validateOrganizationName(v).error,
              onChanged: (_) => _onFieldChanged(),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: AppSpacing.lg),

            // Organization type
            Text(
              'Organization Type *',
              style: context.textStyles.labelMedium?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: OrganizationType.values.map((type) {
                final isSelected = _selectedOrgType == type;
                return ChoiceChip(
                  label: Text(type.label),
                  selected: isSelected,
                  onSelected: (selected) {
                    HapticFeedback.selectionClick();
                    setState(() {
                      _selectedOrgType = selected ? type : null;
                      _fieldErrors.remove('orgType');
                    });
                    _onFieldChanged();
                  },
                );
              }).toList(),
            ),
            if (_fieldErrors['orgType'] != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                _fieldErrors['orgType']!,
                style: context.textStyles.bodySmall?.withColor(cs.error),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),

            // Organization size
            Text(
              'Team Size',
              style: context.textStyles.labelMedium?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: OrganizationSize.values.map((size) {
                final isSelected = _selectedOrgSize == size;
                return ChoiceChip(
                  label: Text(size.label),
                  selected: isSelected,
                  onSelected: (selected) {
                    HapticFeedback.selectionClick();
                    setState(() => _selectedOrgSize = selected ? size : null);
                    _onFieldChanged();
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Website
            TextFormField(
              controller: _orgWebsiteController,
              decoration: const InputDecoration(
                labelText: 'Website (optional)',
                hintText: 'https://example.com',
                prefixIcon: Icon(Icons.language),
              ),
              keyboardType: TextInputType.url,
              validator: (v) {
                if (v == null || v.isEmpty) return null;
                return _validationService.validateOrganizationWebsite(v).error;
              },
              onChanged: (_) => _onFieldChanged(),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: AppSpacing.lg),

            // Description
            TextFormField(
              controller: _orgDescriptionController,
              decoration: const InputDecoration(
                labelText: 'Description *',
                hintText: 'Tell us about your organization and what you do',
                alignLabelWithHint: true,
              ),
              maxLines: 4,
              maxLength: 500,
              validator: (v) => _validationService.validateOrganizationDescription(v).error,
              onChanged: (_) => _onFieldChanged(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep2Experience(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Form(
        key: _step2FormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your event experience',
              style: context.textStyles.titleMedium?.semiBold,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Help us understand your background in organizing events.',
              style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.xl),

            // Past events count
            Text(
              'Events Organized *',
              style: context.textStyles.labelMedium?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: PastEventsCount.values.map((count) {
                final isSelected = _selectedPastEvents == count;
                return ChoiceChip(
                  label: Text(count.label),
                  selected: isSelected,
                  onSelected: (selected) {
                    HapticFeedback.selectionClick();
                    setState(() => _selectedPastEvents = selected ? count : null);
                    _onFieldChanged();
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Event types
            Text(
              'Event Types *',
              style: context.textStyles.labelMedium?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: EventTypeOption.values.map((type) {
                final isSelected = _selectedEventTypes.contains(type);
                return FilterChip(
                  label: Text(type.label),
                  selected: isSelected,
                  onSelected: (selected) {
                    HapticFeedback.selectionClick();
                    setState(() {
                      if (selected) {
                        _selectedEventTypes.add(type);
                      } else {
                        _selectedEventTypes.remove(type);
                      }
                      _fieldErrors.remove('eventTypes');
                    });
                    _onFieldChanged();
                  },
                );
              }).toList(),
            ),
            if (_fieldErrors['eventTypes'] != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                _fieldErrors['eventTypes']!,
                style: context.textStyles.bodySmall?.withColor(cs.error),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),

            // Largest event
            Text(
              'Largest Event Size',
              style: context.textStyles.labelMedium?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: LargestEventSize.values.map((size) {
                final isSelected = _selectedLargestEvent == size;
                return ChoiceChip(
                  label: Text(size.label),
                  selected: isSelected,
                  onSelected: (selected) {
                    HapticFeedback.selectionClick();
                    setState(() => _selectedLargestEvent = selected ? size : null);
                    _onFieldChanged();
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Experience description
            TextFormField(
              controller: _experienceDescController,
              decoration: const InputDecoration(
                labelText: 'Experience Details',
                hintText: 'Describe your event organizing experience',
                alignLabelWithHint: true,
              ),
              maxLines: 4,
              maxLength: 1000,
              onChanged: (_) => _onFieldChanged(),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Portfolio links
            TextFormField(
              controller: _portfolioLinksController,
              decoration: const InputDecoration(
                labelText: 'Portfolio Links (optional)',
                hintText: 'One URL per line',
                alignLabelWithHint: true,
              ),
              maxLines: 3,
              keyboardType: TextInputType.url,
              onChanged: (_) => _onFieldChanged(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep3Documents(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Verification Documents',
            style: context.textStyles.titleMedium?.semiBold,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Upload documents to verify your organization. This helps build trust with attendees.',
            style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
          ),
          const SizedBox(height: AppSpacing.xl),

          DocumentUploadCard(
            currentDocumentUrl: _documentUrl,
            documentType: _documentType,
            documentName: _documentName,
            isRequired: true,
            onUploaded: (result) {
              setState(() {
                _documentUrl = result.url;
                _documentType = result.type;
                _documentName = result.name;
              });
              _onFieldChanged();
            },
            onRemove: () {
              setState(() {
                _documentUrl = null;
                _documentType = null;
                _documentName = null;
              });
              _onFieldChanged();
            },
          ),

          const SizedBox(height: AppSpacing.lg),

          // Tips
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.lightbulb_outline, size: 18, color: cs.primary),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      'Tips',
                      style: context.textStyles.labelMedium?.semiBold,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '• Accepted formats: PDF, JPG, PNG\n'
                  '• Maximum file size: 5MB\n'
                  '• Documents are reviewed within 5-7 business days\n'
                  '• Personal IDs are kept confidential',
                  style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep4Review(ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Review Your Application',
            style: context.textStyles.titleMedium?.semiBold,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Please review your information before submitting.',
            style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
          ),
          const SizedBox(height: AppSpacing.xl),

          // Organization section
          _ReviewSection(
            title: 'Organization',
            icon: Icons.business,
            onEdit: () => _goToStep(0),
            children: [
              _ReviewItem(label: 'Name', value: _orgNameController.text),
              _ReviewItem(label: 'Type', value: _selectedOrgType?.label ?? 'Not selected'),
              if (_selectedOrgSize != null)
                _ReviewItem(label: 'Size', value: _selectedOrgSize!.label),
              if (_orgWebsiteController.text.isNotEmpty)
                _ReviewItem(label: 'Website', value: _orgWebsiteController.text),
              if (_orgDescriptionController.text.isNotEmpty)
                _ReviewItem(
                  label: 'Description', 
                  value: _orgDescriptionController.text,
                  multiline: true,
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Experience section
          _ReviewSection(
            title: 'Experience',
            icon: Icons.event,
            onEdit: () => _goToStep(1),
            children: [
              if (_selectedPastEvents != null)
                _ReviewItem(label: 'Events Organized', value: _selectedPastEvents!.label),
              if (_selectedEventTypes.isNotEmpty)
                _ReviewItem(
                  label: 'Event Types', 
                  value: _selectedEventTypes.map((e) => e.label).join(', '),
                ),
              if (_selectedLargestEvent != null)
                _ReviewItem(label: 'Largest Event', value: _selectedLargestEvent!.label),
              if (_experienceDescController.text.isNotEmpty)
                _ReviewItem(
                  label: 'Experience Details', 
                  value: _experienceDescController.text,
                  multiline: true,
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Documents section
          _ReviewSection(
            title: 'Documents',
            icon: Icons.upload_file,
            onEdit: () => _goToStep(2),
            children: [
              _ReviewItem(
                label: 'Verification Document',
                value: _documentUrl != null ? 'Uploaded ✓' : 'Not uploaded',
                valueColor: _documentUrl != null ? AppColors.success : cs.error,
              ),
              if (_documentType != null)
                _ReviewItem(
                  label: 'Document Type',
                  value: DocumentType.fromValue(_documentType)?.label ?? _documentType!,
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // Terms notice
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline, size: 18, color: cs.onSurfaceVariant),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    'By submitting this application, you agree to our Terms of Service and Organizer Guidelines.',
                    style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNavigation(ColorScheme cs) {
    return Container(
      padding: EdgeInsets.only(
        left: AppSpacing.md,
        right: AppSpacing.md,
        top: AppSpacing.md,
        bottom: MediaQuery.of(context).padding.bottom + AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(top: BorderSide(color: cs.outline.withOpacity(0.2))),
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            TextButton.icon(
              onPressed: _previousStep,
              icon: const Icon(Icons.arrow_back, size: 18),
              label: const Text('Back'),
            ),
          const Spacer(),
          if (_currentStep < _steps.length - 1)
            FilledButton.icon(
              onPressed: _nextStep,
              icon: const Icon(Icons.arrow_forward, size: 18),
              label: const Text('Next'),
            )
          else
            FilledButton.icon(
              onPressed: _isSubmitting ? null : _submitApplication,
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send, size: 18),
              label: Text(_isSubmitting ? 'Submitting...' : 'Submit'),
            ),
        ],
      ),
    );
  }

  Future<bool> _showDiscardDialog() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unsaved Changes'),
        content: const Text(
          'You have unsaved changes. Would you like to save before leaving?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Discard'),
          ),
          FilledButton(
            onPressed: () async {
              await _saveDraft();
              if (mounted) Navigator.pop(context, true);
            },
            child: const Text('Save & Leave'),
          ),
        ],
      ),
    );
    return result ?? false;
  }
}

/// Review section widget
class _ReviewSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onEdit;
  final List<Widget> children;

  const _ReviewSection({
    required this.title,
    required this.icon,
    required this.onEdit,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: cs.primary),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  title,
                  style: context.textStyles.titleSmall?.semiBold,
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Edit'),
                  style: TextButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            ...children,
          ],
        ),
      ),
    );
  }
}

/// Review item widget
class _ReviewItem extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool multiline;

  const _ReviewItem({
    required this.label,
    required this.value,
    this.valueColor,
    this.multiline = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (multiline) {
      return Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: context.textStyles.labelSmall?.withColor(cs.onSurfaceVariant),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: context.textStyles.bodySmall?.withColor(valueColor ?? cs.onSurface),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: context.textStyles.bodySmall?.semiBold.withColor(valueColor ?? cs.onSurface),
            ),
          ),
        ],
      ),
    );
  }
}
