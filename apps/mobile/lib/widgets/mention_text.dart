import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

/// A text widget that renders @mentions as clickable links
class MentionText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextStyle? mentionStyle;
  final Function(String username)? onMentionTap;
  final int? maxLines;
  final TextOverflow? overflow;

  const MentionText({
    super.key,
    required this.text,
    this.style,
    this.mentionStyle,
    this.onMentionTap,
    this.maxLines,
    this.overflow,
  });

  static final _mentionRegex = RegExp(r'@(\w+)');

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final defaultStyle = style ?? Theme.of(context).textTheme.bodyMedium;
    final defaultMentionStyle = mentionStyle ??
        defaultStyle?.copyWith(
          color: cs.primary,
          fontWeight: FontWeight.w600,
        );

    final spans = <InlineSpan>[];
    int lastEnd = 0;

    for (final match in _mentionRegex.allMatches(text)) {
      // Add text before the mention
      if (match.start > lastEnd) {
        spans.add(TextSpan(
          text: text.substring(lastEnd, match.start),
          style: defaultStyle,
        ));
      }

      // Add the mention as a tappable span
      final username = match.group(1)!;
      spans.add(TextSpan(
        text: '@$username',
        style: defaultMentionStyle,
        recognizer: onMentionTap != null
            ? (TapGestureRecognizer()
              ..onTap = () => onMentionTap!(username))
            : null,
      ));

      lastEnd = match.end;
    }

    // Add remaining text
    if (lastEnd < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastEnd),
        style: defaultStyle,
      ));
    }

    // If no mentions found, return simple text
    if (spans.isEmpty) {
      return Text(
        text,
        style: defaultStyle,
        maxLines: maxLines,
        overflow: overflow,
      );
    }

    return RichText(
      text: TextSpan(children: spans),
      maxLines: maxLines,
      overflow: overflow ?? TextOverflow.clip,
    );
  }

  /// Extract all usernames mentioned in text
  static List<String> extractMentions(String text) {
    return _mentionRegex.allMatches(text).map((m) => m.group(1)!).toList();
  }

  /// Check if text contains any mentions
  static bool hasMentions(String text) {
    return _mentionRegex.hasMatch(text);
  }
}

/// Highlight mentions in a TextField controller
class MentionHighlightController extends TextEditingController {
  final Color mentionColor;

  MentionHighlightController({
    String? text,
    this.mentionColor = Colors.blue,
  }) : super(text: text);

  static final _mentionRegex = RegExp(r'@(\w+)');

  @override
  TextSpan buildTextSpan({
    required BuildContext context,
    TextStyle? style,
    required bool withComposing,
  }) {
    final spans = <InlineSpan>[];
    final text = this.text;
    int lastEnd = 0;

    for (final match in _mentionRegex.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(
          text: text.substring(lastEnd, match.start),
          style: style,
        ));
      }

      spans.add(TextSpan(
        text: match.group(0),
        style: style?.copyWith(
          color: mentionColor,
          fontWeight: FontWeight.w600,
        ),
      ));

      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastEnd),
        style: style,
      ));
    }

    return TextSpan(children: spans, style: style);
  }
}
