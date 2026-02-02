import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/settings_models.dart';
import 'package:thittam1hub/services/accessibility_service.dart';
import 'package:thittam1hub/mixins/settings_audit_mixin.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';

/// Language & Region Settings Page
class LanguageSettingsPage extends StatefulWidget {
  const LanguageSettingsPage({super.key});

  @override
  State<LanguageSettingsPage> createState() => _LanguageSettingsPageState();
}

class _LanguageSettingsPageState extends State<LanguageSettingsPage>
    with SettingsAuditMixin {
  final _localeService = LocaleService.instance;
  bool _isLoading = true;

  @override
  String get auditSettingType => 'locale';

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    await _localeService.loadSettings();
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  void _showLanguagePicker() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => _LanguagePickerSheet(
        currentCode: _localeService.languageCode,
        onSelected: (code) {
          final oldCode = _localeService.languageCode;
          HapticFeedback.selectionClick();
          _localeService.setLanguage(code);
          Navigator.pop(ctx);
          setState(() {});
          
          // Log the change
          logSettingChange(
            key: 'languageCode',
            oldValue: oldCode,
            newValue: code,
          );
          
          SettingsFeedback.showSuccess(context, 'Language updated');
        },
      ),
    );
  }

  void _showRegionPicker() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => _RegionPickerSheet(
        currentCode: _localeService.regionCode,
        onSelected: (code) {
          final oldCode = _localeService.regionCode;
          HapticFeedback.selectionClick();
          _localeService.setRegion(code);
          Navigator.pop(ctx);
          setState(() {});
          
          // Log the change
          logSettingChange(
            key: 'regionCode',
            oldValue: oldCode,
            newValue: code,
          );
          
          SettingsFeedback.showSuccess(context, 'Region updated');
        },
      ),
    );
  }

  void _showDateFormatPicker() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => _DateFormatPickerSheet(
        currentFormat: _localeService.dateFormat,
        onSelected: (format) {
          final oldFormat = _localeService.dateFormat;
          HapticFeedback.selectionClick();
          _localeService.setDateFormat(format);
          Navigator.pop(ctx);
          setState(() {});
          
          // Log the change
          logSettingChange(
            key: 'dateFormat',
            oldValue: oldFormat,
            newValue: format,
          );
          
          SettingsFeedback.showSuccess(context, 'Date format updated');
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Language & Region',
      isLoading: _isLoading,
      onRefresh: _loadSettings,
      skeletonSections: 1,
      body: ListenableBuilder(
        listenable: _localeService,
        builder: (context, _) {
          return SettingsSection(
            title: 'Language & Region',
            icon: Icons.language_outlined,
            iconColor: Colors.indigo,
            children: [
              SettingsAction(
                label: 'Language',
                subtitle: _localeService.settings.languageDisplayName,
                icon: Icons.translate_outlined,
                onTap: _showLanguagePicker,
              ),
              SettingsAction(
                label: 'Region',
                subtitle: _localeService.settings.regionDisplayName,
                icon: Icons.public_outlined,
                onTap: _showRegionPicker,
              ),
              SettingsAction(
                label: 'Date & Time Format',
                subtitle: '${_localeService.dateFormat}, ${_localeService.timeFormat}',
                icon: Icons.schedule_outlined,
                onTap: _showDateFormatPicker,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _LanguagePickerSheet extends StatelessWidget {
  final String currentCode;
  final ValueChanged<String> onSelected;

  const _LanguagePickerSheet({
    required this.currentCode,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Language selection',
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Select Language', style: context.textStyles.titleMedium),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: SupportedLanguage.all.length,
                itemBuilder: (context, index) {
                  final lang = SupportedLanguage.all[index];
                  final isSelected = lang.code == currentCode;
                  return Semantics(
                    label: '${lang.name} (${lang.nativeName})',
                    selected: isSelected,
                    child: ListTile(
                      leading: isSelected
                          ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary)
                          : const SizedBox(width: 24),
                      title: Text(lang.name),
                      subtitle: Text(lang.nativeName),
                      onTap: () => onSelected(lang.code),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RegionPickerSheet extends StatelessWidget {
  final String currentCode;
  final ValueChanged<String> onSelected;

  const _RegionPickerSheet({
    required this.currentCode,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Region selection',
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Select Region', style: context.textStyles.titleMedium),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: SupportedRegion.all.length,
                itemBuilder: (context, index) {
                  final region = SupportedRegion.all[index];
                  final isSelected = region.code == currentCode;
                  return Semantics(
                    label: '${region.flag} ${region.name}',
                    selected: isSelected,
                    child: ListTile(
                      leading: Text(region.flag, style: const TextStyle(fontSize: 24)),
                      title: Text(region.name),
                      trailing: isSelected
                          ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary)
                          : null,
                      onTap: () => onSelected(region.code),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateFormatPickerSheet extends StatelessWidget {
  final String currentFormat;
  final ValueChanged<String> onSelected;

  const _DateFormatPickerSheet({
    required this.currentFormat,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Date format selection',
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Date Format', style: context.textStyles.titleMedium),
            const SizedBox(height: 16),
            ...DateFormatOption.all.map((option) {
              final isSelected = option.format == currentFormat;
              return Semantics(
                label: '${option.format} example ${option.example}',
                selected: isSelected,
                child: ListTile(
                  leading: isSelected
                      ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary)
                      : const SizedBox(width: 24),
                  title: Text(option.format),
                  subtitle: Text('Example: ${option.example}'),
                  onTap: () => onSelected(option.format),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
