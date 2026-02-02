-- =============================================
-- PHASE 3: OBSERVABILITY MONITORING QUERIES
-- Industrial Best Practices - Production Monitoring
-- =============================================
-- These queries can be run in Supabase Dashboard to monitor system health

-- =============================================
-- 1. SECURITY MONITORING
-- =============================================

-- Failed login attempts in last 24 hours
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as failed_attempts,
  COUNT(DISTINCT ip_address) as unique_ips
FROM login_attempts 
WHERE success = false 
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Recent admin actions audit log
SELECT 
  a.action,
  a.target_type,
  a.admin_email,
  a.created_at,
  a.ip_address
FROM admin_audit_logs a
WHERE a.created_at > NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC
LIMIT 100;

-- =============================================
-- 2. PERFORMANCE MONITORING
-- =============================================

-- Top tables by sequential scans (performance hotspots)
SELECT 
  schemaname,
  relname as table_name,
  seq_scan,
  idx_scan,
  ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) as seq_scan_pct,
  n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY seq_scan DESC 
LIMIT 20;

-- Index usage efficiency
SELECT 
  schemaname,
  relname as table_name,
  indexrelname as index_name,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- Unused indexes (candidates for removal)
SELECT 
  schemaname,
  relname as table_name,
  indexrelname as index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- =============================================
-- 3. DATABASE HEALTH
-- =============================================

-- Table sizes and row counts
SELECT 
  relname as table_name,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as data_size,
  pg_size_pretty(pg_indexes_size(relid)) as indexes_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

-- Tables with high dead tuple ratio (need vacuum)
SELECT 
  relname as table_name,
  n_live_tup,
  n_dead_tup,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tuple_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY dead_tuple_pct DESC;

-- =============================================
-- 4. APPLICATION METRICS
-- =============================================

-- Active users in last 24 hours
SELECT COUNT(DISTINCT user_id) as active_users
FROM (
  SELECT user_id FROM registrations WHERE created_at > NOW() - INTERVAL '24 hours'
  UNION
  SELECT user_id FROM notifications WHERE created_at > NOW() - INTERVAL '24 hours'
  UNION
  SELECT author_id as user_id FROM spark_posts WHERE created_at > NOW() - INTERVAL '24 hours'
) as active;

-- Event registrations by status (last 7 days)
SELECT 
  e.name as event_name,
  r.status,
  COUNT(*) as count
FROM registrations r
JOIN events e ON r.event_id = e.id
WHERE r.created_at > NOW() - INTERVAL '7 days'
GROUP BY e.name, r.status
ORDER BY e.name, count DESC;

-- Notification delivery stats (last 24 hours)
SELECT 
  type,
  category,
  COUNT(*) as total,
  SUM(CASE WHEN read THEN 1 ELSE 0 END) as read_count,
  ROUND(100.0 * SUM(CASE WHEN read THEN 1 ELSE 0 END) / COUNT(*), 2) as read_rate_pct
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY type, category
ORDER BY total DESC;

-- =============================================
-- 5. RLS POLICY HEALTH CHECK
-- =============================================

-- Tables without RLS enabled (security risk)
SELECT 
  schemaname,
  tablename
FROM pg_tables pt
WHERE schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pc.relname = pt.tablename
      AND pn.nspname = pt.schemaname
      AND pc.relrowsecurity = true
  );

-- Policy count per table
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC;
