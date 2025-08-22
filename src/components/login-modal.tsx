"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { GoogleSignInButton } from './google-signin-button';
import { OTPModal } from './otp-modal';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const { login, isLoading, setUser } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      setError('');
      const result = await login(email, password);
      
      if (result?.requiresOTP) {
        // Show OTP modal for email verification
        setOtpEmail(result.email || email);
        setShowOTPModal(true);
      } else {
        // Successful login - close modal and reset form
        onOpenChange(false);
        setEmail('');
        setPassword('');
        setError('');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };

  const handleGoogleSuccess = () => {
    onOpenChange(false);
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google login failed:', error);
  };


  const handleOTPSubmit = async (otp: string) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: otpEmail, 
          otp: otp 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle OTP verification failure
        throw new Error(result.error || 'OTP verification failed');
      }

      // Successful OTP verification - same as successful login
      const user = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.avatar,
      };

      // Use the auth context to set user (same as Google/email login)
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store the JWT token
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      // Close both modals and reset all form states
      setShowOTPModal(false);
      onOpenChange(false);
      setEmail('');
      setPassword('');
      setError('');
      setOtpEmail('');

    } catch (error) {
      throw error; // Re-throw to let OTP modal handle the error display
    }
  };

  const handleModalClose = (modalOpen: boolean) => {
    if (!modalOpen) {
      // Reset all form states when closing the main modal
      setEmail('');
      setPassword('');
      setError('');
      setShowOTPModal(false);
      setOtpEmail('');
    }
    onOpenChange(modalOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in to your account to access your portfolios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
        </DialogContent>
      </Dialog>

      <OTPModal
        open={showOTPModal}
        onOpenChange={setShowOTPModal}
        email={otpEmail}
        onOTPSubmit={handleOTPSubmit}
        isLoading={isLoading}
      />
    </>
  );
}