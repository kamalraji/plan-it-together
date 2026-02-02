import 'package:flutter/material.dart';
import '../../models/privacy_consent_models.dart';
import '../../services/privacy_service.dart';
import '../../theme.dart';

/// Bottom sheet for managing trusted devices
class TrustedDevicesSheet extends StatefulWidget {
  final List<TrustedDevice> devices;
  final VoidCallback? onUpdated;

  const TrustedDevicesSheet({
    super.key,
    required this.devices,
    this.onUpdated,
  });

  @override
  State<TrustedDevicesSheet> createState() => _TrustedDevicesSheetState();
}

class _TrustedDevicesSheetState extends State<TrustedDevicesSheet> {
  final _privacyService = PrivacyService.instance;
  late List<TrustedDevice> _devices;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _devices = List.from(widget.devices);
  }

  Future<void> _removeTrustedDevice(TrustedDevice device) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Trusted Device'),
        content: Text(
          'Remove "${device.deviceName}" from trusted devices? You\'ll need to verify again when logging in from this device.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);

    try {
      await _privacyService.removeTrustedDevice(device.id);
      setState(() {
        _devices.removeWhere((d) => d.id == device.id);
      });
      widget.onUpdated?.call();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Device removed from trusted list')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to remove device: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _addCurrentDevice() async {
    // Show dialog to configure trust settings
    final result = await showDialog<_TrustSettings>(
      context: context,
      builder: (context) => _AddTrustedDeviceDialog(),
    );

    if (result == null) return;

    setState(() => _isLoading = true);

    try {
      await _privacyService.addTrustedDevice(
        deviceId: 'device_${DateTime.now().millisecondsSinceEpoch}',
        deviceName: result.deviceName,
        deviceType: 'mobile',
        expiryDays: result.expiryDays,
      );

      await _privacyService.loadTrustedDevices();
      setState(() {
        _devices = _privacyService.trustedDevices;
      });
      widget.onUpdated?.call();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Device added as trusted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add device: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.devices,
                    color: cs.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Trusted Devices',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Skip 2FA on these devices',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                if (!_isLoading)
                  IconButton(
                    onPressed: _addCurrentDevice,
                    icon: const Icon(Icons.add_circle_outline),
                    tooltip: 'Trust This Device',
                  ),
              ],
            ),
          ),

          const Divider(),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            )
          else if (_devices.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Icon(
                    Icons.devices_other,
                    size: 64,
                    color: cs.onSurface.withOpacity(0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No Trusted Devices',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add this device as trusted to skip 2FA verification for future logins.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurface.withOpacity(0.6),
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _addCurrentDevice,
                    icon: const Icon(Icons.add),
                    label: const Text('Trust This Device'),
                  ),
                ],
              ),
            )
          else
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _devices.length,
                itemBuilder: (context, index) {
                  final device = _devices[index];
                  return _DeviceTile(
                    device: device,
                    onRemove: () => _removeTrustedDevice(device),
                  );
                },
              ),
            ),

          // Info
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cs.primary.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: cs.primary.withOpacity(0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: cs.primary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Trusted devices skip 2FA for faster login. Remove devices you no longer use.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurface.withOpacity(0.7),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DeviceTile extends StatelessWidget {
  final TrustedDevice device;
  final VoidCallback onRemove;

  const _DeviceTile({
    required this.device,
    required this.onRemove,
  });

  IconData get _deviceIcon {
    switch (device.deviceType?.toLowerCase()) {
      case 'mobile':
        return Icons.smartphone;
      case 'tablet':
        return Icons.tablet;
      case 'desktop':
        return Icons.computer;
      default:
        return Icons.devices;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: device.isCurrent
            ? Border.all(color: cs.primary.withOpacity(0.3))
            : null,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: device.isExpired
                  ? cs.error.withOpacity(0.1)
                  : cs.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _deviceIcon,
              color: device.isExpired ? cs.error : cs.primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        device.deviceName,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (device.isCurrent) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: cs.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'This device',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: cs.onPrimary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (device.os != null) ...[
                      Text(
                        device.os!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.onSurface.withOpacity(0.6),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('•', style: TextStyle(color: cs.onSurface.withOpacity(0.3))),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      device.expiryLabel,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: device.isExpired ? cs.error : cs.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: Icon(Icons.close, color: cs.error),
            tooltip: 'Remove',
          ),
        ],
      ),
    );
  }
}

class _TrustSettings {
  final String deviceName;
  final int expiryDays;

  _TrustSettings({
    required this.deviceName,
    required this.expiryDays,
  });
}

class _AddTrustedDeviceDialog extends StatefulWidget {
  const _AddTrustedDeviceDialog();

  @override
  State<_AddTrustedDeviceDialog> createState() => _AddTrustedDeviceDialogState();
}

class _AddTrustedDeviceDialogState extends State<_AddTrustedDeviceDialog> {
  final _nameController = TextEditingController(text: 'My Device');
  int _expiryDays = 30;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Trust This Device'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Device Name',
              hintText: 'e.g., My iPhone, Work Laptop',
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Trust Duration',
            style: Theme.of(context).textTheme.labelMedium,
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<int>(
            value: _expiryDays,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(value: 7, child: Text('7 days')),
              DropdownMenuItem(value: 30, child: Text('30 days')),
              DropdownMenuItem(value: 90, child: Text('90 days')),
              DropdownMenuItem(value: 365, child: Text('1 year')),
              DropdownMenuItem(value: -1, child: Text('Never expires')),
            ],
            onChanged: (v) => setState(() => _expiryDays = v ?? 30),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(
            context,
            _TrustSettings(
              deviceName: _nameController.text.trim(),
              expiryDays: _expiryDays,
            ),
          ),
          child: const Text('Trust'),
        ),
      ],
    );
  }
}
