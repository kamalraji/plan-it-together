/// Time formatting utilities as a replacement for timeago package
/// Industrial best practice: minimal dependency, full control
library timeago;

/// Format a DateTime to a human-readable relative time string
String format(DateTime dateTime, {String? locale}) {
  final now = DateTime.now();
  final diff = now.difference(dateTime);
  
  if (diff.isNegative) {
    // Future time
    final absDiff = dateTime.difference(now);
    if (absDiff.inMinutes < 1) return 'in a moment';
    if (absDiff.inMinutes < 60) return 'in ${absDiff.inMinutes}m';
    if (absDiff.inHours < 24) return 'in ${absDiff.inHours}h';
    if (absDiff.inDays < 7) return 'in ${absDiff.inDays}d';
    return 'in ${absDiff.inDays ~/ 7}w';
  }
  
  if (diff.inSeconds < 30) return 'just now';
  if (diff.inMinutes < 1) return '${diff.inSeconds}s ago';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays == 1) return 'yesterday';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  if (diff.inDays < 30) return '${diff.inDays ~/ 7}w ago';
  if (diff.inDays < 365) return '${diff.inDays ~/ 30}mo ago';
  return '${diff.inDays ~/ 365}y ago';
}

/// Format a DateTime to a short relative time (no "ago" suffix)
String formatShort(DateTime dateTime) {
  final now = DateTime.now();
  final diff = now.difference(dateTime);
  
  if (diff.isNegative) return 'soon';
  if (diff.inSeconds < 60) return 'now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m';
  if (diff.inHours < 24) return '${diff.inHours}h';
  if (diff.inDays < 7) return '${diff.inDays}d';
  if (diff.inDays < 30) return '${diff.inDays ~/ 7}w';
  return '${diff.inDays ~/ 30}mo';
}
