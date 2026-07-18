"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch, setTokens, clearTokens, getAccessToken } from '@/lib/api';
import { toast } from '@/lib/toast';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user and tokens on startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          // Fetch fresh user profile from API to prevent stale data (e.g. 2FA state)
          const res = await apiFetch<{ user: User }>('/auth/me');
          if (res.success && res.data?.user) {
            localStorage.setItem('wavo_user', JSON.stringify(res.data.user));
            setUser(res.data.user);
          } else {
            // Fallback to local storage if API fails or offline
            const storedUser = localStorage.getItem('wavo_user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        }
      } catch (err) {
        console.error("Failed to restore session", err);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Route protection rules
  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      // Redirect unauthenticated users to login
      router.push('/login');
    } else if (user && (isPublicRoute || pathname === '/')) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; code?: string }> => {
    setIsLoading(true);
    const res = await apiFetch<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);

    if (res.success && res.data) {
      if ((res.data as any).requires2FA) {
        setIsLoading(false);
        return { success: true, requires2FA: true, tempToken: (res.data as any).tempToken } as any;
      }
      const { user: loggedInUser, accessToken, refreshToken } = res.data as any;
      setTokens(accessToken, refreshToken);
      localStorage.setItem('wavo_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      toast.success("Login Successful", `Welcome back, ${loggedInUser.fullName}!`);
      router.push('/dashboard');
      return { success: true };
    } else {
      const errMsg = res.error?.message || "Invalid email or password.";
      
      if (res.error?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error("Email Not Verified", errMsg);
        router.push('/verify-email?email=' + encodeURIComponent(email));
        return { success: false, error: errMsg, code: res.error?.code };
      }

      toast.error("Authentication Failed", errMsg);
      return { success: false, error: errMsg, code: res.error?.code };
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string; code?: string }> => {
    setIsLoading(true);
    const res = await apiFetch<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });

    setIsLoading(false);

    if (res.success && res.data) {
      toast.success("Account Created", "Developer account successfully registered! Please check your email for the verification code.");
      router.push('/verify-email?email=' + encodeURIComponent(email));
      return { success: true };
    } else {
      const errMsg = res.error?.message || "An error occurred during sign up.";

      if (res.error?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error("Email Not Verified", errMsg);
        router.push('/verify-email?email=' + encodeURIComponent(email));
        return { success: false, error: errMsg, code: res.error?.code };
      }

      toast.error("Registration Failed", errMsg);
      return { success: false, error: errMsg, code: res.error?.code };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Graceful invalidation of session on backend
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore backend errors on logout and proceed with local flush
    }
    clearTokens();
    setUser(null);
    setIsLoading(false);
    toast.info("Logged Out", "You have been securely signed out.");
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
