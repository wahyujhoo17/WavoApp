"use client";
import React from 'react';
import { motion, Variants } from 'framer-motion';

export const Features = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <section className="py-32 px-gutter relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none -z-10"></div>
      <div className="max-w-container-max mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">Everything you need to scale</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">Built from the ground up for developer experience, reliability, and performance.</p>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]"
        >
          {/* Bento 1: Large Span */}
          <motion.div variants={itemVariants} className="md:col-span-2 glass-card bento-card rounded-3xl p-8 relative overflow-hidden flex flex-col justify-end group">
            <div className="absolute top-0 right-0 p-8 w-full h-full flex justify-end items-start opacity-30 group-hover:opacity-100 transition-opacity">
              <div className="w-64 h-64 border border-primary/20 rounded-full flex items-center justify-center relative">
                <div className="w-48 h-48 border border-primary/40 rounded-full flex items-center justify-center animate-spin-slow">
                  <div className="w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
                </div>
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                <div className="absolute top-0 left-1/2 h-full w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent"></div>
              </div>
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-xl">bolt</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Real-time Webhooks</h3>
              <p className="text-on-surface-variant max-w-md">Instant delivery reports, message reads, and incoming messages delivered directly to your endpoints with sub-10ms latency.</p>
            </div>
          </motion.div>

          {/* Bento 2: Small */}
          <motion.div variants={itemVariants} className="glass-card bento-card rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-surface text-xl">code_blocks</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 tracking-tight">Type-Safe SDKs</h3>
              <p className="text-sm text-on-surface-variant">Full TypeScript support out of the box with auto-completion for all message templates.</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-white/5 text-xs font-mono">Node.js</span>
                <span className="px-2 py-1 rounded bg-white/5 text-xs font-mono">Python</span>
                <span className="px-2 py-1 rounded bg-white/5 text-xs font-mono">Go</span>
              </div>
            </div>
          </motion.div>

          {/* Bento 3: Small */}
          <motion.div variants={itemVariants} className="glass-card bento-card rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/10 blur-2xl rounded-full group-hover:bg-primary/20 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-surface text-xl">security</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 tracking-tight">Enterprise Security</h3>
              <p className="text-sm text-on-surface-variant">End-to-end encryption, SOC2 compliance, and fine-grained API token scoping.</p>
            </div>
          </motion.div>

          {/* Bento 4: Large Span */}
          <motion.div variants={itemVariants} className="md:col-span-2 glass-card bento-card rounded-3xl p-8 relative overflow-hidden flex flex-col justify-end group">
            <div className="absolute top-0 right-0 w-full md:w-1/2 h-full flex items-center justify-center opacity-20 group-hover:opacity-60 transition-opacity">
              <div className="relative w-full h-48 px-8">
                {/* Visual Graph Area */}
                <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="200" y2="20" stroke="white" strokeOpacity="0.05" />
                  <line x1="0" y1="50" x2="200" y2="50" stroke="white" strokeOpacity="0.05" />
                  <line x1="0" y1="80" x2="200" y2="80" stroke="white" strokeOpacity="0.05" />
                  
                  <path
                    d="M0,80 Q25,20 50,60 T100,40 T150,70 T200,30"
                    fill="none"
                    stroke="url(#graphGradient)"
                    strokeWidth="2"
                    className="animate-[dash_10s_linear_infinite]"
                    strokeDasharray="400"
                    strokeDashoffset="400"
                  />
                  
                  <circle cx="50" cy="60" r="2" fill="var(--color-primary)" className="animate-pulse" />
                  <circle cx="100" cy="40" r="2" fill="var(--color-primary)" className="animate-pulse [animation-delay:1s]" />
                  <circle cx="150" cy="70" r="2" fill="var(--color-primary)" className="animate-pulse [animation-delay:2s]" />
                  
                  <defs>
                    <linearGradient id="graphGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
                      <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="1" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                    <style>{`
                      @keyframes dash {
                        to { stroke-dashoffset: 0; }
                      }
                    `}</style>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="relative z-10 max-w-sm">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-surface text-xl">monitoring</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Deep Observability</h3>
              <p className="text-on-surface-variant">Track message delivery rates, error logs, and throughput limits in a beautiful real-time dashboard.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
