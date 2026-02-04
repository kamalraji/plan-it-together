import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/registration_flow_service.dart';

/// Registration form sheet for collecting attendee details
class RegistrationFormSheet extends StatefulWidget {
  final Event event;
  final RegistrationFlowService flowService;
  final String userName;
  final String userEmail;
  final String? userPhone;
  final VoidCallback onBack;
  final VoidCallback onContinue;

  const RegistrationFormSheet({
    super.key,
    required this.event,
    required this.flowService,
    required this.userName,
    required this.userEmail,
    this.userPhone,
    required this.onBack,
    required this.onContinue,
  });

  @override
  State<RegistrationFormSheet> createState() => _RegistrationFormSheetState();
}

class _RegistrationFormSheetState extends State<RegistrationFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _organizationController;
  late final TextEditingController _roleController;
  
  String? _dietaryRequirement;
  bool _agreedToTerms = false;

  final List<String> _dietaryOptions = [
    'No restrictions',
    'Vegetarian',
    'Vegan',
    'Halal',
    'Kosher',
    'Gluten-free',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    final responses = widget.flowService.formResponses;
    
    _nameController = TextEditingController(
      text: responses['name'] as String? ?? widget.userName,
    );
    _emailController = TextEditingController(
      text: responses['email'] as String? ?? widget.userEmail,
    );
    _phoneController = TextEditingController(
      text: responses['phone'] as String? ?? widget.userPhone ?? '',
    );
    _organizationController = TextEditingController(
      text: responses['organization'] as String? ?? '',
    );
    _roleController = TextEditingController(
      text: responses['role'] as String? ?? '',
    );
    _dietaryRequirement = responses['dietary'] as String? ?? _dietaryOptions.first;
    _agreedToTerms = widget.flowService.agreedToTerms;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _organizationController.dispose();
    _roleController.dispose();
    super.dispose();
  }

  void _saveFormData() {
    widget.flowService.setFormResponses({
      'name': _nameController.text.trim(),
      'email': _emailController.text.trim(),
      'phone': _phoneController.text.trim(),
      'organization': _organizationController.text.trim(),
      'role': _roleController.text.trim(),
      'dietary': _dietaryRequirement,
    });
    widget.flowService.setAgreedToTerms(_agreedToTerms);
  }

  void _handleContinue() {
    if (_formKey.currentState?.validate() ?? false) {
      if (!_agreedToTerms) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please agree to the terms and conditions'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }

      HapticFeedback.mediumImpact();
      _saveFormData();
      widget.onContinue();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: theme.colorScheme.outline.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                IconButton(
                  onPressed: () {
                    _saveFormData();
                    widget.onBack();
                  },
                  icon: const Icon(Icons.arrow_back),
                  style: IconButton.styleFrom(
                    backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Attendee Details',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    'Step 2',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Form content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Name field
                    _FormField(
                      label: 'Full Name',
                      isRequired: true,
                      child: TextFormField(
                        controller: _nameController,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                          hintText: 'Enter your full name',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Name is required';
                          }
                          return null;
                        },
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Email field
                    _FormField(
                      label: 'Email',
                      isRequired: true,
                      child: TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          hintText: 'Enter your email',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Email is required';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                              .hasMatch(value)) {
                            return 'Enter a valid email';
                          }
                          return null;
                        },
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Phone field
                    _FormField(
                      label: 'Phone',
                      isRequired: false,
                      child: TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          hintText: 'Enter your phone number',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Organization field
                    _FormField(
                      label: 'Organization / Company',
                      isRequired: false,
                      child: TextFormField(
                        controller: _organizationController,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                          hintText: 'Your organization or company',
                          prefixIcon: Icon(Icons.business_outlined),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Role field
                    _FormField(
                      label: 'Role / Title',
                      isRequired: false,
                      child: TextFormField(
                        controller: _roleController,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                          hintText: 'Your role or job title',
                          prefixIcon: Icon(Icons.work_outline),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Dietary requirements
                    _FormField(
                      label: 'Dietary Requirements',
                      isRequired: false,
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _dietaryOptions.map((option) {
                          final isSelected = _dietaryRequirement == option;
                          return ChoiceChip(
                            label: Text(option),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) {
                                HapticFeedback.selectionClick();
                                setState(() => _dietaryRequirement = option);
                              }
                            },
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Terms and conditions
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest
                            .withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 24,
                            height: 24,
                            child: Checkbox(
                              value: _agreedToTerms,
                              onChanged: (value) {
                                HapticFeedback.selectionClick();
                                setState(() => _agreedToTerms = value ?? false);
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                setState(() => _agreedToTerms = !_agreedToTerms);
                              },
                              child: Text.rich(
                                TextSpan(
                                  text: 'I agree to the ',
                                  children: [
                                    TextSpan(
                                      text: 'Terms & Conditions',
                                      style: TextStyle(
                                        color: theme.colorScheme.primary,
                                        fontWeight: FontWeight.w500,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                    const TextSpan(
                                      text:
                                          ' and consent to share my information with the event organizers.',
                                    ),
                                  ],
                                ),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Continue button
                    FilledButton(
                      onPressed: _handleContinue,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Review Order',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  final String label;
  final bool isRequired;
  final Widget child;

  const _FormField({
    required this.label,
    required this.isRequired,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
            if (isRequired) ...[
              const SizedBox(width: 4),
              Text(
                '*',
                style: TextStyle(
                  color: theme.colorScheme.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
