"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { LoginModal } from './login-modal';

interface UserProfileDropdownProps {
  className?: string;
}

export function UserProfileDropdown({ className }: UserProfileDropdownProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleProfileClick = () => {
    if (user) {
      setShowDropdown(!showDropdown);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleSignOut = () => {
    logout();
    setShowDropdown(false);
  };

  const handleSignInClick = () => {
    setShowDropdown(false);
    setShowLoginModal(true);
  };

  // Close dropdown when clicking outside
  const handleBackdropClick = () => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  };

  return (
    <>
      {showDropdown && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={handleBackdropClick}
        />
      )}
      
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleProfileClick}
          className="relative z-20"
        >
          <User className="h-4 w-4" />
        </Button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-20">
            {user ? (
              <div className="py-1">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="py-1">
                <button
                  onClick={handleSignInClick}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </>
  );
}