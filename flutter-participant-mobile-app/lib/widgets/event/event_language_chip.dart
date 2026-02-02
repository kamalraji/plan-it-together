import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Displays event language as a chip
class EventLanguageChip extends StatelessWidget {
  final String languageCode;

  const EventLanguageChip({
    super.key,
    required this.languageCode,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: cs.outline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.translate, size: 16, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(_getLanguageName(languageCode), style: text.labelLarge),
        ],
      ),
    );
  }

  String _getLanguageName(String code) {
    const languageNames = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'bn': 'Bengali',
      'pa': 'Punjabi',
      'or': 'Odia',
      'as': 'Assamese',
      'ur': 'Urdu',
      'sa': 'Sanskrit',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'it': 'Italian',
    };
    return languageNames[code.toLowerCase()] ?? code.toUpperCase();
  }
}
