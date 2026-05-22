"use client";
import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}

interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void | Promise<void>;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
  prompt: (options: PromptOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [confirmConfig, setConfirmConfig] = useState<ConfirmationOptions | null>(null);
  const [promptConfig, setPromptConfig] = useState<PromptOptions | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const confirm = (options: ConfirmationOptions) => {
    setConfirmConfig(options);
  };

  const prompt = (options: PromptOptions) => {
    setPromptConfig(options);
    setPromptValue(options.defaultValue || '');
  };

  const handleConfirmClose = () => {
    setConfirmConfig(null);
  };

  const handlePromptClose = () => {
    setPromptConfig(null);
    setPromptValue('');
  };

  return (
    <ConfirmationContext.Provider value={{ confirm, prompt }}>
      {children}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1c1c1e] border border-white/[0.08] rounded-[24px] max-w-[440px] w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    confirmConfig.type === 'danger' 
                      ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20' 
                      : confirmConfig.type === 'warning' 
                        ? 'bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/20' 
                        : 'bg-[#cfbcff]/10 text-[#cfbcff] border border-[#cfbcff]/20'
                  }`}>
                    {confirmConfig.type === 'danger' ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
                  </div>
                  <h3 className="text-[18px] font-bold text-white tracking-tight">{confirmConfig.title}</h3>
                </div>
                
                <p className="text-[14px] text-[#8e8e93] leading-relaxed">
                  {confirmConfig.message}
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleConfirmClose}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-[14px] transition-all"
                  >
                    {confirmConfig.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={async () => {
                      await confirmConfig.onConfirm();
                      handleConfirmClose();
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-[14px] transition-all text-black ${
                      confirmConfig.type === 'danger' 
                        ? 'bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white' 
                        : 'bg-[#cfbcff] hover:bg-[#cfbcff]/90'
                    }`}
                  >
                    {confirmConfig.confirmText || 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prompt Modal */}
      <AnimatePresence>
        {promptConfig && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1c1c1e] border border-white/[0.08] rounded-[24px] max-w-[440px] w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#cfbcff]/10 text-[#cfbcff] border border-[#cfbcff]/20">
                    <Info size={20} />
                  </div>
                  <h3 className="text-[18px] font-bold text-white tracking-tight">{promptConfig.title}</h3>
                </div>
                
                <p className="text-[14px] text-[#8e8e93] leading-relaxed">
                  {promptConfig.message}
                </p>

                <input
                  type="text"
                  placeholder={promptConfig.placeholder || 'Enter value...'}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-[#cfbcff]/50 transition-all font-sans"
                  autoFocus
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handlePromptClose}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-[14px] transition-all"
                  >
                    {promptConfig.cancelText || 'Cancel'}
                  </button>
                  <button
                    disabled={!promptValue.trim()}
                    onClick={async () => {
                      if (promptValue.trim()) {
                        await promptConfig.onConfirm(promptValue);
                        handlePromptClose();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-[#cfbcff] hover:bg-[#cfbcff]/90 disabled:opacity-50 text-black rounded-xl font-bold text-[14px] transition-all"
                  >
                    {promptConfig.confirmText || 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}
