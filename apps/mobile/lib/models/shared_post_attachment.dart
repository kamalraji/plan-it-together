/// Model for shared post data in message attachments
class SharedPostAttachment {
  final String postId;
  final String title;
  final String contentPreview;
  final String authorName;
  final String? authorAvatar;
  final String? imageUrl;
  final String link;

  const SharedPostAttachment({
    required this.postId,
    required this.title,
    required this.contentPreview,
    required this.authorName,
    this.authorAvatar,
    this.imageUrl,
    required this.link,
  });

  /// Parse from raw attachment map
  static SharedPostAttachment? tryParse(dynamic attachment) {
    if (attachment is! Map) return null;
    
    final type = attachment['type'];
    if (type != 'shared_post') return null;
    
    try {
      return SharedPostAttachment(
        postId: attachment['post_id'] as String? ?? '',
        title: attachment['title'] as String? ?? 'Shared Post',
        contentPreview: attachment['content_preview'] as String? ?? '',
        authorName: attachment['author_name'] as String? ?? 'Unknown',
        authorAvatar: attachment['author_avatar'] as String?,
        imageUrl: attachment['image_url'] as String?,
        link: attachment['link'] as String? ?? '',
      );
    } catch (_) {
      return null;
    }
  }

  /// Check if a raw attachment is a shared post
  static bool isSharedPost(dynamic attachment) {
    if (attachment is! Map) return false;
    return attachment['type'] == 'shared_post';
  }
}
