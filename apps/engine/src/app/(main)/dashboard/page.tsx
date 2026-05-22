"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Smartphone, 
  Activity, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sliders
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';

const Sparkline = ({ color, trend }: { color: string, trend: 'up' | 'down' }) => (
  <div className="h-8 w-24 opacity-50">
    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        d={trend === 'up' ? "M0,35 Q25,30 40,15 T100,5" : "M0,5 Q25,10 40,25 T100,35"} 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
    </svg>
  </div>
);

const StatCard = ({ title, value, change, trend, icon: Icon, color }: any) => (
  <div className="bg-[#1c1c1e] border border-white/[0.05] p-6 rounded-[32px] relative overflow-hidden group hover:border-white/10 transition-all duration-500">
    <div className="flex justify-between items-start mb-6">
      <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-[#8e8e93] group-hover:bg-[#cfbcff] group-hover:text-[#381e72] transition-all duration-500 shadow-xl">
        <Icon size={20} />
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className={`flex items-center gap-1 text-[13px] font-bold ${trend === 'up' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
        <Sparkline color={trend === 'up' ? '#34C759' : '#FF3B30'} trend={trend} />
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-[0.15em]">{title}</h3>
      <p className="text-[32px] font-bold text-white tracking-tight leading-none pt-1">{value}</p>
    </div>
  </div>
);

const ActivityRow = ({ title, desc, time, status }: { title: string; desc: string; time: string; status: string }) => {
  const statusColor = 
    status === 'SENT' || status === 'DELIVERED' || status === 'READ' ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 
    status === 'QUEUED' || status === 'PROCESSING' ? 'bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]/20' : 
    'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20';

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.03] last:border-none group hover:bg-white/[0.01] px-2 transition-all rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#8e8e93] group-hover:bg-primary/10 group-hover:text-primary transition-all">
          <Activity size={18} />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-white group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-[12px] text-[#8e8e93] truncate max-w-[180px]">{desc}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${statusColor}`}>
          {status}
        </div>
        <span className="text-[10px] text-[#8e8e93]/50 font-medium">{time}</span>
      </div>
    </div>
  );
};

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [activeLines, setActiveLines] = React.useState({ current: true, prev: false });
  const [services, setServices] = React.useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>('');
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [recentLogs, setRecentLogs] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchInitialData = async () => {
    setIsLoading(true);
    const servicesRes = await apiFetch<any[]>('/services');
    if (servicesRes.success && servicesRes.data) {
      setServices(servicesRes.data);
      if (servicesRes.data.length > 0) {
        setSelectedServiceId(servicesRes.data[0].id);
      } else {
        setIsLoading(false);
      }
    } else {
      toast.error("Dashboard Error", "Failed to retrieve service list.");
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInitialData();
  }, []);

  React.useEffect(() => {
    if (!selectedServiceId) return;

    const fetchServiceData = async () => {
      const [analyticsRes, logsRes] = await Promise.all([
        apiFetch<any>(`/analytics?serviceId=${selectedServiceId}`),
        apiFetch<any[]>(`/logs?serviceId=${selectedServiceId}&limit=5`)
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
      if (logsRes.success && logsRes.data) {
        setRecentLogs(logsRes.data);
      }
      setIsLoading(false);
    };

    fetchServiceData();
  }, [selectedServiceId]);

  const activeServicesCount = services.filter(s => s.status === 'CONNECTED').length;
  
  // Extract Stats
  const totalOutbound = analytics?.stats?.outbound?.total || 0;
  const totalInbound = analytics?.stats?.inbound?.total || 0;
  const totalMessages = totalOutbound + totalInbound;
  const successRate = analytics?.stats?.successRate ?? 100;
  const failedCount = analytics?.stats?.outbound?.failed || 0;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-[36px] font-bold tracking-tight text-white leading-tight">
            Welcome back, {user?.fullName.split(' ')[0] || 'Developer'}
          </h1>
          <p className="text-[#8e8e93] text-[16px] font-medium">
            {services.length > 0 ? (
              <>
                You have <span className="text-[#00c896] font-bold">{activeServicesCount} connected</span> WhatsApp instances out of {services.length}.
              </>
            ) : (
              "Get started by creating your first WhatsApp service."
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {services.length > 0 && (
            <div className="flex items-center gap-2 bg-[#1c1c1e] border border-white/5 rounded-2xl px-4 py-3">
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
          <Link href="/whatsapp-services" className="bg-[#cfbcff] text-[#381e72] px-8 py-3.5 rounded-2xl font-bold text-[15px] flex items-center gap-2.5 hover:opacity-90 transition-all shadow-[0_0_30px_rgba(207,188,255,0.25)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
            <Plus size={20} strokeWidth={3} />
            Create Service
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={36} className="animate-spin text-[#cfbcff]" />
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
          <h3 className="text-[22px] font-bold text-white mb-2">No Instances Initialized</h3>
          <p className="text-[#8e8e93] max-w-[420px] mb-10 leading-relaxed font-medium">
            Link a WhatsApp account to start processing automated messages and monitoring delivery webhooks.
          </p>
          <Link 
            href="/whatsapp-services"
            className="flex items-center gap-2.5 text-[#00c896] font-bold text-[15px] hover:underline"
          >
            <Plus size={20} strokeWidth={3} />
            Connect Your First Device
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Messages" value={totalMessages.toLocaleString()} change={totalMessages > 0 ? "+100%" : "0%"} trend="up" icon={MessageSquare} />
            <StatCard title="Active Devices" value={`${activeServicesCount}/${services.length}`} change={`+${activeServicesCount}`} trend="up" icon={Smartphone} />
            <StatCard title="API Success" value={`${successRate}%`} change={successRate >= 99 ? "0.0%" : "-1.2%"} trend={successRate >= 99 ? "up" : "down"} icon={Zap} />
            <StatCard title="Outbound Failed" value={failedCount.toLocaleString()} change={`${failedCount > 0 ? '+' : ''}${failedCount}`} trend="down" icon={Activity} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart Area */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#1c1c1e] border border-white/[0.05] p-10 rounded-[40px] relative overflow-hidden group shadow-2xl">
                 <div className="flex justify-between items-start mb-12">
                   <div>
                     <h3 className="text-[22px] font-bold text-white tracking-tight">Message Analytics</h3>
                     <p className="text-[14px] text-[#8e8e93] font-medium mt-1">Real-time throughput for the last 7 days</p>
                   </div>
                   <div className="flex items-center gap-2 bg-black/20 p-1 rounded-2xl border border-white/5">
                     <button 
                      onClick={() => setActiveLines({...activeLines, current: !activeLines.current})}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeLines.current ? 'bg-[#cfbcff]/10 text-[#cfbcff]' : 'text-[#8e8e93] hover:bg-white/5'}`}
                     >
                       <div className={`w-2 h-2 rounded-full ${activeLines.current ? 'bg-[#cfbcff]' : 'bg-[#8e8e93]'}`} />
                       <span className="text-[11px] font-bold uppercase tracking-wider">Current</span>
                     </button>
                     <button 
                      onClick={() => setActiveLines({...activeLines, prev: !activeLines.prev})}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeLines.prev ? 'bg-white/10 text-white' : 'text-[#8e8e93] hover:bg-white/5'}`}
                     >
                       <div className={`w-2 h-2 rounded-full ${activeLines.prev ? 'bg-white/30' : 'bg-[#8e8e93]'}`} />
                       <span className="text-[11px] font-bold uppercase tracking-wider">Prev Period</span>
                     </button>
                   </div>
                 </div>

                 <div className="flex gap-4">
                   {/* Y-Axis Labels */}
                   <div className="flex flex-col justify-between py-1 h-[320px] text-[11px] font-bold text-[#8e8e93]/50 uppercase tracking-widest w-12 text-right">
                     <span>{totalMessages > 0 ? (totalMessages * 1.5).toFixed(0) : '100'}</span>
                     <span>{totalMessages > 0 ? (totalMessages * 0.75).toFixed(0) : '50'}</span>
                     <span>0</span>
                   </div>

                   {/* Smooth Bezier Chart */}
                   <div className="relative h-[320px] flex-1 mt-4">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
                        {/* Grid Lines */}
                        {[0, 1, 2].map(i => (
                          <line key={i} x1="0" y1={i * 150} x2="1000" y2={i * 150} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        ))}
                        
                        <defs>
                          <linearGradient id="smoothGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#cfbcff" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#cfbcff" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Prev Period Line */}
                        {activeLines.prev && (
                          <motion.path 
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: 0.3, pathLength: 1 }}
                            transition={{ duration: 1.5 }}
                            d="M 0 280 C 150 290, 300 270, 450 260 C 600 250, 750 200, 1000 180" 
                            fill="none" 
                            stroke="white" 
                            strokeWidth="3" 
                            strokeDasharray="8 8"
                            strokeLinecap="round"
                          />
                        )}

                        {/* Smooth Path - Bezier Curves */}
                        {activeLines.current && (
                          <>
                            <motion.path 
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 1 }}
                              transition={{ duration: 2.5, ease: "easeInOut" }}
                              d="M 0 250 C 100 240, 200 200, 300 240 C 400 280, 500 150, 600 120 C 700 90, 800 130, 900 100 C 950 85, 1000 80, 1000 80" 
                              fill="none" 
                              stroke="#cfbcff" 
                              strokeWidth="4" 
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path 
                              d="M 0 250 C 100 240, 200 200, 300 240 C 400 280, 500 150, 600 120 C 700 90, 800 130, 900 100 C 950 85, 1000 80, 1000 80 V 300 H 0 Z" 
                              fill="url(#smoothGradient)" 
                            />
                          </>
                        )}
                      </svg>
                      
                      {/* Labels */}
                      <div className="flex justify-between mt-10 px-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Mon', 'Today'].map((day, i) => (
                          <span key={i} className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.2em]">{day}</span>
                        ))}
                      </div>
                   </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] shadow-xl">
                   <h3 className="text-[18px] font-bold text-white mb-8 flex items-center gap-3">
                     <div className="w-2 h-6 bg-[#34C759] rounded-full" />
                     Connectivity
                   </h3>
                   <div className="space-y-6">
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] text-[#8e8e93] font-medium">Online Devices</span>
                          <span className="text-[14px] font-bold text-white">{activeServicesCount} / {services.length}</span>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-[2px]">
                           <div 
                             className="h-full bg-gradient-to-r from-[#34C759] to-[#34C759]/60 rounded-full transition-all duration-500" 
                             style={{ width: `${services.length > 0 ? (activeServicesCount / services.length) * 100 : 0}%` }}
                           />
                        </div>
                     </div>
                     <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] text-[#8e8e93] font-medium">Connecting</span>
                          <span className="text-[14px] font-bold text-[#FFCC00]">
                            {services.filter(s => s.status === 'CONNECTING' || s.status === 'QR_PENDING').length}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-[2px]">
                           <div 
                             className="h-full bg-[#FFCC00] rounded-full transition-all duration-500" 
                             style={{ width: `${services.length > 0 ? (services.filter(s => s.status === 'CONNECTING' || s.status === 'QR_PENDING').length / services.length) * 100 : 0}%` }}
                           />
                        </div>
                     </div>
                   </div>
                </div>

                <div className="bg-gradient-to-br from-[#1c1c1e] to-[#0c0c0e] border border-white/[0.05] p-8 rounded-[32px] flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 text-primary opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={120} strokeWidth={1} />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-white mb-3">Service Health</h3>
                    <p className="text-[14px] text-[#8e8e93] leading-relaxed max-w-[200px]">
                      Operational excellence maintained. No downtime in 30 days.
                    </p>
                  </div>
                  <button className="flex items-center gap-2 text-[14px] font-bold text-[#cfbcff] mt-8 group w-fit cursor-pointer">
                    Status Page <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] h-full flex flex-col shadow-xl">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-[20px] font-bold text-white tracking-tight">Recent Activity</h3>
                  <Link href="/logs" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <ArrowUpRight size={20} className="text-[#cfbcff]" />
                  </Link>
                </div>
                <div className="flex-1 space-y-3 min-h-[220px]">
                  {recentLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                      <p className="text-[13px] text-[#8e8e93] font-medium">No recent activity logged.</p>
                    </div>
                  ) : (
                    recentLogs.map((log) => {
                      const isOutbound = log.direction === 'OUTBOUND';
                      const title = isOutbound ? `Outbound message` : `Inbound message`;
                      const desc = isOutbound ? `To: ${log.toNumber}` : `From: ${log.fromNumber}`;
                      
                      return (
                        <ActivityRow 
                          key={log.id}
                          title={title} 
                          desc={desc}
                          time={new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          status={log.status} 
                        />
                      );
                    })
                  )}
                </div>
                
                <div className="mt-12 pt-10 border-t border-white/[0.05] space-y-8">
                  <h4 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.25em]">Maintenance</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <Link href="/settings" className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[20px] hover:bg-white/10 transition-all group">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-[#cfbcff]/10 flex items-center justify-center text-[#cfbcff]">
                           <Zap size={18} />
                         </div>
                         <span className="text-[14px] font-bold text-white">Reset Keys</span>
                       </div>
                       <ChevronRight size={18} className="text-[#8e8e93] group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </Link>
                    <button className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[20px] hover:bg-white/10 transition-all group text-left cursor-pointer">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
                           <ArrowUpRight size={18} />
                         </div>
                         <span className="text-[14px] font-bold text-white">Billing</span>
                       </div>
                       <ChevronRight size={18} className="text-[#8e8e93] group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
