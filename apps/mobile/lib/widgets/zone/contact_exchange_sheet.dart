import 'package:flutter/material.dart';
import '../../models/impact_profile.dart';
import '../../supabase/networking_service.dart';
import '../styled_avatar.dart';
import '../styled_button.dart';

/// Bottom sheet for exchanging contact information
class ContactExchangeSheet extends StatefulWidget {
  final String eventId;
  final ImpactProfile targetProfile;
  final VoidCallback? onExchanged;

  const ContactExchangeSheet({
    super.key,
    required this.eventId,
    required this.targetProfile,
    this.onExchanged,
  });

  @override
  State<ContactExchangeSheet> createState() => _ContactExchangeSheetState();
}

class _ContactExchangeSheetState extends State<ContactExchangeSheet> {
  final NetworkingService _service = NetworkingService();

  bool _shareEmail = true;
  bool _sharePhone = false;
  bool _shareLinkedIn = true;
  bool _isLoading = false;

  Future<void> _exchangeContact() async {
    if (!_shareEmail && !_sharePhone && !_shareLinkedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one field to share')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final success = await _service.exchangeContact(
      eventId: widget.eventId,
      targetUserId: widget.targetProfile.userId,
      sharedFields: {
        'email': _shareEmail,
        'phone': _sharePhone,
        'linkedin': _shareLinkedIn,
      },
    );

    setState(() => _isLoading = false);

    if (!mounted) return;

    if (success) {
      widget.onExchanged?.call();
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Contact shared successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to share contact'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header with handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Title
            Row(
              children: [
                Icon(
                  Icons.share,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 12),
                Text(
                  'Share Your Contact',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            Text(
              'Choose what information to share with ${widget.targetProfile.fullName}',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.textTheme.bodyMedium?.color?.withOpacity(0.7),
              ),
            ),

            const SizedBox(height: 20),

            // Target profile
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: theme.dividerColor),
              ),
              child: Row(
                children: [
                  StyledAvatar(
                    imageUrl: widget.targetProfile.avatarUrl,
                    name: widget.targetProfile.fullName,
                    size: 48,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.targetProfile.fullName,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (widget.targetProfile.headline.isNotEmpty)
                          Text(
                            widget.targetProfile.headline,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.textTheme.bodySmall?.color
                                  ?.withOpacity(0.7),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Share options
            Text(
              'Select fields to share:',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),

            _buildShareOption(
              context,
              icon: Icons.email_outlined,
              label: 'Email Address',
              value: _shareEmail,
              onChanged: (v) => setState(() => _shareEmail = v ?? false),
            ),
            _buildShareOption(
              context,
              icon: Icons.phone_outlined,
              label: 'Phone Number',
              value: _sharePhone,
              onChanged: (v) => setState(() => _sharePhone = v ?? false),
            ),
            _buildShareOption(
              context,
              icon: Icons.link,
              label: 'LinkedIn Profile',
              value: _shareLinkedIn,
              onChanged: (v) => setState(() => _shareLinkedIn = v ?? false),
            ),

            const SizedBox(height: 24),

            // Info text
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 20,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'They will receive a notification and can view your shared info in their contacts.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Share button
            SizedBox(
              width: double.infinity,
              child: StyledButton(
                onPressed: _isLoading ? null : _exchangeContact,
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.share, size: 18),
                          SizedBox(width: 8),
                          Text('Share Contact'),
                        ],
                      ),
              ),
            ),

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption(
    BuildContext context, {
    required IconData icon,
    required String label,
    required bool value,
    required ValueChanged<bool?> onChanged,
  }) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: value ? theme.colorScheme.primary : theme.dividerColor,
        ),
      ),
      child: CheckboxListTile(
        value: value,
        onChanged: onChanged,
        title: Row(
          children: [
            Icon(icon, size: 20),
            const SizedBox(width: 12),
            Text(label),
          ],
        ),
        controlAffinity: ListTileControlAffinity.trailing,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}
