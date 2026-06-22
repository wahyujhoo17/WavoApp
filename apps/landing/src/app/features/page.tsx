"use client";
import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/CTA";

const FeatureHero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 80]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative h-screen min-h-[650px] w-full overflow-hidden flex items-center bg-[#050505]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />
        
        {/* Animated Glow 1 */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-primary blur-[120px]"
        />
        {/* Animated Glow 2 */}
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] right-[5%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full bg-[#a882ff] blur-[100px]"
        />

        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/30 z-10" />
      </div>

      <div className="max-w-container-max mx-auto px-gutter relative z-20 w-full flex flex-col lg:flex-row items-center justify-between gap-12 pt-20 lg:pt-0">
        {/* Left Column: Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.3, type: "spring", stiffness: 40 }}
          style={{ y: y1 }}
          className="w-full lg:w-[50%] relative hidden md:block"
        >
          <div className="relative w-full max-w-[800px] mr-auto flex justify-center items-center">
            <img 
              src="/images/wavo-dashboard.png" 
              alt="Wavo Dashboard Engine" 
              className="w-full h-auto object-contain drop-shadow-[0_0_50px_rgba(168,130,255,0.15)]"
            />
            
            {/* Floating animated elements */}
            <motion.div 
              animate={{ y: [-15, 15, -15] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-10 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -z-10"
            />
            <motion.div 
              animate={{ y: [15, -15, 15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/4 right-20 w-40 h-40 bg-[#a882ff]/20 rounded-full blur-[70px] -z-10"
            />
          </div>
        </motion.div>

        {/* Right Column: Text */}
        <motion.div style={{ y: y1 }} className="max-w-2xl lg:w-1/2 z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-wrap items-center gap-3 mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary backdrop-blur-md">
              <span className="material-symbols-outlined text-[16px]">redeem</span>
              Free 1,000 Messages / Day
            </div>
            {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-sm font-medium text-green-400 backdrop-blur-md">
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              100% Safe Anti-Ban
            </div> */}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-[1.1] text-white"
          >
            Scale WhatsApp Messaging <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#a882ff] to-primary bg-[length:200%_auto] animate-gradient-x">Without Limits.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-lg text-on-surface-variant max-w-xl font-normal leading-relaxed mb-12 opacity-80"
          >
            Send millions of WhatsApp messages safely without fear of Facebook blocks. Our intelligent anti-ban mechanism ensures enterprise-grade reliability and realtime delivery tracking.
          </motion.p>

          <div className="flex flex-wrap gap-5">
            <button className="relative group overflow-hidden bg-white text-background px-9 py-4 rounded-full font-bold text-base transition-all shadow-glow-primary hover:shadow-glow-primary-lg">
              <span className="relative z-10">Start Building</span>
            </button>
            <button className="glass-card text-on-surface px-9 py-4 rounded-full font-bold text-base border border-white/10 hover:bg-white/5 transition-all">
              Documentation
            </button>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20 z-20 pointer-events-none"
      >
        <span className="text-[9px] uppercase tracking-[0.4em] font-bold">Explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white via-white/40 to-transparent"></div>
      </motion.div>
    </section>
  );
};

const FeatureSection = ({ title, description, code, direction = "left", icon }: any) => {
  return (
    <div className="py-32 border-t border-white/5 bg-background/50 backdrop-blur-3xl relative overflow-hidden">
      <div className={`absolute top-1/2 ${direction === 'left' ? 'left-0' : 'right-0'} -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -z-10`}></div>

      <div className={`max-w-container-max mx-auto px-gutter flex flex-col ${direction === "right" ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-16 md:gap-24`}>
        <div className="flex-1 space-y-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-glow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-on-surface leading-none">{title}</h2>
          </div>
          <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed font-normal opacity-80">{description}</p>
          <div className="grid grid-cols-2 gap-6 pt-4">
            {[
              { label: "Global Edge", icon: "public" },
              { label: "Sub-100ms", icon: "bolt" },
              { label: "Secure Vault", icon: "shield_lock" },
              { label: "Auto-Scale", icon: "trending_up" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-on-surface-variant font-medium group/item hover:text-on-surface transition-colors cursor-default">
                <span className="material-symbols-outlined text-primary/60 text-xl group-hover/item:text-primary transition-all">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/60 backdrop-blur-3xl shadow-xl group hover:border-primary/20 transition-all duration-700">
            <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/30 uppercase tracking-[0.2em] font-bold">Wavo Engine</span>
            </div>
            <div className="p-8 overflow-x-auto">
              <pre className="font-mono text-sm leading-relaxed text-primary/70">
                <code>{code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-on-surface selection:bg-primary selection:text-white">
      <Navbar />
      <FeatureHero />

      <section className="relative">
        <FeatureSection
          icon="shield_lock"
          title="Smart Anti-Ban Engine"
          description="Protect your business numbers from Facebook's ban algorithms. Wavo automatically simulates human typing, manages random message delays, and smartly limits velocity to keep your accounts 100% safe."
          code={`// Intelligent Anti-Ban Strategy
const wavo = new WavoServer({
  antiBan: {
    enabled: true,
    humanize: true,         // Typing simulation
    delayMin: 1200,         // Dynamic ms delay
    delayMax: 3500,
    dailyLimit: 1000        // Free quota guard
  }
});`}
        />
        <FeatureSection
          direction="right"
          icon="account_tree"
          title="Multi-Node Scale"
          description="Scale your WhatsApp automation across multiple nodes globally. Wavo handles state synchronization and session distribution."
          code={`// Elastic Cluster Config
const wavo = new WavoServer({
  nodes: ['us-east', 'eu-west'],
  replication: true,
  store: 'redis'
});`}
        />
        <FeatureSection
          direction="right"
          icon="bolt"
          title="Streaming Webhooks"
          description="Real-time events for message status, typing indicators, and presence updates with sub-100ms latency."
          code={`// Event Handling
wavo.on('message', async (ctx) => {
  await ctx.reply('Processed instantly.');
});`}
        />
      </section>

      {/* Grid Detail Section */}
      <section className="py-32 px-gutter">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-6 text-white">Excellence.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Auto-Healing", desc: "Intelligent recovery systems that restore connections automatically.", icon: "healing" },
              { title: "Smart Limiting", desc: "Adaptive algorithms to keep accounts safe.", icon: "speed" },
              { title: "Cloud Native", desc: "Support for Redis Cloud, MongoDB Atlas, and modern backends.", icon: "cloud" },
              { title: "Interactive UI", desc: "Support for list messages, quick replies, and carousel flows.", icon: "touch_app" },
              { title: "Observability", desc: "Integration with Prometheus, Grafana, and Datadog.", icon: "analytics" },
              { title: "Scale Up", desc: "Architected to handle millions of concurrent messages.", icon: "trending_up" }
            ].map((f, i) => (
              <div
                key={i}
                className="group p-10 rounded-[3rem] bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all text-2xl">{f.icon}</span>
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">{f.title}</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed font-normal opacity-60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
