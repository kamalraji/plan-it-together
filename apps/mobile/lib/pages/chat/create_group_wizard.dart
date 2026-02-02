import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/chat_group.dart';
import '../../services/group_chat_service.dart';
import '../../services/group_icon_service.dart';
import '../../widgets/styled_text_field.dart';
import '../../widgets/styled_button.dart';
import '../../widgets/radio_card.dart';
import '../../widgets/animated_selection_chip.dart';
import '../../widgets/chat/group_shimmer.dart';
import '../../theme.dart';
import 'widgets/group_icon_picker_sheet.dart';

/// Premium multi-step group creation wizard
/// Features: 3 steps with animated transitions, progress indicator
class CreateGroupWizard extends StatefulWidget {
  const CreateGroupWizard({super.key});

  @override
  State<CreateGroupWizard> createState() => _CreateGroupWizardState();
}

class _CreateGroupWizardState extends State<CreateGroupWizard>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _pageController = PageController();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _groupService = GroupChatService();
  final _iconService = GroupIconService();

  int _currentStep = 0;
  bool _isLoading = false;

  // Step 1: Group Info
  Uint8List? _iconBytes;
  String? _iconFileName;
  Color? _gradientColor1;
  Color? _gradientColor2;

  // Step 2: Privacy & Settings
  bool _isPublic = false;
  bool _onlyAdminsCanSend = false;
  bool _onlyAdminsCanEdit = true;

  // Step 3: Add Members (simplified for creation)
  final List<SelectedMember> _selectedMembers = [];

  late AnimationController _progressController;
  late AnimationController _stepController;
  late Animation<double> _progressAnimation;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _stepController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _progressAnimation = CurvedAnimation(
      parent: _progressController,
      curve: Curves.easeOutCubic,
    );
    _progressController.forward();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _pageController.dispose();
    _progressController.dispose();
    _stepController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep == 0) {
      if (!_formKey.currentState!.validate()) return;
    }

    if (_currentStep < 2) {
      HapticFeedback.lightImpact();
      setState(() => _currentStep++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    } else {
      _createGroup();
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      HapticFeedback.lightImpact();
      setState(() => _currentStep--);
      _pageController.previousPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    } else {
      Navigator.pop(context);
    }
  }

  Future<void> _createGroup() async {
    setState(() => _isLoading = true);

    try {
      // Create group
      final groupResult = await _groupService.createGroup(
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        memberIds: _selectedMembers.map((m) => m.userId).toList(),
        isPublic: _isPublic,
      );

      if (!groupResult.isSuccess) {
        throw Exception(groupResult.errorMessage ?? 'Failed to create group');
      }

      final group = groupResult.data;

      // Upload icon if selected
      if (_iconBytes != null && _iconFileName != null) {
        await _iconService.uploadIconFromBytes(
          groupId: group.id,
          bytes: _iconBytes!,
          fileName: _iconFileName!,
          logEvent: false,
        );
      }

      // Apply settings
      if (_onlyAdminsCanSend) {
        await _groupService.setOnlyAdminsCanSend(group.id, true);
      }
      if (_onlyAdminsCanEdit) {
        await _groupService.setOnlyAdminsCanEdit(group.id, true);
      }

      if (mounted) {
        HapticFeedback.heavyImpact();
        Navigator.of(context).pop(group);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Group "${group.name}" created!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create group: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showIconPicker() {
    GroupIconPickerSheet.show(
      context: context,
      initialLetter: _nameController.text.isNotEmpty 
          ? _nameController.text[0] 
          : 'G',
      onImageSelected: (bytes, fileName) {
        setState(() {
          _iconBytes = bytes;
          _iconFileName = fileName;
          _gradientColor1 = null;
          _gradientColor2 = null;
        });
      },
      onGradientSelected: (color1, color2, initial) {
        setState(() {
          _iconBytes = null;
          _iconFileName = null;
          _gradientColor1 = color1;
          _gradientColor2 = color2;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(_stepTitle),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(_currentStep == 0 ? Icons.close : Icons.arrow_back),
          onPressed: _previousStep,
        ),
      ),
      body: Column(
        children: [
          // Progress indicator
          _buildProgressIndicator(cs),
          
          // Page content
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildStep1GroupInfo(cs),
                _buildStep2Privacy(cs),
                _buildStep3Members(cs),
              ],
            ),
          ),

          // Bottom action bar
          _buildBottomBar(cs),
        ],
      ),
    );
  }

  String get _stepTitle {
    switch (_currentStep) {
      case 0:
        return 'Group Info';
      case 1:
        return 'Privacy & Permissions';
      case 2:
        return 'Add Members';
      default:
        return 'Create Group';
    }
  }

  Widget _buildProgressIndicator(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.xl,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: List.generate(3, (index) {
          final isActive = index <= _currentStep;
          final isCurrent = index == _currentStep;

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    height: 4,
                    decoration: BoxDecoration(
                      color: isActive
                          ? cs.primary
                          : cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                if (index < 2) const SizedBox(width: 4),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStep1GroupInfo(ColorScheme cs) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(context.horizontalPadding),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.lg),
            
            // Icon picker
            GestureDetector(
              onTap: _showIconPicker,
              child: _buildIconPreview(cs),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextButton(
              onPressed: _showIconPicker,
              child: Text(
                _iconBytes != null || _gradientColor1 != null
                    ? 'Change Photo'
                    : 'Add Photo',
                style: TextStyle(color: cs.primary),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // Group name
            StyledTextField(
              controller: _nameController,
              label: 'Group Name',
              hint: 'Enter a name for your group',
              prefixIcon: Icons.group,
              maxLength: 50,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a group name';
                }
                if (value.trim().length < 3) {
                  return 'Name must be at least 3 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // Description
            StyledTextField(
              controller: _descriptionController,
              label: 'Description (Optional)',
              hint: 'What is this group about?',
              prefixIcon: Icons.description_outlined,
              maxLines: 3,
              maxLength: 200,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIconPreview(ColorScheme cs) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: _iconBytes == null && _gradientColor1 == null
            ? cs.primary.withOpacity(0.1)
            : null,
        gradient: _gradientColor1 != null
            ? LinearGradient(
                colors: [_gradientColor1!, _gradientColor2!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: cs.primary.withOpacity(0.3),
          width: 2,
        ),
        image: _iconBytes != null
            ? DecorationImage(
                image: MemoryImage(_iconBytes!),
                fit: BoxFit.cover,
              )
            : null,
        boxShadow: [
          BoxShadow(
            color: (_gradientColor1 ?? cs.primary).withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: _iconBytes == null && _gradientColor1 == null
          ? Icon(
              Icons.camera_alt_rounded,
              size: 48,
              color: cs.primary,
            )
          : _gradientColor1 != null
              ? Center(
                  child: Text(
                    (_nameController.text.isNotEmpty
                            ? _nameController.text[0]
                            : 'G')
                        .toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              : null,
    );
  }

  Widget _buildStep2Privacy(ColorScheme cs) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(context.horizontalPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: AppSpacing.md),
          
          // Group visibility
          Text(
            'Group Visibility',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          
          RadioCard<bool>(
            value: false,
            groupValue: _isPublic,
            onChanged: (v) => setState(() => _isPublic = v),
            icon: Icons.lock_outline,
            title: 'Private Group',
            subtitle: 'Only invited members can join',
            iconColor: AppColors.violet500,
          ),
          const SizedBox(height: AppSpacing.sm),
          RadioCard<bool>(
            value: true,
            groupValue: _isPublic,
            onChanged: (v) => setState(() => _isPublic = v),
            icon: Icons.public,
            title: 'Public Group',
            subtitle: 'Anyone can find and join',
            iconColor: AppColors.emerald500,
          ),

          const SizedBox(height: AppSpacing.xl),

          // Messaging permissions
          Text(
            'Messaging Permissions',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          
          RadioCard<bool>(
            value: false,
            groupValue: _onlyAdminsCanSend,
            onChanged: (v) => setState(() => _onlyAdminsCanSend = v),
            icon: Icons.chat_bubble_outline,
            title: 'Everyone Can Send',
            subtitle: 'All members can send messages',
            iconColor: AppColors.blue500,
          ),
          const SizedBox(height: AppSpacing.sm),
          RadioCard<bool>(
            value: true,
            groupValue: _onlyAdminsCanSend,
            onChanged: (v) => setState(() => _onlyAdminsCanSend = v),
            icon: Icons.admin_panel_settings_outlined,
            title: 'Admins Only',
            subtitle: 'Only admins can send messages',
            iconColor: AppColors.amber500,
          ),

          const SizedBox(height: AppSpacing.xl),

          // Edit permissions
          Text(
            'Edit Permissions',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          
          RadioCard<bool>(
            value: false,
            groupValue: _onlyAdminsCanEdit,
            onChanged: (v) => setState(() => _onlyAdminsCanEdit = v),
            icon: Icons.edit_outlined,
            title: 'Everyone Can Edit',
            subtitle: 'All members can edit group info',
            iconColor: AppColors.teal500,
          ),
          const SizedBox(height: AppSpacing.sm),
          RadioCard<bool>(
            value: true,
            groupValue: _onlyAdminsCanEdit,
            onChanged: (v) => setState(() => _onlyAdminsCanEdit = v),
            icon: Icons.security,
            title: 'Admins Only',
            subtitle: 'Only admins can edit group info',
            iconColor: AppColors.pink500,
          ),
        ],
      ),
    );
  }

  Widget _buildStep3Members(ColorScheme cs) {
    return Column(
      children: [
        // Selected members preview
        if (_selectedMembers.isNotEmpty) ...[
          SelectionChipRow(
            members: _selectedMembers,
            onRemove: (userId) {
              setState(() {
                _selectedMembers.removeWhere((m) => m.userId == userId);
              });
            },
          ),
          const SizedBox(height: AppSpacing.md),
          Divider(color: cs.outline.withOpacity(0.2)),
        ],

        // Empty state or member list
        Expanded(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.group_add_outlined,
                    size: 48,
                    color: cs.primary,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Add Members Later',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: cs.onSurface,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 48),
                  child: Text(
                    'You can skip this step and add members after creating the group.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(ColorScheme cs) {
    return Container(
      padding: EdgeInsets.all(context.horizontalPadding),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
          top: BorderSide(color: cs.outline.withOpacity(0.1)),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Step indicator
            Text(
              'Step ${_currentStep + 1} of 3',
              style: TextStyle(
                color: cs.onSurfaceVariant,
                fontSize: 13,
              ),
            ),
            const Spacer(),
            // Action button
            StyledButton(
              onPressed: _isLoading ? null : _nextStep,
              label: _currentStep == 2 ? 'Create Group' : 'Continue',
              icon: _currentStep == 2 ? Icons.check : Icons.arrow_forward,
              isLoading: _isLoading,
            ),
          ],
        ),
      ),
    );
  }
}
