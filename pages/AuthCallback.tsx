import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Landing page for the Supabase OAuth redirect (`/auth/callback`).
 *
 * The provider sends the browser back here with the auth result in the URL —
 * `?code=...` for the PKCE flow, `#access_token=...` for the implicit flow, or
 * `?error=...` when the provider/Supabase rejected the attempt. supabase-js
 * reads that URL once, on client initialization, and exchanges it for a session.
 *
 * So this page must NOT navigate away before that has happened: replacing the
 * URL first throws away the code and the sign-in silently fails. `getSession()`
 * waits on the client's initialization (including the code exchange), which
 * makes it the right thing to await before deciding where to go.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      // The provider can report a failure instead of a code (consent denied,
      // redirect URL not allow-listed, provider disabled in Supabase, ...).
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const providerError =
        query.get('error_description') ||
        query.get('error') ||
        hash.get('error_description') ||
        hash.get('error');

      if (providerError) {
        console.error('🔐 OAuth callback error:', providerError);
        if (!cancelled) {
          setError(providerError);
          setTimeout(() => navigate('/login', { replace: true, state: { authError: providerError } }), 2500);
        }
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError || !data.session) {
        const message = sessionError?.message || 'Could not complete sign in. Please try again.';
        console.error('🔐 OAuth callback failed to produce a session:', message);
        setError(message);
        setTimeout(() => navigate('/login', { replace: true, state: { authError: message } }), 2500);
        return;
      }

      console.log('🔐 OAuth callback established a session, redirecting to /app');
      navigate('/app', { replace: true });
    };

    finish();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="flex flex-col items-center space-y-4">
        {error ? (
          <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <p className="text-gold/60 text-sm font-medium">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
