"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { WorldMap } from "@/components/ui/world-map";

export const Infrastructure = () => {
  return (
    <section className="py-32 px-gutter relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-mesh-gradient opacity-20 -z-10"></div>
      
      <div className="max-w-container-max mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest mb-6"
        >
          Infrastructure
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-on-surface mb-6 tracking-tighter"
        >
          Global Low-Latency Network
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-16"
        >
          Wavo operates on a high-speed edge network with over 20+ points of presence globally to ensure sub-100ms message delivery.
        </motion.p>
        
        <div className="relative w-full max-w-5xl mx-auto border border-white/10 rounded-[2.5rem] glass-card overflow-hidden bg-black/60 backdrop-blur-md shadow-2xl">
          <WorldMap
            dots={[
              {
                start: { lat: 40.71, lng: -74.00, label: "New York" },
                end: { lat: 50.11, lng: 8.68, label: "Frankfurt" },
              },
              {
                start: { lat: 50.11, lng: 8.68, label: "Frankfurt" },
                end: { lat: 25.20, lng: 55.27, label: "Dubai" },
              },
              {
                start: { lat: 25.20, lng: 55.27, label: "Dubai" },
                end: { lat: 1.35, lng: 103.81, label: "Singapore" },
              },
              {
                start: { lat: 1.35, lng: 103.81, label: "Singapore" },
                end: { lat: 35.67, lng: 139.65, label: "Tokyo" },
              },
              {
                start: { lat: 35.67, lng: 139.65, label: "Tokyo" },
                end: { lat: 34.05, lng: -118.24, label: "Los Angeles" },
              },
              {
                start: { lat: 34.05, lng: -118.24, label: "Los Angeles" },
                end: { lat: 40.71, lng: -74.00, label: "New York" },
              },
              {
                start: { lat: 40.71, lng: -74.00, label: "New York" },
                end: { lat: -23.55, lng: -46.63, label: "São Paulo" },
              },
              {
                start: { lat: 50.11, lng: 8.68, label: "Frankfurt" },
                end: { lat: -33.92, lng: 18.42, label: "Cape Town" },
              },
              {
                start: { lat: 1.35, lng: 103.81, label: "Singapore" },
                end: { lat: -33.86, lng: 151.20, label: "Sydney" },
              },
              {
                start: { lat: 19.07, lng: 72.87, label: "Mumbai" },
                end: { lat: 1.35, lng: 103.81, label: "Singapore" },
              },
              {
                start: { lat: 48.85, lng: 2.35, label: "Paris" },
                end: { lat: 50.11, lng: 8.68, label: "Frankfurt" },
              }
            ]}
            lineColor="#10b981"
          />

          {/* Stats Overlay */}
          <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end z-30 pointer-events-none">
            <div className="flex gap-12">
              <div>
                <div className="text-3xl font-bold text-on-surface font-mono">99.99%</div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-semibold">Uptime Guarantee</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-on-surface font-mono">&lt;45ms</div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-semibold">Global Latency</div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-3xl font-bold text-on-surface font-mono">24/7</div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-semibold">Live Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
