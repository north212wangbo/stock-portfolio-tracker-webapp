"use client";

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OTPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onOTPSubmit: (otp: string) => Promise<void>;
  isLoading?: boolean;
}

export function OTPModal({ open, onOpenChange, email, onOTPSubmit, isLoading = false }: OTPModalProps) {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when modal opens
  useEffect(() => {
    if (open && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [open]);

  const handleInputChange = async (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOTP(newOtp);
    
    if (error) setError('');

    // Move to next input if current input has a value
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const completeOtp = newOtp.join('');
      if (completeOtp.length === 6) {
        try {
          await onOTPSubmit(completeOtp);
          // Reset on success
          setOTP(['', '', '', '', '', '']);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Verification failed. Please try again.');
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // If current input is empty, move to previous input
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOTP(newOtp);
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Handle paste
    else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      // Allow default paste behavior, will be handled in onPaste
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pasteData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasteData[i] || '';
      }
      setOTP(newOtp);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      // Auto-submit if we have 6 digits
      if (pasteData.length === 6) {
        setTimeout(async () => {
          try {
            await onOTPSubmit(pasteData);
            setOTP(['', '', '', '', '', '']);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Verification failed. Please try again.');
          }
        }, 100);
      }
    }
  };

  const handleClose = () => {
    setOTP(['', '', '', '', '', '']);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Verification</DialogTitle>
          <DialogDescription>
            We&apos;ve sent a verification code to {email}. Please enter the 6-digit code below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Verification Code</Label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  disabled={isLoading}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {isLoading && (
              <p className="text-sm text-muted-foreground text-center">Verifying...</p>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-4">
          Didn&apos;t receive the code? Check your spam folder or try again in a few minutes.
        </div>
      </DialogContent>
    </Dialog>
  );
}