import 'package:flutter/material.dart';
import '../../models/security_preferences_models.dart';
import '../../services/enhanced_security_service.dart';

class SessionTimeoutSheet extends StatefulWidget {
  const SessionTimeoutSheet({super.key});

  @override
  State<SessionTimeoutSheet> createState() => _SessionTimeoutSheetState();
}

class _SessionTimeoutSheetState extends State<SessionTimeoutSheet> {
  final _securityService = EnhancedSecurityService.instance;
  bool _loading = true;
  bool _saving = false;
  int _selectedTimeout = 30;
  bool _idleTimeoutEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await _securityService.getSecurityPreferences();
    if (mounted) {
      setState(() {
        _selectedTimeout = prefs.sessionTimeoutMinutes;
        _idleTimeoutEnabled = prefs.idleTimeoutEnabled;
        _loading = false;
      });
    }
  }

  Future<void> _saveTimeout(int minutes) async {
    setState(() => _saving = true);
    
    final success = await _securityService.updateSessionTimeout(minutes);
    
    if (mounted) {
      setState(() {
        _saving = false;
        if (success) _selectedTimeout = minutes;
      });
      
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Session timeout updated'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _toggleIdleTimeout(bool enabled) async {
    setState(() => _saving = true);
    
    final success = await _securityService.updateIdleTimeoutEnabled(enabled);
    
    if (mounted) {
      setState(() {
        _saving = false;
        if (success) _idleTimeoutEnabled = enabled;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurface.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.timer_outlined,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Session Timeout',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Auto-logout after inactivity',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(40),
              child: CircularProgressIndicator(),
            )
          else
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Enable/Disable toggle
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.security,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Idle Timeout',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  'Lock app after period of inactivity',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _idleTimeoutEnabled,
                            onChanged: _saving ? null : _toggleIdleTimeout,
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    Text(
                      'Timeout Duration',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Choose how long before the app locks',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Timeout options
                    ...SessionTimeoutOption.all.map((option) {
                      final isSelected = _selectedTimeout == option.minutes;
                      
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Material(
                          color: isSelected
                              ? theme.colorScheme.primary.withOpacity(0.1)
                              : theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            onTap: _saving || !_idleTimeoutEnabled
                                ? null
                                : () => _saveTimeout(option.minutes),
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  Icon(
                                    option.minutes == 0
                                        ? Icons.lock_open
                                        : Icons.lock_clock,
                                    color: isSelected
                                        ? theme.colorScheme.primary
                                        : theme.colorScheme.onSurface.withOpacity(0.6),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Text(
                                      option.label,
                                      style: theme.textTheme.bodyLarge?.copyWith(
                                        fontWeight: isSelected ? FontWeight.w600 : null,
                                        color: !_idleTimeoutEnabled
                                            ? theme.colorScheme.onSurface.withOpacity(0.4)
                                            : null,
                                      ),
                                    ),
                                  ),
                                  if (isSelected)
                                    Icon(
                                      Icons.check_circle,
                                      color: theme.colorScheme.primary,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                    
                    const SizedBox(height: 16),
                    
                    // Info card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.amber.withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.info_outline,
                            color: Colors.amber.shade700,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Shorter timeouts provide better security but may require more frequent re-authentication.',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.amber.shade700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
