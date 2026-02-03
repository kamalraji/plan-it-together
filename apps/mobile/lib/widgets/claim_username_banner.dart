import 'package:flutter/material.dart';

/// A banner prompting users without a username to claim one.
/// 
/// Displays a card with an @ icon and call-to-action to navigate
/// to profile editing and claim a unique username.
class ClaimUsernameBanner extends StatelessWidget {
  final VoidCallback? onClaim;

  const ClaimUsernameBanner({super.key, this.onClaim});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.all(12),
      color: cs.primaryContainer,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: cs.primary.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onClaim,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.alternate_email,
                  color: cs.onPrimary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Claim your @username',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: cs.onPrimaryContainer,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Get a unique handle before someone else does!',
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onPrimaryContainer.withOpacity(0.75),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: cs.onPrimaryContainer,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
