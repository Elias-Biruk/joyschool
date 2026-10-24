'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface GoogleSignInProps {
  onGoogleAuth: (idToken: string) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function GoogleSignIn({ onGoogleAuth, onSuccess, onError }: GoogleSignInProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Google Client ID is configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your-google-client-id.apps.googleusercontent.com') {
      setGoogleConfigured(false);
      onError?.('Google sign-in is not configured');
      return;
    }

    setGoogleConfigured(true);

    // Load Google Identity Services script on mount
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);

      // @ts-ignore - Google API types
      const google = window.google;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          console.log('[GoogleSignIn] Callback triggered, response:', response ? 'Credential received' : 'No response');
          try {
            setLoading(true);
            console.log('[GoogleSignIn] Calling onGoogleAuth with credential');
            await onGoogleAuth(response.credential);
            console.log('[GoogleSignIn] Authentication successful, calling onSuccess');
            onSuccess?.();
          } catch (error: any) {
            console.error('[GoogleSignIn] Authentication error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Google sign-in failed';
            console.error('[GoogleSignIn] Error message:', errorMessage);
            onError?.(errorMessage);
          } finally {
            console.log('[GoogleSignIn] Setting loading to false');
            setLoading(false);
          }
        },
      });

      // Render the Google button
      if (buttonRef.current) {
        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          width: '100%',
        });
      }
    };

    script.onerror = () => {
      console.error('[GoogleSignIn] Failed to load Google Identity Services script');
      onError?.('Failed to load Google sign-in');
    };

    document.head.appendChild(script);
  }, [onError, onSuccess, onGoogleAuth]);

  if (!googleConfigured) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google sign-in (not configured)
      </Button>
    );
  }

  return (
    <div className="w-full">
      {loading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </div>
      )}
      <div ref={buttonRef} className="w-full" />
    </div>
  );
}
