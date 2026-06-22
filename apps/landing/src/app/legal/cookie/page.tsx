"use client";
import React from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/CTA";
import { Shield, FileText, Cookie, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
  { id: 'privacy', label: 'Privacy Policy', icon: Shield, href: '/legal/privacy' },
  { id: 'terms', label: 'Terms of Service', icon: FileText, href: '/legal/terms' },
  { id: 'cookie', label: 'Cookie Policy', icon: Cookie, href: '/legal/cookie' },
];

const SideNavItem = ({ icon: Icon, label, href, isActive }: any) => (
  <Link
    href={href}
    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
      isActive 
        ? 'bg-[#cfbcff]/10 text-[#cfbcff] border border-[#cfbcff]/20' 
        : 'text-[#8e8e93] hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    <Icon size={16} />
    {label}
  </Link>
);

export default function CookiePage() {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#050505] text-on-surface selection:bg-primary selection:text-white">
      <Navbar />

      <div className="pt-24 flex min-h-screen max-w-container-max mx-auto">
        {/* ─── Left Sidebar Navigation ─── */}
        <div className="hidden lg:block w-[260px] border-r border-white/[0.05] p-6 shrink-0 h-[calc(100vh-120px)] sticky top-24 overflow-y-auto">
          <div className="space-y-2 mb-8">
            <h4 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.2em] px-4 mb-4">Legal Documents</h4>
            {SECTIONS.map((s) => (
              <SideNavItem
                key={s.id}
                icon={s.icon}
                label={s.label}
                href={s.href}
                isActive={pathname === s.href}
              />
            ))}
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 max-w-[920px] p-6 md:p-12 mx-auto overflow-hidden">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#8e8e93] mb-8">
            <span>Wavo</span>
            <ChevronRight size={14} />
            <span>Legal</span>
            <ChevronRight size={14} />
            <span className="text-white">Cookie Policy</span>
          </div>

          {/* ════════════════ COOKIE POLICY ════════════════ */}
          <section id="cookie" className="space-y-6 mb-14">
            <h2 className="text-[28px] font-bold text-white border-b border-white/[0.05] pb-3 flex items-center gap-3">
              <Cookie className="text-[#cfbcff]" size={26} />
              Cookie Policy
            </h2>
            <div className="text-[15px] text-[#8e8e93] leading-relaxed space-y-4 font-normal">
              <p className="text-white/90">Last updated: June 22, 2026</p>
              <p>
                This Cookie Policy explains how Wavo uses cookies and similar technologies to recognize you when you visit or log in to our dashboard and landing website.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">1. What are Cookies?</h4>
              <p>
                Cookies are small data files placed on your computer or mobile device when you visit a website. They are widely used to make websites work efficiently, provide analytics, and securely store session preferences.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">2. How We Use Cookies</h4>
              <p>
                We use strictly necessary cookies to keep you signed in to your account dashboard and preserve your theme selections (light/dark mode). We may also use anonymous third-party analytical cookies to analyze site traffic and performance.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">3. Controlling Cookies</h4>
              <p>
                You can configure or disable cookies through your browser settings. However, disabling strictly necessary cookies will prevent you from logging in and accessing the Wavo Dashboard.
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
