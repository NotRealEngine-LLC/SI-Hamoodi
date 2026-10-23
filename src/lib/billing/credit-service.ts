// HAMOODI SyntheTech Intelligence — Credit Service
// Phase 11: Immutable Credit Ledger Management

import { getSupabaseClient } from '../supabase/client';
import {
  CreditAccount,
  CreditLedgerEntry,
  CreateCreditAccountInput,
  CreateCreditLedgerEntryInput,
  TransactionType,
  BillingError,
  InsufficientCreditsError,
} from './types';

/**
 * Credit Service
 * Manages immutable credit ledger with atomic operations
 */
export class SICreditService {
  /**
   * Create a new credit account
   */
  async createAccount(input: CreateCreditAccountInput): Promise<CreditAccount> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('credit_accounts')
      .insert({
        user_id: input.user_id || null,
        workspace_id: input.workspace_id || null,
        account_type: input.account_type,
        available_balance: input.initial_balance || 0,
        reserved_balance: 0,
        unit: input.unit || 'hamoodi_credit',
        status: 'active',
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw new BillingError('ACCOUNT_CREATE_FAILED', `Failed to create account: ${error.message}`);

    return data as CreditAccount;
  }

  /**
   * Get credit account
   */
  async getAccount(accountId: string): Promise<CreditAccount | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error || !data) return null;

    return data as CreditAccount;
  }

  /**
   * Get account by owner
   */
  async getAccountByOwner(
    accountType: 'personal' | 'workspace',
    userId?: string,
    workspaceId?: string
  ): Promise<CreditAccount | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    let query = supabase
      .from('credit_accounts')
      .select('*')
      .eq('account_type', accountType);

    if (userId) query = query.eq('user_id', userId);
    if (workspaceId) query = query.eq('workspace_id', workspaceId);

    const { data, error } = await query.single();

    if (error || !data) return null;

    return data as CreditAccount;
  }

  /**
   * Reserve credits (atomic operation)
   */
  async reserveCredits(
    accountId: string,
    amount: number,
    referenceType: string,
    referenceId: string,
    idempotencyKey: string
  ): Promise<CreditLedgerEntry> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Get account with row lock
    const { data: account, error: accountError } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new BillingError('ACCOUNT_NOT_FOUND', 'Credit account not found');
    }

    // Check available balance
    if (account.available_balance < amount) {
      throw new InsufficientCreditsError(amount, account.available_balance);
    }

    // Create reservation ledger entry
    const entry = await this.createLedgerEntry({
      credit_account_id: accountId,
      transaction_type: 'reserve',
      amount,
      unit: account.unit,
      reference_type: referenceType,
      reference_id: referenceId,
      idempotency_key: idempotencyKey,
      description: `Reserved ${amount} ${account.unit} for ${referenceType}`,
    });

    // Update account balances atomically
    await supabase
      .from('credit_accounts')
      .update({
        available_balance: account.available_balance - amount,
        reserved_balance: account.reserved_balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    return entry;
  }

  /**
   * Consume reserved credits (settle)
   */
  async consumeCredits(
    accountId: string,
    amount: number,
    referenceType: string,
    referenceId: string,
    reservationIdempotencyKey: string
  ): Promise<CreditLedgerEntry> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new BillingError('ACCOUNT_NOT_FOUND', 'Credit account not found');
    }

    // Check reserved balance
    if (account.reserved_balance < amount) {
      throw new BillingError('INSUFFICIENT_RESERVATION', 'Not enough reserved credits');
    }

    // Create consumption ledger entry
    const entry = await this.createLedgerEntry({
      credit_account_id: accountId,
      transaction_type: 'consume',
      amount,
      unit: account.unit,
      reference_type: referenceType,
      reference_id: referenceId,
      idempotency_key: `consume_${reservationIdempotencyKey}`,
      description: `Consumed ${amount} ${account.unit} for ${referenceType}`,
    });

    // Update account balances atomically
    await supabase
      .from('credit_accounts')
      .update({
        reserved_balance: account.reserved_balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    return entry;
  }

  /**
   * Release reserved credits (unused reservation)
   */
  async releaseCredits(
    accountId: string,
    amount: number,
    referenceType: string,
    referenceId: string,
    reservationIdempotencyKey: string
  ): Promise<CreditLedgerEntry> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new BillingError('ACCOUNT_NOT_FOUND', 'Credit account not found');
    }

    // Create release ledger entry
    const entry = await this.createLedgerEntry({
      credit_account_id: accountId,
      transaction_type: 'release',
      amount,
      unit: account.unit,
      reference_type: referenceType,
      reference_id: referenceId,
      idempotency_key: `release_${reservationIdempotencyKey}`,
      description: `Released ${amount} ${account.unit} for ${referenceType}`,
    });

    // Update account balances atomically
    await supabase
      .from('credit_accounts')
      .update({
        available_balance: account.available_balance + amount,
        reserved_balance: account.reserved_balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    return entry;
  }

  /**
   * Grant credits (promotional, subscription, etc.)
   */
  async grantCredits(
    accountId: string,
    amount: number,
    referenceType: string,
    referenceId: string,
    idempotencyKey: string,
    description?: string
  ): Promise<CreditLedgerEntry> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new BillingError('ACCOUNT_NOT_FOUND', 'Credit account not found');
    }

    // Create grant ledger entry
    const entry = await this.createLedgerEntry({
      credit_account_id: accountId,
      transaction_type: 'grant',
      amount,
      unit: account.unit,
      reference_type: referenceType,
      reference_id: referenceId,
      idempotency_key: idempotencyKey,
      description: description || `Granted ${amount} ${account.unit}`,
    });

    // Update account balance atomically
    await supabase
      .from('credit_accounts')
      .update({
        available_balance: account.available_balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    return entry;
  }

  /**
   * Refund credits
   */
  async refundCredits(
    accountId: string,
    amount: number,
    referenceType: string,
    referenceId: string,
    originalTransactionId: string,
    idempotencyKey: string,
    description?: string
  ): Promise<CreditLedgerEntry> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new BillingError('ACCOUNT_NOT_FOUND', 'Credit account not found');
    }

    // Create refund ledger entry
    const entry = await this.createLedgerEntry({
      credit_account_id: accountId,
      transaction_type: 'refund',
      amount,
      unit: account.unit,
      reference_type: referenceType,
      reference_id: referenceId,
      idempotency_key: idempotencyKey,
      description: description || `Refunded ${amount} ${account.unit}`,
      metadata: { original_transaction_id: originalTransactionId },
    });

    // Update account balance atomically
    await supabase
      .from('credit_accounts')
      .update({
        available_balance: account.available_balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    return entry;
  }

  /**
   * Create ledger entry (immutable)
   */
  private async createLedgerEntry(input: CreateCreditLedgerEntryInput): Promise<CreditLedgerEntry> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('credit_ledger')
      .insert({
        credit_account_id: input.credit_account_id,
        transaction_type: input.transaction_type,
        amount: input.amount,
        unit: input.unit || 'hamoodi_credit',
        reference_type: input.reference_type || null,
        reference_id: input.reference_id || null,
        idempotency_key: input.idempotency_key,
        description: input.description || null,
        metadata: input.metadata || {},
        operator_id: input.operator_id || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BillingError('DUPLICATE_TRANSACTION', 'Transaction with this idempotency key already exists');
      }
      throw new BillingError('LEDGER_FAILED', `Failed to create ledger entry: ${error.message}`);
    }

    return data as CreditLedgerEntry;
  }

  /**
   * Get ledger entries for account
   */
  async getLedgerEntries(
    accountId: string,
    filters?: {
      transaction_type?: TransactionType;
      start_date?: string;
      end_date?: string;
      limit?: number;
    }
  ): Promise<CreditLedgerEntry[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    let query = supabase
      .from('credit_ledger')
      .select('*')
      .eq('credit_account_id', accountId)
      .order('created_at', { ascending: false });

    if (filters?.transaction_type) query = query.eq('transaction_type', filters.transaction_type);
    if (filters?.start_date) query = query.gte('created_at', filters.start_date);
    if (filters?.end_date) query = query.lte('created_at', filters.end_date);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) throw new BillingError('QUERY_FAILED', `Failed to get ledger entries: ${error.message}`);

    return (data || []) as CreditLedgerEntry[];
  }

  /**
   * Get account balance (available + reserved)
   */
  async getBalance(accountId: string): Promise<{ available: number; reserved: number; total: number }> {
    const account = await this.getAccount(accountId);
    if (!account) throw new BillingError('ACCOUNT_NOT_FOUND', 'Credit account not found');

    return {
      available: account.available_balance,
      reserved: account.reserved_balance,
      total: account.available_balance + account.reserved_balance,
    };
  }
}

export const creditService = new SICreditService();
