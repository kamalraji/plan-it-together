import 'package:thittam1hub/models/spark_post.dart';
import 'package:thittam1hub/models/paginated_list.dart';
import 'package:thittam1hub/repositories/spark_repository.dart';
import 'package:thittam1hub/repositories/base_repository.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Supabase implementation of SparkRepository
/// 
/// Handles all Spark (social feed) data operations with Supabase,
/// including caching, optimistic updates, and error handling.
class SupabaseSparkRepository extends BaseRepository implements SparkRepository {
  static SupabaseSparkRepository? _instance;
  static SupabaseSparkRepository get instance => _instance ??= SupabaseSparkRepository._();
  SupabaseSparkRepository._();

  @override
  String get tag => 'SparkRepository';

  final _supabase = SupabaseConfig.client;

  @override
  Future<Result<PaginatedList<SparkPost>>> getFeedPosts({
    int page = 0,
    int pageSize = 20,
    bool forceRefresh = false,
  }) {
    return execute(() async {
      final offset = page * pageSize;
      
      final response = await _supabase
          .from('spark_posts')
          .select('''
            *,
            author:impact_profiles!user_id(id, full_name, username, avatar_url),
            spark_reactions(user_id)
          ''')
          .order('created_at', ascending: false)
          .range(offset, offset + pageSize - 1);

      final posts = (response as List)
          .map((json) => SparkPost.fromJson(json))
          .toList();

      logDbOperation('SELECT', 'spark_posts', rowCount: posts.length);

      return PaginatedList(
        items: posts,
        page: page,
        pageSize: pageSize,
        hasMore: posts.length == pageSize,
      );
    }, operationName: 'getFeedPosts');
  }

  @override
  Future<Result<SparkPost?>> getPostById(String postId) {
    return execute(() async {
      final response = await _supabase
          .from('spark_posts')
          .select('''
            *,
            author:impact_profiles!user_id(id, full_name, username, avatar_url),
            spark_reactions(user_id)
          ''')
          .eq('id', postId)
          .maybeSingle();

      if (response == null) return null;
      
      logDbOperation('SELECT', 'spark_posts', rowCount: 1);
      return SparkPost.fromJson(response);
    }, operationName: 'getPostById');
  }

  @override
  Future<Result<List<SparkPost>>> getUserPosts(String userId, {int limit = 20}) {
    return execute(() async {
      final response = await _supabase
          .from('spark_posts')
          .select('''
            *,
            author:impact_profiles!user_id(id, full_name, username, avatar_url),
            spark_reactions(user_id)
          ''')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'spark_posts', rowCount: (response as List).length);
      return response.map((json) => SparkPost.fromJson(json)).toList();
    }, operationName: 'getUserPosts');
  }

  @override
  Future<Result<SparkPost>> createPost({
    required String content,
    List<Map<String, dynamic>>? attachments,
    String? repostId,
    String? linkedEventId,
    List<String>? hashtags,
  }) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final response = await _supabase
          .from('spark_posts')
          .insert({
            'user_id': userId,
            'content': content,
            'attachments': attachments,
            'repost_id': repostId,
            'linked_event_id': linkedEventId,
            'hashtags': hashtags,
          })
          .select('''
            *,
            author:impact_profiles!user_id(id, full_name, username, avatar_url)
          ''')
          .single();

      logDbOperation('INSERT', 'spark_posts', rowCount: 1);
      return SparkPost.fromJson(response);
    }, operationName: 'createPost');
  }

  @override
  Future<Result<SparkPost>> updatePost({
    required String postId,
    required String content,
    List<String>? hashtags,
  }) {
    return execute(() async {
      final response = await _supabase
          .from('spark_posts')
          .update({
            'content': content,
            'hashtags': hashtags,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', postId)
          .select('''
            *,
            author:impact_profiles!user_id(id, full_name, username, avatar_url)
          ''')
          .single();

      logDbOperation('UPDATE', 'spark_posts', rowCount: 1);
      return SparkPost.fromJson(response);
    }, operationName: 'updatePost');
  }

  @override
  Future<Result<bool>> deletePost(String postId) {
    return execute(() async {
      await _supabase
          .from('spark_posts')
          .delete()
          .eq('id', postId);

      logDbOperation('DELETE', 'spark_posts', rowCount: 1);
      return true;
    }, operationName: 'deletePost');
  }

  @override
  Future<Result<bool>> toggleSpark(String postId) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Check if already sparked
      final existing = await _supabase
          .from('spark_reactions')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

      if (existing != null) {
        // Remove spark
        await _supabase
            .from('spark_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);
        
        logDbOperation('DELETE', 'spark_reactions', rowCount: 1);
        return false;
      } else {
        // Add spark
        await _supabase
            .from('spark_reactions')
            .insert({
              'post_id': postId,
              'user_id': userId,
            });
        
        logDbOperation('INSERT', 'spark_reactions', rowCount: 1);
        return true;
      }
    }, operationName: 'toggleSpark');
  }

  @override
  Future<Result<bool>> hasSparked(String postId) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      final response = await _supabase
          .from('spark_reactions')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

      return response != null;
    }, operationName: 'hasSparked');
  }

  @override
  Future<Result<List<String>>> getSparkedPostIds({int limit = 100}) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return <String>[];

      final response = await _supabase
          .from('spark_reactions')
          .select('post_id')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'spark_reactions', rowCount: (response as List).length);
      return response.map((r) => r['post_id'] as String).toList();
    }, operationName: 'getSparkedPostIds');
  }

  @override
  Future<Result<bool>> bookmarkPost(String postId) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('spark_bookmarks')
          .upsert({
            'post_id': postId,
            'user_id': userId,
          }, onConflict: 'post_id,user_id');

      logDbOperation('UPSERT', 'spark_bookmarks', rowCount: 1);
      return true;
    }, operationName: 'bookmarkPost');
  }

  @override
  Future<Result<bool>> unbookmarkPost(String postId) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('spark_bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

      logDbOperation('DELETE', 'spark_bookmarks', rowCount: 1);
      return true;
    }, operationName: 'unbookmarkPost');
  }

  @override
  Future<Result<List<SparkPost>>> getBookmarkedPosts({int limit = 50}) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return <SparkPost>[];

      final response = await _supabase
          .from('spark_bookmarks')
          .select('''
            post:spark_posts(
              *,
              author:impact_profiles!user_id(id, full_name, username, avatar_url),
              spark_reactions(user_id)
            )
          ''')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      final posts = (response as List)
          .where((r) => r['post'] != null)
          .map((r) => SparkPost.fromJson(r['post']))
          .toList();

      logDbOperation('SELECT', 'spark_bookmarks', rowCount: posts.length);
      return posts;
    }, operationName: 'getBookmarkedPosts');
  }

  @override
  Future<Result<List<SparkPost>>> searchPosts(String query, {int limit = 20}) {
    return execute(() async {
      final response = await _supabase
          .from('spark_posts')
          .select('''
            *,
            author:impact_profiles!user_id(id, full_name, username, avatar_url),
            spark_reactions(user_id)
          ''')
          .or('content.ilike.%$query%,hashtags.cs.{$query}')
          .order('created_at', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'spark_posts', rowCount: (response as List).length);
      return response.map((json) => SparkPost.fromJson(json)).toList();
    }, operationName: 'searchPosts');
  }

  @override
  Future<Result<List<String>>> getTrendingHashtags({int limit = 10}) {
    return execute(() async {
      // Query recent posts and extract hashtags
      final response = await _supabase
          .from('spark_posts')
          .select('hashtags')
          .not('hashtags', 'is', null)
          .gte('created_at', DateTime.now().subtract(const Duration(days: 7)).toIso8601String())
          .limit(500);

      // Count hashtag occurrences
      final hashtagCounts = <String, int>{};
      for (final row in response as List) {
        final hashtags = row['hashtags'] as List?;
        if (hashtags != null) {
          for (final tag in hashtags) {
            final tagStr = tag.toString().toLowerCase();
            hashtagCounts[tagStr] = (hashtagCounts[tagStr] ?? 0) + 1;
          }
        }
      }

      // Sort by count and return top N
      final sorted = hashtagCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      return sorted.take(limit).map((e) => e.key).toList();
    }, operationName: 'getTrendingHashtags');
  }

  @override
  Future<Result<bool>> reportPost(String postId, String reason, {String? details}) {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('spark_reports')
          .insert({
            'post_id': postId,
            'reporter_id': userId,
            'reason': reason,
            'details': details,
          });

      logDbOperation('INSERT', 'spark_reports', rowCount: 1);
      return true;
    }, operationName: 'reportPost');
  }
}
