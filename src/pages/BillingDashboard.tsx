// HAMOODI SyntheTech Intelligence — Billing Dashboard
// Phase 11: Subscription & Billing Management

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Download, Loader2, CheckCircle, AlertCircle,
  Clock, Crown, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stripeBillingService } from '../lib/billing/stripe-service';
import { entitlementService } from '../lib/billing/entitlement-service';
import { creditService } from '../lib/billing/credit-service';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import type { BillingSubscription, BillingPlan, CreditAccount } from '../lib/billing/types';

export function BillingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceManagement();
  
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && currentWorkspace) {
      loadBillingData();
    }
  }, [user, currentWorkspace]);

  const loadBillingData = async () => {
    if (!user || !currentWorkspace) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get entitlements
      const entitlements = await entitlementService.resolveEntitlements(
        user.id,
        currentWorkspace.id
      );

      // Get subscription
      const customer = await stripeBillingService.getCustomer(user.id);
      if (customer) {
        const sub = await stripeBillingService.getSubscription(customer.id);
        setSubscription(sub);

        if (sub) {
          const planData = await entitlementService.getAvailablePlans();
          const currentPlan = planData.find(p => p.plan_id === sub.plan_id);
          setPlan(currentPlan || null);
        }
      }

      // Get credit account
      const account = await creditService.getAccountByOwner(
        'workspace',
        undefined,
        currentWorkspace.id
      );
      setCreditAccount(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;

    try {
      const customer = await stripeBillingService.getCustomer(user.id);
      if (!customer) {
        alert('No billing account found');
        return;
      }

      // In production, this would create a Stripe billing portal session
      alert('Billing portal would open here.\n\nStripe integration requires server-side configuration.');
    } catch (err) {
      console.error('Failed to open billing portal:', err);
    }
  };

  const handleViewInvoices = async () => {
    if (!user) return;

    try {
      const customer = await stripeBillingService.getCustomer(user.id);
      if (!customer) {
        alert('No billing account found');
        return;
      }

      // In production, this would fetch invoices from Stripe
      alert('Invoice history would be displayed here.\n\nStripe integration requires server-side configuration.');
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return <CheckCircle size={16} className="text-emerald-400" />;
      case 'past_due':
        return <AlertCircle size={16} className="text-amber-400" />;
      case 'cancelled':
        return <Clock size={16} className="text-zinc-400" />;
      default:
        return <AlertCircle size={16} className="text-zinc-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'text-emerald-400';
      case 'past_due':
        return 'text-amber-400';
      case 'cancelled':
        return 'text-zinc-400';
      default:
        return 'text-zinc-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-zinc-400">Manage your subscription, credits, and billing</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Current Plan */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>
          <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
            {subscription && plan ? (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(subscription.status)}
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4">{plan.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Status:</span>{' '}
                      <span className={`capitalize ${getStatusColor(subscription.status)}`}>
                        {subscription.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Renews:</span>{' '}
                      <span className="text-zinc-300">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                    {subscription.cancel_at_period_end && (
                      <div className="text-amber-400">
                        Cancels at period end
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Change Plan
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Zap size={20} className="text-zinc-400" />
                    <h3 className="text-xl font-bold text-white">Free Plan</h3>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4">Get started with HAMOODI SI</p>
                  <div className="text-sm text-zinc-500">
                    Basic features with limited usage
                  </div>
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Credit Balance */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Credit Balance</h2>
          <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
            {creditAccount ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Available Credits</p>
                    <p className="text-3xl font-bold text-white">
                      {creditAccount.available_balance.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {creditAccount.unit.replace('_', ' ')}s
                    </p>
                  </div>
                  {creditAccount.reserved_balance > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-zinc-500 mb-1">Reserved</p>
                      <p className="text-xl font-semibold text-amber-400">
                        {creditAccount.reserved_balance.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate('/usage')}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
                >
                  View Transaction History
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <CreditCard size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 mb-4">No credit account</p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Purchase Credits
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Billing Management */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Billing Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleManageBilling}
              className="p-6 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-left transition-all"
            >
              <CreditCard size={24} className="text-violet-400 mb-3" />
              <h3 className="text-base font-medium text-white mb-1">Manage Payment Methods</h3>
              <p className="text-sm text-zinc-400">Update card, billing address, and payment settings</p>
            </button>

            <button
              onClick={handleViewInvoices}
              className="p-6 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-left transition-all"
            >
              <Download size={24} className="text-emerald-400 mb-3" />
              <h3 className="text-base font-medium text-white mb-1">View Invoices</h3>
              <p className="text-sm text-zinc-400">Download receipts and view billing history</p>
            </button>
          </div>
        </section>

        {/* Plan Features */}
        {plan && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Your Plan Features</h2>
            <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">Features</h3>
                  <div className="space-y-2">
                    {Object.entries(plan.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center gap-2">
                        {enabled ? (
                          <CheckCircle size={16} className="text-emerald-400" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span className={`text-sm ${enabled ? 'text-zinc-300' : 'text-zinc-600'}`}>
                          {formatFeatureName(feature)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">Usage Limits</h3>
                  <div className="space-y-2">
                    {Object.entries(plan.usage_limits).map(([feature, limit]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300">
                          {formatFeatureName(feature)}
                        </span>
                        <span className="text-sm text-zinc-400">
                          {formatLimit(limit as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function formatFeatureName(feature: string): string {
  return feature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatLimit(limit: number): string {
  if (limit === -1) return 'Unlimited';
  if (limit >= 1000000000) return `${(limit / 1000000000).toFixed(0)} GB`;
  if (limit >= 1000000) return `${(limit / 1000000).toFixed(0)} MB`;
  if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
  return limit.toString();
}
