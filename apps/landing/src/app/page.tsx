"use client";

import dynamic from 'next/dynamic';
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SocialProof } from "@/components/SocialProof";
import { Features } from "@/components/Features";
import { CTA, Footer } from "@/components/CTA";

const Terminal = dynamic(() => import("@/components/Terminal").then(mod => mod.Terminal), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-background" /> 
});

const Infrastructure = dynamic(() => import("@/components/Infrastructure").then(mod => mod.Infrastructure), { 
  ssr: false,
  loading: () => <div className="h-[600px] bg-background" /> 
});

export default function Home() {
  return (
    <main className="flex-grow flex flex-col relative pt-[72px]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-background-image-mesh-gradient -z-10 pointer-events-none"></div>
      <div className="absolute inset-0 grid-pattern -z-10 pointer-events-none opacity-50"></div>
      
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <Terminal />
      <Infrastructure />
      <CTA />
      <Footer />
    </main>
  );
}
