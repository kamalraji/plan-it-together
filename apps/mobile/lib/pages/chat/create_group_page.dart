import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/chat_group.dart';
import '../../services/group_chat_service.dart';
import '../../services/group_icon_service.dart';
import '../../widgets/styled_text_field.dart';
import '../../widgets/styled_button.dart';
import '../../theme.dart';

class CreateGroupPage extends StatefulWidget {
  const CreateGroupPage({super.key});

  @override
  State<CreateGroupPage> createState() => _CreateGroupPageState();
}

class _CreateGroupPageState extends State<CreateGroupPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _groupService = GroupChatService();
  final _iconService = GroupIconService();

  bool _isPublic = false;
  bool _isLoading = false;
  final List<String> _selectedMembers = [];
  
  // Icon selection
  Uint8List? _selectedIconBytes;
  String? _selectedIconName;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
  
  Future<void> _pickIcon() async {
    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );
      
      if (image == null) return;
      
      final bytes = await image.readAsBytes();
      if (bytes.length > 2 * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Image is too large (max 2MB)')),
          );
        }
        return;
      }
      
      setState(() {
        _selectedIconBytes = bytes;
        _selectedIconName = image.name;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }

  Future<void> _createGroup() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Create group first
      final groupResult = await _groupService.createGroup(
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        memberIds: _selectedMembers,
        isPublic: _isPublic,
      );

      if (!groupResult.isSuccess) {
        throw Exception(groupResult.errorMessage ?? 'Failed to create group');
      }
      final group = groupResult.data;
      
      // Upload icon if selected
      if (_selectedIconBytes != null && _selectedIconName != null) {
        await _iconService.uploadIconFromBytes(
          groupId: group.id,
          bytes: _selectedIconBytes!,
          fileName: _selectedIconName!,
          logEvent: false,
        );
      }

      if (mounted) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Group'),
        centerTitle: true,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding, vertical: 16),
          children: [
            // Group Icon with picker
            Center(
              child: GestureDetector(
                onTap: _pickIcon,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                    image: _selectedIconBytes != null
                        ? DecorationImage(
                            image: MemoryImage(_selectedIconBytes!),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: _selectedIconBytes == null
                      ? Icon(
                          Icons.camera_alt_outlined,
                          size: 40,
                          color: AppColors.primary,
                        )
                      : null,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                _selectedIconBytes != null ? 'Tap to change' : 'Add Group Photo',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Group Name
            StyledTextField(
              controller: _nameController,
              label: 'Group Name',
              hint: 'Enter group name',
              prefixIcon: Icons.group,
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
            const SizedBox(height: 16),

            // Description
            StyledTextField(
              controller: _descriptionController,
              label: 'Description (Optional)',
              hint: 'What is this group about?',
              prefixIcon: Icons.description_outlined,
              maxLines: 3,
            ),
            const SizedBox(height: 24),

            // Privacy Toggle
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Theme.of(context).dividerColor,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: (_isPublic ? Colors.green : AppColors.primary)
                          .withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _isPublic ? Icons.public : Icons.lock_outline,
                      color: _isPublic ? Colors.green : AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isPublic ? 'Public Group' : 'Private Group',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          _isPublic
                              ? 'Anyone can find and join'
                              : 'Only invited members can join',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Switch.adaptive(
                    value: _isPublic,
                    onChanged: (value) => setState(() => _isPublic = value),
                    activeColor: AppColors.primary,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Add Members Section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Theme.of(context).dividerColor,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Add Members',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () async {
                          // TODO: Navigate to member selection page
                          // final selected = await Navigator.pushNamed(
                          //   context,
                          //   '/chat/groups/select-members',
                          // );
                          // if (selected != null) {
                          //   setState(() => _selectedMembers = selected);
                          // }
                        },
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add'),
                      ),
                    ],
                  ),
                  if (_selectedMembers.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                        child: Text(
                          'No members added yet.\nYou can add members after creating the group.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 14,
                          ),
                        ),
                      ),
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _selectedMembers.map((memberId) {
                        return Chip(
                          label: Text(memberId),
                          deleteIcon: const Icon(Icons.close, size: 18),
                          onDeleted: () {
                            setState(() => _selectedMembers.remove(memberId));
                          },
                        );
                      }).toList(),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Create Button
            StyledButton(
              onPressed: _isLoading ? null : _createGroup,
              label: _isLoading ? 'Creating...' : 'Create Group',
              icon: Icons.check,
              isLoading: _isLoading,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
