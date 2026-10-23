# HAMOODI SI — Authentication Architecture

## Overview

HAMOODI SI uses Supabase Auth for user authentication. The system supports email/password, email verification, password recovery, and Google OAuth.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth UI  │──│ AuthContext  │──│ Supabase Client      │  │
│  │ (Pages)  │  │ (State Mgmt) │  │ (@supabase/supabase) │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                                        │                     │
└────────────────────────────────────────┼─────────────────────┘
                                         │ HTTPS
┌────────────────────────────────────────┼─────────────────────┐
│                     Supabase           │                     │
│                                        ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth Service │  │  PostgreSQL  │  │   Storage    │      │
│  │  (JWT/Session)│  │  (RLS)       │  │  (Avatars)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Sign Up
1. User submits email, password, display name
2. Client calls `supabase.auth.signUp()`
3. Supabase creates user in `auth.users`
4. If email confirmation required: user receives verification email
5. On confirmation: session established, redirected to onboarding
6. Profile created via upsert on first authenticated access

### Sign In
1. User submits email and password
2. Client calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials
4. Session stored in localStorage
5. AuthContext state transitions to 'authenticated'
6. Profile loaded/created, workspace data fetched

### Session Management
- **Auto-refresh:** Tokens are automatically refreshed before expiry
- **Persistence:** Sessions persist in localStorage across page reloads
- **Multi-tab:** Auth state changes propagate via `onAuthStateChange` listener
- **Expiration:** Expired sessions redirect to sign-in

### Sign Out
1. Client calls `supabase.auth.signOut()`
2. Session cleared from storage
3. AuthContext state transitions to 'guest'
4. User-scoped data cleared from UI
5. Local workspace data preserved (not deleted)

### Password Recovery
1. User requests reset via email
2. Supabase sends recovery link to `/auth/update-password`
3. User sets new password via `supabase.auth.updateUser()`
4. Session updated, redirected to sign-in

## HAMOODI vs Puter Authentication

These are **separate systems** that must not be conflated:

| Aspect | HAMOODI Account | Puter AI |
|--------|----------------|----------|
| Provider | Supabase Auth | Puter.js |
| Purpose | Identity, cloud data | AI generation |
| Session | JWT in localStorage | Puter-managed |
| Sign-out | Clears HAMOODI session | Independent |

**Key rules:**
- Puter login ≠ HAMOODI signup
- HAMOODI sign-out does NOT sign out of Puter
- Both connections displayed separately in settings
- AI requests require Puter authorization regardless of HAMOODI status

## Protected Routes

```
Public routes:
  /auth/sign-in
  /auth/sign-up
  /auth/forgot-password
  /auth/update-password
  /auth/callback

Protected routes (require auth for cloud features):
  /workspace (works in guest mode with local data)
  /onboarding (requires auth)
```

## Security Considerations

1. **No service-role keys in client code**
2. **RLS enforces data isolation at database level**
3. **Client-side auth checks are for UX only, not security**
4. **Session tokens are httpOnly where possible**
5. **Redirect URLs validated against allowlist**
6. **Rate limiting configured in Supabase dashboard**

## Configuration

Required environment variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

## Future Enhancements

- Multi-factor authentication (MFA)
- Magic link authentication
- Social OAuth providers (GitHub, Apple)
- Organization/team accounts
- API key management for integrations
