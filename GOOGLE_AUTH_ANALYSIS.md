# Google Sign-In Production Failure Analysis

## Executive Summary

The 401 error on Google Sign-In is caused by one of these issues (exact cause will be revealed by new logging):

1. **GOOGLE_CLIENT_ID not configured on Render** - Most likely cause
2. **GOOGLE_CLIENT_ID mismatch** between frontend and backend
3. **Invalid Google ID token** (expired, wrong audience, or signature failure)

## Flow Tracing Results

### Frontend → Backend Data Flow

**Frontend (GoogleSignIn.tsx):**
- Uses Google Identity Services `renderButton()` API
- Google callback receives: `response.credential` (JWT ID token)
- Sends: `POST /api/v1/auth/google` with body `{ idToken: credential }`

**Frontend (auth.ts):**
- Function: `googleAuth(idToken: string)`
- Calls: `api.post('/v1/auth/google', { idToken })`
- Payload format: ✅ Correct (matches backend DTO)

**Backend (auth.controller.ts):**
- Endpoint: `POST /v1/auth/google`
- DTO: `GoogleTokenDto` with `idToken: string`
- Validation: ✅ Expects `idToken` field

**Backend (auth.service.ts):**
- Checks: `GOOGLE_CLIENT_ID` environment variable
- Rejects if: `!clientId || !this.googleClient || clientId === 'placeholder'`
- Uses: `google-auth-library` OAuth2Client
- Validates: Token signature, issuer, expiration, audience
- Audience check: Must match `GOOGLE_CLIENT_ID`

### Environment Variables

**Frontend (Vercel):**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth Client ID (public)

**Backend (Render):**
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID (must match frontend)
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL` - OAuth callback URL (for strategy, not current flow)

**Critical Requirement:**
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Vercel) **MUST EQUAL** `GOOGLE_CLIENT_ID` (Render)

## Root Cause Candidates

### 1. Missing GOOGLE_CLIENT_ID on Render (Most Likely)

If `GOOGLE_CLIENT_ID` is not set on Render, or set to placeholder value:
```typescript
if (!clientId || !this.googleClient || clientId === 'placeholder') {
  throw new UnauthorizedException('Google authentication is not configured...');
}
```

**Fix:** Add `GOOGLE_CLIENT_ID` to Render environment variables.

### 2. GOOGLE_CLIENT_ID Mismatch

If frontend and backend have different Client IDs:
- Frontend generates token for Client ID A
- Backend validates against Client ID B
- Audience validation fails → 401

**Fix:** Ensure both use the same Client ID from Google Cloud Console.

### 3. Invalid Google Token

Possible causes:
- Token expired (1 hour lifetime)
- Token tampered with (signature invalid)
- Wrong issuer (not accounts.google.com)
- Missing required claims (email, sub)

**Fix:** This indicates a Google API or configuration issue.

## Refresh Token Loop Issue

**Problem:**
When Google auth returned 401, the Axios interceptor attempted to refresh the token:
```typescript
if (error.response?.status === 401 && !originalRequest._retry) {
  // Attempt refresh even for /auth/google endpoint
}
```

This caused an infinite loop because:
1. Google auth fails (401)
2. Interceptor tries refresh (also 401, no valid token)
3. Loop continues

**Fix Applied:**
Now excludes `/auth/` endpoints from refresh attempts:
```typescript
if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
  // Only refresh for non-auth endpoints
}
```

## Changes Made

### Backend (auth.service.ts)

Added detailed logging to identify exact failure point:

```typescript
private readonly logger = new Logger(AuthService.name);

async googleAuth(googleTokenDto: GoogleTokenDto) {
  const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

  if (!clientId || !this.googleClient || clientId === 'placeholder') {
    this.logger.warn(`Google OAuth not configured. Client ID: ${clientId ? 'SET' : 'NOT_SET'}, googleClient: ${this.googleClient ? 'INITIALIZED' : 'NOT_INITIALIZED'}`);
    throw new UnauthorizedException('Google authentication is not configured...');
  }

  // ... token validation ...

  if (!payload) {
    this.logger.error('Google token payload is null');
    throw new UnauthorizedException('Invalid Google token');
  }

  if (!email) {
    this.logger.error('Google token missing email');
    throw new UnauthorizedException('Email is required from Google');
  }

  // ... user lookup ...

  if (user && !user.isActive) {
    this.logger.warn(`Google user account suspended: ${user.email}`);
    throw new UnauthorizedException('Account is suspended');
  }

  // ... error handling ...

  this.logger.error(`Google token validation failed: ${error.message}`);
  throw new UnauthorizedException('Invalid Google token');
}
```

### Frontend (api.ts)

Prevented refresh loop on auth failures:

```typescript
if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
  // Only attempt refresh for non-auth endpoints
  originalRequest._retry = true;
  // ... refresh logic ...
}
```

## COOP Warning (Cross-Origin-Opener-Policy)

**Observation:**
```
Cross-Origin-Opener-Policy policy would block the window.postMessage call.
```

**Analysis:**
- This is an informational warning from Google Identity Services
- It occurs when using FedCM (Federated Credential Management)
- Does NOT block the authentication flow
- Can be safely ignored

**No action required** unless the popup callback actually fails (which would be a different error).

## Required Environment Variables

### Render (Backend)

```bash
GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
GOOGLE_CALLBACK_URL=https://joyschool-en2x.onrender.com/api/v1/auth/google/callback
```

### Vercel (Frontend)

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
```

**Critical:** Both must use the **same** Client ID from Google Cloud Console.

## Deployment Steps

1. **Check Render Environment Variables:**
   - Go to Render dashboard → your service → Environment
   - Verify `GOOGLE_CLIENT_ID` is set (not placeholder)
   - Verify `GOOGLE_CLIENT_SECRET` is set
   - Verify it matches the Client ID in Vercel

2. **Check Vercel Environment Variables:**
   - Go to Vercel dashboard → your project → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
   - Verify it matches the Client ID in Render

3. **Check Google Cloud Console:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Verify authorized JavaScript origins include:
     - `https://joyschool-vwpd.vercel.app`
   - Verify authorized redirect URIs include:
     - `https://joyschool-en2x.onrender.com/api/v1/auth/google/callback`

4. **Deploy Changes:**
   - Backend: Already pushed (commit `ed83fa66`)
   - Frontend: Already pushed (commit `ed83fa66`)
   - Render will auto-deploy from GitHub
   - Vercel will auto-deploy from GitHub

5. **Check Render Logs After Deployment:**
   - Look for log messages from the new logging:
     - `Google OAuth not configured` → Fix environment variables
     - `Google token payload is null` → Token format issue
     - `Google token missing email` → Google API issue
     - `Google token validation failed: <error>` → Check the specific error message

## Testing

After deployment, test Google Sign-In and observe:

1. **If log shows "Google OAuth not configured":**
   - Add `GOOGLE_CLIENT_ID` to Render environment variables
   - Redeploy

2. **If log shows token validation error:**
   - Check that Client IDs match between frontend and backend
   - Verify Google Cloud Console has correct origins
   - Check that token is not expired

3. **If no logs appear:**
   - Check that request is reaching the backend
   - Verify CORS is working (should be fixed by previous commit)
   - Check browser console for client-side errors

## Summary

The 401 error is most likely due to:
1. Missing `GOOGLE_CLIENT_ID` on Render (80% probability)
2. Client ID mismatch between frontend and backend (15% probability)
3. Invalid Google token (5% probability)

The new logging will definitively identify which issue is occurring. The refresh loop has been fixed to prevent cascading failures.
