"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden px-gutter bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>
      <div className="max-w-container-max mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Wavo WhatsApp API v2.0 is now in Public Beta
        </div>
        
        <h1 className="text-6xl md:text-[5.5rem] lg:text-[7rem] font-bold text-on-surface mb-8 mx-auto max-w-5xl tracking-tighter leading-[1.05]">
          WhatsApp API <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#a882ff]">Built for Scale.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-on-surface-variant mb-12 mx-auto max-w-3xl font-normal tracking-tight">
          Open-source messaging infrastructure with realtime APIs, queue-powered delivery, and multi-instance orchestration.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
          <Link href={`${process.env.NEXT_PUBLIC_ENGINE_URL || ''}/register`}>
            <button className="bg-white text-background px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-primary transition-all shadow-glow-primary hover:shadow-glow-primary-lg flex items-center justify-center gap-2">
              Start Building Free
              <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
            </button>
          </Link>
          <Link href="/docs">
            <button className="glass-card text-on-surface px-8 py-3.5 rounded-full font-medium text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Read Docs
            </button>
          </Link>
        </div>

        {/* Enhanced Code Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative w-full max-w-4xl mx-auto perspective-[2000px]"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-[#a882ff]/30 rounded-2xl blur-2xl opacity-50"></div>
          <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative transform rotate-x-[2deg] hover:rotate-x-0 transition-transform duration-500">
            {/* Terminal Header */}
            <div className="bg-black/40 border-b border-white/5 px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="text-xs font-mono text-on-surface-variant/50">send-message.ts</div>
              <div className="w-12"></div>
            </div>
            {/* Code Content */}
            <div className="p-6 bg-[#09090b]/80 backdrop-blur-md">
              <pre className="text-left font-mono text-sm leading-relaxed overflow-x-auto">
                <code className="language-typescript">
                  <span className="text-[#c678dd]">import</span> {"{ Wavo }"} <span className="text-[#c678dd]">from</span> <span className="text-[#98c379]">&apos;@wavo/whatsapp&apos;</span>;<br /><br />
                  <span className="text-[#56b6c2]">// Initialize with zero-config</span><br />
                  <span className="text-[#c678dd]">const</span> client = <span className="text-[#e5c07b]">new</span> <span className="text-[#61afef]">Wavo</span>(<span className="text-[#e06c75]">process</span>.<span className="text-[#e06c75]">env</span>.<span className="text-[#d19a66]">WAVO_API_KEY</span>);<br /><br />
                  <span className="text-[#c678dd]">await</span> client.<span className="text-[#e06c75]">messages</span>.<span className="text-[#61afef]">send</span>({`{`} <br />
                  {"  "}<span className="text-[#d19a66]">to</span>: <span className="text-[#98c379]">&apos;+15551234567&apos;</span>,<br />
                  {"  "}<span className="text-[#d19a66]">type</span>: <span className="text-[#98c379]">&apos;template&apos;</span>,<br />
                  {"  "}<span className="text-[#d19a66]">template</span>: {`{`} <br />
                  {"    "}<span className="text-[#d19a66]">name</span>: <span className="text-[#98c379]">&apos;welcome_dev&apos;</span>,<br />
                  {"    "}<span className="text-[#d19a66]">components</span>: [<br />
                  {"      "}{`{`} <span className="text-[#d19a66]">type</span>: <span className="text-[#98c379]">&apos;header&apos;</span>, <span className="text-[#d19a66]">parameters</span>: [{`{`} <span className="text-[#d19a66]">type</span>: <span className="text-[#98c379]">&apos;text&apos;</span>, <span className="text-[#d19a66]">text</span>: <span className="text-[#98c379]">&apos;Wavo User&apos;</span> {`}`}] {`}`} <br />
                  {"    "}]<br />
                  {"  "}{`}`} <br />
                  {`}`});
                </code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
