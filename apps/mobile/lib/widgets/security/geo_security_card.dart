import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/security_preferences_models.dart';
import '../../services/enhanced_security_service.dart';

/// Card showing recent login locations for security awareness
class GeoSecurityCard extends StatefulWidget {
  final int maxLocations;
  final VoidCallback? onViewAll;

  const GeoSecurityCard({
    super.key,
    this.maxLocations = 5,
    this.onViewAll,
  });

  @override
  State<GeoSecurityCard> createState() => _GeoSecurityCardState();
}

class _GeoSecurityCardState extends State<GeoSecurityCard> {
  final _securityService = EnhancedSecurityService.instance;
  List<LoginAttempt> _recentLogins = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadLogins();
  }

  Future<void> _loadLogins() async {
    try {
      final logins = await _securityService.getRecentLoginAttempts(
        limit: widget.maxLocations,
      );
      if (mounted) {
        setState(() {
          _recentLogins = logins;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: theme.colorScheme.outline.withOpacity(0.1),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.location_on_outlined,
                    color: theme.colorScheme.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Recent Login Locations',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (widget.onViewAll != null)
                  TextButton(
                    onPressed: widget.onViewAll,
                    child: const Text('View All'),
                  ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_recentLogins.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(
                        Icons.location_off_outlined,
                        size: 40,
                        color: theme.colorScheme.onSurface.withOpacity(0.3),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No recent logins',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              Column(
                children: [
                  // Map placeholder (visual representation)
                  _buildLocationMap(theme),
                  const SizedBox(height: 16),
                  // List of recent logins
                  ..._recentLogins.map((login) => _buildLoginTile(login, theme)),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationMap(ThemeData theme) {
    // Get unique locations
    final locations = _recentLogins
        .where((l) => l.locationCountry != null)
        .map((l) => l.displayLocation)
        .toSet()
        .toList();

    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.1),
        ),
      ),
      child: Stack(
        children: [
          // Grid pattern for map effect
          CustomPaint(
            size: const Size(double.infinity, 120),
            painter: _MapGridPainter(
              color: theme.colorScheme.outline.withOpacity(0.1),
            ),
          ),
          // Location markers
          if (locations.isNotEmpty)
            Center(
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: locations.take(4).map((loc) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: theme.colorScheme.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.location_on,
                          color: Colors.white,
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          loc,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLoginTile(LoginAttempt login, ThemeData theme) {
    final timeFormat = DateFormat('MMM d, h:mm a');
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
          borderRadius: BorderRadius.circular(10),
          border: !login.success
              ? Border.all(color: Colors.red.withOpacity(0.3))
              : null,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: login.success
                    ? Colors.green.withOpacity(0.1)
                    : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(
                login.success ? Icons.check : Icons.close,
                color: login.success ? Colors.green : Colors.red,
                size: 16,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    login.displayLocation,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    timeFormat.format(login.createdAt.toLocal()),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ),
            if (!login.success)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Failed',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.red.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Custom painter for map grid pattern
class _MapGridPainter extends CustomPainter {
  final Color color;

  _MapGridPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 0.5;

    // Horizontal lines
    for (double y = 0; y < size.height; y += 20) {
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y),
        paint,
      );
    }

    // Vertical lines
    for (double x = 0; x < size.width; x += 20) {
      canvas.drawLine(
        Offset(x, 0),
        Offset(x, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Alert banner for geo anomaly detection
class GeoAnomalyAlert extends StatelessWidget {
  final GeoAnomalyResult anomaly;
  final VoidCallback? onDismiss;
  final VoidCallback? onSecureAccount;

  const GeoAnomalyAlert({
    super.key,
    required this.anomaly,
    this.onDismiss,
    this.onSecureAccount,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isHighRisk = anomaly.isCritical || anomaly.isHigh;
    final color = isHighRisk ? Colors.red : Colors.orange;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isHighRisk ? Icons.security : Icons.warning_amber,
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getAlertTitle(),
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: color.shade700,
                      ),
                    ),
                    Text(
                      'Risk Level: ${anomaly.riskLevel.toUpperCase()}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: color.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              if (onDismiss != null)
                IconButton(
                  onPressed: onDismiss,
                  icon: Icon(Icons.close, color: color.shade600),
                ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          Text(
            anomaly.details,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: color.shade700,
            ),
          ),
          
          if (anomaly.recommendations.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...anomaly.recommendations.map((rec) => Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.arrow_right,
                    size: 16,
                    color: color.shade600,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      rec,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: color.shade600,
                      ),
                    ),
                  ),
                ],
              ),
            )),
          ],
          
          if (onSecureAccount != null && isHighRisk) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onSecureAccount,
                style: FilledButton.styleFrom(
                  backgroundColor: color,
                ),
                icon: const Icon(Icons.lock, size: 18),
                label: const Text('Secure My Account'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _getAlertTitle() {
    switch (anomaly.anomalyType) {
      case 'impossible_travel':
        return 'Impossible Travel Detected';
      case 'new_location':
        return 'Login from New Location';
      case 'new_country':
        return 'Login from New Country';
      case 'new_ip':
        return 'Login from Unknown IP';
      default:
        return 'Unusual Login Activity';
    }
  }
}
