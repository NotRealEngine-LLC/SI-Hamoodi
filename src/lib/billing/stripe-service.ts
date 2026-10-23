// HAMOODI SyntheTech Intelligence — Stripe Billing Service
// Phase 11: Payment Processing with Stripe

import { getSupabaseClient } from '../supabase/client';
import {
  BillingCustomer,
  BillingSubscription,
  BillingPlan,
  StripeCheckoutSession,
  CreateCheckoutSessionInput,
  StripeWebhookEvent,
  BillingError,
  InvalidStripeEventError,
} from './types';

// Stripe configuration (server-side only)
const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '';

// Stripe client (lazy initialization)
let stripeClient: any = null;

/**
 * Initialize Stripe client (server-side only)
 */
async function getStripeClient() {
  if (!STRIPE_SECRET_KEY) {
    console.warn('Stripe secret key not configured');
    return null;
  }

  if (stripeClient) {
    return stripeClient;
  }

  try {
    const stripe = await import('stripe');
    stripeClient = new stripe.default(STRIPE_SECRET_KEY, {
      apiVersion: '2026-09-30.endive', // Use current stable version
    });
    return stripeClient;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
}

/**
 * Stripe Billing Service
 * Handles payment processing, subscriptions, and customer management
 */
export class SIStripeBillingService {
  /**
   * Create or retrieve Stripe customer
   */
  async getOrCreateCustomer(
    userId: string,
    email: string,
    metadata?: Record<string, any>
  ): Promise<BillingCustomer> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('billing_customers')
      .select('*')
      .eq('user_id', userId)
      .eq('billing_owner_type', 'user')
      .single();

    if (existing) {
      return existing as BillingCustomer;
    }

    // Create Stripe customer
    const stripe = await getStripeClient();
    if (!stripe) throw new BillingError('STRIPE_NOT_CONFIGURED', 'Stripe not configured');

    const stripeCustomer = await stripe.customers.create({
      email,
      metadata: {
        user_id: userId,
        ...metadata,
      },
    });

    // Save to database
    const { data, error } = await supabase
      .from('billing_customers')
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomer.id,
        billing_owner_type: 'user',
        billing_owner_id: userId,
        email,
        name: stripeCustomer.name,
      })
      .select()
      .single();

    if (error) throw new BillingError('CUSTOMER_CREATE_FAILED', `Failed to create customer: ${error.message}`);

    return data as BillingCustomer;
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<StripeCheckoutSession> {
    const stripe = await getStripeClient();
    if (!stripe) throw new BillingError('STRIPE_NOT_CONFIGURED', 'Stripe not configured');

    try {
      const session = await stripe.checkout.sessions.create({
        customer: input.customer_id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: input.price_id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: input.success_url,
        cancel_url: input.cancel_url,
        metadata: input.metadata,
      });

      return {
        id: session.id,
        url: session.url || '',
        customer_id: session.customer as string,
        subscription_id: session.subscription as string | undefined,
        status: session.status,
        expires_at: session.expires_at,
      };
    } catch (error) {
      throw new BillingError(
        'CHECKOUT_FAILED',
        `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    const stripe = await getStripeClient();
    if (!stripe) throw new BillingError('STRIPE_NOT_CONFIGURED', 'Stripe not configured');

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      throw new BillingError(
        'PORTAL_FAILED',
        `Failed to create portal session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify and process Stripe webhook
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<StripeWebhookEvent> {
    const stripe = await getStripeClient();
    if (!stripe) throw new BillingError('STRIPE_NOT_CONFIGURED', 'Stripe not configured');

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      throw new InvalidStripeEventError(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Process event based on type
    await this.processWebhookEvent(event);

    return event as StripeWebhookEvent;
  }

  /**
   * Process webhook event
   */
  private async processWebhookEvent(event: any): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: any): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Get or create subscription record
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    if (!subscriptionId) return;

    // Fetch subscription from Stripe
    const stripe = await getStripeClient();
    if (!stripe) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get plan from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const { data: plan } = await supabase
      .from('billing_plans')
      .select('plan_id')
      .or(`stripe_price_id.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();

    if (!plan) {
      console.error('Plan not found for price:', priceId);
      return;
    }

    // Get customer
    const { data: customer } = await supabase
      .from('billing_customers')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!customer) {
      console.error('Customer not found:', customerId);
      return;
    }

    // Create or update subscription
    await supabase
      .from('billing_subscriptions')
      .upsert({
        billing_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        plan_id: plan.plan_id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        metadata: subscription.metadata || {},
      }, {
        onConflict: 'stripe_subscription_id',
      });

    // Grant included credits if this is a new subscription
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      await this.grantSubscriptionCredits(customer.id, plan.plan_id);
    }
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('billing_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('billing_subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(invoice: any): Promise<void> {
    // Track successful payment
    console.log('Invoice paid:', invoice.id);
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    // Track failed payment
    console.log('Invoice payment failed:', invoice.id);
  }

  /**
   * Grant subscription credits
   */
  private async grantSubscriptionCredits(customerId: string, planId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Get plan details
    const { data: plan } = await supabase
      .from('billing_plans')
      .select('included_credits')
      .eq('plan_id', planId)
      .single();

    if (!plan || plan.included_credits === 0) return;

    // Get customer
    const { data: customer } = await supabase
      .from('billing_customers')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!customer) return;

    // Get or create credit account
    let { data: account } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('account_type', customer.billing_owner_type)
      .eq('user_id', customer.user_id)
      .eq('workspace_id', customer.workspace_id)
      .single();

    if (!account) {
      const { data: newAccount } = await supabase
        .from('credit_accounts')
        .insert({
          user_id: customer.user_id,
          workspace_id: customer.workspace_id,
          account_type: customer.billing_owner_type,
          available_balance: 0,
          reserved_balance: 0,
          unit: 'hamoodi_credit',
          status: 'active',
        })
        .select()
        .single();

      account = newAccount;
    }

    if (!account) return;

    // Create ledger entry for grant
    const idempotencyKey = `subscription_grant_${customer.id}_${planId}_${Date.now()}`;

    await supabase.from('credit_ledger').insert({
      credit_account_id: account.id,
      transaction_type: 'grant',
      amount: plan.included_credits,
      unit: 'hamoodi_credit',
      reference_type: 'subscription',
      reference_id: planId,
      idempotency_key: idempotencyKey,
      description: `Subscription credits for ${planId}`,
    });

    // Update account balance
    await supabase
      .from('credit_accounts')
      .update({
        available_balance: account.available_balance + plan.included_credits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id);
  }

  /**
   * Get subscription by customer
   */
  async getSubscription(customerId: string): Promise<BillingSubscription | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('billing_customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return data as BillingSubscription;
  }

  /**
   * Get all plans
   */
  async getPlans(): Promise<BillingPlan[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) throw new BillingError('QUERY_FAILED', `Failed to get plans: ${error.message}`);

    return (data || []) as BillingPlan[];
  }

  /**
   * Get customer by user ID
   */
  async getCustomer(userId: string): Promise<BillingCustomer | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('billing_customers')
      .select('*')
      .eq('user_id', userId)
      .eq('billing_owner_type', 'user')
      .single();

    if (error || !data) return null;

    return data as BillingCustomer;
  }
}

export const stripeBillingService = new SIStripeBillingService();
