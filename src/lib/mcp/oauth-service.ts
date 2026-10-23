// HAMOODI SyntheTech Intelligence — OAuth Connection Service
// Phase 08: OAuth authorization for external integrations

import { getSupabaseClient } from '../supabase/client';
import {
  IntegrationConnection,
  IntegrationProvider,
  OAuthConfig,
  OAuthTokens,
  OAuthState,
  AuthenticationError,
  ConnectionError,
} from './types';

export class SIOAuthConnectionService {
  private readonly REDIRECT_URI = `${window.location.origin}/integrations/oauth/callback`;
  private readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Start OAuth authorization flow
   */
  async startOAuthFlow(
    userId: string,
    connectionId: string,
    provider: IntegrationProvider
  ): Promise<string> {
    if (!provider.oauth_authorize_url || !provider.oauth_token_url || !provider.oauth_client_id) {
      throw new AuthenticationError('OAuth not configured for this provider');
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Generate state parameter
    const state: OAuthState = {
      connectionId,
      userId,
      pkceVerifier: codeVerifier,
      redirectUri: this.REDIRECT_URI,
      createdAt: Date.now(),
    };

    // Store state in sessionStorage (not localStorage for security)
    const stateString = btoa(JSON.stringify(state));
    sessionStorage.setItem(`oauth_state_${connectionId}`, stateString);

    // Build authorization URL
    const authUrl = new URL(provider.oauth_authorize_url);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', provider.oauth_client_id);
    authUrl.searchParams.set('redirect_uri', this.REDIRECT_URI);
    authUrl.searchParams.set('state', stateString);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    if (provider.oauth_scopes && provider.oauth_scopes.length > 0) {
      authUrl.searchParams.set('scope', provider.oauth_scopes.join(' '));
    }

    return authUrl.toString();
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    code: string,
    stateString: string
  ): Promise<OAuthTokens> {
    // Decode and validate state
    let state: OAuthState;
    try {
      state = JSON.parse(atob(stateString));
    } catch {
      throw new AuthenticationError('Invalid state parameter');
    }

    // Validate state expiry
    if (Date.now() - state.createdAt > this.STATE_EXPIRY_MS) {
      throw new AuthenticationError('State parameter expired');
    }

    // Retrieve stored state
    const storedStateString = sessionStorage.getItem(`oauth_state_${state.connectionId}`);
    if (!storedStateString || storedStateString !== stateString) {
      throw new AuthenticationError('State mismatch');
    }

    // Clean up state
    sessionStorage.removeItem(`oauth_state_${state.connectionId}`);

    // Get provider configuration
    const supabase = getSupabaseClient();
    if (!supabase) throw new ConnectionError('Supabase not configured');

    const { data: connection } = await supabase
      .from('integration_connections')
      .select('*, provider:integration_providers(*)')
      .eq('id', state.connectionId)
      .single();

    if (!connection || !connection.provider) {
      throw new ConnectionError('Connection not found');
    }

    const provider = connection.provider as IntegrationProvider;

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(
      code,
      state.pkceVerifier,
      provider
    );

    // Store encrypted tokens
    await this.storeTokens(state.connectionId, tokens);

    // Update connection
    await supabase
      .from('integration_connections')
      .update({
        status: 'connected',
        oauth_scopes: tokens.scopes,
        oauth_expires_at: new Date(tokens.expiresAt * 1000).toISOString(),
        last_success_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.connectionId);

    return tokens;
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    provider: IntegrationProvider
  ): Promise<OAuthTokens> {
    if (!provider.oauth_token_url || !provider.oauth_client_id) {
      throw new AuthenticationError('OAuth token endpoint not configured');
    }

    const response = await fetch(provider.oauth_token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI,
        client_id: provider.oauth_client_id,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AuthenticationError(`Token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() / 1000 + (data.expires_in || 3600),
      tokenType: data.token_type || 'Bearer',
      scopes: data.scope ? data.scope.split(' ') : provider.oauth_scopes || [],
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(connectionId: string): Promise<OAuthTokens> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ConnectionError('Supabase not configured');

    // Get connection and credentials
    const { data: connection } = await supabase
      .from('integration_connections')
      .select('*, provider:integration_providers(*)')
      .eq('id', connectionId)
      .single();

    if (!connection || !connection.provider) {
      throw new ConnectionError('Connection not found');
    }

    const provider = connection.provider as IntegrationProvider;

    // In production, retrieve encrypted refresh token from credentials table
    // For now, throw error as we don't have secure credential storage implemented
    throw new AuthenticationError('Token refresh not yet implemented - requires secure credential storage');
  }

  /**
   * Store encrypted tokens
   */
  private async storeTokens(connectionId: string, tokens: OAuthTokens): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // In production, this would:
    // 1. Encrypt tokens using a secure key management system
    // 2. Store in integration_credentials table
    // 3. Never expose raw tokens to client

    // For now, we'll store minimal metadata
    // Actual token storage requires server-side encryption
    console.warn('Token storage requires server-side encryption - not implemented in client');
  }

  /**
   * Revoke OAuth tokens
   */
  async revokeTokens(connectionId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Get connection
    const { data: connection } = await supabase
      .from('integration_connections')
      .select('*, provider:integration_providers(*)')
      .eq('id', connectionId)
      .single();

    if (!connection || !connection.provider) {
      return;
    }

    // In production, this would:
    // 1. Call provider's revocation endpoint
    // 2. Delete encrypted credentials
    // 3. Update connection status

    await supabase
      .from('integration_connections')
      .update({
        status: 'disconnected',
        oauth_scopes: null,
        oauth_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(connection: IntegrationConnection): boolean {
    if (!connection.oauth_expires_at) {
      return false;
    }

    const expiresAt = new Date(connection.oauth_expires_at).getTime();
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minute buffer

    return expiresAt - bufferMs < now;
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  /**
   * Generate PKCE code challenge
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

export const oauthConnectionService = new SIOAuthConnectionService();
