"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { toast } from '@/lib/toast';
import { apiFetch } from '@/lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = React.useState(initialEmail);
  const [otp, setOtp] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    
    setError(null);
    setIsLoading(true);

    const res = await apiFetch<any>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    
    setIsLoading(false);

    if (res.success) {
      toast.success("Verification Successful", "Your email has been verified. You can now sign in.");
      router.push('/login');
    } else {
      setError(res.error?.message || "Failed to verify email. Please check the code and try again.");
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address to resend the code.");
      return;
    }

    setError(null);
    setIsResending(true);

    const res = await apiFetch<any>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    setIsResending(false);

    if (res.success) {
      toast.success("Code Sent", "A new verification code has been sent to your email.");
    } else {
      setError(res.error?.message || "Failed to resend verification code.");
    }
  };

  return (
    <div className="w-full lg:w-1/2 bg-[#0f0f12] p-8 md:p-12 flex flex-col justify-center">
      <div>
        <div className="mb-12">
          <div className="relative w-[150px] h-[40px]">
            <Image 
              src="/img/logo/fulllogo.png" 
              alt="Wavo Logo" 
              fill
              sizes="150px"
              priority
              className="object-contain"
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Verify Email</h1>
        <p className="text-on-surface-variant/60 text-[15px] mb-8 leading-relaxed max-w-[340px]">
          Enter the 6-digit verification code we sent to your email address.
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-widest block px-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="dev@example.com"
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary/40 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-widest block px-1">Verification Code</label>
            <input 
              type="text" 
              required
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ''));
                if (error) setError(null);
              }}
              placeholder="123456"
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 text-white text-xl text-center tracking-[1em] focus:outline-none focus:border-primary/40 transition-all font-mono"
            />
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2.5">
              <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6 || !email}
            className="w-full relative group overflow-hidden bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-[0_0_40px_-10px_rgba(109,40,217,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? 'Verifying...' : 'Verify Email'}
              {!isLoading && <ShieldCheck size={16} />}
            </span>
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className="text-sm text-on-surface-variant/60 font-medium">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={isResending || !email}
            className="text-white hover:text-primary font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Mail size={14} />
            )}
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c] flex items-center justify-center font-sans py-12 md:py-20 relative">
      <div className="w-full max-w-[1100px] min-h-[600px] lg:h-[750px] flex flex-col lg:flex-row rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl shadow-black/50 mx-4 md:mx-6 z-10">
        
        <Suspense fallback={<div className="w-full lg:w-1/2 bg-[#0f0f12] p-8 md:p-12 flex flex-col justify-center items-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <VerifyEmailContent />
        </Suspense>

        {/* Right Side: Visual/Branding */}
        <div className="hidden lg:flex w-1/2 relative bg-[#14141a] items-center justify-center overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(109,40,217,0.15)_0%,transparent_70%)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col items-center text-center px-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 bg-primary/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-primary/30"
            >
              <ShieldCheck className="text-primary" size={48} />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">Secure Authentication</h2>
            <p className="text-on-surface-variant/60 leading-relaxed text-sm max-w-[280px]">
              We protect your account with email verification to ensure only you have access to your developer dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Global Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/img/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5" />
      </div>
    </main>
  );
}
