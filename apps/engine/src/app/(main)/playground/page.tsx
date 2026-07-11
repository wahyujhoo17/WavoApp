"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, Send, Smartphone, ShieldAlert, CheckCircle2, AlertTriangle, Code2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';

export default function PlaygroundPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [toNumber, setToNumber] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Response State
  const [apiResponse, setApiResponse] = useState<string>('// Enter destination and message to test the API...');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await apiFetch<any[]>('/services');
      if (res.success && res.data) {
        // Only get CONNECTED services for playground testing
        const connectedServices = res.data.filter(s => s.status === 'CONNECTED');
        setServices(connectedServices);
        if (connectedServices.length > 0) {
          setSelectedServiceId(connectedServices[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load services", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !toNumber || !messageText) {
      toast.error('Validation Error', 'Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    setApiResponse('// Sending request to /api/v1/send/text...\n');

    try {
      const res = await apiFetch<any>('/send/text', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedServiceId,
          to: toNumber,
          message: messageText
        })
      });

      // Pretty print JSON response
      setApiResponse(JSON.stringify(res, null, 2));

      if (res.success) {
        toast.success('Message Queued', 'Successfully sent to WhatsApp gateway');
        setMessageText(''); // Clear text after success
      } else {
        toast.error('Send Failed', res.error?.message || 'Unknown error occurred');
      }
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: err.message }, null, 2));
      toast.error('Request Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.05] pb-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-white flex items-center gap-3">
            <Terminal className="text-primary w-9 h-9" />
            API Playground
          </h1>
          <p className="text-[#8e8e93] text-[16px] font-medium mt-1">
            Test and simulate Wavo API requests directly from your dashboard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Request Form */}
        <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] shadow-xl space-y-8 flex flex-col">
          <div>
            <h3 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
              <Send className="text-[#cfbcff] w-5 h-5" />
              Send Text Message
            </h3>
            <p className="text-[14px] text-[#8e8e93] mt-1 font-medium">Configure payload parameters to push a message through the API.</p>
          </div>

          <form onSubmit={handleTestSend} className="space-y-6 flex-1 flex flex-col">
            {/* Service Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest block px-1">WhatsApp Service</label>
              {loadingServices ? (
                <div className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-[#8e8e93] text-sm animate-pulse">
                  Loading available services...
                </div>
              ) : services.length === 0 ? (
                <div className="w-full bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl px-4 py-3 text-[#ff3b30] text-sm flex items-center gap-2">
                  <ShieldAlert size={16} />
                  No CONNECTED services available.
                </div>
              ) : (
                <div className="relative">
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full bg-black/40 border ${isDropdownOpen ? 'border-primary/40' : 'border-white/5'} rounded-2xl pl-10 pr-10 py-3 text-white text-sm font-bold flex items-center justify-between cursor-pointer transition-all hover:border-white/20`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Smartphone size={16} className="absolute left-4 text-primary" />
                      <span className="truncate">
                        {services.find(s => s.id === selectedServiceId)?.name || 'Select a service'} 
                        <span className="text-white/40 ml-1 font-normal">
                          (+{services.find(s => s.id === selectedServiceId)?.phoneNumber})
                        </span>
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <motion.div 
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        >
                          <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {services.map(svc => (
                              <div
                                key={svc.id}
                                onClick={() => {
                                  setSelectedServiceId(svc.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all ${
                                  selectedServiceId === svc.id 
                                    ? 'bg-primary/20 text-primary' 
                                    : 'text-white hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-bold truncate">{svc.name}</span>
                                  <span className={selectedServiceId === svc.id ? 'text-primary/60' : 'text-white/40'}>
                                    (+{svc.phoneNumber})
                                  </span>
                                </div>
                                {selectedServiceId === svc.id && (
                                  <Check size={16} className="shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Destination Phone Number */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest block px-1">Destination Number (To)</label>
              <input 
                type="text" 
                required
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="628123456789"
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/40 transition-all font-mono placeholder:text-[#8e8e93]/50"
              />
              <p className="text-[11px] text-[#8e8e93] px-1">Must be E.164 format digits only (10-15 characters).</p>
            </div>

            {/* Message Body */}
            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest block px-1">Message Payload</label>
              <textarea 
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Hello from Wavo API Playground!"
                className="w-full flex-1 min-h-[160px] bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/40 transition-all placeholder:text-[#8e8e93]/50 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 mt-auto">
              <button 
                type="submit"
                disabled={isSubmitting || services.length === 0}
                className="w-full py-4 bg-primary/20 text-primary border border-primary/20 rounded-2xl font-bold text-[15px] hover:bg-primary/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Sending Request...
                  </span>
                ) : (
                  <>
                    <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                    Execute API Call
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Console/Logs */}
        <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative group">
          <div className="h-12 bg-[#1c1c1e] border-b border-white/[0.05] flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-2">
              <Code2 size={16} className="text-[#8e8e93]" />
              <span className="text-[12px] font-bold text-[#8e8e93] font-mono tracking-wider">RESPONSE PAYLOAD</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff3b30]/80" />
              <div className="w-3 h-3 rounded-full bg-[#FFCC00]/80" />
              <div className="w-3 h-3 rounded-full bg-[#34C759]/80" />
            </div>
          </div>
          
          <div className="flex-1 p-6 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent">
            {/* Syntax Highlighted JSON output */}
            <pre className="font-mono text-[13px] text-[#cfbcff] leading-relaxed overflow-y-auto custom-scrollbar h-full break-all whitespace-pre-wrap">
              {apiResponse}
            </pre>
            
            {/* Blurry glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none opacity-50 mix-blend-screen group-hover:opacity-100 transition-opacity duration-1000" />
          </div>
        </div>
      </div>
    </div>
  );
}
