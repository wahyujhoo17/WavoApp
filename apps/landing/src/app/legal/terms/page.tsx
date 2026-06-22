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

export default function TermsPage() {
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
            <span className="text-white">Terms of Service</span>
          </div>

          {/* ════════════════ TERMS OF SERVICE ════════════════ */}
          <section id="terms" className="space-y-6 mb-20">
            <h2 className="text-[28px] font-bold text-white border-b border-white/[0.05] pb-3 flex items-center gap-3">
              <FileText className="text-[#cfbcff]" size={26} />
              Terms of Service
            </h2>
            <div className="text-[15px] text-[#8e8e93] leading-relaxed space-y-4 font-normal">
              <p className="text-white/90">Last updated: June 22, 2026</p>
              <p>
                Welcome to Wavo! By accessing or using our self-hosted platform or cloud-hosted services, you agree to comply with and be bound by these Terms of Service.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">1. Account Registration</h4>
              <p>
                You must provide accurate and complete registration information. You are solely responsible for maintaining the confidentiality of your API keys and JWT access tokens, and for all activities that occur under your account.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">2. Acceptable Use and Facebook Policies</h4>
              <p>
                You agree NOT to use Wavo to distribute unsolicited messages (spam), malware, phishing campaigns, or illegal content. Your use of Wavo must strictly adhere to the WhatsApp Business Terms of Service and Facebook Developer policies. While Wavo provides built-in rate limiting and anti-ban mechanisms, we do not guarantee and are not liable if your WhatsApp number is blocked or banned by Meta for violating WhatsApp policies.
              </p>

              <h4 className="text-white font-bold text-[16px] pt-4">3. Limitation of Liability</h4>
              <p>
                Wavo is provided "as is" without warranty of any kind. In no event shall Wavo Inc., its developers, or affiliates be liable for any direct, indirect, incidental, or consequential damages (including loss of data, number bans, or service interruption) arising out of the use or inability to use this platform.
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
