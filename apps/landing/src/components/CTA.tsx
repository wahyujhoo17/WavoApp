"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export const CTA = () => {
  return (
    <section className="py-32 px-gutter border-t border-white/5 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] z-0 pointer-events-none"></div>
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-on-surface mb-6 tracking-tighter">Ready to build?</h2>
        <p className="text-xl text-on-surface-variant mb-10 font-normal">Join thousands of developers building scalable messaging experiences with Wavo.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href={`${process.env.NEXT_PUBLIC_ENGINE_URL || ''}/register`}>
            <button className="bg-white text-background px-10 py-4 rounded-full font-semibold text-base hover:bg-primary transition-all shadow-glow-primary hover:shadow-glow-primary-lg w-full sm:w-auto">
              Get Started Now
            </button>
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="glass-card text-on-surface px-10 py-4 rounded-full font-semibold text-base hover:bg-white/5 transition-all flex items-center justify-center gap-2">
            <GithubIcon />
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-background w-full py-20 border-t border-white/5 relative overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-12 px-gutter max-w-container-max mx-auto relative z-10">
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-2 text-xl font-bold text-on-surface mb-6 tracking-tighter">
            <Image
              src="/img/logo/fulllogo.png"
              alt="Wavo Logo"
              width={120}
              height={32}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <p className="text-sm text-on-surface-variant/70 mb-8 max-w-xs leading-relaxed">
            The open-source WhatsApp API infrastructure for modern developers. Secure, scalable, and built for high-throughput messaging.
          </p>
          <div className="flex gap-4">
            <a href="https://github.com" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all">
              <GithubIcon />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" /></svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-on-surface text-sm mb-6 uppercase tracking-widest">Platform</h4>
          <ul className="space-y-4">
            <li><a className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="/features">Features</a></li>
            <li><a className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="#">Changelog</a></li>
            <li><a className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="#">Status</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-on-surface text-sm mb-6 uppercase tracking-widest">Developers</h4>
          <ul className="space-y-4">
            <li><a className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="/docs">Documentation</a></li>
            <li><a className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="#">API Reference</a></li>
            <li><a className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="#">SDKs</a></li>
            <li><a className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="#">Open Source</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-on-surface text-sm mb-6 uppercase tracking-widest">Legal</h4>
          <ul className="space-y-4">
            <li><Link className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="/legal/privacy">Privacy Policy</Link></li>
            <li><Link className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="/legal/terms">Terms of Service</Link></li>
            <li><Link className="text-sm text-on-surface-variant/70 hover:text-primary transition-colors" href="/legal/cookie">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-gutter mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-on-surface-variant/50">© 2026 Wavo Inc. All rights reserved.</p>
      </div>
    </footer>
  );
};
