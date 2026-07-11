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
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error("OAuth authentication failed", error);
      let friendlyError = "Authentication was rejected or configuration is missing.";
      if (error === 'google_not_configured') friendlyError = "Google Login is not configured.";
      if (error === 'github_not_configured') friendlyError = "GitHub Login is not configured.";
      if (error === 'csrf_validation_failed') friendlyError = "Security validation failed. Please try again.";
      
      toast.error("Authentication Failed", friendlyError);
      router.push(`/login?error=${error}`);
      return;
    }

    if (code) {
      // Exchange code for tokens
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/auth/oauth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const { user, accessToken, refreshToken } = data.data;
          setTokens(accessToken, refreshToken);
          localStorage.setItem('wavo_user', JSON.stringify(user));
          setUser(user);
          
          toast.success("Authentication Successful", `Welcome, ${user.fullName}!`);
          router.push('/dashboard');
        } else {
          throw new Error(data.error?.message || 'Exchange failed');
        }
      })
      .catch(err => {
        console.error("Failed to exchange OAuth token", err);
        toast.error("Authentication Failed", "Received invalid response from server.");
        router.push('/login?error=exchange_failed');
      });
    } else {
      router.push('/login');
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
