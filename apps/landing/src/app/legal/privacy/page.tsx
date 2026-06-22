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

export default function PrivacyPage() {
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
            <span className="text-white">Privacy Policy</span>
          </div>

          {/* ════════════════ PRIVACY POLICY ════════════════ */}
          <section id="privacy" className="space-y-6 mb-20">
            <h2 className="text-[28px] font-bold text-white border-b border-white/[0.05] pb-3 flex items-center gap-3">
              <Shield className="text-[#cfbcff]" size={26} />
              Privacy Policy
            </h2>
            <div className="text-[15px] text-[#8e8e93] leading-relaxed space-y-4 font-normal">
              <p className="text-white/90">Last updated: June 22, 2026</p>
              <p>
                At Wavo, we take your privacy seriously. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our WhatsApp API Gateway service, dashboard, and related websites.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">1. Information We Collect</h4>
              <p>
                We collect personal information that you voluntarily provide to us when registering, such as your name, email address, passwords, and billing information. In addition, when connecting a WhatsApp account, we encrypt and securely store session tokens and connection states required to perform automated messaging services on your behalf.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">2. How We Use Your Information</h4>
              <p>
                We use your information to operate and maintain your WhatsApp service instances, authenticate access to the REST API, process billing, prevent platform abuse, and send you important updates or security alerts regarding your account.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">3. Data Retention and Security</h4>
              <p>
                All session credentials are encrypted using industry-standard AES-256-GCM. We do not store the content of messages sent through Wavo once they are successfully dispatched to WhatsApp, except for transient logs necessary for delivery tracking. You may completely delete your WhatsApp credentials and soft-delete your instance from the Dashboard at any time.
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
