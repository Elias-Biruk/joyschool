# JoyEdu Cloud Deployment Guide

## Architecture Overview

JoyEdu uses a modern cloud-native architecture:

- **Frontend**: Next.js 16.4.2 deployed on Vercel
- **Backend**: NestJS 12 REST API deployed on Render
- **Database**: Neon (managed PostgreSQL)
- **ORM**: Prisma 5.22.0 with connection pooling
- **Source Control**: GitHub with automated deployments

```
┌─────────────┐     HTTPS     ┌─────────────┐
│   Vercel    │ ◄────────────► │   Render    │
│  (Frontend) │               │  (Backend)  │
└─────────────┘               └──────┬──────┘
                                      │
                                      │ SSL/TLS
                                      │
                               ┌──────▼──────┐
                               │    Neon     │
                               │ (PostgreSQL)│
                               └─────────────┘
```

## Prerequisites

### Required Accounts

1. **GitHub** - Source code repository
2. **Vercel** - Frontend hosting (free tier available)
3. **Render** - Backend hosting (free tier available)
4. **Neon** - Managed PostgreSQL (free tier available)

### Local Development

- Node.js 18+
- Git
- PostgreSQL (optional, for local development)

## Phase 1: Neon Database Setup

### 1. Create Neon Project

1. Sign up at [https://neon.tech](https://neon.tech)
2. Create a new project named `joyschool`
3. Select a region closest to your users
4. Choose the free tier (0.5 GB storage, 1 compute hour/day)

### 2. Get Connection Strings

Neon provides two connection strings:

**Pooled Connection (for application use):**
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true
```

**Direct Connection (for migrations):**
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 3. Apply Migrations

```bash
cd backend
# Set direct connection for migrations
export DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
npm run prisma:migrate:deploy
```

Or use the provided script:
```bash
cd backend/prisma
chmod +x migrate-deploy.sh
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true" ./migrate-deploy.sh
```

### 4. Seed Database (Optional - Development Only)

⚠️ **Never seed production database**

```bash
cd backend
NODE_ENV=development DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require" npm run prisma:seed
```

The seed script includes a production guard and will exit with an error if `NODE_ENV=production`.

## Phase 2: Render Backend Deployment

### 1. Create Render Web Service

1. Sign up at [https://render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Root Directory:** `backend`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

**Environment Variables:**

| Variable | Value | Sync to GitHub |
|----------|-------|----------------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` | Yes |
| `DATABASE_URL` | *Neon pooled connection string* | No |
| `JWT_SECRET` | *Generate 32+ char random string* | No |
| `JWT_REFRESH_SECRET` | *Generate 32+ char random string* | No |
| `FRONTEND_URL` | *Your Vercel domain* | No |
| `OBSERVE_APP_KEY` | *Optional - from observe.nestjs.com* | No |
| `OBSERVE_APP_SECRET` | *Optional - from observe.nestjs.com* | No |
| `RATE_LIMIT_TTL` | `60000` | Yes |
| `RATE_LIMIT_LIMIT` | `10` | Yes |

**Health Check Path:** `/api/health`

### 2. Render Configuration File

The repository includes `backend/render.yaml` for Render Blueprint deployment:

```yaml
services:
  - type: web
    name: joyschool-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /api/health
```

### 3. Free Tier Limitations

- **Cold starts**: Free tier services spin down after 15 minutes of inactivity (30-60s cold start)
- **RAM**: 512 MB limit
- **CPU**: Shared CPU
- **Build time**: 15 minutes limit
- **Sleep**: Services sleep after 15 minutes of inactivity

## Phase 3: Vercel Frontend Deployment

### 1. Create Vercel Project

1. Sign up at [https://vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:

**Root Directory:** `frontend`

**Framework Preset:** Next.js

**Build Command:** `npm run build`

**Output Directory:** `.next`

**Install Command:** `npm install`

### 2. Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | *Your Render backend URL* | Production, Preview, Development |

Example: `https://joyschool-backend.onrender.com/api`

### 3. Vercel Configuration File

The repository includes `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### 4. Free Tier Limitations

- **Bandwidth**: 100 GB/month
- **Build time**: 6,000 minutes/month
- **Serverless Function execution**: 100 GB-hours/month
- **Edge Network**: Global CDN included

## Phase 4: GitHub Continuous Deployment

### Deployment Workflow

```
Git Push to GitHub
        ↓
┌───────────────┬───────────────┐
│               │               │
▼               ▼               ▼
Vercel         Render          Neon
Frontend       Backend         (No auto-deploy)
Build          Build           Manual migrations only
Deploy         Deploy
```

### Branch Strategy

**Production Branch:** `main` or `master`
- Deploys to production on both Vercel and Render

**Preview Branches:** Any other branch
- Creates preview deployments on Vercel
- Creates preview deployments on Render (if configured)

### Migration Safety

Migrations are **not** automatically applied. You must manually run migrations:

1. Deploy backend code to Render
2. SSH into the Render service or run migration script locally
3. Apply migrations: `npm run prisma:migrate:deploy`
4. Verify application health

### GitHub Actions (Optional)

For automated migrations, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm ci
      - run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

⚠️ **Never commit secrets to GitHub.** Use GitHub Secrets for sensitive values.

## Environment Variable Matrix

### Backend (Render)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Neon pooled connection | `postgresql://...` |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) | Random string |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret (32+ chars) | Random string |
| `NODE_ENV` | Yes | Environment | `production` |
| `PORT` | Yes | Server port | `10000` |
| `FRONTEND_URL` | Yes | Frontend origin for CORS | `https://joyschool.vercel.app` |
| `OBSERVE_APP_KEY` | No | NestJS Observe (optional) | From observe.nestjs.com |
| `OBSERVE_APP_SECRET` | No | NestJS Observe (optional) | From observe.nestjs.com |
| `RATE_LIMIT_TTL` | No | Rate limit window (ms) | `60000` |
| `RATE_LIMIT_LIMIT` | No | Max requests per window | `10` |

### Frontend (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `https://joyschool-backend.onrender.com/api` |

### Local Development

```bash
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/joyschool?schema=public"
JWT_SECRET="dev-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
NODE_ENV=development
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

## Safe Prisma Migration Procedure

### Development

```bash
cd backend
npm run prisma:migrate
```

### Production (Neon)

**Option 1: Direct Connection**
```bash
cd backend
export DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
npm run prisma:migrate:deploy
```

**Option 2: Using Script**
```bash
cd backend/prisma
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true" ./migrate-deploy.sh
```

### Migration Rollback

```bash
cd backend
export DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
npx prisma migrate resolve --rolled-back [migration-name]
```

### Important Notes

- Never use `prisma migrate dev` in production
- Never use `prisma db push` in production
- Always use direct connection (without pgbouncer) for migrations
- Test migrations on a staging database first
- Keep migration files in version control

## Verification Checklist

### Pre-Deployment

- [ ] Neon database created
- [ ] Migrations applied to Neon
- [ ] Render service configured with all env vars
- [ ] Vercel project configured with API URL
- [ ] GitHub repository connected to both services
- [ ] Secrets added to Render (not committed)
- [ ] Secrets added to Vercel (not committed)

### Post-Deployment

- [ ] Backend health check returns 200: `GET https://your-backend.onrender.com/api/health`
- [ ] Frontend loads at Vercel URL
- [ ] User registration works
- [ ] User login works and tokens are stored
- [ ] API calls from frontend to backend succeed
- [ ] CORS errors are absent
- [ ] Course listing loads
- [ ] Enrollment workflow works
- [ ] Quiz submission works
- [ ] Assignment submission works

## Logs and Troubleshooting

### Render Logs

1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. View real-time logs or download logs

### Vercel Logs

1. Go to Vercel dashboard
2. Select your project
3. Click "Logs" tab
4. View build logs and runtime logs

### Neon Logs

1. Go to Neon dashboard
2. Select your project
3. Click "SQL Editor" or "Logs"
4. View query logs and connection stats

### Common Issues

**Cold Start Delays:**
- Free tier services spin down after inactivity
- First request may take 30-60 seconds
- Consider paid tier for consistent performance

**Database Connection Errors:**
- Verify DATABASE_URL is correct
- Check if using pooled vs direct connection
- Ensure SSL is enabled (`sslmode=require`)

**CORS Errors:**
- Verify FRONTEND_URL matches Vercel domain exactly
- Check that credentials are enabled in CORS config
- Ensure API prefix is correct (`/api`)

**Build Failures:**
- Check build logs for specific errors
- Verify Node.js version compatibility
- Ensure all dependencies are in package.json

## Database Backup and Restore

### Neon Automatic Backups

Neon provides automatic backups:
- Point-in-time recovery (up to 7 days on free tier)
- Daily backups at no additional cost
- Branching for development/testing

### Manual Backup

```bash
# Export database
pg_dump "postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require" > backup.sql

# Restore database
psql "postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require" < backup.sql
```

### Neon Branching

Create a branch for testing:
```bash
# Via Neon CLI
npx neonctl branches create --name test-branch
```

## Rollback Procedure

### Application Rollback

**Render:**
1. Go to Render dashboard
2. Select your service
3. Click "Deployments"
4. Click "Rollback" on previous deployment

**Vercel:**
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click "..." on previous deployment → "Promote to Production"

### Database Rollback

```bash
cd backend
export DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
npx prisma migrate resolve --rolled-back [migration-name]
```

⚠️ **Database rollbacks may cause data loss if schema changes are not reversible.**

## Free Tier Limitations Summary

### Render Free Tier

- **RAM:** 512 MB
- **CPU:** Shared
- **Sleep:** After 15 minutes inactivity
- **Cold Start:** 30-60 seconds
- **Build Time:** 15 minutes
- **Bandwidth:** 100 GB/month (soft limit)

### Vercel Free Tier

- **Bandwidth:** 100 GB/month
- **Build Minutes:** 6,000/month
- **Serverless Function Execution:** 100 GB-hours/month
- **Edge Network:** Global CDN included
- **No cold starts** for static assets

### Neon Free Tier

- **Storage:** 0.5 GB
- **Compute:** 1 hour/day
- **Auto-suspend:** After 5 minutes inactivity
- **Cold Start:** 2-3 seconds
- **Point-in-time Recovery:** 7 days

## Production Recommendations

For production use, consider upgrading to paid tiers:

1. **Render:** Pro tier ($7/month) - No sleep, dedicated CPU
2. **Vercel:** Pro tier ($20/month) - More bandwidth, faster builds
3. **Neon:** Pro tier ($19/month) - More storage, more compute

## Security Considerations

1. **Secrets Management:**
   - Never commit `.env` files
   - Use Render/Vercel environment variables
   - Rotate secrets regularly
   - Use strong random secrets (32+ chars)

2. **Database Security:**
   - Always use SSL (`sslmode=require`)
   - Use connection pooling (pgbouncer)
   - Restrict database user permissions
   - Enable Neon's built-in security features

3. **API Security:**
   - JWT tokens expire after 15 minutes
   - Rate limiting configured (10 req/60s)
   - CORS restricted to frontend domain
   - Swagger disabled in production

## Support and Monitoring

### Health Endpoints

- Backend: `GET /api/health`
- Returns: `{ status: 'ok', database: 'connected', timestamp: '...' }`

### Monitoring

- **Render Logs:** Real-time application logs
- **Vercel Analytics:** Frontend performance
- **Neon Dashboard:** Database metrics
- **NestJS Observe:** Optional application telemetry

### Alerting

Configure alerts for:
- Backend health check failures
- High error rates
- Database connection failures
- High response times

## Previous Verification Results (2026-10-22)

### Test Results
- ✅ Backend unit tests: 3/3 suites passed, 5/5 tests passed (Exit code: 0)
- ✅ Backend E2E tests: 4/4 suites passed, 12/12 tests passed (Exit code: 0)
- ✅ Prisma migration status: Database schema is up to date (1 migration applied)
- ✅ Frontend build: Successful (16 static pages, 4 dynamic pages)

### Security Verification
- ✅ Unauthorized access blocked
- ✅ Cross-user data access blocked
- ✅ Invalid role permissions blocked
- ✅ Rate limiting configured
- ✅ Password complexity enforced
- ✅ XSS protection with DOMPurify
- ✅ Failed login tracking implemented
- ✅ CORS configured
- ✅ JWT-based authentication

### Code Changes for Cloud Deployment

**Backend Changes:**
- Added `/api/health` endpoint with database connectivity check
- Added environment variable validation at startup
- Made rate limiting configurable via env vars
- Disabled Swagger in production
- Added production error handling (no stack traces)
- Removed `--env-file` flags from start scripts
- Added `prisma:migrate:deploy` script
- Added production guard to seed script
- Updated `.env.example` with Neon connection examples
- Removed hardcoded Observe keys

**Frontend Changes:**
- Updated `.env.example` with production API URL
- Added `vercel.json` configuration

**New Files:**
- `backend/render.yaml` - Render Blueprint configuration
- `backend/prisma/migrate-deploy.sh` - Neon migration script
- `frontend/vercel.json` - Vercel configuration

## Deployment Sequence

### Initial Deployment

1. **Set up Neon database**
   - Create project
   - Get connection strings
   - Apply migrations

2. **Deploy backend to Render**
   - Connect GitHub
   - Configure environment variables
   - Deploy

3. **Deploy frontend to Vercel**
   - Connect GitHub
   - Set NEXT_PUBLIC_API_URL
   - Deploy

4. **Verify**
   - Health check
   - User registration
   - User login
   - Core workflows

### Subsequent Deployments

1. Push code to GitHub
2. Wait for automatic deployments
3. Run migrations if schema changed
4. Verify functionality

### Migration-Required Deployments

If you modify `prisma/schema.prisma`:

1. Create migration locally: `npm run prisma:migrate`
2. Commit migration files
3. Push to GitHub
4. Wait for backend deployment
5. Manually apply migrations to Neon
6. Verify application health

## Remaining Manual Steps

The following require manual configuration by the repository owner:

1. Create Neon account and project
2. Create Render account and connect GitHub
3. Create Vercel account and connect GitHub
4. Configure environment variablesRender (DATABASE_URL, JWT_SECRET, etc.)
5. Configure environment variables in Vercel (NEXT_PUBLIC_API_URL)
6. Apply initial migrations to Neon
7. (Optional) Configure GitHub Actions for automated migrations
8. (Optional) Set up monitoring and alerting

## Risks and Blockers

### Known Risks

1. **Cold Starts:** Free tier services may have 30-60s cold starts
2. **Database Limits:** Free tier has 0.5 GB storage limit
3. **Migration Safety:** Migrations must be applied manually
4. **Seed Protection:** Seed script has production guard but should be verified

### Blockers for Production

None - codebase is ready for cloud deployment with manual configuration.

### Recommendations

1. Test deployment on free tiers first
2. Upgrade to paid tiers before production traffic
3. Set up staging environment for testing
4. Configure monitoring and alerting
5. Document runbook procedures
6. Regular backup verification
