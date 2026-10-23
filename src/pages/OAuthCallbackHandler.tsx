// HAMOODI SyntheTech Intelligence — OAuth Callback Handler
// Phase 08: Handle OAuth authorization callbacks

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useIntegrations } from '../contexts/IntegrationsContext';

export function OAuthCallbackHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useIntegrations();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(`OAuth error: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Missing code or state parameter');
        return;
      }

      try {
        await handleOAuthCallback(code, state);
        setStatus('success');
        
        // Redirect to integrations page after 2 seconds
        setTimeout(() => {
          navigate('/integrations');
        }, 2000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'OAuth callback failed');
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="max-w-md w-full px-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 size={48} className="animate-spin text-violet-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Completing Authorization</h2>
              <p className="text-sm text-zinc-400">
                Please wait while we complete the connection...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Connection Successful</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Your integration has been connected successfully.
              </p>
              <p className="text-xs text-zinc-500">
                Redirecting to integrations...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
              <p className="text-sm text-red-400 mb-4">
                {errorMessage || 'An error occurred during authorization'}
              </p>
              <button
                onClick={() => navigate('/integrations')}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-all"
              >
                Return to Integrations
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
