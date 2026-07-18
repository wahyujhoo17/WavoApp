"use client";
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  MoreVertical, 
  Smartphone, 
  Zap, 
  Trash2,
  QrCode,
  RefreshCw,
  LogOut,
  Eye,
  Edit3,
  X
} from 'lucide-react';
import { io } from 'socket.io-client';
import { apiFetch, getAccessToken } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useConfirmation } from '@/components/ConfirmationProvider';

const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface WhatsAppService {
  id: string;
  name: string;
  slug: string;
  status: 'INACTIVE' | 'CONNECTING' | 'QR_PENDING' | 'CONNECTED' | 'DISCONNECTED' | 'SUSPENDED';
  phoneNumber?: string | null;
  createdAt: string;
}

const ServiceCard = ({ 
  service, 
  onDelete, 
  onUpdate,
  onEdit
}: { 
  service: WhatsAppService; 
  onDelete: () => void; 
  onUpdate: (id: string, updates: Partial<WhatsAppService>) => void; 
  onEdit: (service: WhatsAppService) => void;
}) => {
  const { id, name, status, phoneNumber } = service;
  const router = useRouter();
  const { confirm } = useConfirmation();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [localStatus, setLocalStatus] = React.useState(status);
  const [localPhoneNumber, setLocalPhoneNumber] = React.useState(phoneNumber);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Sync status and phone number props if they change externally
  React.useEffect(() => {
    setLocalStatus(status);
    setLocalPhoneNumber(phoneNumber);
  }, [status, phoneNumber]);
  
  // Connect to Socket.IO for QR and Status stream
  React.useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    console.log(`[Socket] Connecting to ${SOCKET_URL} for room service:${id}`);
    
    const socket = io(SOCKET_URL, {
      auth: { token: getAccessToken() }
    });
    
    socket.on('connect', () => {
      console.log(`[Socket] Connected, subscribing to room service:${id}`);
      socket.emit('subscribe', { serviceId: id });
    });
    
    socket.on('service:qr', (data: { serviceId: string; qr: string; expiresIn: number }) => {
      console.log(`[Socket] Received QR code for service:${id}`);
      setQrCode(data.qr);
      setLocalStatus('QR_PENDING');
      setShowQrModal(true);
      onUpdate(id, { status: 'QR_PENDING' });
    });
    
    socket.on('service:status', (data: { serviceId: string; status: any; phoneNumber?: string }) => {
      console.log(`[Socket] Received status update for service:${id}:`, data);
      setLocalStatus(data.status);
      if (data.phoneNumber) {
        setLocalPhoneNumber(data.phoneNumber);
      }
      onUpdate(id, { 
        status: data.status, 
        ...(data.phoneNumber && { phoneNumber: data.phoneNumber })
      });
      
      if (data.status === 'CONNECTED') {
        toast.success("WhatsApp Connected", `Successfully paired device with number ${data.phoneNumber || ''}!`);
        setQrCode(null);
        setShowQrModal(false);
      } else if (data.status === 'DISCONNECTED' || data.status === 'INACTIVE') {
        toast.info("WhatsApp Disconnected", "The WhatsApp instance is now disconnected.");
        setQrCode(null);
        setShowQrModal(false);
      }
    });
    
    return () => {
      console.log(`[Socket] Disconnecting socket for service:${id}`);
      socket.disconnect();
    };
  }, [id, onUpdate]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = () => {
    router.push(`/whatsapp-services/${id}`);
  };

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConnecting(true);
    toast.info("Connecting...", "Initiating WhatsApp connection session...");
    
    const res = await apiFetch<any>(`/services/${id}/connect`, {
      method: 'POST'
    });
    
    setIsConnecting(false);
    if (res.success) {
      setLocalStatus('CONNECTING');
      if (res.data?.qr) {
        setQrCode(res.data.qr);
        setLocalStatus('QR_PENDING');
        setShowQrModal(true);
        onUpdate(id, { status: 'QR_PENDING' });
      } else {
        onUpdate(id, { status: 'CONNECTING' });
      }
    } else {
      toast.error("Failed to Connect", res.error?.message || "Could not connect to WhatsApp service.");
    }
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Disconnecting...", "Sending request to disconnect session...");
    
    const res = await apiFetch<any>(`/services/${id}/disconnect`, {
      method: 'POST'
    });
    
    if (res.success) {
      setLocalStatus('INACTIVE');
      setQrCode(null);
      setShowQrModal(false);
      setLocalPhoneNumber(null);
      onUpdate(id, { status: 'INACTIVE', phoneNumber: null });
      toast.success("Disconnected", "WhatsApp session gracefully disconnected.");
    } else {
      toast.error("Disconnection Failed", res.error?.message || "Failed to disconnect WhatsApp service.");
    }
  };

  const handleDelete = () => {
    confirm({
      title: "Delete WhatsApp Service",
      message: "Are you sure you want to delete this WhatsApp service? This action is irreversible.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        toast.info("Deleting...", "Removing service instance...");
        const res = await apiFetch<any>(`/services/${id}`, {
          method: 'DELETE'
        });
        
        if (res.success) {
          toast.success("Instance Deleted", "WhatsApp service was successfully deleted.");
          onDelete();
        } else {
          toast.error("Deletion Failed", res.error?.message || "Could not delete WhatsApp service.");
        }
      }
    });
  };

  const statusColor = 
    localStatus === 'CONNECTED' ? 'text-[#34C759]' : 
    localStatus === 'QR_PENDING' || localStatus === 'CONNECTING' ? 'text-[#FFCC00]' : 
    'text-[#FF3B30]';
    
  const statusText = 
    localStatus === 'CONNECTED' ? '• Connected' : 
    localStatus === 'QR_PENDING' ? 'QR Ready' : 
    localStatus === 'CONNECTING' ? 'Connecting...' : 
    localStatus === 'DISCONNECTED' ? 'Disconnected' : 
    localStatus === 'SUSPENDED' ? 'Suspended' : 
    'Inactive';

  return (
    <div 
      onClick={handleNavigate}
      className="bg-[#1c1c1e] border border-white/[0.05] p-6 rounded-[24px] relative group hover:border-white/10 transition-all shadow-lg cursor-pointer"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#8e8e93]">
            {localStatus === 'CONNECTING' || isConnecting ? (
              <RefreshCw size={22} className="animate-spin text-[#cfbcff]" />
            ) : (
              <WhatsAppIcon size={24} />
            )}
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-white tracking-tight">{name}</h3>
            <p className="text-[13px] text-[#8e8e93] font-mono font-medium truncate max-w-[150px]">{id}</p>
          </div>
        </div>
        <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-[#8e8e93] hover:text-white transition-colors p-1"
          >
            <MoreVertical size={20} />
          </button>
          
          <AnimatePresence>
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-[#2c2c2e] border border-white/10 rounded-xl shadow-2xl z-[100] py-1 overflow-hidden"
              >
                <button 
                  onClick={handleNavigate}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Eye size={16} className="text-[#8e8e93]" />
                  View Details
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onEdit(service); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Edit3 size={16} className="text-[#8e8e93]" />
                  Edit Service
                </button>
                <div className="h-[1px] bg-white/5 my-1" />
                <button 
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors text-left font-bold"
                >
                  <Trash2 size={16} />
                  Delete Service
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-4 mb-8 min-h-[100px] flex flex-col justify-center">
        <div className="flex justify-between items-center text-[13px] font-medium mb-2">
          <span className="text-[#8e8e93]">Status</span>
          <span className={`flex items-center gap-1.5 font-bold ${statusColor}`}>
            {localStatus === 'CONNECTED' && <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />}
            {statusText}
          </span>
        </div>

        {localStatus === 'QR_PENDING' && qrCode ? (
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#FFCC00]/20 bg-[#FFCC00]/5 items-center justify-center text-center">
            <QrCode size={24} className="text-[#FFCC00]" />
            <div>
              <p className="text-[13px] text-[#FFCC00] font-bold">QR Code Ready</p>
              <p className="text-[11px] text-[#8e8e93] mt-1">Please scan the QR code to connect.</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowQrModal(true); }}
              className="mt-2 py-2 px-6 rounded-lg font-bold text-[12px] bg-[#FFCC00] text-black hover:opacity-90 transition-all w-full"
            >
              View QR Code
            </button>
          </div>
        ) : localStatus === 'CONNECTING' || isConnecting ? (
          <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5 justify-center py-4">
            <RefreshCw size={20} className="animate-spin text-[#cfbcff] shrink-0" />
            <p className="text-[12px] text-[#8e8e93] font-medium">
              Generating QR Code...
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[13px] font-medium">
              <span className="text-[#8e8e93]">Number</span>
              <span className="text-white font-bold">{localPhoneNumber || 'Not Connected'}</span>
            </div>
            <div className="flex justify-between items-center text-[13px] font-medium">
              <span className="text-[#8e8e93]">Volume (Cycle)</span>
              <span className="text-white font-bold">{localStatus === 'CONNECTED' ? 'Active' : '0 msg'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {localStatus === 'CONNECTED' ? (
          <button 
            onClick={handleDisconnect}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-[14px] bg-white/5 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Disconnect
          </button>
        ) : localStatus === 'QR_PENDING' || localStatus === 'CONNECTING' ? (
          <button 
            onClick={handleDisconnect}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-[14px] bg-white/5 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            Cancel
          </button>
        ) : (
          <button 
            onClick={handleConnect}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-[14px] bg-[#cfbcff] text-[#381e72] hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            Connect
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showQrModal && qrCode && (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
              onClick={(e) => { e.stopPropagation(); setShowQrModal(false); }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1c1c1e] border border-white/[0.08] rounded-[32px] max-w-[500px] w-full overflow-hidden shadow-2xl p-8 space-y-6 relative max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar"
              >
              <button 
                onClick={(e) => { e.stopPropagation(); setShowQrModal(false); }}
                className="absolute right-6 top-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#8e8e93] hover:text-white transition-all z-20"
              >
                <X size={18} />
              </button>
              
              <div className="space-y-2 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#FFCC00]/10 border border-[#FFCC00]/20 flex items-center justify-center text-[#FFCC00]">
                  <QrCode size={24} />
                </div>
                <h3 className="text-[22px] font-bold text-white tracking-tight pt-1">Scan QR Code</h3>
                <p className="text-[14px] text-[#8e8e93] leading-relaxed">
                  Open WhatsApp on your phone, go to <strong>Linked Devices</strong>, and point your camera at this QR code.
                </p>
              </div>
                
              <div className="flex justify-center w-full py-2">
                <div className="w-[280px] h-[280px] bg-white rounded-3xl flex items-center justify-center p-4 shadow-[0_0_40px_rgba(255,204,0,0.15)] relative overflow-hidden">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
                    alt="Scan QR" 
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowQrModal(false); }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-[15px] transition-all active:scale-[0.98]"
                >
                  Close Window
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDisconnect(e); }}
                  className="flex-1 py-4 bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 rounded-2xl font-bold text-[15px] hover:bg-[#FF3B30]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cancel Connection
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] space-y-6 relative overflow-hidden">
    <div className="flex justify-between items-start">
      <div className="w-14 h-14 rounded-2xl bg-white/5 animate-pulse" />
      <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
    </div>
    <div className="space-y-3">
      <div className="h-6 bg-white/5 rounded-lg w-1/2 animate-pulse" />
      <div className="h-4 bg-white/5 rounded-lg w-3/4 animate-pulse" />
    </div>
    <div className="pt-6 border-t border-white/[0.05] flex justify-between">
      <div className="h-4 bg-white/5 rounded-lg w-1/4 animate-pulse" />
      <div className="h-4 bg-white/5 rounded-lg w-1/4 animate-pulse" />
    </div>
  </div>
);

export default function WhatsAppServicesPage() {
  const [services, setServices] = React.useState<WhatsAppService[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<WhatsAppService | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [newServiceName, setNewServiceName] = React.useState('');
  const [newWebhookUrl, setNewWebhookUrl] = React.useState('');
  const [editServiceName, setEditServiceName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchServices = async () => {
    setIsLoading(true);
    const res = await apiFetch<WhatsAppService[]>('/services');
    setIsLoading(false);
    if (res.success && res.data) {
      setServices(res.data);
    } else {
      toast.error("Fetch Error", "Failed to retrieve WhatsApp instances.");
    }
  };

  React.useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async () => {
    if (!newServiceName.trim()) {
      toast.error("Validation Error", "Please provide a valid service name.");
      return;
    }
    
    setIsSubmitting(true);
    const res = await apiFetch<WhatsAppService>('/services', {
      method: 'POST',
      body: JSON.stringify({
        name: newServiceName,
        webhookUrl: newWebhookUrl.trim() || undefined
      })
    });
    
    setIsSubmitting(false);
    if (res.success && res.data) {
      toast.success("Instance Created", "WhatsApp service initialized successfully.");
      setServices([res.data, ...services]);
      setNewServiceName('');
      setNewWebhookUrl('');
      setIsModalOpen(false);
    } else {
      toast.error("Creation Failed", res.error?.message || "Could not initialize WhatsApp service.");
    }
  };

  const handleEditClick = (service: WhatsAppService) => {
    setEditingService(service);
    setEditServiceName(service.name);
    setIsEditModalOpen(true);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    if (!editServiceName.trim()) {
      toast.error("Validation Error", "Please provide a valid service name.");
      return;
    }
    
    setIsSubmitting(true);
    const res = await apiFetch<WhatsAppService>(`/services/${editingService.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: editServiceName
      })
    });
    
    setIsSubmitting(false);
    if (res.success && res.data) {
      toast.success("Service Updated", "WhatsApp service name updated successfully.");
      setServices(services.map(s => s.id === editingService.id ? { ...s, name: res.data!.name } : s));
      setIsEditModalOpen(false);
      setEditingService(null);
    } else {
      toast.error("Update Failed", res.error?.message || "Could not update WhatsApp service.");
    }
  };

  const handleCardUpdate = (id: string, updates: Partial<WhatsAppService>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleCardDelete = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-white">WhatsApp Services</h1>
          <p className="text-[#8e8e93] text-[15px] font-medium mt-1">
            Manage your WhatsApp API instances, check connection status, and monitor message volume.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00c896] text-[#000] px-6 py-3 rounded-xl font-bold text-[15px] flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_25px_rgba(0,200,150,0.2)] cursor-pointer"
        >
          <Plus size={20} />
          Create New Service
        </button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-[440px] bg-[#1c1c1e] border border-white/[0.08] rounded-[24px] shadow-2xl relative overflow-hidden"
            >
                {/* Background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00c896]/10 rounded-full blur-3xl" />
                
                <div className="p-6 space-y-4 relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20">
                      <Plus size={20} />
                    </div>
                    <h3 className="text-[18px] font-bold text-white tracking-tight">Create New Service</h3>
                  </div>
                  
                  <p className="text-[14px] text-[#8e8e93] leading-relaxed">
                    Initialize a new WhatsApp instance for your application.
                  </p>
                  
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider block px-1">Service Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Support Bot"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-[#00c896]/50 transition-all font-sans"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider block px-1">Webhook URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://api.example.com/wavo-webhook"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-[#00c896]/50 transition-all font-sans"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-[14px] transition-all"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleCreate}
                        className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[14px] transition-all text-black bg-[#00c896] hover:bg-[#00c896]/90 flex items-center justify-center gap-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                        Create Instance
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
        
      {/* Edit Service Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1c1c1e] border border-white/[0.08] rounded-[24px] max-w-[440px] w-full overflow-hidden shadow-2xl relative max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#cfbcff]/10 text-[#cfbcff] border border-[#cfbcff]/20">
                      <Play size={20} />
                    </div>
                    <h3 className="text-[18px] font-bold text-white tracking-tight">Edit Service</h3>
                  </div>
                </div>
                
                <p className="text-[14px] text-[#8e8e93] leading-relaxed">
                  Update the details of your WhatsApp service.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider block px-1">Service Name</label>
                    <input 
                      type="text" 
                      value={editServiceName}
                      onChange={(e) => setEditServiceName(e.target.value)}
                      placeholder="e.g. Support Line"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-[#cfbcff]/50 transition-all font-sans"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-[14px] transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpdateService}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[14px] transition-all text-black bg-[#cfbcff] hover:bg-[#cfbcff]/90"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : services.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 bg-[#1c1c1e] border border-white/[0.05] rounded-[40px] text-center"
        >
          <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center text-[#8e8e93] mb-8">
            <Smartphone size={48} />
          </div>
          <h3 className="text-[22px] font-bold text-white mb-2">No Services Connected</h3>
          <p className="text-[#8e8e93] max-w-[420px] mb-10 leading-relaxed font-medium">
            Start by creating your first WhatsApp service instance to enable API messaging and real-time event monitoring.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2.5 text-[#00c896] font-bold text-[15px] hover:underline cursor-pointer"
          >
            <Plus size={20} strokeWidth={3} />
            Connect Your First Device
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard 
              key={service.id}
              service={service}
              onUpdate={handleCardUpdate}
              onDelete={() => handleCardDelete(service.id)}
              onEdit={handleEditClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
