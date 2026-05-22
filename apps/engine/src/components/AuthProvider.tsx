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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
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
        const storedUser = localStorage.getItem('wavo_user');
        
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
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

    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      // Redirect unauthenticated users to login
      router.push('/login');
    } else if (user && (isPublicRoute || pathname === '/')) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const res = await apiFetch<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);

    if (res.success && res.data) {
      const { user: loggedInUser, accessToken, refreshToken } = res.data;
      setTokens(accessToken, refreshToken);
      localStorage.setItem('wavo_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      toast.success("Login Successful", `Welcome back, ${loggedInUser.fullName}!`);
      router.push('/dashboard');
      return true;
    } else {
      toast.error("Authentication Failed", res.error?.message || "Invalid email or password.");
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setIsLoading(true);
    const res = await apiFetch<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });

    setIsLoading(false);

    if (res.success && res.data) {
      toast.success("Account Created", "Developer account successfully registered! Please sign in.");
      router.push('/login');
      return true;
    } else {
      toast.error("Registration Failed", res.error?.message || "An error occurred during sign up.");
      return false;
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
