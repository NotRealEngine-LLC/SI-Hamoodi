// HAMOODI SyntheTech Intelligence — Pricing Page
// Phase 11: Subscription Plans & Pricing

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Zap, Crown, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stripeBillingService } from '../lib/billing/stripe-service';
import { useAuth } from '../contexts/AuthContext';
import type { BillingPlan } from '../lib/billing/types';

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await stripeBillingService.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (plan: BillingPlan) => {
    if (!user) {
      navigate('/auth/sign-in');
      return;
    }

    if (plan.plan_id === 'free') {
      navigate('/workspace');
      return;
    }

    // In production, this would create a Stripe checkout session
    // For now, show a message
    alert(`Checkout for ${plan.name} plan would be initiated here.\n\nStripe integration requires server-side configuration.`);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Zap size={24} className="text-zinc-400" />;
      case 'plus': return <Zap size={24} className="text-blue-400" />;
      case 'pro': return <Crown size={24} className="text-violet-400" />;
      case 'team': return <Building2 size={24} className="text-amber-400" />;
      default: return <Zap size={24} className="text-zinc-400" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'from-zinc-500 to-zinc-600';
      case 'plus': return 'from-blue-500 to-blue-600';
      case 'pro': return 'from-violet-500 to-indigo-600';
      case 'team': return 'from-amber-500 to-orange-600';
      default: return 'from-zinc-500 to-zinc-600';
    }
  };

  const formatPrice = (plan: BillingPlan) => {
    if (plan.plan_id === 'free') return 'Free';
    
    // These are example prices - would come from Stripe
    const prices: Record<string, { month: number; year: number }> = {
      'plus': { month: 20, year: 200 },
      'pro': { month: 50, year: 500 },
      'team': { month: 100, year: 1000 },
    };

    const price = prices[plan.plan_id];
    if (!price) return 'Contact Us';

    const amount = billingInterval === 'month' ? price.month : price.year;
    return `$${amount}/${billingInterval === 'month' ? 'mo' : 'yr'}`;
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
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-zinc-400 mb-8">
              Scale your intelligence with HAMOODI SI
            </p>

            {/* Billing Interval Toggle */}
            <div className="inline-flex items-center gap-2 p-1 bg-zinc-800 rounded-lg">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingInterval === 'month'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingInterval === 'year'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs text-emerald-400">Save 20%</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.plan_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl border ${
                plan.is_popular
                  ? 'bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/50'
                  : 'bg-zinc-800/30 border-zinc-700/50'
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlanColor(plan.plan_id)} flex items-center justify-center mb-4`}>
                  {getPlanIcon(plan.plan_id)}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-zinc-400 mb-4">{plan.description}</p>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatPrice(plan)}
                </div>
                {plan.plan_id !== 'free' && (
                  <p className="text-xs text-zinc-500">
                    {plan.included_credits.toLocaleString()} credits included
                  </p>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  plan.is_popular
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {plan.plan_id === 'free' ? 'Get Started' : 'Subscribe'}
              </button>

              <div className="mt-6 space-y-3">
                {Object.entries(plan.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-start gap-2">
                    {enabled ? (
                      <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${enabled ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      {formatFeatureName(feature)}
                    </span>
                  </div>
                ))}

                {Object.entries(plan.usage_limits).map(([feature, limit]) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-300">
                      {formatLimitName(feature)}: {formatLimit(limit as number)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="What are HAMOODI credits?"
              answer="HAMOODI credits are used to meter eligible services operated by HAMOODI, such as company-funded AI usage, premium automation execution, and hosted document processing. Credits are separate from Puter.js usage, which is managed through your Puter account."
            />
            <FAQItem
              question="Can I change my plan later?"
              answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle, and prorations are handled automatically."
            />
            <FAQItem
              question="What happens if I exceed my quota?"
              answer="You'll receive a notification when approaching your quota limits. Once exceeded, additional usage will be blocked until the next billing period or until you upgrade your plan."
            />
            <FAQItem
              question="Do credits expire?"
              answer="Subscription-included credits reset each billing period. Purchased credits may have expiration dates as specified at the time of purchase. Promotional credits follow their specific terms."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-base font-medium text-white">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-400"
            />
          </svg>
        </motion.div>
      </button>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="mt-4 text-sm text-zinc-400">{answer}</p>
      </motion.div>
    </div>
  );
}

function formatFeatureName(feature: string): string {
  return feature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatLimitName(feature: string): string {
  return feature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Per Month', '/mo')
    .replace('Bytes', 'Storage');
}

function formatLimit(limit: number): string {
  if (limit === -1) return 'Unlimited';
  if (limit >= 1000000000) return `${(limit / 1000000000).toFixed(0)} GB`;
  if (limit >= 1000000) return `${(limit / 1000000).toFixed(0)} MB`;
  if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
  return limit.toString();
}
