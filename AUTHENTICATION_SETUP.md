# JoyEdu Authentication System Setup Guide

This guide explains how to configure the new authentication features including Google OAuth, Resend email integration, onboarding, and profile management.

## Overview

The JoyEdu authentication system now includes:
- Google OAuth sign-in
- Email/password authentication with email verification
- Password reset via email
- Student/Teacher onboarding flow
- Profile management
- Resend email integration for transactional emails

## Prerequisites

- Google Cloud Console account
- Resend account (for email delivery)
- Access to backend environment variables (Render)
- Access to frontend environment variables (Vercel)

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API or Google Identity Platform

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for public apps) or **Internal** (for organization)
3. Fill in the required information:
   - App name: JoyEdu
   - User support email: your-email@domain.com
   - Developer contact email: your-email@domain.com
4. Add required scopes:
   - `email`
   - `profile`
   - `openid`
5. Save and continue (you can add test users during development)

### 3. Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: JoyEdu Web Client
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://joyschool-vwpd.vercel.app` (production)
6. Add authorized redirect URIs:
   - `http://localhost:3000/login` (development)
   - `https://joyschool-vwpd.vercel.app/login` (production)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

**Backend (Render):**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://joyschool-en2x.onrender.com/api/v1/auth/google/callback
```

**Frontend (Vercel):**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 5. Test Google Sign-In

1. Register the OAuth client in the Google Cloud Console
2. Add your email as a test user if using External consent screen
3. Navigate to the login page and click "Continue with Google"
4. Verify that the authentication flow works end-to-end

---

## Resend Email Setup

### 1. Create Resend Account

1. Go to [Resend](https://resend.com)
2. Sign up and verify your email
3. Navigate to **API Keys**

### 2. Create API Key

1. Click **Create API Key**
2. Name: JoyEdu Backend
3. Copy the API key (starts with `re_`)

### 3. Configure Sender Domain

**Option A: Use Resend's free testing sender (development only)**
- Resend provides a default sender like `onboarding@resend.dev`
- This sender can only send to verified email addresses
- Add your email as a verified recipient in Resend dashboard

**Option B: Verify your own domain (production)**
1. Navigate to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `joyschool.com`)
4. Add DNS records as instructed:
   - TXT record for verification
   - CNAME record for DKIM
   - MX records for email receiving (optional)
5. Wait for DNS propagation (usually a few minutes to hours)
6. Once verified, you can send from any address at your domain

### 4. Configure Environment Variables

**Backend (Render):**
```env
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://joyschool-vwpd.vercel.app
```

### 5. Test Email Delivery

1. In development, check backend logs for email content (Resend is not configured)
2. Once configured, test the password reset flow
3. Verify emails arrive in your inbox (check spam folder)

---

## Database Migration

The new authentication system requires the following database changes:

### New Fields in User Model:
- `provider` - Authentication provider ('google', 'email')
- `providerId` - External identity ID (Google sub claim)
- `emailVerificationToken` - Token for email verification
- `emailVerificationExpires` - Expiry for verification token
- `onboardingCompleted` - Boolean flag for onboarding status
- `passwordHash` - Now nullable (for OAuth-only accounts)

### Migration Applied:
The migration `20261023012459_add_oauth_and_onboarding` has been created and applied to the development database.

### Production Migration:
To apply this migration to production:
```bash
cd backend
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require" npx prisma migrate deploy
```

---

## Onboarding Flow

### User Journey:

1. **User Signs Up/In**
   - Via Google OAuth or email/password
   - Email verification required for email registration
   - Google users skip email verification if `email_verified=true`

2. **Onboarding Check**
   - Backend checks `onboardingCompleted` flag
   - If false, redirect to `/onboarding`

3. **Role Selection**
   - User selects Student or Teacher
   - Admin role cannot be self-assigned
   - Backend enforces role assignment

4. **Profile Completion**
   - Optional bio field
   - Students can add grade level/school (future enhancement)
   - Teachers can add expertise (future enhancement)

5. **Dashboard Redirect**
   - Students → `/dashboard`
   - Teachers → `/teacher`

### API Endpoint:
```
POST /api/v1/users/onboarding
Authorization: Bearer <access_token>
Body: { role: "STUDENT" | "TEACHER", bio?: string }
```

---

## Profile Management

### User Profile Page: `/profile`

Features:
- View and edit profile information
- Update first name, last name, bio
- Upload avatar (future enhancement)
- View account status (email verified, onboarding completed)
- Sign out

### API Endpoints:
```
GET /api/v1/users/profile
PUT /api/v1/users/profile
```

---

## Email Verification Flow

### For Email/Password Registration:

1. User registers with email and password
2. Backend generates verification token (24-hour expiry)
3. Resend sends verification email
4. User clicks link in email: `/verify-email?token=xxx`
5. Backend validates token and marks email as verified
6. User redirected to login

### Resend Verification:

Users can request a new verification email if needed:
```
POST /api/v1/auth/resend-verification
Body: { email: string }
```

### Google Users:

- Google users with `email_verified=true` skip email verification
- Google users with unverified emails are treated as unverified

---

## Password Reset Flow

### Request Reset:

1. User navigates to `/forgot-password`
2. Enters email address
3. Backend generates reset token (1-hour expiry)
4. Generic response sent (does not reveal if email exists)
5. Resend sends reset email

### Reset Password:

1. User clicks link in email: `/reset-password?token=xxx`
2. Enters new password
3. Backend validates token and updates password
4. User redirected to login

### API Endpoints:
```
POST /api/v1/auth/forgot-password
Body: { email: string }

POST /api/v1/auth/reset-password
Body: { token: string, newPassword: string }
```

---

## Security Considerations

### Implemented Security Measures:

1. **Google OAuth**
   - Backend validates Google ID tokens
   - Uses Google's stable `sub` claim as identity
   - Validates token signature, issuer, audience, expiry
   - Prevents account takeover via email collision

2. **Email Verification**
   - Cryptographically secure tokens
   - Token expiry enforced (24 hours)
   - Single-use tokens
   - Generic responses prevent account enumeration

3. **Password Reset**
   - Cryptographically secure tokens
   - Token expiry enforced (1 hour)
   - Single-use tokens
   - Invalidates existing sessions after reset

4. **Onboarding**
   - Admin role cannot be self-assigned
   - Backend enforces role checks
   - Prevents incomplete onboarding from accessing protected features

5. **Resend Integration**
   - API key stored only on backend
   - Never exposed to frontend
   - Graceful degradation if not configured
   - Logs contain no sensitive data

### Additional Recommendations:

1. Enable rate limiting on all auth endpoints (already implemented)
2. Use HTTPS in production (required for OAuth)
3. Implement account lockout after failed login attempts (already implemented)
4. Consider adding 2FA for sensitive operations
5. Regular security audits of OAuth configuration

---

## Troubleshooting

### Google OAuth Issues:

**Problem:** "Error 400: redirect_uri_mismatch"
- Solution: Ensure authorized redirect URIs in Google Console match exactly

**Problem:** "API key not allowed"
- Solution: Verify Client ID is correct and not restricted

**Problem:** Google sign-in popup blocked
- Solution: Check browser popup blocker settings

### Resend Email Issues:

**Problem:** Emails not arriving
- Solution: Check Resend dashboard for delivery logs
- Solution: Verify sender domain is properly configured
- Solution: Check spam folder

**Problem:** "From address not verified"
- Solution: Add your domain to Resend and verify DNS records
- Solution: Use Resend's testing sender for development

### Database Issues:

**Problem:** Migration fails
- Solution: Check DATABASE_URL uses direct connection (no pgbouncer)
- Solution: Verify SSL is enabled (`sslmode=require`)

### Build Issues:

**Problem:** TypeScript errors after Prisma migration
- Solution: Run `npx prisma generate` to regenerate client

---

## Testing Checklist

### Google OAuth:
- [ ] Sign in with Google (new user)
- [ ] Sign in with Google (returning user)
- [ ] Sign in with Google after email/password registration (should fail with conflict message)
- [ ] Profile data populated from Google (name, avatar)

### Email Verification:
- [ ] Register with email/password
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Email marked as verified
- [ ] Resend verification email
- [ ] Expired token handling

### Password Reset:
- [ ] Request password reset
- [ ] Receive reset email
- [ ] Reset password successfully
- [ ] Sign in with new password
- [ ] Expired token handling
- [ ] Generic response for non-existent email

### Onboarding:
- [ ] New user redirected to onboarding
- [ ] Student role selection works
- [ ] Teacher role selection works
- [ ] Admin role blocked
- [ ] Redirected to correct dashboard after completion
- [ ] Onboarding not required for returning users

### Profile Management:
- [ ] View profile page
- [ ] Update profile information
- [ ] Changes persist
- [ ] Sign out works

---

## Environment Variable Reference

### Backend (.env):
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# JWT
JWT_SECRET="your-32-char-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-32-char-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Application
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://joyschool-vwpd.vercel.app"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="https://joyschool-en2x.onrender.com/api/v1/auth/google/callback"

# Resend Email
RESEND_API_KEY="re_your-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# Rate Limiting
RATE_LIMIT_TTL="60000"
RATE_LIMIT_LIMIT="10"
```

### Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=https://joyschool-en2x.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## Deployment Notes

### Render (Backend):
1. Add environment variables in Render dashboard
2. Deploy code (automatically via GitHub integration)
3. Apply database migrations manually
4. Verify health check endpoint: `https://your-backend.onrender.com/api/health`

### Vercel (Frontend):
1. Add environment variables in Vercel dashboard
2. Deploy code (automatically via GitHub integration)
3. No database migrations needed

### Migration Safety:
- Never run `prisma migrate dev` in production
- Always use `prisma migrate deploy` for production
- Test migrations on staging database first
- Keep migration files in version control

---

## Support

For issues or questions:
- Check backend logs in Render dashboard
- Check frontend logs in Vercel dashboard
- Review Resend email delivery logs
- Verify Google OAuth configuration in Google Cloud Console
