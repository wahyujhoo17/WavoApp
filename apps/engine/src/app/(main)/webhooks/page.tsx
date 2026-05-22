"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Copy, 
  Zap, 
  Activity,
  Sliders,
  Loader2,
  Globe,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';

const AVAILABLE_EVENTS = [
  { key: 'message.received', label: 'Message Received', description: 'Triggered when an incoming message is received from a contact.' },
  { key: 'message.sent', label: 'Message Sent', description: 'Triggered when an outgoing message is successfully sent.' },
  { key: 'message.failed', label: 'Message Failed', description: 'Triggered when an outgoing message fails to send.' },
  { key: 'instance.connected', label: 'Instance Connected', description: 'Triggered when the WhatsApp instance connects successfully.' },
  { key: 'instance.disconnected', label: 'Instance Disconnected', description: 'Triggered when the WhatsApp instance is disconnected.' },
];

const WebhooksSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
    {/* Left Column */}
    <div className="lg:col-span-2 space-y-8">
      {/* Endpoint Config Skeleton */}
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] space-y-8">
        <div className="flex justify-between items-start">
          <div className="h-6 bg-white/5 rounded-lg w-1/3" />
          <div className="h-12 bg-white/5 rounded-2xl w-32" />
        </div>
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="h-3 bg-white/5 rounded w-24" />
            <div className="h-14 bg-white/5 rounded-2xl w-full" />
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-white/5 rounded w-24" />
            <div className="h-14 bg-white/5 rounded-2xl w-full" />
          </div>
        </div>
      </div>

      {/* Events Card Skeleton */}
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] space-y-8">
        <div className="h-6 bg-white/5 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[100px] bg-white/5 rounded-[24px] w-full" />
          ))}
        </div>
      </div>
    </div>

    {/* Right Column */}
    <div className="space-y-8">
      {/* Test Connection Skeleton */}
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-10 rounded-[40px] flex flex-col items-center space-y-6">
        <div className="w-20 h-20 rounded-[28px] bg-white/5" />
        <div className="h-6 bg-white/5 rounded-lg w-1/2" />
        <div className="h-20 bg-white/5 rounded-2xl w-full" />
        <div className="h-14 bg-white/5 rounded-2xl w-full" />
      </div>

      {/* Deliveries Skeleton */}
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] space-y-6">
        <div className="flex justify-between">
          <div className="h-6 bg-white/5 rounded-lg w-1/3" />
          <div className="h-4 bg-white/5 rounded-lg w-16" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Card = ({ title, subtitle, children, extra, className = "" }: any) => (
  <div className={`bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] shadow-xl ${className}`}>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h3 className="text-[20px] font-bold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-[14px] text-[#8e8e93] font-medium mt-1.5">{subtitle}</p>}
      </div>
      {extra}
    </div>
    {children}
  </div>
);

const EventCheckbox = ({ title, description, checked, onChange }: any) => {
  return (
    <label 
      className={`flex gap-4 p-5 rounded-[24px] border transition-all group cursor-pointer ${
        checked ? 'bg-[#cfbcff]/5 border-[#cfbcff]/20' : 'bg-black/20 border-white/5 hover:border-white/10'
      }`}
    >
      <div className="pt-1">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={onChange}
          className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-[#cfbcff] cursor-pointer" 
        />
      </div>
      <div>
        <h4 className={`text-[15px] font-bold transition-colors ${checked ? 'text-white' : 'text-[#8e8e93]'}`}>{title}</h4>
        <p className="text-[12px] text-[#8e8e93]/60 leading-relaxed mt-1.5 font-medium">{description}</p>
      </div>
    </label>
  );
};

const DeliveryRow = ({ delivery }: { delivery: any }) => {
  const { id, event, responseStatus, status, createdAt } = delivery;
  const isSuccess = status === 'SUCCESS';
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-all cursor-pointer group border border-transparent hover:border-white/5">
      <div className="flex items-center gap-4">
        <div className={`w-2.5 h-2.5 rounded-full ${isSuccess ? 'bg-[#34C759] shadow-[0_0_8px_#34C759]' : 'bg-[#FF3B30] shadow-[0_0_8px_#FF3B30]'} transition-all`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-mono text-white font-bold tracking-tight">evt_{id}</span>
            <span className="text-[11px] font-bold text-[#8e8e93]/60 bg-white/5 px-2 py-0.5 rounded-md font-mono">{event}</span>
          </div>
          <p className="text-[12px] text-[#8e8e93] font-medium mt-1">{formatTime(createdAt)}</p>
        </div>
      </div>
      <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${
        isSuccess ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20'
      }`}>
        {responseStatus} {isSuccess ? 'OK' : 'ERR'}
      </div>
    </div>
  );
};

export default function WebhooksPage() {
  const [services, setServices] = React.useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>('');
  const [webhookConfig, setWebhookConfig] = React.useState<any>(null);
  
  const [payloadUrl, setPayloadUrl] = React.useState('');
  const [signingSecret, setSigningSecret] = React.useState('');
  const [subscribedEvents, setSubscribedEvents] = React.useState<string[]>([]);
  const [isActive, setIsActive] = React.useState(true);
  
  const [deliveries, setDeliveries] = React.useState<any[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [isFetchingConfig, setIsFetchingConfig] = React.useState(false);

  // Fetch initial services list
  React.useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      const res = await apiFetch<any[]>('/services');
      if (res.success && res.data) {
        setServices(res.data);
        if (res.data.length > 0) {
          setSelectedServiceId(res.data[0].id);
        } else {
          setIsLoading(false);
        }
      } else {
        toast.error("Error", "Failed to retrieve WhatsApp services list.");
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Fetch configuration whenever service is switched
  React.useEffect(() => {
    if (!selectedServiceId) return;

    const fetchConfig = async () => {
      setIsFetchingConfig(true);
      const res = await apiFetch<any>(`/webhooks?serviceId=${selectedServiceId}`);
      if (res.success) {
        if (res.data) {
          setWebhookConfig(res.data);
          setPayloadUrl(res.data.url);
          setSigningSecret(res.data.secret);
          setSubscribedEvents(res.data.events || []);
          setIsActive(res.data.isActive);
          
          // Fetch historical deliveries
          const deliveriesRes = await apiFetch<any[]>(`/webhooks/${res.data.id}/deliveries`);
          if (deliveriesRes.success && deliveriesRes.data) {
            setDeliveries(deliveriesRes.data);
          } else {
            setDeliveries([]);
          }
        } else {
          // Reset status if config does not exist
          setWebhookConfig(null);
          setPayloadUrl('');
          setSigningSecret('');
          setSubscribedEvents(['message.received', 'message.sent', 'message.failed', 'instance.connected', 'instance.disconnected']);
          setIsActive(true);
          setDeliveries([]);
        }
      } else {
        toast.error("Config Error", "Failed to load webhook configuration.");
      }
      setIsFetchingConfig(false);
      setIsLoading(false);
    };

    fetchConfig();
  }, [selectedServiceId]);

  const handleSave = async () => {
    if (!payloadUrl.trim()) {
      toast.error("Validation Error", "Payload URL is required.");
      return;
    }

    try {
      new URL(payloadUrl);
    } catch (_) {
      toast.error("Validation Error", "Please enter a valid absolute HTTP/HTTPS URL.");
      return;
    }

    setIsSaving(true);
    const res = await apiFetch<any>('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: selectedServiceId,
        url: payloadUrl,
        events: subscribedEvents,
        isActive
      })
    });

    setIsSaving(false);
    if (res.success && res.data) {
      toast.success("Webhook Saved", "Configuration has been successfully updated.");
      setWebhookConfig(res.data);
      setSigningSecret(res.data.secret);
      
      // Fetch deliveries to make sure list is populated/current
      const deliveriesRes = await apiFetch<any[]>(`/webhooks/${res.data.id}/deliveries`);
      if (deliveriesRes.success && deliveriesRes.data) {
        setDeliveries(deliveriesRes.data);
      }
    } else {
      toast.error("Save Failed", res.error?.message || "Failed to update webhook configuration.");
    }
  };

  const handleToggleActive = async () => {
    if (!webhookConfig) return;
    
    const newActiveState = !isActive;
    setIsActive(newActiveState);
    
    const res = await apiFetch<any>('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: selectedServiceId,
        url: payloadUrl,
        events: subscribedEvents,
        isActive: newActiveState
      })
    });
    
    if (res.success && res.data) {
      setWebhookConfig(res.data);
      toast.success(
        newActiveState ? "Webhook Enabled" : "Webhook Disabled",
        newActiveState ? "Webhook payload deliveries are now active." : "Webhook payload deliveries are now disabled."
      );
    } else {
      setIsActive(!newActiveState);
      toast.error("Toggle Failed", res.error?.message || "Failed to update webhook active status.");
    }
  };

  const handleTest = async () => {
    if (!webhookConfig) {
      toast.error("Test Error", "Please configure and save your webhook before pinging.");
      return;
    }

    setIsTesting(true);
    toast.info("Sending Test Payload...", "Verify your server logs for the incoming request.");

    const res = await apiFetch<any>('/webhooks/test', {
      method: 'POST',
      body: JSON.stringify({ serviceId: selectedServiceId })
    });

    setIsTesting(false);
    if (res.success) {
      toast.success("Test Success", "Sample webhook payload successfully generated!");
      
      // Immediately reload deliveries list to visualize it
      const deliveriesRes = await apiFetch<any[]>(`/webhooks/${webhookConfig.id}/deliveries`);
      if (deliveriesRes.success && deliveriesRes.data) {
        setDeliveries(deliveriesRes.data);
      }
    } else {
      toast.error("Test Failed", res.error?.message || "Sample payload failed to reach the server.");
    }
  };

  const handleCopySecret = () => {
    if (!signingSecret) return;
    navigator.clipboard.writeText(signingSecret);
    toast.info("Secret Copied", "Webhook signing secret is now in your clipboard.");
  };

  const toggleEvent = (eventKey: string) => {
    setSubscribedEvents(prev => 
      prev.includes(eventKey) 
        ? prev.filter(e => e !== eventKey) 
        : [...prev, eventKey]
    );
  };

  const renderLiveStatus = () => {
    if (webhookConfig && isActive) {
      return (
        <div className="px-5 py-2.5 bg-[#34C759]/10 border border-[#34C759]/20 rounded-2xl flex items-center gap-2.5 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-[#34C759] animate-pulse shadow-[0_0_12px_#34C759]" />
          <span className="text-[11px] font-bold text-[#34C759] uppercase tracking-[0.2em]">Live Status: Active</span>
        </div>
      );
    }
    
    if (webhookConfig && !isActive) {
      return (
        <div className="px-5 py-2.5 bg-[#FFCC00]/10 border border-[#FFCC00]/20 rounded-2xl flex items-center gap-2.5 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFCC00] shadow-[0_0_12px_#FFCC00]" />
          <span className="text-[11px] font-bold text-[#FFCC00] uppercase tracking-[0.2em]">Status: Inactive</span>
        </div>
      );
    }

    return (
      <div className="px-5 py-2.5 bg-[#8e8e93]/10 border border-[#8e8e93]/20 rounded-2xl flex items-center gap-2.5 shadow-inner">
        <div className="w-2.5 h-2.5 rounded-full bg-[#8e8e93] shadow-[0_0_12px_#8e8e93]" />
        <span className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.2em]">Status: Not Setup</span>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading || isFetchingConfig) return <WebhooksSkeleton />;

    if (services.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-8 bg-[#1c1c1e] border border-white/[0.05] rounded-[40px] shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-[28px] bg-white/5 flex items-center justify-center text-[#8e8e93] mb-2 border border-white/5 shadow-xl">
            <Zap size={32} className="text-[#cfbcff]" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-[22px] font-bold text-white tracking-tight">No WhatsApp Instances Available</h3>
            <p className="text-[15px] text-[#8e8e93] font-medium leading-relaxed">
              You need to register at least one active WhatsApp Service session before configuring webhook payload destinations.
            </p>
          </div>
          <Link href="/whatsapp-services" className="px-8 py-3.5 bg-[#cfbcff] text-[#381e72] rounded-2xl font-bold text-[15px] hover:opacity-90 transition-all shadow-[0_0_30px_rgba(207,188,255,0.25)] hover:scale-[1.02] active:scale-[0.98]">
            Configure WhatsApp Service
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card 
            title="Endpoint Configuration" 
            extra={
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2.5 px-6 py-3 bg-[#cfbcff] text-[#381e72] rounded-2xl font-bold text-[14px] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(207,188,255,0.2)] disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            }
          >
            <div className="space-y-8 mt-4">
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider px-1">Payload URL</label>
                <div className="flex bg-black/40 border border-white/5 rounded-2xl overflow-hidden group focus-within:border-[#cfbcff]/40 transition-all shadow-inner">
                  <div className="bg-white/5 px-5 py-4 text-[13px] font-bold text-[#8e8e93] border-r border-white/5 flex items-center gap-2">
                    <Globe size={14} className="text-[#8e8e93]" />
                    POST
                  </div>
                  <input 
                    value={payloadUrl}
                    onChange={(e) => setPayloadUrl(e.target.value)}
                    placeholder="https://yourdomain.com/webhook-listener"
                    className="flex-1 bg-transparent px-5 py-4 text-[15px] font-mono text-white outline-none font-medium"
                  />
                </div>
                <p className="text-[12px] text-[#8e8e93]/60 font-medium px-1">The URL where Wavo will send real-time event notifications via HTTP POST payloads.</p>
              </div>
              
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider px-1">Signing Secret</label>
                <div className="flex gap-3">
                  <div className="flex-1 flex bg-black/40 border border-white/5 rounded-2xl overflow-hidden group focus-within:border-[#cfbcff]/40 transition-all shadow-inner relative">
                    <div className="bg-white/5 px-5 py-4 text-[13px] font-bold text-[#8e8e93] border-r border-white/5 flex items-center gap-2">
                      <Lock size={14} className="text-[#8e8e93]" />
                    </div>
                    <input 
                      type="password"
                      readOnly 
                      value={signingSecret || ""} 
                      placeholder={signingSecret ? "" : "Generates automatically upon initial saving"}
                      className={`flex-1 bg-transparent px-5 py-4 text-[15px] font-mono text-white outline-none font-medium ${!signingSecret && 'placeholder:text-[#8e8e93]/30'}`}
                    />
                  </div>
                  <button 
                    onClick={handleCopySecret}
                    disabled={!signingSecret}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[#8e8e93] hover:text-white transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Copy size={20} />
                  </button>
                </div>
                <p className="text-[12px] text-[#8e8e93]/60 font-medium px-1">
                  Use this webhook signing secret to verify payload authenticity. Read our documentation to learn how.
                </p>
              </div>

              {webhookConfig && (
                <div className="flex items-center justify-between p-5 rounded-2xl bg-black/20 border border-white/5 mt-4">
                  <div>
                    <h4 className="text-[15px] font-bold text-white">Enable Webhook</h4>
                    <p className="text-[12px] text-[#8e8e93]/60 mt-1 font-medium">Temporarily toggle webhook payload deliveries without deleting your setup.</p>
                  </div>
                  <button 
                    onClick={handleToggleActive}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                      isActive ? 'bg-[#00c896]' : 'bg-white/10'
                    }`}
                  >
                    <span 
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </Card>
          
          <Card title="Subscribed Events" subtitle="Select which active event channels will trigger a HTTP POST delivery.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {AVAILABLE_EVENTS.map((event) => (
                <EventCheckbox 
                  key={event.key}
                  title={event.label}
                  description={event.description}
                  checked={subscribedEvents.includes(event.key)}
                  onChange={() => toggleEvent(event.key)}
                />
              ))}
            </div>
          </Card>
        </div>
        
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#1c1c1e] to-[#0c0c0e] border border-white/[0.05] rounded-[40px] flex flex-col items-center text-center p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />
            <div className="w-20 h-20 rounded-[28px] bg-white/5 flex items-center justify-center text-[#8e8e93] mb-8 border border-white/5 shadow-xl group-hover:scale-110 transition-transform duration-500">
              <Zap size={32} className={webhookConfig ? "text-[#00c896]" : "text-[#8e8e93]/40"} fill="currentColor" />
            </div>
            <h3 className="text-[22px] font-bold text-white mb-3 tracking-tight">Test Connection</h3>
            <p className="text-[15px] text-[#8e8e93] font-medium leading-relaxed mb-10 px-2">
              Send a simulation event JSON payload to your destination endpoint to guarantee proper HTTP parsing.
            </p>
            <button 
              onClick={handleTest} 
              disabled={isTesting || !webhookConfig}
              className="w-full py-4 bg-[#00c896] text-black font-bold rounded-2xl text-[15px] flex items-center justify-center gap-2.5 hover:opacity-90 transition-all shadow-[0_0_30px_rgba(0,200,150,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer disabled:scale-100"
            >
              {isTesting ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
              {isTesting ? "Pinging..." : "Ping Endpoint"}
            </button>
          </div>
          
          <Card 
            title="Recent Deliveries" 
            subtitle="Last 10 payload delivery transactions"
            extra={
              deliveries.length > 0 && (
                <button className="text-[13px] font-bold text-[#cfbcff] hover:underline transition-all cursor-pointer">
                  History
                </button>
              )
            }
          >
            <div className="space-y-3 mt-4">
              {deliveries.length > 0 ? (
                deliveries.slice(0, 10).map((delivery) => (
                  <DeliveryRow key={delivery.id} delivery={delivery} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-white/5 rounded-2xl text-center space-y-3 bg-black/10">
                  <AlertTriangle size={24} className="text-[#8e8e93]/40" />
                  <div className="space-y-1">
                    <p className="text-[14px] font-bold text-[#8e8e93]">No deliveries yet</p>
                    <p className="text-[12px] text-[#8e8e93]/50 leading-relaxed font-medium">
                      {webhookConfig ? "Trigger actions or test the endpoint to generate delivery transactions." : "Save a webhook config to get started."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-white">Webhooks</h1>
          <p className="text-[#8e8e93] text-[16px] font-medium mt-1 max-w-[640px] leading-relaxed">
            Configure real-time HTTP POST notifications to stay updated on message delivery, status changes, and system alerts.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {services.length > 0 && (
            <div className="flex items-center gap-2 bg-[#1c1c1e] border border-white/5 rounded-2xl px-4 py-3 shadow-xl">
              <Sliders size={16} className="text-[#cfbcff]" />
              <select 
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="bg-transparent border-none text-[14px] text-white outline-none font-bold cursor-pointer pr-4"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#1c1c1e] text-white font-bold">{s.name}</option>
                ))}
              </select>
            </div>
          )}
          {renderLiveStatus()}
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
