# Vercel Multi-Environment Setup Guide

## Overview

This guide helps you set up Vercel deployment with three environments:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STRATEGY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   main branch ─────────► Production                              │
│                          organizer.thittam1hub.com               │
│                                                                  │
│   staging branch ──────► Staging                                 │
│                          staging.thittam1hub.com                 │
│                                                                  │
│   feature/* branches ──► Preview                                 │
│                          feature-xxx.thittam1hub.vercel.app      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Connect GitHub to Lovable

1. Go to **Project Settings** → **GitHub**
2. Click **Connect project**
3. Authorize the Lovable GitHub App
4. Create or select a repository

---

## Step 2: Create Vercel Account & Project

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

---

## Step 3: Get Vercel Credentials

### Get Vercel Token
1. Go to [Vercel Settings → Tokens](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name: `github-actions`
4. Scope: Full Account
5. Copy the token

### Get Org ID & Project ID
1. Go to your Vercel project settings
2. Scroll to **General** section
3. Copy **Project ID** and **Team ID** (Org ID)

---

## Step 4: Add GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Description |
|-------------|-------------|
| `VERCEL_TOKEN` | Your Vercel API token |
| `VERCEL_ORG_ID` | Your Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |
| `VITE_SUPABASE_URL` | Production Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production Supabase anon key |
| `VITE_SUPABASE_URL_STAGING` | Staging Supabase URL (optional) |
| `VITE_SUPABASE_PUBLISHABLE_KEY_STAGING` | Staging Supabase key (optional) |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN |

---

## Step 5: Configure Custom Domains

### Production Domain (organizer.thittam1hub.com)

1. Go to Vercel Project → **Settings** → **Domains**
2. Add `organizer.thittam1hub.com`
3. Configure DNS at your registrar:
   ```
   Type: CNAME
   Name: organizer
   Value: cname.vercel-dns.com
   ```

### Staging Domain (staging.thittam1hub.com)

1. Add `staging.thittam1hub.com` in Vercel
2. Go to **Git** settings
3. Under **Production Branch**, keep `main`
4. Add a **Branch Domain**:
   - Branch: `staging`
   - Domain: `staging.thittam1hub.com`

### DNS Configuration

At your domain registrar (GoDaddy, Cloudflare, etc.):

```
# Production
organizer.thittam1hub.com  CNAME  cname.vercel-dns.com

# Staging  
staging.thittam1hub.com    CNAME  cname.vercel-dns.com

# OR for apex domain
thittam1hub.com            A      76.76.21.21
```

---

## Step 6: Create Staging Branch

```bash
# Create staging branch from main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

---

## Step 7: Environment Variables in Vercel

1. Go to Vercel Project → **Settings** → **Environment Variables**
2. Add variables for each environment:

| Variable | Production | Staging | Preview |
|----------|------------|---------|---------|
| `VITE_SUPABASE_URL` | prod-url | staging-url | staging-url |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | prod-key | staging-key | staging-key |
| `VITE_SENTRY_DSN` | dsn | dsn | - |
| `VITE_ENVIRONMENT` | production | staging | preview |
| `VITE_ENABLE_API_LOGGING` | false | true | true |

---

## Workflow Explained

### Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, commit, push
git add .
git commit -m "Add new feature"
git push -u origin feature/new-feature

# → Automatic preview deployment
# → URL commented on PR
```

### Staging Release

```bash
# Merge feature to staging
git checkout staging
git merge feature/new-feature
git push origin staging

# → Deploys to staging.thittam1hub.com
```

### Production Release

```bash
# Merge staging to main
git checkout main
git merge staging
git push origin main

# → Deploys to organizer.thittam1hub.com
# → Creates release tag
```

---

## Rollback Procedure

### Quick Rollback (Vercel Dashboard)

1. Go to Vercel Project → **Deployments**
2. Find the last working deployment
3. Click **...** → **Promote to Production**

### Git Rollback

```bash
# Revert the last commit
git checkout main
git revert HEAD
git push origin main

# → Triggers new deployment with reverted code
```

---

## Monitoring

### Deployment Status

- Check GitHub Actions for build status
- Check Vercel dashboard for deployment logs
- Check Sentry for runtime errors

### Health Checks

The workflow includes automatic health checks:
- Staging: `curl https://staging.thittam1hub.com`
- Production: `curl https://organizer.thittam1hub.com`

---

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs
2. Run `npm run build` locally to reproduce
3. Check TypeScript errors: `npx tsc --noEmit`

### Domain Not Working

1. Verify DNS propagation: `dig organizer.thittam1hub.com`
2. Check Vercel domain settings
3. Wait up to 48 hours for DNS propagation

### Environment Variables Missing

1. Check Vercel project settings
2. Ensure variables are set for correct environment
3. Redeploy after adding variables

---

## File Structure

```
/
├── vercel.json                        # Vercel configuration
├── .github/
│   └── workflows/
│       └── vercel-deploy.yml          # Multi-environment workflow
├── .env                               # Local development
├── .env.staging                       # Staging template
└── .env.production                    # Production template
```

---

## Next Steps

1. [ ] Connect GitHub repository to Lovable
2. [ ] Create Vercel account and project
3. [ ] Add GitHub secrets
4. [ ] Configure custom domains
5. [ ] Create staging branch
6. [ ] Test preview deployment with feature branch
7. [ ] Test staging deployment
8. [ ] Test production deployment

---

*Last updated: February 2025*
