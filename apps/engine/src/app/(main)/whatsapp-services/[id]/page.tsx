"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Pause, 
  Play,
  RefreshCw, 
  Battery, 
  Monitor, 
  Activity, 
  Copy, 
  Eye, 
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Save,
  ArrowRight,
  Plus,
  Trash2,
  Send,
  Loader2
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import { io } from 'socket.io-client';
import { useConfirmation } from '@/components/ConfirmationProvider';

const Card = ({ title, subtitle, children, extra }: any) => (
  <div className="bg-[#1c1c1e] border border-white/[0.05] p-6 rounded-[24px] h-full flex flex-col justify-between">
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[18px] font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-[13px] text-[#8e8e93] font-medium mt-1">{subtitle}</p>}
        </div>
        {extra}
      </div>
      {children}
    </div>
  </div>
);

const LogRow = ({ time, direction, type, toNumber, fromNumber, status }: any) => {
  const isOutbound = direction === 'OUTBOUND';
  const getStatusColor = () => {
    switch (status) {
      case 'DELIVERED':
      case 'SENT':
      case 'SUCCESS':
        return 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20';
      case 'FAILED':
        return 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20';
      case 'PENDING':
        return 'bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/20';
      default:
        return 'bg-white/10 text-white border border-white/20';
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.03] last:border-none group hover:bg-white/[0.01] px-2 transition-all cursor-pointer rounded-xl">
      <div className="grid grid-cols-5 w-full items-center">
        <div className="text-[14px] text-white font-medium">{time}</div>
        <div className="text-[13px] text-[#cfbcff] font-bold tracking-wider">{direction}</div>
        <div className="text-[14px] text-[#8e8e93] font-mono">{type}</div>
        <div className="text-[14px] text-white font-mono">{isOutbound ? `To: ${toNumber}` : `From: ${fromNumber || 'Unknown'}`}</div>
        <div className="flex justify-end items-center gap-4">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${getStatusColor()}`}>
            {status}
          </span>
          <ArrowRight size={16} className="text-[#8e8e93] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { confirm, prompt } = useConfirmation();

  // Detail states
  const [loading, setLoading] = React.useState(true);
  const [service, setService] = React.useState<any>(null);
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [recentLogs, setRecentLogs] = React.useState<any[]>([]);

  // Webhook states
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [webhookActive, setWebhookActive] = React.useState(true);
  const [showSecret, setShowSecret] = React.useState(false);
  const [isSavingWebhook, setIsSavingWebhook] = React.useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = React.useState(false);

  // API Key states
  const [newApiKey, setNewApiKey] = React.useState<string | null>(null);
  const [showNewApiKey, setShowNewApiKey] = React.useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = React.useState(false);

  // Operation states
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  // Fetch full details of the WhatsApp service
  const fetchServiceDetails = React.useCallback(async () => {
    try {
      const res = await apiFetch<any>(`/services/${id}`);
      if (res.success && res.data) {
        setService(res.data);
        
        // Populate webhook inputs
        if (res.data.webhooks && res.data.webhooks.length > 0) {
          const primaryWebhook = res.data.webhooks[0];
          setWebhookUrl(primaryWebhook.url);
          setWebhookActive(primaryWebhook.isActive);
        } else {
          setWebhookUrl('');
          setWebhookActive(true);
        }
      } else {
        toast.error("Fetch Failed", res.error?.message || "Failed to load WhatsApp service details.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "An unexpected error occurred while loading details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch recent logs
  const fetchRecentLogs = React.useCallback(async () => {
    try {
      const res = await apiFetch<any[]>(`/logs?serviceId=${id}&limit=5`);
      if (res.success && res.data) {
        setRecentLogs(res.data);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  }, [id]);

  // Initial load
  React.useEffect(() => {
    fetchServiceDetails();
    fetchRecentLogs();
  }, [fetchServiceDetails, fetchRecentLogs]);

  // Connect to Socket.IO for live updates if in CONNECTING or QR_PENDING status
  React.useEffect(() => {
    if (!service || (service.status !== 'CONNECTING' && service.status !== 'QR_PENDING')) {
      setQrCode(null);
      return;
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    console.log(`[Socket] Connecting to ${SOCKET_URL} for room service:${id}`);
    
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log(`[Socket] Connected, subscribing to room service:${id}`);
      socket.emit('subscribe', { serviceId: id });
    });
    
    socket.on('service:qr', (data: { serviceId: string; qr: string; expiresIn: number }) => {
      console.log(`[Socket] Received QR code for service:${id}`);
      setQrCode(data.qr);
      setService((prev: any) => prev ? { ...prev, status: 'QR_PENDING' } : null);
    });
    
    socket.on('service:status', (data: { serviceId: string; status: any; phoneNumber?: string }) => {
      console.log(`[Socket] Received status update for service:${id}:`, data);
      setService((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          status: data.status,
          phoneNumber: data.phoneNumber || prev.phoneNumber
        };
      });
      
      if (data.status === 'CONNECTED') {
        toast.success("WhatsApp Connected", `Successfully paired device with number ${data.phoneNumber || ''}!`);
        setQrCode(null);
        fetchRecentLogs();
      } else if (data.status === 'DISCONNECTED' || data.status === 'INACTIVE') {
        toast.info("WhatsApp Disconnected", "The WhatsApp instance is now disconnected.");
        setQrCode(null);
        fetchRecentLogs();
      }
    });
    
    return () => {
      console.log(`[Socket] Disconnecting socket for service:${id}`);
      socket.disconnect();
    };
  }, [id, service?.status, fetchRecentLogs]);

  // Connect WhatsApp service trigger
  const handleConnect = async () => {
    setIsConnecting(true);
    toast.info("Connecting...", "Initiating WhatsApp connection session...");
    try {
      const res = await apiFetch<any>(`/services/${id}/connect`, { method: 'POST' });
      if (res.success) {
        if (res.data?.qr) {
          setQrCode(res.data.qr);
          setService((prev: any) => prev ? { ...prev, status: 'QR_PENDING' } : null);
        } else {
          setService((prev: any) => prev ? { ...prev, status: res.data?.status || 'CONNECTING' } : null);
        }
      } else {
        toast.error("Failed to Connect", res.error?.message || "Could not connect to WhatsApp service.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to communicate with WhatsApp service.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect WhatsApp service trigger
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    toast.info("Disconnecting...", "Sending request to disconnect session...");
    try {
      const res = await apiFetch<any>(`/services/${id}/disconnect`, { method: 'POST' });
      if (res.success) {
        toast.success("Disconnected", "WhatsApp session gracefully disconnected.");
        setService((prev: any) => prev ? { ...prev, status: 'INACTIVE', phoneNumber: null } : null);
        setQrCode(null);
      } else {
        toast.error("Disconnection Failed", res.error?.message || "Failed to disconnect WhatsApp service.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to communicate with WhatsApp service.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Save/Update Webhook trigger
  const handleSaveWebhook = async () => {
    if (!webhookUrl) {
      toast.error("Validation Error", "Callback URL is required to enable Webhooks.");
      return;
    }
    setIsSavingWebhook(true);
    try {
      const res = await apiFetch<any>('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: id,
          url: webhookUrl,
          isActive: webhookActive
        })
      });
      if (res.success) {
        toast.success("Webhook Saved", "Webhook configuration updated successfully.");
        fetchServiceDetails();
      } else {
        toast.error("Save Failed", res.error?.message || "Failed to update Webhook configuration.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to update Webhook settings.");
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleToggleWebhookActive = async (newActiveState: boolean) => {
    if (!webhookUrl.trim()) {
      toast.error("Validation Error", "Please configure a Callback URL first before enabling Webhooks.");
      return;
    }

    setWebhookActive(newActiveState);

    try {
      const res = await apiFetch<any>('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: id,
          url: webhookUrl,
          isActive: newActiveState
        })
      });
      if (res.success) {
        toast.success(
          newActiveState ? "Webhook Enabled" : "Webhook Disabled",
          newActiveState ? "Webhook payload deliveries are now active." : "Webhook payload deliveries are now disabled."
        );
        fetchServiceDetails();
      } else {
        setWebhookActive(!newActiveState);
        toast.error("Toggle Failed", res.error?.message || "Failed to update webhook active status.");
      }
    } catch (err) {
      console.error(err);
      setWebhookActive(!newActiveState);
      toast.error("Error", "Failed to update webhook active status.");
    }
  };

  // Test Webhook ping trigger
  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    toast.info("Testing...", "Sending test ping payload to your server...");
    try {
      const res = await apiFetch<any>('/webhooks/test', {
        method: 'POST',
        body: JSON.stringify({ serviceId: id })
      });
      if (res.success) {
        toast.success("Webhook Ping Sent", "A test payload has been dispatched successfully!");
      } else {
        toast.error("Test Failed", res.error?.message || "Could not deliver webhook test ping.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to dispatch webhook test.");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Generate new API Key trigger
  const handleGenerateApiKey = () => {
    prompt({
      title: "Generate API Key",
      message: "Enter a name to identify this API Key:",
      defaultValue: "Production Key",
      confirmText: "Generate",
      onConfirm: async (keyName) => {
        if (!keyName.trim()) return;
        setIsGeneratingKey(true);
        try {
          const res = await apiFetch<any>('/api-keys', {
            method: 'POST',
            body: JSON.stringify({
              serviceId: id,
              name: keyName
            })
          });
          if (res.success && res.data) {
            setNewApiKey(res.data.apiKey);
            setShowNewApiKey(true);
            toast.success("API Key Generated", "Your new API credential has been generated successfully.");
            fetchServiceDetails();
          } else {
            toast.error("Generation Failed", res.error?.message || "Failed to generate API Key.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error", "Failed to create API Key.");
        } finally {
          setIsGeneratingKey(false);
        }
      }
    });
  };

  // Revoke API Key trigger
  const handleRevokeApiKey = (keyId: string) => {
    confirm({
      title: "Revoke API Key",
      message: "Are you sure you want to revoke this API Key? Any requests using this key will immediately fail.",
      confirmText: "Revoke Key",
      type: "danger",
      onConfirm: async () => {
        // Optimistically remove from state instantly
        setService((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            apiKeys: prev.apiKeys.filter((k: any) => k.id !== keyId)
          };
        });

        try {
          const res = await apiFetch<any>(`/api-keys/${keyId}`, { method: 'DELETE' });
          if (res.success) {
            toast.success("Key Revoked", "API Key successfully marked as inactive.");
            fetchServiceDetails();
          } else {
            toast.error("Revocation Failed", res.error?.message || "Failed to revoke API Key.");
            // Revert state on failure
            fetchServiceDetails();
          }
        } catch (err) {
          console.error(err);
          toast.error("Error", "Failed to revoke API credential.");
          // Revert state on failure
          fetchServiceDetails();
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#cfbcff] animate-spin" />
        <span className="text-[14px] text-[#8e8e93] font-medium font-mono">Loading service configurations...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-8 max-w-[600px] mx-auto text-center space-y-4">
        <XCircle className="w-16 h-16 text-[#FF3B30] mx-auto" />
        <h2 className="text-[24px] font-bold text-white">WhatsApp Service Not Found</h2>
        <p className="text-[14px] text-[#8e8e93]">The service you are looking for does not exist or you do not have permission to view it.</p>
        <Link href="/whatsapp-services" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-all text-[14px]">
          <ChevronLeft size={16} /> Back to Services
        </Link>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (service.status) {
      case 'CONNECTED':
        return (
          <span className="px-3 py-1 bg-[#34C759]/10 text-[#34C759] text-[11px] font-bold rounded-full border border-[#34C759]/20 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
            Connected
          </span>
        );
      case 'CONNECTING':
      case 'QR_PENDING':
        return (
          <span className="px-3 py-1 bg-[#FFCC00]/10 text-[#FFCC00] text-[11px] font-bold rounded-full border border-[#FFCC00]/20 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00] animate-pulse" />
            Connecting
          </span>
        );
      case 'DISCONNECTED':
      case 'INACTIVE':
      default:
        return (
          <span className="px-3 py-1 bg-[#FF3B30]/10 text-[#FF3B30] text-[11px] font-bold rounded-full border border-[#FF3B30]/20 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
            Disconnected
          </span>
        );
    }
  };

  const hasWebhook = service.webhooks && service.webhooks.length > 0;
  const webhookConfig = hasWebhook ? service.webhooks[0] : null;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/whatsapp-services" className="flex items-center gap-2 text-[#8e8e93] hover:text-white transition-colors text-[14px] font-medium mb-4 group w-fit">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Services
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-[32px] font-bold tracking-tight text-white">{service.name}</h1>
            {getStatusBadge()}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {service.status === 'CONNECTED' ? (
            <button 
              disabled={isDisconnecting}
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] rounded-xl font-bold text-[14px] hover:bg-[#FF3B30]/20 transition-all disabled:opacity-50"
            >
              {isDisconnecting ? <Loader2 size={16} className="animate-spin" /> : <Pause size={16} />}
              Disconnect Session
            </button>
          ) : (
            <button 
              disabled={isConnecting}
              onClick={handleConnect}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#cfbcff] text-black rounded-xl font-bold text-[14px] hover:bg-[#cfbcff]/90 transition-all disabled:opacity-50"
            >
              {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Connect Instance
            </button>
          )}
        </div>
      </div>

      {/* API Key Modal Banner (shown only once) */}
      {showNewApiKey && newApiKey && (
        <div className="p-6 rounded-[24px] bg-[#34C759]/10 border border-[#34C759]/20 space-y-4 relative overflow-hidden animate-fade-in shadow-xl shadow-[#34C759]/5">
          <div className="absolute inset-0 bg-gradient-to-r from-[#34C759]/5 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#34C759]/20 rounded-xl text-[#34C759]">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-[18px] font-bold text-white tracking-tight">New API Key Created Successfully</h4>
                <p className="text-[13px] text-[#8e8e93] font-medium mt-0.5">Please store this secret token in a safe location. For security purposes, you will not be able to retrieve this raw key again.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowNewApiKey(false)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[12px] font-bold text-[#8e8e93] hover:text-white transition-all"
            >
              Dismiss
            </button>
          </div>
          <div className="flex gap-3 max-w-[800px] mt-2">
            <input 
              readOnly 
              value={newApiKey}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-[14px] font-mono text-white outline-none focus:border-[#34C759]/50 transition-all"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(newApiKey);
                toast.success("Copied Key", "API Token copied to clipboard!");
              }}
              className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[#8e8e93] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Copy size={18} />
              <span className="text-[13px] font-bold uppercase tracking-wider hidden sm:inline">Copy</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan to Connect */}
        <Card title="Scan to Connect" subtitle="Open WhatsApp on your device and link via QR code.">
          <div className="mt-8 flex flex-col items-center justify-center p-8 bg-black/20 rounded-[20px] border border-white/5 relative overflow-hidden group min-h-[250px]">
            {service.status === 'CONNECTED' ? (
              <div className="flex flex-col items-center justify-center text-center gap-4 py-6">
                <div className="p-4 bg-[#34C759]/10 border border-[#34C759]/20 text-[#34C759] rounded-full animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-white">Device Linked Successfully</h4>
                  <p className="text-[12px] text-[#8e8e93] mt-1.5 max-w-[200px]">WhatsApp instance is actively connected and waiting to route messages.</p>
                </div>
              </div>
            ) : service.status === 'QR_PENDING' && qrCode ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative p-3 bg-white rounded-2xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`}
                    alt="WhatsApp QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <span className="text-[12px] font-bold text-[#FFCC00] animate-pulse flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00]" />
                  Scan to Link Account
                </span>
              </div>
            ) : (service.status === 'CONNECTING' || isConnecting) ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <RefreshCw size={36} className="text-[#cfbcff] animate-spin" />
                <span className="text-[12px] font-bold text-white tracking-[0.2em] uppercase">Generating Session...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-4 py-6">
                <div className="p-4 bg-white/5 border border-white/10 text-[#8e8e93] rounded-full">
                  <Activity size={32} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-white">Instance Inactive</h4>
                  <p className="text-[12px] text-[#8e8e93] mt-1 max-w-[200px]">Link your device to start sending messages and processing webhooks.</p>
                </div>
                <button 
                  onClick={handleConnect}
                  className="px-4 py-2 bg-[#cfbcff] text-black font-bold rounded-lg text-[13px] hover:bg-[#cfbcff]/90 transition-all flex items-center gap-2 mt-2"
                >
                  <Play size={14} /> Connect Device
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Device Info */}
        <div className="lg:col-span-2">
          <Card 
            title="Device Info" 
            subtitle="Current connection status and hardware details."
            extra={<button onClick={fetchServiceDetails} className="p-2 text-[#8e8e93] hover:text-white transition-colors hover:rotate-180 duration-500"><RefreshCw size={18} /></button>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {[
                { 
                  label: 'Status', 
                  value: service.status === 'CONNECTED' ? 'Linked & Active' : (service.status === 'CONNECTING' || service.status === 'QR_PENDING') ? 'Connecting' : 'Disconnected', 
                  icon: Activity, 
                  color: service.status === 'CONNECTED' ? 'text-[#34C759]' : (service.status === 'CONNECTING' || service.status === 'QR_PENDING') ? 'text-[#FFCC00]' : 'text-[#FF3B30]' 
                },
                { 
                  label: 'Phone Number', 
                  value: service.phoneNumber || '-- (Not linked)', 
                  icon: Monitor, 
                  color: service.phoneNumber ? 'text-white' : 'text-[#8e8e93]' 
                },
                { 
                  label: 'Creation Date', 
                  value: new Date(service.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }), 
                  icon: Clock, 
                  color: 'text-white' 
                }
              ].map((item, i) => (
                <div key={i} className="bg-black/20 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-full min-h-[110px]">
                  <div className="flex items-center gap-3 text-[#8e8e93]">
                    <item.icon size={18} />
                    <span className="text-[12px] font-bold uppercase tracking-wider">{item.label}</span>
                  </div>
                  <div className={`text-[16px] font-bold ${item.color} flex items-center gap-2 mt-3 font-mono`}>
                    {item.label === 'Status' && (
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        service.status === 'CONNECTED' ? 'bg-[#34C759]' : (service.status === 'CONNECTING' || service.status === 'QR_PENDING') ? 'bg-[#FFCC00] animate-pulse' : 'bg-[#FF3B30]'
                      }`} />
                    )}
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Credentials */}
        <Card title="API Credentials" subtitle="Active credentials authorizing your developers to push WhatsApp messages.">
          <div className="space-y-6 mt-8">
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">Service ID</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={service.id} 
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] font-mono text-white outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(service.id);
                    toast.success("Copied ID", "Service ID copied to clipboard!");
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[#8e8e93] hover:text-white transition-all"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            {/* Existing API Keys list */}
            <div className="space-y-3">
              <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider block">Active Keys</label>
              {service.apiKeys && service.apiKeys.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {service.apiKeys.map((key: any) => (
                    <div key={key.id} className="flex items-center justify-between bg-black/20 border border-white/5 px-4 py-3 rounded-xl">
                      <div className="space-y-0.5">
                        <div className="text-[14px] font-bold text-white">{key.name}</div>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#8e8e93] font-mono group/key">
                          <span>{key.keyPrefix}************</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(key.keyPrefix);
                              toast.success("Prefix Copied", "API Key prefix copied to clipboard!");
                            }}
                            className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors text-white/40 opacity-0 group-hover/key:opacity-100 focus:opacity-100"
                            title="Copy Prefix"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          key.isActive ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20' : 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20'
                        }`}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button 
                          disabled={!key.isActive}
                          onClick={() => handleRevokeApiKey(key.id)}
                          className="p-2 text-[#FF3B30] hover:bg-[#FF3B30]/10 hover:text-white border border-[#FF3B30]/10 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                          title="Revoke Key"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-black/10 border border-dashed border-white/10 rounded-xl text-[12px] text-[#8e8e93] font-medium">
                  No API Keys configured. Generate one below to call the API.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                disabled={isGeneratingKey}
                onClick={handleGenerateApiKey}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-[13px] font-bold text-[#cfbcff] hover:text-white rounded-xl transition-all disabled:opacity-50"
              >
                {isGeneratingKey ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Generate New Key
              </button>
            </div>
          </div>
        </Card>

        {/* Webhook Settings */}
        <Card 
          title="Webhook Settings" 
          subtitle="Configure a callback URL to receive real-time updates and messages."
          extra={
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={webhookActive} 
                onChange={(e) => handleToggleWebhookActive(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#cfbcff]"></div>
            </label>
          }
        >
          <div className="space-y-6 mt-8">
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">Callback URL</label>
              <input 
                placeholder="https://app.yourdomain.com/webhooks/whatsapp"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] font-mono text-white outline-none focus:border-[#cfbcff]/50 transition-all"
              />
            </div>
            
            {webhookConfig && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">Signing Secret</label>
                <div className="flex gap-2">
                  <input 
                    type={showSecret ? 'text' : 'password'}
                    readOnly 
                    value={webhookConfig.secret} 
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] font-mono text-white outline-none"
                  />
                  <button 
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[#8e8e93] hover:text-white transition-all"
                  >
                    {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8e8e93] font-medium mt-1">Used to verify the payload signature of incoming webhook requests.</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {['message.received', 'message.sent', 'instance.connected'].map((evt) => (
                  <span key={evt} className="text-[10px] font-mono font-medium px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[#8e8e93]">
                    {evt}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {hasWebhook && (
                  <button 
                    disabled={isTestingWebhook}
                    onClick={handleTestWebhook}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
                  >
                    {isTestingWebhook ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Test Ping
                  </button>
                )}
                <button 
                  disabled={isSavingWebhook}
                  onClick={handleSaveWebhook}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#cfbcff] text-black rounded-xl text-[13px] font-bold hover:bg-[#cfbcff]/90 transition-all disabled:opacity-50"
                >
                  {isSavingWebhook ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card 
        title="Recent Logs" 
        subtitle="Latest outgoing and incoming WhatsApp events for this service." 
        extra={
          <Link href="/logs" className="text-[13px] font-bold text-[#cfbcff] flex items-center gap-2 hover:text-white transition-all group">
            View All Logs 
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        }
      >
        <div className="mt-6">
          <div className="grid grid-cols-5 w-full px-2 py-3 border-b border-white/[0.05] text-[12px] font-bold text-[#8e8e93] uppercase tracking-widest">
            <div>Timestamp</div>
            <div>Direction</div>
            <div>Type</div>
            <div>Detail</div>
            <div className="text-right">Status</div>
          </div>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="divide-y divide-white/[0.01]">
              {recentLogs.map((log: any) => (
                <LogRow 
                  key={log.id}
                  time={new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 
                  direction={log.direction}
                  type={log.messageType}
                  toNumber={log.toNumber}
                  fromNumber={log.fromNumber}
                  status={log.status} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[#8e8e93] font-medium text-[13px]">
              No message logs have been recorded for this WhatsApp service yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
