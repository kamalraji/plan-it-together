import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/cache_service.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/profile_history_service.dart';
import 'package:thittam1hub/services/profile_validation_service.dart';
import 'package:thittam1hub/services/profile_draft_service.dart';
import 'package:thittam1hub/services/username_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
// Import only what we need to avoid symbol collisions (ShimmerLoading exists in two libs).
import 'package:thittam1hub/utils/animations.dart' show FadeSlideTransition, staggerDelay;
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/widgets/cover_image_picker.dart';
import 'package:thittam1hub/widgets/profile/profile_completeness_card.dart';
import 'package:thittam1hub/widgets/profile/profile_history_sheet.dart';
import 'package:thittam1hub/widgets/profile/validation_error_banner.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/widgets/username_field.dart';

import 'package:thittam1hub/services/logging_service.dart';

/// Edit Profile screen with form validation, haptic feedback, and accessibility
class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  static final _log = LoggingService.instance;
  static const String _tag = 'EditProfilePage';
  
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();
  final _profileService = ProfileService.instance;
  final _usernameService = UsernameService.instance;
  final _historyService = ProfileHistoryService.instance;
  final _validationService = ProfileValidationService();
  final _draftService = ProfileDraftService();
  
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _bioController = TextEditingController();
  final _organizationController = TextEditingController();
  final _phoneController = TextEditingController();
  final _websiteController = TextEditingController();
  final _linkedinController = TextEditingController();
  final _twitterController = TextEditingController();
  final _githubController = TextEditingController();

  // Focus nodes for error scrolling
  final Map<String, FocusNode> _focusNodes = {};
  final Map<String, GlobalKey> _fieldKeys = {};

  UserProfile? _profile;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _newAvatarUrl;
  String? _newCoverImageUrl;
  String? _selectedGradientId;
  final _imagePicker = ImagePicker();
  
  // Username state
  String? _originalUsername;
  bool _usernameAvailable = true;
  DateTime? _nextUsernameChangeDate;
  bool _canChangeUsername = true;
  
  // Validation state
  ProfileValidationResult? _validationResult;
  bool _showValidationBanner = false;
  
  // Real-time inline validation state
  final Map<String, String?> _fieldErrors = {};
  final Map<String, Timer?> _debounceTimers = {};
  final Map<String, bool> _fieldInteracted = {};
  
  // Auto-save timer
  Timer? _autoSaveTimer;
  bool _hasPendingDraft = false;

  @override
  void initState() {
    super.initState();
    _initializeFocusNodes();
    _loadProfile();
    _setupFieldListeners();
    _checkForDraft();
    _startAutoSave();
  }

  void _initializeFocusNodes() {
    final fields = ['fullName', 'username', 'bio', 'organization', 'phone', 
                    'website', 'linkedin', 'twitter', 'github'];
    for (final field in fields) {
      _focusNodes[field] = FocusNode();
      _fieldKeys[field] = GlobalKey();
    }
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    for (final timer in _debounceTimers.values) {
      timer?.cancel();
    }
    for (final node in _focusNodes.values) {
      node.dispose();
    }
    _scrollController.dispose();
    _fullNameController.dispose();
    _usernameController.dispose();
    _bioController.dispose();
    _organizationController.dispose();
    _phoneController.dispose();
    _websiteController.dispose();
    _linkedinController.dispose();
    _twitterController.dispose();
    _githubController.dispose();
    super.dispose();
  }

  /// Checks if there are unsaved changes
  bool get _hasUnsavedChanges {
    if (_profile == null) return false;
    
    return _fullNameController.text != (_profile?.fullName ?? '') ||
           _usernameController.text != (_originalUsername ?? '') ||
           _bioController.text != (_profile?.bio ?? '') ||
           _organizationController.text != (_profile?.organization ?? '') ||
           _phoneController.text != (_profile?.phone ?? '') ||
           _websiteController.text != (_profile?.website ?? '') ||
           _linkedinController.text != (_profile?.linkedinUrl ?? '') ||
           _twitterController.text != (_profile?.twitterUrl ?? '') ||
           _githubController.text != (_profile?.githubUrl ?? '') ||
           _newAvatarUrl != null ||
           _newCoverImageUrl != null ||
           _selectedGradientId != _profile?.coverGradientId;
  }

  /// Shows discard confirmation dialog
  Future<bool> _showDiscardDialog() async {
    HapticFeedback.mediumImpact();
    
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Discard changes?'),
        content: const Text('You have unsaved changes. Are you sure you want to leave?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep editing'),
          ),
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              _draftService.clearDraft();
              Navigator.of(context).pop(true);
            },
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Discard'),
          ),
        ],
      ),
    ) ?? false;
  }

  /// Checks for existing draft and offers to restore
  Future<void> _checkForDraft() async {
    final draft = await _draftService.loadDraft();
    if (draft != null && draft.isNotEmpty && mounted) {
      final draftAge = await _draftService.getDraftAge();
      final ageText = draftAge != null ? _formatDraftAge(draftAge) : 'recently';
      
      HapticFeedback.lightImpact();
      
      final shouldRestore = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Restore draft?'),
          content: Text('You have an unsaved draft from $ageText. Would you like to restore it?'),
          actions: [
            TextButton(
              onPressed: () {
                _draftService.clearDraft();
                Navigator.of(context).pop(false);
              },
              child: const Text('Discard'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Restore'),
            ),
          ],
        ),
      );
      
      if (shouldRestore == true && mounted) {
        _restoreDraft(draft);
        setState(() => _hasPendingDraft = true);
        HapticFeedback.selectionClick();
      }
    }
  }

  String _formatDraftAge(Duration age) {
    if (age.inMinutes < 60) {
      return '${age.inMinutes} minute${age.inMinutes == 1 ? '' : 's'} ago';
    } else if (age.inHours < 24) {
      return '${age.inHours} hour${age.inHours == 1 ? '' : 's'} ago';
    }
    return 'over a day ago';
  }

  void _restoreDraft(Map<String, String> draft) {
    if (draft['fullName'] != null) _fullNameController.text = draft['fullName']!;
    if (draft['bio'] != null) _bioController.text = draft['bio']!;
    if (draft['organization'] != null) _organizationController.text = draft['organization']!;
    if (draft['phone'] != null) _phoneController.text = draft['phone']!;
    if (draft['website'] != null) _websiteController.text = draft['website']!;
    if (draft['linkedin'] != null) _linkedinController.text = draft['linkedin']!;
    if (draft['twitter'] != null) _twitterController.text = draft['twitter']!;
    if (draft['github'] != null) _githubController.text = draft['github']!;
  }

  void _startAutoSave() {
    _autoSaveTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_hasUnsavedChanges) {
        _saveDraft();
      }
    });
  }

  Future<void> _saveDraft() async {
    await _draftService.saveDraft({
      'fullName': _fullNameController.text,
      'bio': _bioController.text,
      'organization': _organizationController.text,
      'phone': _phoneController.text,
      'website': _websiteController.text,
      'linkedin': _linkedinController.text,
      'twitter': _twitterController.text,
      'github': _githubController.text,
    });
  }
  
  /// Sets up listeners for real-time inline validation
  void _setupFieldListeners() {
    // Full name validation
    _fullNameController.addListener(() => _validateFieldDebounced(
      'fullName',
      () => _validationService.validateFullName(_fullNameController.text).errorMessage,
    ));
    
    // Bio validation
    _bioController.addListener(() => _validateFieldDebounced(
      'bio',
      () => _validationService.validateBio(_bioController.text).errorMessage,
    ));
    
    // Organization validation
    _organizationController.addListener(() => _validateFieldDebounced(
      'organization',
      () => _validationService.validateOrganization(_organizationController.text).errorMessage,
    ));
    
    // Phone validation
    _phoneController.addListener(() => _validateFieldDebounced(
      'phone',
      () => _validationService.validatePhone(_phoneController.text).errorMessage,
    ));
    
    // URL validations with longer debounce
    _websiteController.addListener(() => _validateFieldDebounced(
      'website',
      () => _validationService.validateWebsite(_websiteController.text).errorMessage,
      debounceMs: 600,
    ));
    _linkedinController.addListener(() => _validateFieldDebounced(
      'linkedin',
      () => _validationService.validateLinkedIn(_linkedinController.text).errorMessage,
      debounceMs: 600,
    ));
    _twitterController.addListener(() => _validateFieldDebounced(
      'twitter',
      () => _validationService.validateTwitter(_twitterController.text).errorMessage,
      debounceMs: 600,
    ));
    _githubController.addListener(() => _validateFieldDebounced(
      'github',
      () => _validationService.validateGitHub(_githubController.text).errorMessage,
      debounceMs: 600,
    ));
  }
  
  /// Validates a field with debouncing for real-time feedback
  void _validateFieldDebounced(String fieldName, String? Function() validator, {int debounceMs = 300}) {
    _fieldInteracted[fieldName] = true;
    
    _debounceTimers[fieldName]?.cancel();
    _debounceTimers[fieldName] = Timer(Duration(milliseconds: debounceMs), () {
      if (mounted) {
        final error = validator();
        final previousError = _fieldErrors[fieldName];
        
        setState(() {
          _fieldErrors[fieldName] = error;
        });
        
        // Haptic feedback on validation state change
        if (error != null && previousError == null) {
          HapticFeedback.lightImpact();
        } else if (error == null && previousError != null) {
          HapticFeedback.selectionClick();
        }
      }
    });
  }
  
  /// Builds inline error widget for a field
  Widget _buildInlineError(String fieldName, TextEditingController controller) {
    final hasInteracted = _fieldInteracted[fieldName] ?? false;
    final error = _fieldErrors[fieldName];
    final hasValue = controller.text.trim().isNotEmpty;
    
    if (!hasInteracted) return const SizedBox.shrink();
    
    final cs = Theme.of(context).colorScheme;
    
    if (error != null) {
      return Semantics(
        liveRegion: true,
        child: Padding(
          padding: const EdgeInsets.only(top: 4, left: 2),
          child: Row(
            children: [
              Icon(Icons.error_outline, size: 14, color: cs.error),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  error,
                  style: TextStyle(fontSize: 12, color: cs.error),
                ),
              ),
            ],
          ),
        ),
      );
    } else if (hasValue) {
      return Padding(
        padding: const EdgeInsets.only(top: 4, left: 2),
        child: Row(
          children: [
            Icon(Icons.check_circle, size: 14, color: Colors.green.shade600),
            const SizedBox(width: 4),
            Text(
              'Valid',
              style: TextStyle(fontSize: 12, color: Colors.green.shade600),
            ),
          ],
        ),
      );
    }
    
    return const SizedBox.shrink();
  }
  
  /// Gets the suffix icon for inline validation status
  Widget? _getValidationSuffixIcon(String fieldName, TextEditingController controller) {
    final hasInteracted = _fieldInteracted[fieldName] ?? false;
    if (!hasInteracted || controller.text.trim().isEmpty) return null;
    
    final error = _fieldErrors[fieldName];
    final cs = Theme.of(context).colorScheme;
    
    if (error != null) {
      return Icon(Icons.error_outline, color: cs.error);
    }
    return const Icon(Icons.check_circle, color: Colors.green);
  }

  Future<void> _loadProfile() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _isLoading = true);

    try {
      // Force refresh to ensure we have the latest username from database
      final profile = await _profileService.getUserProfile(userId, forceRefresh: true);
      final nextChangeDate = await _usernameService.getNextUsernameChangeDate(userId);
      
      if (profile != null && mounted) {
        _profile = profile;
        _fullNameController.text = profile.fullName ?? '';
        _usernameController.text = profile.username ?? '';
        _originalUsername = profile.username;
        _bioController.text = profile.bio ?? '';
        _organizationController.text = profile.organization ?? '';
        _phoneController.text = profile.phone ?? '';
        _websiteController.text = profile.website ?? '';
        _linkedinController.text = profile.linkedinUrl ?? '';
        _twitterController.text = profile.twitterUrl ?? '';
        _githubController.text = profile.githubUrl ?? '';
        _selectedGradientId = profile.coverGradientId;
        
        _nextUsernameChangeDate = nextChangeDate;
        _canChangeUsername = nextChangeDate == null;
      }
    } catch (e) {
      _log.error('Failed to load profile: $e', tag: _tag);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickAvatar() async {
    HapticFeedback.mediumImpact();
    
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final pickedFile = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      // Show loading indicator
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Uploading avatar...')),
        );
      }

      // Read image bytes
      final imageBytes = await pickedFile.readAsBytes();
      final fileName = 'avatar_${DateTime.now().millisecondsSinceEpoch}.jpg';

      // Upload to Supabase storage
      final avatarUrl = await _profileService.uploadAvatar(userId, imageBytes, fileName);

      if (avatarUrl != null && mounted) {
        HapticFeedback.heavyImpact();
        setState(() {
          _newAvatarUrl = avatarUrl;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Avatar uploaded successfully'),
            backgroundColor: AppColors.success,
          ),
        );
      } else if (mounted) {
        HapticFeedback.vibrate();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to upload avatar'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      _log.error('Failed to pick avatar: $e', tag: _tag);
      if (mounted) {
        HapticFeedback.vibrate();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick image: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  /// Validates all fields and shows error banner if needed
  ProfileValidationResult _validateAllFields() {
    return _validationService.validateProfile(
      fullName: _fullNameController.text,
      username: _usernameController.text,
      bio: _bioController.text,
      organization: _organizationController.text,
      phone: _phoneController.text,
      website: _websiteController.text,
      linkedinUrl: _linkedinController.text,
      twitterUrl: _twitterController.text,
      githubUrl: _githubController.text,
      usernameAvailable: _usernameAvailable,
      canChangeUsername: _canChangeUsername,
    );
  }

  /// Scrolls to and focuses the first error field
  void _scrollToFirstError(ProfileValidationResult result) {
    if (result.errors.isEmpty) return;
    
    final firstErrorField = result.errors.first.fieldName;
    final key = _fieldKeys[firstErrorField];
    final focusNode = _focusNodes[firstErrorField];
    
    if (key?.currentContext != null) {
      Scrollable.ensureVisible(
        key!.currentContext!,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
        alignment: 0.3,
      ).then((_) {
        focusNode?.requestFocus();
      });
    }
  }

  Future<void> _saveProfile() async {
    HapticFeedback.lightImpact();
    
    // Run comprehensive validation
    final validation = _validateAllFields();
    
    if (!validation.isValid) {
      HapticFeedback.vibrate();
      
      setState(() {
        _validationResult = validation;
        _showValidationBanner = true;
      });
      
      // Scroll to first error
      _scrollToFirstError(validation);
      
      // Show snackbar with error count
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Please fix ${validation.errors.length} validation error${validation.errors.length > 1 ? 's' : ''}'
          ),
          backgroundColor: AppColors.error,
          action: SnackBarAction(
            label: 'View',
            textColor: Colors.white,
            onPressed: () {
              _scrollController.animateTo(
                0,
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
              );
            },
          ),
        ),
      );
      return;
    }
    
    // Clear any previous validation errors
    setState(() {
      _validationResult = null;
      _showValidationBanner = false;
    });
    
    if (!_formKey.currentState!.validate()) return;
    if (_profile == null) return;
    
    // Check username specific conditions
    final newUsername = _usernameController.text.trim();
    final usernameChanged = newUsername != (_originalUsername ?? '');

    setState(() => _isSaving = true);

    try {
      // Prepare old profile data for history tracking
      final oldProfileData = _profile!.toJson();
      
      final updatedProfile = _profile!.copyWith(
        fullName: _fullNameController.text.trim(),
        username: newUsername.isEmpty ? null : newUsername,
        usernameChangedAt: usernameChanged && newUsername.isNotEmpty 
            ? DateTime.now() 
            : _profile!.usernameChangedAt,
        bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
        organization: _organizationController.text.trim().isEmpty ? null : _organizationController.text.trim(),
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        website: _websiteController.text.trim().isEmpty ? null : _websiteController.text.trim(),
        linkedinUrl: _linkedinController.text.trim().isEmpty ? null : _linkedinController.text.trim(),
        twitterUrl: _twitterController.text.trim().isEmpty ? null : _twitterController.text.trim(),
        githubUrl: _githubController.text.trim().isEmpty ? null : _githubController.text.trim(),
        avatarUrl: _newAvatarUrl ?? _profile!.avatarUrl,
        coverImageUrl: _newCoverImageUrl ?? _profile!.coverImageUrl,
        coverGradientId: _selectedGradientId,
        updatedAt: DateTime.now(),
      );

      await _profileService.updateUserProfile(updatedProfile);
      
      // Invalidate profile cache to ensure all pages show updated data immediately
      // This is especially important for username changes
      // Wrapped in try-catch for web build compatibility (Hive may not be fully available on web)
      try {
        await CacheService.instance.invalidateProfileCache(_profile!.id);
        await CacheService.instance.cacheUserProfile(updatedProfile);
      } catch (cacheError) {
        _log.error('⚠️ Cache update skipped: $cacheError', tag: _tag);
      }
      
      // Track changes in history
      await _historyService.trackChanges(
        userId: _profile!.id,
        oldProfile: oldProfileData,
        newProfile: updatedProfile.toJson(),
      );
      
      // Clear draft on successful save
      await _draftService.clearDraft();

      if (mounted) {
        HapticFeedback.heavyImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        HapticFeedback.vibrate();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }
  
  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
  
  Widget _buildUsernameCooldownBanner() {
    if (_nextUsernameChangeDate == null) return const SizedBox.shrink();
    
    final daysRemaining = _nextUsernameChangeDate!.difference(DateTime.now()).inDays;
    final cs = Theme.of(context).colorScheme;
    
    return Semantics(
      label: 'Username is locked. $daysRemaining days remaining until you can change it.',
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cs.secondaryContainer,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: cs.secondary.withOpacity(0.3),
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.schedule,
              size: 20,
              color: cs.secondary,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Username locked',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: cs.onSecondaryContainer,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    daysRemaining > 0
                        ? 'You can change your username in $daysRemaining day${daysRemaining == 1 ? '' : 's'}'
                        : 'You can change your username on ${_formatDate(_nextUsernameChangeDate!)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: cs.onSecondaryContainer.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String? _validateUrl(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final uri = Uri.tryParse(value);
    if (uri == null || !uri.hasScheme || (!uri.scheme.startsWith('http'))) {
      return 'Please enter a valid URL';
    }
    return null;
  }

  void _showCoverPicker() {
    HapticFeedback.mediumImpact();
    
    showCoverImagePicker(
      context: context,
      currentImageUrl: _newCoverImageUrl ?? _profile?.coverImageUrl,
      currentGradientId: _selectedGradientId,
      onSelectGradient: (gradientId) {
        HapticFeedback.selectionClick();
        setState(() {
          _selectedGradientId = gradientId;
          _newCoverImageUrl = null; // Clear custom image when selecting gradient
        });
      },
      onSelectImage: (imageBytes, fileName) async {
        final userId = SupabaseConfig.auth.currentUser?.id;
        if (userId == null) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Uploading cover image...')),
        );

        try {
          final coverUrl = await _profileService.uploadCoverImage(userId, imageBytes, fileName);
          if (coverUrl != null && mounted) {
            HapticFeedback.heavyImpact();
            setState(() {
              _newCoverImageUrl = coverUrl;
              _selectedGradientId = null; // Clear gradient when uploading custom image
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Cover image uploaded'),
                backgroundColor: AppColors.success,
              ),
            );
          }
        } catch (e) {
          if (mounted) {
            HapticFeedback.vibrate();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to upload: $e'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        }
      },
      onRemove: () {
        HapticFeedback.lightImpact();
        setState(() {
          _selectedGradientId = null;
          _newCoverImageUrl = null;
        });
      },
    );
  }

  Widget _buildCoverBannerSection() {
    final cs = Theme.of(context).colorScheme;
    final currentCoverUrl = _newCoverImageUrl ?? _profile?.coverImageUrl;
    final currentGradientId = _selectedGradientId;
    
    // Find matching gradient theme
    CoverGradientTheme? gradientTheme;
    if (currentGradientId != null) {
      gradientTheme = CoverGradientTheme.presets.firstWhere(
        (t) => t.id == currentGradientId,
        orElse: () => CoverGradientTheme.presets.first,
      );
    }

    return Semantics(
      label: 'Cover banner. Tap to change cover image or select a gradient theme.',
      button: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'COVER BANNER',
            style: context.textStyles.labelSmall?.withColor(AppColors.textMuted),
          ),
          const SizedBox(height: AppSpacing.sm),
          GestureDetector(
            onTap: _showCoverPicker,
            child: Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: cs.outline.withValues(alpha: 0.3)),
                gradient: gradientTheme != null
                    ? LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: gradientTheme.colors,
                      )
                    : null,
                image: currentCoverUrl != null && gradientTheme == null
                    ? DecorationImage(
                        image: NetworkImage(currentCoverUrl),
                        fit: BoxFit.cover,
                      )
                    : null,
                color: currentCoverUrl == null && gradientTheme == null
                    ? cs.surfaceContainerHighest
                    : null,
              ),
              child: Stack(
                children: [
                  // Overlay for better icon visibility
                  if (currentCoverUrl != null || gradientTheme != null)
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.black.withValues(alpha: 0.2),
                      ),
                    ),
                  // Edit icon
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.edit_outlined, color: Colors.white, size: 18),
                          const SizedBox(width: 6),
                          Text(
                            currentCoverUrl != null || gradientTheme != null
                                ? 'Change Cover'
                                : 'Add Cover',
                            style: context.textStyles.labelMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Gradient name badge
                  if (gradientTheme != null)
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          gradientTheme.name,
                          style: context.textStyles.labelSmall?.copyWith(
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryButton() {
    final cs = Theme.of(context).colorScheme;
    
    return Semantics(
      label: 'View profile change history. See previous usernames, avatars and more.',
      button: true,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          showProfileHistorySheet(context);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest.withOpacity(0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: cs.outlineVariant.withOpacity(0.3),
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.history,
                size: 20,
                color: cs.primary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Profile Change History',
                      style: context.textStyles.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'View previous usernames, avatars & more',
                      style: context.textStyles.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: cs.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Builds form field with key and focus node for accessibility
  Widget _buildFormField({
    required String fieldName,
    required TextEditingController controller,
    required String label,
    String? hint,
    bool required = false,
    int? maxLength,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? prefixText,
    String? helperText,
  }) {
    return Semantics(
      label: '$label${required ? ', required field' : ''}',
      textField: true,
      child: Column(
        key: _fieldKeys[fieldName],
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: controller,
            focusNode: _focusNodes[fieldName],
            decoration: InputDecoration(
              labelText: required ? '$label *' : label,
              hintText: hint,
              prefixText: prefixText,
              border: const OutlineInputBorder(),
              helperText: helperText,
              suffixIcon: _getValidationSuffixIcon(fieldName, controller),
              counterText: maxLength != null ? '${controller.text.length}/$maxLength' : null,
            ),
            maxLength: maxLength,
            maxLines: maxLines,
            keyboardType: keyboardType,
            onChanged: maxLength != null ? (_) => setState(() {}) : null,
            validator: required ? (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Please enter your $label';
              }
              if (value.trim().length < 2) {
                return '$label must be at least 2 characters';
              }
              return null;
            } : null,
          ),
          _buildInlineError(fieldName, controller),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_hasUnsavedChanges,
      onPopInvokedWithResult: (didPop, result) async {
        if (!didPop && _hasUnsavedChanges) {
          final shouldLeave = await _showDiscardDialog();
          if (shouldLeave && context.mounted) {
            Navigator.of(context).pop();
          }
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Edit Profile'),
          actions: [
            if (!_isLoading)
              Semantics(
                label: _hasUnsavedChanges ? 'Save changes, you have unsaved changes' : 'Save profile',
                button: true,
                child: Stack(
                  children: [
                    TextButton(
                      onPressed: _isSaving ? null : _saveProfile,
                      child: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save'),
                    ),
                    // Unsaved changes indicator
                    if (_hasUnsavedChanges && !_isSaving)
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
        body: _isLoading
            ? SafeArea(
                child: ListView(
                  padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: AppSpacing.md),
                  children: [
                    const Center(
                      child: ShimmerPlaceholder(
                        width: 100,
                        height: 100,
                        isCircle: true,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    ...List.generate(8, (index) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: FadeSlideTransition(
                        delay: staggerDelay(index),
                        child: ShimmerPlaceholder(
                          width: double.infinity,
                          height: 56,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    )),
                  ],
                ),
              )
            : Form(
                key: _formKey,
                child: ListView(
                  controller: _scrollController,
                  padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: AppSpacing.md),
                  children: [
                    // Validation Error Banner
                    if (_showValidationBanner && _validationResult != null)
                      ValidationErrorBanner(
                        validationResult: _validationResult!,
                        onDismiss: () => setState(() => _showValidationBanner = false),
                      ),
                    
                    // Profile Completeness Card
                    if (_profile != null) ...[
                      ProfileCompletenessCard(
                        profile: _profile!,
                        onFieldTap: () {
                          // Scroll to first incomplete field
                        },
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],
                    
                    // Profile History Button
                    _buildHistoryButton(),
                    const SizedBox(height: AppSpacing.md),
                    
                    // Draft restored indicator
                    if (_hasPendingDraft) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.tertiaryContainer.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.restore,
                              size: 16,
                              color: Theme.of(context).colorScheme.tertiary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Draft restored',
                              style: context.textStyles.labelSmall?.copyWith(
                                color: Theme.of(context).colorScheme.onTertiaryContainer,
                              ),
                            ),
                            const Spacer(),
                            GestureDetector(
                              onTap: () {
                                setState(() => _hasPendingDraft = false);
                              },
                              child: Icon(
                                Icons.close,
                                size: 16,
                                color: Theme.of(context).colorScheme.onTertiaryContainer,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],
                    
                    // Cover Banner Section
                    _buildCoverBannerSection(),
                    const SizedBox(height: AppSpacing.lg),
                    
                    // Avatar Section with Hero animation
                    Semantics(
                      label: 'Profile photo. Tap to change your photo.',
                      button: true,
                      child: Center(
                        child: Column(
                          children: [
                            Stack(
                              children: [
                                AnimatedHero(
                                  tag: HeroConfig.profileAvatarTag(_profile?.id ?? 'avatar'),
                                  child: CircleAvatar(
                                    radius: 50,
                                    backgroundColor: Theme.of(context).colorScheme.primary,
                                    backgroundImage: (_newAvatarUrl ?? _profile?.avatarUrl) != null
                                        ? NetworkImage(_newAvatarUrl ?? _profile!.avatarUrl!)
                                        : null,
                                    child: (_newAvatarUrl ?? _profile?.avatarUrl) == null
                                        ? Text(
                                            (_profile?.fullName ?? 'U')[0].toUpperCase(),
                                            style: context.textStyles.displaySmall?.copyWith(
                                              color: Theme.of(context).colorScheme.onPrimary,
                                            ),
                                          )
                                        : null,
                                  ),
                                ),
                                if (_newAvatarUrl != null)
                                  Positioned(
                                    right: 0,
                                    top: 0,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: AppColors.success,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.white, width: 2),
                                      ),
                                      child: const Icon(Icons.check, size: 16, color: Colors.white),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            TextButton.icon(
                              onPressed: _pickAvatar,
                              icon: const Icon(Icons.camera_alt),
                              label: const Text('Change Photo'),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Personal Info Section
                    Text(
                      'PERSONAL INFO',
                      style: context.textStyles.labelSmall?.withColor(AppColors.textMuted),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    
                    _buildFormField(
                      fieldName: 'fullName',
                      controller: _fullNameController,
                      label: 'Full name',
                      hint: 'Enter your full name',
                      required: true,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    // Username cooldown banner
                    if (!_canChangeUsername) _buildUsernameCooldownBanner(),
                    
                    // Username field
                    if (_canChangeUsername) ...[
                      Container(
                        key: _fieldKeys['username'],
                        child: UsernameField(
                          controller: _usernameController,
                          excludeUserId: _profile?.id,
                          fullName: _fullNameController.text,
                          initialValue: _originalUsername,
                          showStrengthIndicator: true,
                          onAvailabilityChanged: (available) {
                            setState(() => _usernameAvailable = available);
                          },
                        ),
                      ),
                    ] else ...[
                      TextFormField(
                        controller: _usernameController,
                        enabled: false,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w500,
                        ),
                        decoration: InputDecoration(
                          labelText: 'Username',
                          prefixText: '@',
                          prefixStyle: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                          border: const OutlineInputBorder(),
                          filled: true,
                          fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.5),
                          disabledBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildFormField(
                      fieldName: 'bio',
                      controller: _bioController,
                      label: 'Bio',
                      hint: 'Tell others about yourself',
                      maxLength: 500,
                      maxLines: 4,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildFormField(
                      fieldName: 'organization',
                      controller: _organizationController,
                      label: 'Organization',
                      hint: 'Company or institution',
                      maxLength: 120,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildFormField(
                      fieldName: 'phone',
                      controller: _phoneController,
                      label: 'Phone',
                      hint: '+91 98765 43210',
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Links Section
                    Text(
                      'LINKS',
                      style: context.textStyles.labelSmall?.withColor(AppColors.textMuted),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    
                    _buildFormField(
                      fieldName: 'website',
                      controller: _websiteController,
                      label: 'Website',
                      hint: 'https://example.com',
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildFormField(
                      fieldName: 'linkedin',
                      controller: _linkedinController,
                      label: 'LinkedIn',
                      hint: 'https://linkedin.com/in/username',
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildFormField(
                      fieldName: 'twitter',
                      controller: _twitterController,
                      label: 'Twitter',
                      hint: 'https://twitter.com/username',
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildFormField(
                      fieldName: 'github',
                      controller: _githubController,
                      label: 'GitHub',
                      hint: 'https://github.com/username',
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
      ),
    );
  }
}
