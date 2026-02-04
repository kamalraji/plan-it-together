# Thittam1Hub Production Deployment Guide

## Overview

This document provides comprehensive guidance for deploying Thittam1Hub to production environments.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │───▶│   Supabase   │◀───│ Edge Functions│      │
│  │  (Lovable)   │    │  (Backend)   │    │   (78+)      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    Sentry    │    │  PostgreSQL  │    │   Storage    │      │
│  │  (Monitoring)│    │  (Database)  │    │  (Files)     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Pre-Deployment Checklist

### Security
- [ ] All RLS policies reviewed and secured
- [ ] Password leak protection enabled in Supabase
- [ ] API keys rotated for production
- [ ] Secrets stored securely (not in code)
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled

### Performance
- [ ] Database indexes optimized
- [ ] Edge functions tested under load
- [ ] Frontend bundle size < 500KB initial
- [ ] Lazy loading implemented for large components
- [ ] Image optimization enabled

### Monitoring
- [ ] Sentry DSN configured (`VITE_SENTRY_DSN`)
- [ ] Health check endpoints working
- [ ] Log aggregation in place
- [ ] Alerting configured for critical errors

### Deployment
- [ ] Feature flags set for gradual rollout
- [ ] Rollback procedure documented
- [ ] Database backup strategy in place
- [ ] DNS and SSL configured

---

## 🔧 Environment Configuration

### Node.js Version (CRITICAL)

This project requires **Node.js 20.19.0 LTS**. This is pinned in `.nvmrc`.

#### Vercel Configuration (Required)

Vercel ignores `.nvmrc` and `NODE_VERSION` env vars in `vercel.json`. You **MUST** set the Node version in the Vercel Dashboard:

1. Go to your Vercel project → **Settings** → **General**
2. Scroll to **Node.js Version**
3. Select **20.x** (or enter `20.19.0` if custom input is available)
4. Save and redeploy

#### Regenerate package-lock.json (Required if built on wrong Node version)

If your `package-lock.json` was generated on Node 24, you'll get esbuild binary mismatches. Fix:

```bash
# Ensure you're on Node 20
nvm install 20.19.0
nvm use 20.19.0
node -v  # Should show v20.19.0

# Regenerate lockfile
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Commit the new lockfile
git add package-lock.json
git commit -m "fix: regenerate package-lock on Node 20 LTS"
git push
```

#### Why Node 20 LTS?

- **Security**: LTS versions receive prioritized security patches until April 2026
- **Stability**: Battle-tested by AWS, Netflix, Airbnb, and enterprise deployments
- **Compatibility**: Most npm packages and build tools optimize for LTS versions
- **esbuild**: Native binaries are version-matched; mixing Node versions causes the "Expected X but got Y" error

---

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | ✅ |
| `VITE_SENTRY_DSN` | Sentry error tracking | ⚠️ Recommended |
| `VITE_APP_VERSION` | App version for tracking | Optional |

### Environment Files

```
.env                    # Local development
.env.staging            # Staging environment  
.env.production         # Production environment
```

### Sample Production Configuration

```env
# Supabase (Production Instance)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Monitoring
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
VITE_ENABLE_API_LOGGING=false
VITE_ENABLE_HEALTH_CHECK=true

# App Metadata
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

---

## 🚀 Deployment Methods

### Method 1: Lovable Built-in Deployment (Recommended)

1. **Test in Preview**
   - Make changes in the Lovable editor
   - Test thoroughly in the preview environment
   - Verify all features work as expected

2. **Publish to Production**
   - Click the **Publish** button in the top-right
   - Frontend changes deploy when you click "Update"
   - Backend changes (edge functions, migrations) deploy **immediately**

3. **Verify Deployment**
   - Check the published URL
   - Verify health check endpoint: `/functions/v1/health-check`
   - Monitor Sentry for any new errors

### Method 2: External Hosting (Vercel/Netlify)

For separate organizer app deployment:

```bash
# Build the application
npm run build

# Deploy to Vercel
npx vercel --prod

# Or deploy to Netlify
npx netlify deploy --prod
```

### Method 3: GitHub Actions (Automated)

The CI/CD pipeline (`.github/workflows/deploy-production.yml`) handles:
- Automated testing on push
- Security scanning
- Build verification
- Staging/Production deployment

---

## 🔒 Security Hardening

### 1. Row-Level Security (RLS)

Ensure all tables have proper RLS policies:

```sql
-- Example: Secure user data
CREATE POLICY "users_can_view_own_data" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_data" ON user_profiles
FOR UPDATE USING (auth.uid() = id);
```

### 2. Role-Based Access Control

Use the `has_role()` function for role checks:

```sql
-- Check if user is admin
SELECT has_role(auth.uid(), 'admin');

-- Use in RLS policies
CREATE POLICY "admins_can_view_all" ON events
FOR SELECT USING (
  visibility = 'PUBLIC' OR has_role(auth.uid(), 'admin')
);
```

### 3. Enable Password Protection

In Supabase Dashboard:
1. Go to **Authentication** > **Settings**
2. Enable **Leaked password protection**
3. Configure password requirements

---

## 📊 Monitoring & Observability

### Sentry Error Tracking

Sentry is pre-configured in `src/main.tsx`:

```typescript
// Production sampling rates
tracesSampleRate: 0.1,           // 10% of transactions
replaysSessionSampleRate: 0.1,   // 10% of sessions
replaysOnErrorSampleRate: 1.0,   // 100% of error sessions
```

### Health Check Endpoint

The `/functions/v1/health-check` endpoint returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "pass", "latencyMs": 45 },
    "auth": { "status": "pass", "latencyMs": 23 },
    "storage": { "status": "pass", "latencyMs": 67 }
  },
  "uptime": 3600
}
```

### Logging Strategy

| Level | Development | Staging | Production |
|-------|-------------|---------|------------|
| DEBUG | ✅ | ✅ | ❌ |
| INFO | ✅ | ✅ | Minimal |
| WARN | ✅ | ✅ | ✅ |
| ERROR | ✅ | ✅ | ✅ + Alert |

---

## 🔄 Rollback Procedures

### Frontend Rollback (Lovable)

1. Go to the Lovable project settings
2. Navigate to **Versions** or **History**
3. Select a previous stable version
4. Click **Restore** to rollback

### Database Rollback

For schema changes:
1. Identify the breaking migration
2. Create a new migration to reverse changes
3. Test in preview environment first
4. Deploy to production

**⚠️ Important**: Data migrations cannot be automatically rolled back. Always backup before destructive operations.

---

## 🧪 Testing Strategy

### Pre-Deployment Testing

```bash
# Run all tests
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Post-Deployment Verification

1. **Health Check**: `curl https://your-domain.com/functions/v1/health-check`
2. **Smoke Tests**: Verify critical user flows work
3. **Error Monitoring**: Check Sentry for new errors
4. **Performance**: Monitor load times and API response times

---

## 📅 Feature Flag Rollout

Use feature flags for gradual releases:

```typescript
// In src/lib/featureFlags.ts
export const FEATURE_FLAGS = {
  NEW_FEATURE: {
    key: 'new_feature',
    defaultValue: false,
    rolloutPercentage: 10,  // Start at 10%
    enabledForGroups: ['beta_testers'],
  },
};
```

### Rollout Strategy

1. **0%** - Feature disabled for everyone
2. **10%** - Internal testing / beta users
3. **25%** - Early adopters
4. **50%** - Half of users
5. **100%** - Full rollout

---

## 🆘 Troubleshooting

### Common Issues

#### esbuild version mismatch
```
Error: Expected "0.25.12" but got "0.25.0"
```

**Cause**: `package-lock.json` was generated on a different Node version than the build environment.

**Fix**: 
1. Set Node 20.x in Vercel Dashboard → Settings → General → Node.js Version
2. Regenerate `package-lock.json` on Node 20 (see Node.js section above)

#### Vercel uses wrong Node version
```
Node.js v24.13.0
```

**Cause**: Vercel Dashboard overrides all other Node version settings (`.nvmrc`, env vars).

**Fix**: Set Node version in Vercel Dashboard → Settings → General → Node.js Version → Select 20.x

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Database Connection Issues
- Verify `VITE_SUPABASE_URL` is correct
- Check Supabase project status
- Verify RLS policies aren't blocking access

#### Edge Function Errors
- Check function logs in Supabase Dashboard
- Verify environment variables are set
- Test locally with `supabase functions serve`

### Support Channels

- **Documentation**: https://docs.lovable.dev
- **Supabase Docs**: https://supabase.com/docs
- **Discord**: Lovable Community

---

## 📚 Additional Resources

- [Lovable Documentation](https://docs.lovable.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Sentry Documentation](https://docs.sentry.io)
- [Vite Documentation](https://vitejs.dev)

---

*Last updated: February 2025*
