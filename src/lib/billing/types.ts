// HAMOODI SyntheTech Intelligence — Phase 11 Types
// Analytics, Billing, Credits & Security Infrastructure

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface AnalyticsEvent {
  id: string;
  event_name: string;
  event_version: number;
  user_id?: string;
  workspace_id?: string;
  session_id?: string;
  entity_type?: string;
  entity_id?: string;
  properties: Record<string, any>;
  environment: string;
  source: 'client' | 'server' | 'worker';
  created_at: string;
}

export interface CreateAnalyticsEventInput {
  event_name: string;
  event_version?: number;
  user_id?: string;
  workspace_id?: string;
  session_id?: string;
  entity_type?: string;
  entity_id?: string;
  properties?: Record<string, any>;
  environment?: string;
  source?: 'client' | 'server' | 'worker';
}

// ============================================================
// BILLING PLAN TYPES
// ============================================================

export type PlanStatus = 'active' | 'deprecated' | 'archived';
export type BillingInterval = 'month' | 'year';

export interface BillingPlan {
  id: string;
  plan_id: string;
  name: string;
  description?: string;
  status: PlanStatus;
  billing_interval: BillingInterval;
  stripe_price_id?: string;
  stripe_price_id_yearly?: string;
  features: Record<string, boolean>;
  usage_limits: Record<string, number>;
  workspace_limits: Record<string, number>;
  included_credits: number;
  credit_unit: string;
  display_order: number;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// BILLING CUSTOMER TYPES
// ============================================================

export type BillingOwnerType = 'user' | 'workspace';

export interface BillingCustomer {
  id: string;
  user_id?: string;
  workspace_id?: string;
  stripe_customer_id: string;
  billing_owner_type: BillingOwnerType;
  billing_owner_id: string;
  email?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBillingCustomerInput {
  user_id?: string;
  workspace_id?: string;
  stripe_customer_id: string;
  billing_owner_type: BillingOwnerType;
  billing_owner_id: string;
  email?: string;
  name?: string;
}

// ============================================================
// BILLING SUBSCRIPTION TYPES
// ============================================================

export type SubscriptionStatus = 
  | 'trialing' 
  | 'active' 
  | 'past_due' 
  | 'unpaid' 
  | 'cancelled' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'paused'
  | 'none';

export interface BillingSubscription {
  id: string;
  billing_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateBillingSubscriptionInput {
  billing_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  trial_start?: string;
  trial_end?: string;
  metadata?: Record<string, any>;
}

export interface UpdateBillingSubscriptionInput {
  status?: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// CREDIT ACCOUNT TYPES
// ============================================================

export type AccountType = 'personal' | 'workspace';
export type AccountStatus = 'active' | 'frozen' | 'closed';

export interface CreditAccount {
  id: string;
  user_id?: string;
  workspace_id?: string;
  account_type: AccountType;
  available_balance: number;
  reserved_balance: number;
  unit: string;
  status: AccountStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateCreditAccountInput {
  user_id?: string;
  workspace_id?: string;
  account_type: AccountType;
  initial_balance?: number;
  unit?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// CREDIT LEDGER TYPES
// ============================================================

export type TransactionType = 
  | 'grant' 
  | 'reserve' 
  | 'consume' 
  | 'release' 
  | 'refund' 
  | 'expire' 
  | 'adjust' 
  | 'reverse';

export interface CreditLedgerEntry {
  id: string;
  credit_account_id: string;
  transaction_type: TransactionType;
  amount: number;
  unit: string;
  reference_type?: string;
  reference_id?: string;
  idempotency_key: string;
  description?: string;
  metadata: Record<string, any>;
  operator_id?: string;
  created_at: string;
}

export interface CreateCreditLedgerEntryInput {
  credit_account_id: string;
  transaction_type: TransactionType;
  amount: number;
  unit?: string;
  reference_type?: string;
  reference_id?: string;
  idempotency_key: string;
  description?: string;
  metadata?: Record<string, any>;
  operator_id?: string;
}

// ============================================================
// CREDIT PRICING TYPES
// ============================================================

export type PricingStatus = 'active' | 'deprecated' | 'archived';

export interface CreditPricingCatalog {
  id: string;
  service_id: string;
  meter_id: string;
  credit_rate: number;
  unit: string;
  price_version: number;
  effective_from: string;
  effective_until?: string;
  status: PricingStatus;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateCreditPricingInput {
  service_id: string;
  meter_id: string;
  credit_rate: number;
  unit?: string;
  price_version?: number;
  effective_from?: string;
  effective_until?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// WORKSPACE QUOTA TYPES
// ============================================================

export type QuotaType = 
  | 'monthly_credits' 
  | 'storage_bytes' 
  | 'workspace_members' 
  | 'custom_agents' 
  | 'active_workflows' 
  | 'scheduled_runs';

export type PeriodType = 'monthly' | 'yearly' | 'one_time';
export type QuotaStatus = 'active' | 'suspended' | 'expired';

export interface WorkspaceQuota {
  id: string;
  workspace_id: string;
  quota_type: QuotaType;
  hard_limit: number;
  soft_limit?: number;
  current_usage: number;
  period_type: PeriodType;
  period_start: string;
  period_end?: string;
  status: QuotaStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceQuotaInput {
  workspace_id: string;
  quota_type: QuotaType;
  hard_limit: number;
  soft_limit?: number;
  period_type?: PeriodType;
  period_start?: string;
  period_end?: string;
  metadata?: Record<string, any>;
}

export interface UpdateWorkspaceQuotaInput {
  hard_limit?: number;
  soft_limit?: number;
  current_usage?: number;
  period_end?: string;
  status?: QuotaStatus;
  metadata?: Record<string, any>;
}

// ============================================================
// AUDIT EVENT TYPES
// ============================================================

export interface AuditEvent {
  id: string;
  event_type: string;
  user_id?: string;
  workspace_id?: string;
  target_type?: string;
  target_id?: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CreateAuditEventInput {
  event_type: string;
  user_id?: string;
  workspace_id?: string;
  target_type?: string;
  target_id?: string;
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// ============================================================
// ENTITLEMENT TYPES
// ============================================================

export interface Entitlement {
  feature: string;
  enabled: boolean;
  limit?: number;
  current_usage?: number;
}

export interface EntitlementResolution {
  user_id: string;
  workspace_id: string;
  plan_id: string;
  subscription_status: SubscriptionStatus;
  entitlements: Entitlement[];
  credit_balance?: number;
  quotas: WorkspaceQuota[];
}

// ============================================================
// STRIPE INTEGRATION TYPES
// ============================================================

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer_id: string;
  subscription_id?: string;
  status: string;
  expires_at: number;
}

export interface CreateCheckoutSessionInput {
  customer_id: string;
  price_id: string;
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, any>;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class BillingError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

export class InsufficientCreditsError extends BillingError {
  constructor(required: number, available: number) {
    super(
      'INSUFFICIENT_CREDITS',
      `Insufficient credits: required ${required}, available ${available}`,
      { required, available }
    );
    this.name = 'InsufficientCreditsError';
  }
}

export class QuotaExceededError extends BillingError {
  constructor(quota_type: string, limit: number, current: number) {
    super(
      'QUOTA_EXCEEDED',
      `Quota exceeded for ${quota_type}: limit ${limit}, current ${current}`,
      { quota_type, limit, current }
    );
    this.name = 'QuotaExceededError';
  }
}

export class SubscriptionRequiredError extends BillingError {
  constructor(required_plan: string) {
    super(
      'SUBSCRIPTION_REQUIRED',
      `Subscription required: ${required_plan} or higher`,
      { required_plan }
    );
    this.name = 'SubscriptionRequiredError';
  }
}

export class InvalidStripeEventError extends BillingError {
  constructor(message: string = 'Invalid Stripe webhook event') {
    super('INVALID_STRIPE_EVENT', message);
    this.name = 'InvalidStripeEventError';
  }
}
