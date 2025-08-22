"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

declare global {
  interface Window {
    google: typeof google;
  }
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOTP?: boolean; email?: string } | void>;
  logout: () => void;
  handleGoogleLogin: (idToken: string) => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);

    // Initialize Google OAuth
    const initializeGoogleAuth = () => {
      if (typeof window !== 'undefined' && window.google) {
        setGoogleInitialized(true);
      }
    };

    // Check if Google script is already loaded
    if (window.google) {
      initializeGoogleAuth();
    } else {
      // Wait for Google script to load
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', initializeGoogleAuth);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://yahoo-stock-api.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle error responses (wrong username/password, etc.)
        throw new Error(result.message || 'Login failed');
      }

      if (result.requiresOTP) {
        // Account created or requires OTP verification
        return {
          requiresOTP: true,
          email: result.email
        };
      }

      // Successful login - handle like Google login
      const user: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.avatar,
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store the JWT token
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw to let the UI handle it
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleLogin = async (idToken: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('API base URL not configured');
    }

    // Remove trailing slash from API base URL to avoid double slashes
    const cleanApiBaseUrl = apiBaseUrl.replace(/\/+$/, '');
    const apiUrl = `${cleanApiBaseUrl}/api/auth/google`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Assuming your backend returns user data in the response
      const user: User = {
        id: result.user?.id || result.id,
        email: result.user?.email || result.email,
        name: result.user?.name || result.name,
        avatar: result.user?.avatar || result.picture,
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store the JWT token if provided by your backend
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

    } catch (error) {
      console.error('Backend authentication error:', error);
      throw error;
    }
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    
    // Sign out from Google as well
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Reload the page to return to mock data state
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      handleGoogleLogin,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}