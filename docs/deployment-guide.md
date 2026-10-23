# HAMOODI SI — Deployment Guide

**Phase:** 12 / 12 — Production Deployment  
**Version:** 1.0.0  
**Last Updated:** 2026-01-XX

---

## Overview

This guide covers the complete deployment process for HAMOODI SyntheTech Intelligence, from environment setup to production launch.

---

## Prerequisites

### Required Services

1. **Supabase Project**
   - PostgreSQL database
   - Authentication service
   - Storage service
   - Edge Functions (optional)

2. **Vercel/Netlify/Cloud Provider**
   - Static site hosting
   - Serverless functions (optional)
   - CDN

3. **External Services (Optional)**
   - PostHog (analytics)
   - Stripe (billing)
   - Puter.js (AI generation)
   - MCP servers (integrations)

### Required Tools

- Node.js 18+
- npm or yarn
- Git
- Supabase CLI (recommended)

---

## Environment Configuration

### 1. Clone Repository

```bash
git clone <repository-url>
cd hamoodi-si
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env.local` file:

```env
# ===========================================
# REQUIRED: Supabase Configuration
# ===========================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Application URL (for auth callbacks)
VITE_APP_URL=http://localhost:3000

# ===========================================
# OPTIONAL: PostHog Analytics
# ===========================================
# VITE_POSTHOG_API_KEY=your-posthog-key
# VITE_POSTHOG_HOST=https://app.posthog.com

# ===========================================
# OPTIONAL: Stripe Billing (Server-side only)
# ===========================================
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# STRIPE_PRICE_PLUS=price_...
# STRIPE_PRICE_PRO=price_...
# STRIPE_PRICE_TEAM=price_...

# ===========================================
# OPTIONAL: Feature Flags
# ===========================================
# VITE_ENABLE_MARKETPLACE=false
# VITE_ENABLE_ADVANCED_AUTOMATION=false
```

**Important:**
- Never commit `.env.local` to git
- Use `.env.example` as a template
- Server-side keys (STRIPE_*) must never be exposed to client

### 4. Verify Configuration

```bash
npm run typecheck
npm run build
```

Both commands should complete without errors.

---

## Database Setup

### 1. Apply Migrations

Navigate to Supabase SQL Editor and apply migrations in order:

```sql
-- Phase 03: Core schema
-- File: supabase/migrations/001_initial_schema.sql

-- Phase 04: Workspaces & Hubs
-- File: supabase/migrations/002_workspaces_hubs_files.sql

-- Phase 05: AI Intelligence
-- File: supabase/migrations/003_si_intelligence.sql

-- Phase 06: Super Agent
-- File: supabase/migrations/004_super_agent.sql

-- Phase 07: Synthetic Memory
-- File: supabase/migrations/005_synthetic_memory.sql

-- Phase 08: MCP Integrations
-- File: supabase/migrations/008_mcp_integrations.sql

-- Phase 09: Creation Studios
-- File: supabase/migrations/009_creation_studios.sql

-- Phase 10: Agents & Automation
-- File: supabase/migrations/010_agents_skills_automation.sql

-- Phase 11: Analytics & Billing
-- File: supabase/migrations/011_billing_analytics_security.sql
```

**Alternative: Using Supabase CLI**

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

### 2. Verify Migrations

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables (50+):
- profiles
- workspaces
- workspace_members
- hubs
- projects
- conversations
- messages
- workspace_files
- custom_agents
- agent_skills
- workflow_definitions
- billing_plans
- credit_accounts
- credit_ledger
- ... and more

### 3. Verify RLS Policies

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

### 4. Create Storage Buckets

In Supabase Storage, create:

1. **si-workspace-files** (private)
   - For user file uploads
   - RLS policies required

2. **si-artifacts** (private)
   - For creation studio exports
   - RLS policies required

---

## Authentication Setup

### 1. Configure Auth Providers

In Supabase Dashboard → Authentication → Providers:

**Email (Required)**
- Enable Email provider
- Configure SMTP settings
- Set email templates

**Google OAuth (Optional)**
- Create Google OAuth credentials
- Add authorized redirect URIs:
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/auth/callback` (development)

### 2. Configure Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://your-domain.com`
- Redirect URLs:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/auth/**`

### 3. Test Authentication

1. Sign up with a test account
2. Verify email confirmation works
3. Sign in successfully
4. Test password recovery
5. Test sign out

---

## External Service Configuration

### PostHog Analytics (Optional)

1. Create PostHog project at https://app.posthog.com
2. Get API key
3. Add to `.env.local`:
   ```env
   VITE_POSTHOG_API_KEY=phc_your_key
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```
4. Verify events are tracked in PostHog dashboard

### Stripe Billing (Optional)

1. Create Stripe account at https://stripe.com
2. Create products and prices:
   - Plus plan (monthly/yearly)
   - Pro plan (monthly/yearly)
   - Team plan (monthly/yearly)
3. Get price IDs and add to `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PLUS=price_...
   STRIPE_PRICE_PRO=price_...
   STRIPE_PRICE_TEAM=price_...
   ```
4. Configure webhook endpoint:
   - URL: `https://your-domain.com/api/billing/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
5. Test with Stripe test mode

### Puter.js AI (Optional)

1. Verify Puter.js script is loaded in `index.html`:
   ```html
   <script src="https://js.puter.com/v2/"></script>
   ```
2. Test AI generation in chat interface
3. Verify model selection works
4. Test streaming responses

### MCP Integrations (Optional)

1. Register MCP server endpoints in Integrations Hub
2. Test connection and tool discovery
3. Verify OAuth flows for protected servers
4. Test tool execution

---

## Deployment Options

### Option A: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel login
   vercel link
   ```

2. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Mark sensitive variables as encrypted

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Domain**
   - Add custom domain in Vercel dashboard
   - Update DNS records
   - Wait for SSL certificate

### Option B: Netlify

1. **Connect Repository**
   - Link GitHub repository in Netlify dashboard

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables**
   - Add all variables from `.env.local`

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Option C: Docker (Self-hosted)

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf**
   ```nginx
   server {
       listen 80;
       root /usr/share/nginx/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           # Proxy to serverless functions or backend
       }
   }
   ```

3. **Build and Run**
   ```bash
   docker build -t hamoodi-si .
   docker run -p 80:80 hamoodi-si
   ```

---

## Post-Deployment Verification

### 1. Smoke Tests

Perform these critical tests:

**Authentication**
- [ ] Sign up works
- [ ] Email verification works
- [ ] Sign in works
- [ ] Sign out works
- [ ] Password recovery works

**Workspace**
- [ ] Create workspace works
- [ ] Switch workspace works
- [ ] Create project works
- [ ] Create conversation works

**AI Generation**
- [ ] Chat works
- [ ] Model selection works
- [ ] Streaming works
- [ ] Cancellation works

**File Management**
- [ ] Upload works
- [ ] Download works
- [ ] Delete works

**Studios**
- [ ] Docs Studio works
- [ ] Sheets Studio works
- [ ] Slides Studio works
- [ ] Code Studio works

### 2. Security Checks

- [ ] RLS policies prevent cross-tenant access
- [ ] Authentication required for protected routes
- [ ] No secrets in client bundle
- [ ] HTTPS enforced
- [ ] CORS configured correctly

### 3. Performance Checks

- [ ] Initial load < 3s
- [ ] Time to interactive < 5s
- [ ] No console errors
- [ ] No memory leaks
- [ ] Responsive on mobile

### 4. Integration Checks

- [ ] PostHog events tracked (if configured)
- [ ] Stripe webhooks received (if configured)
- [ ] Puter.js AI generation works (if configured)
- [ ] MCP tools execute (if configured)

---

## Monitoring & Observability

### Application Monitoring

Set up monitoring for:

1. **Error Tracking**
   - Sentry or similar
   - Capture unhandled exceptions
   - Track error rates

2. **Performance Monitoring**
   - Lighthouse CI
   - Web Vitals tracking
   - Bundle size monitoring

3. **Uptime Monitoring**
   - Pingdom or similar
   - Alert on downtime
   - Track response times

### Business Metrics

Track in PostHog or similar:

1. **User Metrics**
   - Signups
   - Active users
   - Retention

2. **Usage Metrics**
   - AI generations
   - File uploads
   - Workflow runs

3. **Revenue Metrics** (if billing enabled)
   - Subscriptions
   - MRR
   - Churn

---

## Backup & Recovery

### Database Backups

Supabase provides automatic backups:
- Daily backups retained for 7 days
- Point-in-time recovery available
- Manual backups via dashboard

### Recovery Procedure

1. **Identify Issue**
   - Check error logs
   - Review recent changes
   - Assess data impact

2. **Restore from Backup**
   - Use Supabase dashboard
   - Select recovery point
   - Verify data integrity

3. **Verify Application**
   - Run smoke tests
   - Check critical data
   - Monitor for errors

---

## Rollback Procedure

If deployment causes issues:

### 1. Quick Rollback (Vercel/Netlify)

```bash
# Vercel
vercel rollback

# Netlify
# Use deploy history in dashboard
```

### 2. Manual Rollback

```bash
# Revert to previous commit
git checkout <previous-commit>

# Rebuild
npm run build

# Redeploy
vercel --prod
```

### 3. Database Rollback

**Warning:** Database migrations are forward-only. To rollback:

1. Identify problematic migration
2. Create reverse migration (if possible)
3. Apply reverse migration
4. Verify data integrity

---

## Production Checklist

Before going live, verify:

### Infrastructure
- [ ] Supabase project configured
- [ ] All migrations applied
- [ ] Storage buckets created
- [ ] RLS policies verified
- [ ] Authentication configured
- [ ] Custom domain set up
- [ ] SSL certificate active

### Environment
- [ ] `.env.local` configured
- [ ] All required variables set
- [ ] Sensitive variables encrypted
- [ ] No secrets in git

### Testing
- [ ] Smoke tests passed
- [ ] Security checks passed
- [ ] Performance checks passed
- [ ] Integration checks passed
- [ ] Mobile responsive verified
- [ ] Cross-browser tested

### Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring active
- [ ] Alerts configured

### Documentation
- [ ] User documentation updated
- [ ] API documentation current
- [ ] Deployment guide reviewed
- [ ] Recovery procedures documented

### Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie policy configured
- [ ] GDPR compliance verified (if applicable)

---

## Troubleshooting

### Build Failures

**Issue:** TypeScript errors
**Solution:** Run `npm run typecheck` and fix all errors

**Issue:** Missing dependencies
**Solution:** Run `npm install` and verify `package.json`

### Runtime Errors

**Issue:** Authentication fails
**Solution:** Verify Supabase URL and keys in `.env.local`

**Issue:** Database queries fail
**Solution:** Verify migrations applied and RLS policies correct

**Issue:** File uploads fail
**Solution:** Verify storage buckets created and policies configured

### Performance Issues

**Issue:** Slow initial load
**Solution:** Implement code splitting, optimize images

**Issue:** Slow database queries
**Solution:** Add indexes, optimize queries, use pagination

---

## Support & Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [PostHog Docs](https://posthog.com/docs)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

### HAMOODI SI
- Repository: [GitHub](https://github.com/your-org/hamoodi-si)
- Issues: [GitHub Issues](https://github.com/your-org/hamoodi-si/issues)

---

## Conclusion

This deployment guide provides a complete roadmap for launching HAMOODI SyntheTech Intelligence. Follow each section carefully to ensure a successful production deployment.

**Next Steps:**
1. Review this guide completely
2. Prepare environment configuration
3. Set up Supabase project
4. Apply database migrations
5. Deploy to hosting provider
6. Run post-deployment verification
7. Monitor and maintain

---

**HAMOODI SyntheTech Intelligence**  
*Production Deployment Guide*  
**Version:** 1.0.0  
**Founded by BhaiSazzaD**
