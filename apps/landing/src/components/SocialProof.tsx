import React from 'react';

export const SocialProof = () => {
  return (
    <section className="py-12 border-y border-white/5 bg-background">
      <div className="max-w-container-max mx-auto px-gutter text-center">
        <p className="text-[11px] font-semibold text-on-surface-variant/60 mb-8 tracking-widest uppercase">Trusted by engineering teams at</p>
        <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-xl font-bold text-on-surface tracking-tight">
            <span className="material-symbols-outlined text-2xl">account_tree</span>TechFlow
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-on-surface tracking-tight">
            <span className="material-symbols-outlined text-2xl">cloud_sync</span>Nimbus
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-on-surface tracking-tight">
            <span className="material-symbols-outlined text-2xl">webhook</span>Hooked
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-on-surface tracking-tight">
            <span className="material-symbols-outlined text-2xl">schema</span>ByteShift
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-on-surface tracking-tight">
            <span className="material-symbols-outlined text-2xl">hub</span>NetMesh
          </div>
        </div>
      </div>
    </section>
  );
};
