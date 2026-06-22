"use client";
import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { setTokens } from '@/lib/api';
import { toast } from '@/lib/toast';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const userStr = searchParams.get('user');

    if (token && refresh && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Establish local auth state
        setTokens(token, refresh);
        localStorage.setItem('wavo_user', JSON.stringify(user));
        setUser(user);
        
        toast.success("Authentication Successful", `Welcome, ${user.fullName}!`);
        router.push('/dashboard');
      } catch (err) {
        console.error("Failed to parse OAuth user metadata", err);
        toast.error("Authentication Failed", "Received invalid user metadata from identity provider.");
        router.push('/login?error=invalid_user_data');
      }
    } else {
      const error = searchParams.get('error') || 'unknown_error';
      console.error("OAuth authentication failed", error);
      
      let friendlyError = "Authentication was rejected or configuration is missing.";
      if (error === 'google_not_configured') {
        friendlyError = "Google Login is not configured on the server.";
      } else if (error === 'github_not_configured') {
        friendlyError = "GitHub Login is not configured on the server.";
      }
      
      toast.error("Authentication Failed", friendlyError);
      router.push(`/login?error=${error}`);
    }
  }, [searchParams, router, setUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0c] text-white">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
        <h2 className="text-lg font-bold tracking-tight mt-4">Completing Sign In...</h2>
        <p className="text-on-surface-variant/40 text-xs">Establishing secure developer session.</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0c] text-white">
        <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
