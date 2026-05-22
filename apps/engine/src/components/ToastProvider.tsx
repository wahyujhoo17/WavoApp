"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, Info, X } from 'lucide-react';
import { ToastType } from '@/lib/toast';

interface ToastData {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  React.useEffect(() => {
    const handleToast = (event: any) => {
      const { title, message, type } = event.detail;
      const newToast: ToastData = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        message,
        type,
      };
      
      // Add toast to stack
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full sm:w-[350px]">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              layout
              className="pointer-events-auto flex items-start gap-3 bg-[#1c1c1e] border border-white/10 px-5 py-4 rounded-2xl shadow-2xl w-full select-none"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? 'bg-[#34C759]/10 text-[#34C759]' : 
                toast.type === 'error' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                'bg-[#cfbcff]/10 text-[#cfbcff]'
              }`}>
                {toast.type === 'success' ? <ShieldCheck size={18} /> : 
                 toast.type === 'error' ? <AlertCircle size={18} /> : 
                 <Info size={18} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white leading-tight truncate">{toast.title}</p>
                <p className="text-[12px] text-[#8e8e93] font-medium leading-normal mt-0.5 break-words">{toast.message}</p>
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                className="text-[#8e8e93] hover:text-white transition-colors shrink-0 p-0.5"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
