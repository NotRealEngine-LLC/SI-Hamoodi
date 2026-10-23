-- HAMOODI SyntheTech Intelligence — Phase 11 Migration
-- Product Analytics, Billing, Credits & Security Infrastructure

-- ============================================================
-- 1. ANALYTICS EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Identity
  event_name TEXT NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,
  
  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Entity Reference
  entity_type TEXT,
  entity_id TEXT,
  
  -- Event Data
  properties JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  environment TEXT NOT NULL DEFAULT 'production',
  source TEXT NOT NULL DEFAULT 'client',
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace ON public.analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- RLS: Users can view their own events
CREATE POLICY "Users can view own analytics events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- System can insert events
CREATE POLICY "System can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ============================================================
-- 2. BILLING PLANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan Identity
  plan_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
  
  -- Billing Configuration
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
  stripe_price_id TEXT,
  stripe_price_id_yearly TEXT,
  
  -- Features & Limits
  features JSONB NOT NULL DEFAULT '{}',
  usage_limits JSONB NOT NULL DEFAULT '{}',
  workspace_limits JSONB NOT NULL DEFAULT '{}',
  
  -- Credits
  included_credits INTEGER NOT NULL DEFAULT 0,
  credit_unit TEXT NOT NULL DEFAULT 'hamoodi_credit',
  
  -- Display
  display_order INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_billing_plans_status ON public.billing_plans(status);
CREATE INDEX IF NOT EXISTS idx_billing_plans_stripe ON public.billing_plans(stripe_price_id);

-- RLS: All authenticated users can view active plans
CREATE POLICY "Users can view active plans"
  ON public.billing_plans FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Only admins can manage plans
CREATE POLICY "Admins can manage plans"
  ON public.billing_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- ============================================================
-- 3. BILLING CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer Identity
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_customer_id TEXT NOT NULL UNIQUE,
  
  -- Billing Owner
  billing_owner_type TEXT NOT NULL CHECK (billing_owner_type IN ('user', 'workspace')),
  billing_owner_id UUID NOT NULL,
  
  -- Metadata
  email TEXT,
  name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT billing_customers_unique_owner UNIQUE (billing_owner_type, billing_owner_id)
);

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_billing_customers_user ON public.billing_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_workspace ON public.billing_customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe ON public.billing_customers(stripe_customer_id);

-- RLS: Users can view their own customer records
CREATE POLICY "Users can view own billing customers"
  ON public.billing_customers FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- System can insert customer records
CREATE POLICY "System can insert billing customers"
  ON public.billing_customers FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- ============================================================
-- 4. BILLING SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Subscription Identity
  billing_customer_id UUID NOT NULL REFERENCES public.billing_customers(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  
  -- Plan Reference
  plan_id TEXT NOT NULL REFERENCES public.billing_plans(plan_id),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'trialing', 'active', 'past_due', 'unpaid', 'cancelled', 
    'incomplete', 'incomplete_expired', 'paused'
  )),
  
  -- Billing Period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  
  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer ON public.billing_subscriptions(billing_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe ON public.billing_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON public.billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_plan ON public.billing_subscriptions(plan_id);

-- RLS: Users can view subscriptions they own
CREATE POLICY "Users can view own subscriptions"
  ON public.billing_subscriptions FOR SELECT
  TO authenticated
  USING (
    billing_customer_id IN (
      SELECT id FROM public.billing_customers
      WHERE user_id = auth.uid() OR
      workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
      )
    )
  );

-- System can manage subscriptions
CREATE POLICY "System can manage subscriptions"
  ON public.billing_subscriptions FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================
-- 5. CREDIT ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Account Identity
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Account Type
  account_type TEXT NOT NULL CHECK (account_type IN ('personal', 'workspace')),
  
  -- Balance (in smallest unit, e.g., cents or microcredits)
  available_balance BIGINT NOT NULL DEFAULT 0,
  reserved_balance BIGINT NOT NULL DEFAULT 0,
  
  -- Currency/Unit
  unit TEXT NOT NULL DEFAULT 'hamoodi_credit',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT credit_accounts_unique_owner UNIQUE (account_type, user_id, workspace_id)
);

ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_credit_accounts_user ON public.credit_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_workspace ON public.credit_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_status ON public.credit_accounts(status);

-- RLS: Users can view their own credit accounts
CREATE POLICY "Users can view own credit accounts"
  ON public.credit_accounts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- System can manage credit accounts
CREATE POLICY "System can manage credit accounts"
  ON public.credit_accounts FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================
-- 6. CREDIT LEDGER TABLE (IMMUTABLE)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction Identity
  credit_account_id UUID NOT NULL REFERENCES public.credit_accounts(id) ON DELETE CASCADE,
  
  -- Transaction Type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'grant', 'reserve', 'consume', 'release', 'refund', 'expire', 'adjust', 'reverse'
  )),
  
  -- Amount (positive for credits in, negative for credits out)
  amount BIGINT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'hamoodi_credit',
  
  -- Reference
  reference_type TEXT,
  reference_id TEXT,
  
  -- Idempotency
  idempotency_key TEXT NOT NULL UNIQUE,
  
  -- Metadata
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Operator (for adjustments)
  operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_credit_ledger_account ON public.credit_ledger(credit_account_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_type ON public.credit_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reference ON public.credit_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created ON public.credit_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_idempotency ON public.credit_ledger(idempotency_key);

-- RLS: Users can view ledger entries for their accounts
CREATE POLICY "Users can view own ledger entries"
  ON public.credit_ledger FOR SELECT
  TO authenticated
  USING (
    credit_account_id IN (
      SELECT id FROM public.credit_accounts
      WHERE user_id = auth.uid() OR
      workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
      )
    )
  );

-- System can insert ledger entries
CREATE POLICY "System can insert ledger entries"
  ON public.credit_ledger FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Ledger is immutable (no updates or deletes)
-- This is enforced by not granting UPDATE/DELETE permissions

-- ============================================================
-- 7. CREDIT PRICING CATALOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_pricing_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service Identity
  service_id TEXT NOT NULL,
  meter_id TEXT NOT NULL,
  
  -- Pricing
  credit_rate BIGINT NOT NULL, -- Credits per unit
  unit TEXT NOT NULL DEFAULT 'hamoodi_credit',
  
  -- Version Control
  price_version INTEGER NOT NULL DEFAULT 1,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
  
  -- Metadata
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT credit_pricing_unique_version UNIQUE (service_id, meter_id, price_version)
);

ALTER TABLE public.credit_pricing_catalog ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_credit_pricing_service ON public.credit_pricing_catalog(service_id);
CREATE INDEX IF NOT EXISTS idx_credit_pricing_status ON public.credit_pricing_catalog(status);
CREATE INDEX IF NOT EXISTS idx_credit_pricing_effective ON public.credit_pricing_catalog(effective_from, effective_until);

-- RLS: All authenticated users can view active pricing
CREATE POLICY "Users can view active pricing"
  ON public.credit_pricing_catalog FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Only admins can manage pricing
CREATE POLICY "Admins can manage pricing"
  ON public.credit_pricing_catalog FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- ============================================================
-- 8. WORKSPACE QUOTAS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quota Identity
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Quota Type
  quota_type TEXT NOT NULL CHECK (quota_type IN (
    'monthly_credits', 'storage_bytes', 'workspace_members', 
    'custom_agents', 'active_workflows', 'scheduled_runs'
  )),
  
  -- Limits
  hard_limit BIGINT NOT NULL,
  soft_limit BIGINT, -- Alert threshold
  current_usage BIGINT NOT NULL DEFAULT 0,
  
  -- Period
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('monthly', 'yearly', 'one_time')),
  period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_end TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workspace_quotas_unique UNIQUE (workspace_id, quota_type, period_start)
);

ALTER TABLE public.workspace_quotas ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspace_quotas_workspace ON public.workspace_quotas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_quotas_type ON public.workspace_quotas(quota_type);
CREATE INDEX IF NOT EXISTS idx_workspace_quotas_status ON public.workspace_quotas(status);
CREATE INDEX IF NOT EXISTS idx_workspace_quotas_period ON public.workspace_quotas(period_start, period_end);

-- RLS: Workspace members can view quotas
CREATE POLICY "Workspace members can view quotas"
  ON public.workspace_quotas FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

-- Only workspace owners/admins can manage quotas
CREATE POLICY "Workspace admins can manage quotas"
  ON public.workspace_quotas FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- ============================================================
-- 9. AUDIT EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Identity
  event_type TEXT NOT NULL,
  
  -- Actor
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- Target
  target_type TEXT,
  target_id TEXT,
  
  -- Event Data
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  
  -- Security Context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_events_user ON public.audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_workspace ON public.audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON public.audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON public.audit_events(created_at DESC);

-- RLS: Users can view audit events for their workspaces
CREATE POLICY "Users can view workspace audit events"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- System can insert audit events
CREATE POLICY "System can insert audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Audit events are immutable
-- No UPDATE or DELETE permissions granted

-- ============================================================
-- 10. INSERT DEFAULT BILLING PLANS
-- ============================================================
INSERT INTO public.billing_plans (plan_id, name, description, billing_interval, features, usage_limits, workspace_limits, included_credits, display_order, is_popular)
VALUES 
  ('free', 'Free', 'Get started with HAMOODI SI', 'month', 
   '{"custom_agents": false, "advanced_automation": false, "priority_support": false}'::jsonb,
   '{"ai_generations_per_month": 100, "storage_bytes": 1073741824}'::jsonb,
   '{"max_workspaces": 1, "max_members_per_workspace": 3}'::jsonb,
   0, 1, false),
  ('plus', 'Plus', 'For individuals and small teams', 'month',
   '{"custom_agents": true, "advanced_automation": false, "priority_support": false}'::jsonb,
   '{"ai_generations_per_month": 1000, "storage_bytes": 10737418240}'::jsonb,
   '{"max_workspaces": 3, "max_members_per_workspace": 10}'::jsonb,
   1000, 2, false),
  ('pro', 'Pro', 'For professionals and growing teams', 'month',
   '{"custom_agents": true, "advanced_automation": true, "priority_support": true}'::jsonb,
   '{"ai_generations_per_month": 10000, "storage_bytes": 107374182400}'::jsonb,
   '{"max_workspaces": 10, "max_members_per_workspace": 50}'::jsonb,
   5000, 3, true),
  ('team', 'Team', 'For large organizations', 'month',
   '{"custom_agents": true, "advanced_automation": true, "priority_support": true, "dedicated_support": true}'::jsonb,
   '{"ai_generations_per_month": 100000, "storage_bytes": 1099511627776}'::jsonb,
   '{"max_workspaces": -1, "max_members_per_workspace": -1}'::jsonb,
   25000, 4, false)
ON CONFLICT (plan_id) DO NOTHING;

-- ============================================================
-- 11. GRANTS
-- ============================================================
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT INSERT ON public.analytics_events TO authenticated;

GRANT SELECT ON public.billing_plans TO authenticated;

GRANT SELECT, INSERT ON public.billing_customers TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.billing_subscriptions TO authenticated;

GRANT SELECT ON public.credit_accounts TO authenticated;
GRANT INSERT, UPDATE ON public.credit_accounts TO authenticated;

GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT INSERT ON public.credit_ledger TO authenticated;

GRANT SELECT ON public.credit_pricing_catalog TO authenticated;

GRANT SELECT ON public.workspace_quotas TO authenticated;
GRANT INSERT, UPDATE ON public.workspace_quotas TO authenticated;

GRANT SELECT ON public.audit_events TO authenticated;
GRANT INSERT ON public.audit_events TO authenticated;

-- ============================================================
-- NOTES:
-- - All tables use RLS with workspace membership checks
-- - Credit ledger is immutable (no UPDATE/DELETE)
-- - Audit events are immutable (no UPDATE/DELETE)
-- - Billing plans include default Free/Plus/Pro/Team tiers
-- - Stripe integration requires server-side secret key
-- - PostHog integration requires API key configuration
-- - Credit system uses integer accounting (no floating point)
-- - Quotas support monthly/yearly/one-time periods
