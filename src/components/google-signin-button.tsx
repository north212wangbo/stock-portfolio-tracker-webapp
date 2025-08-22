"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { handleGoogleLogin } = useAuth();
  const { actualTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Google Identity Services only once
  useEffect(() => {
    if (typeof window === 'undefined' || !window.google || isInitialized) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: google.accounts.id.CredentialResponse) => {
        try {
          await handleGoogleLogin(response.credential);
          onSuccess?.();
        } catch (error) {
          console.error('Google sign-in error:', error);
          onError?.(error as Error);
        }
      },
    });

    setIsInitialized(true);
  }, [handleGoogleLogin, onSuccess, onError, isInitialized]);

  // Render the button when initialized or theme changes
  useEffect(() => {
    if (!isInitialized || !buttonRef.current || typeof window === 'undefined' || !window.google) return;

    // Clear any existing button content
    buttonRef.current.innerHTML = '';

    // Render the button with theme-aware configuration
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: actualTheme === 'dark' ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 400, // Fixed width to prevent resizing
    });
  }, [isInitialized, actualTheme]);

  return <div ref={buttonRef} className="w-full" />;
}