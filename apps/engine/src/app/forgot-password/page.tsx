"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Mail } from 'lucide-react';

import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setError(null);
    setIsLoading(true);

    const res = await apiFetch<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      toast.success("Link Sent", "If that email is registered, we have sent a reset link.");
    } else {
      setError(res.error?.message || "Failed to send reset link.");
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0c] flex items-center justify-center font-sans py-12 md:py-20 relative">
      <div className="w-full max-w-[1100px] min-h-[600px] lg:h-[750px] flex flex-col lg:flex-row rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl shadow-black/50 mx-4 md:mx-6 z-10">
        
        {/* Left Side: Form */}
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

            <h1 className="text-3xl font-bold text-white mb-3">Reset Password</h1>
            <p className="text-on-surface-variant/60 text-[15px] mb-8 leading-relaxed max-w-[340px]">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {isSuccess ? (
              <div className="space-y-6">
                <div className="p-6 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="text-primary" size={24} />
                    <h3 className="text-white font-bold text-lg">Check your email</h3>
                  </div>
                  <p className="text-on-surface-variant/70 text-sm leading-relaxed">
                    We've sent a password reset link to <strong>{email}</strong>. 
                    Please check your inbox and spam folder.
                  </p>
                </div>
                
                <Link href="/login" className="w-full bg-white/5 text-white py-4 rounded-xl font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center">
                  Back to login
                </Link>
              </div>
            ) : (
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

                {error && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary/20 text-primary py-4 rounded-xl font-bold text-sm hover:bg-primary/30 transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                  {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
                
                <Link href="/login" className="w-full text-center text-xs font-bold text-[#cfbcff] hover:underline uppercase tracking-widest transition-all py-2 mt-4 block">
                  Back to login
                </Link>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Visual Section */}
        <div className="hidden lg:flex w-1/2 bg-[#14141a] p-12 flex-col justify-center items-center relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[440px] glass-card rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative z-10"
          >
            <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/40">security.js</span>
            </div>
            <div className="p-6 bg-[#0c0c0e]">
              <pre className="font-mono text-[12px] leading-relaxed text-on-surface-variant/70">
                <code>
                  <span className="text-[#5c6370]">// Enterprise-grade security</span><br />
                  <span className="text-[#c678dd]">import</span> {"{ CryptoEngine }"} <span className="text-[#c678dd]">from</span> <span className="text-[#98c379]">'@wavo/core'</span>;<br /><br />
                  <span className="text-[#c678dd]">const</span> token = <span className="text-[#e5c07b]">CryptoEngine</span>.<span className="text-[#61afef]">generateSecureToken</span>();<br />
                  <span className="text-[#c678dd]">await</span> auth.<span className="text-[#61afef]">sendResetEmail</span>(email, token);<br /><br />
                  <span className="text-[#5c6370]">// Protected with rate limiting & encryption</span>
                </code>
              </pre>
            </div>
          </motion.div>

          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
        </div>

      </div>
    </main>
  );
}
