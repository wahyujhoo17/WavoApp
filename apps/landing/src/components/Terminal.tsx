"use client";
import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.8,
      delayChildren: 0.5,
    },
  },
};

const lineVariants = {
  hidden: { opacity: 0, x: -5 },
  visible: { opacity: 1, x: 0 },
};

const TerminalContent = () => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="p-6 font-mono text-sm text-on-surface-variant bg-black min-h-[280px]"
    >
      <motion.div variants={lineVariants} className="mb-2">
        <span className="text-primary">❯</span> wavo webhooks listen --port 3000
      </motion.div>
      <motion.div variants={lineVariants} className="text-white/40 mb-4">
        Starting secure tunnel to wavo.local...
      </motion.div>
      <motion.div variants={lineVariants} className="text-[#27c93f] mb-4">
        ✓ Tunnel established: https://abc-123.wavo.link -&gt; localhost:3000
      </motion.div>
      <motion.div variants={lineVariants} className="mb-2 opacity-50">
        Waiting for events...
      </motion.div>
      <motion.div variants={lineVariants} className="mb-1">
        <span className="text-primary">[2024-05-13 10:14:02]</span> POST /webhooks/wa - <span className="text-[#27c93f]">200 OK</span> (message.received)
      </motion.div>
      <motion.div variants={lineVariants} className="mb-1">
        <span className="text-primary">[2024-05-13 10:14:05]</span> POST /webhooks/wa - <span className="text-[#27c93f]">200 OK</span> (message.delivered)
      </motion.div>
      <motion.div variants={lineVariants} className="mb-1">
        <span className="text-primary">[2024-05-13 10:14:12]</span> POST /webhooks/wa - <span className="text-[#27c93f]">200 OK</span> (message.read)
      </motion.div>
      <motion.div variants={lineVariants} className="mt-4 flex items-center">
        <span className="text-primary animate-pulse">█</span>
      </motion.div>
    </motion.div>
  );
};

export const Terminal = () => {
  return (
    <section className="py-24 border-t border-white/5 bg-[#050505]">
      <div className="max-w-container-max mx-auto px-gutter flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 lg:pr-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-6"
          >
            Developer Experience
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-on-surface mb-6 tracking-tighter"
          >
            Command line control.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-on-surface-variant mb-8"
          >
            Manage templates, inspect webhooks, and tail logs directly from your terminal using our official CLI. No need to context switch to a browser.
          </motion.p>
          <motion.ul 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, staggerChildren: 0.1 }}
            className="space-y-4"
          >
            <motion.li variants={lineVariants} className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              Create and sync message templates
            </motion.li>
            <motion.li variants={lineVariants} className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              Local webhook tunneling built-in
            </motion.li>
            <motion.li variants={lineVariants} className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              Tail production delivery logs
            </motion.li>
          </motion.ul>
        </div>
        <div className="flex-1 w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-xl overflow-hidden border border-white/10 shadow-2xl"
          >
            <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center">
              <div className="text-xs font-mono text-on-surface-variant">bash</div>
            </div>
            <TerminalContent />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
