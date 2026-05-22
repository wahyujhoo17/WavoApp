"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  Download, 
  RefreshCw, 
  Copy, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Terminal,
  Clock,
  Filter,
  Smartphone,
  Info
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { apiFetch } from '@/lib/api';

const LogsSkeleton = () => (
  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden min-h-0 animate-pulse">
    <div className="bg-[#1c1c1e] border border-white/[0.05] rounded-[32px] flex flex-col overflow-hidden p-8 space-y-6">
      <div className="h-8 bg-white/5 rounded-xl w-full" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 bg-white/5 rounded-2xl w-full" />
      ))}
    </div>
    <div className="bg-[#1c1c1e] border border-white/[0.05] rounded-[32px] flex flex-col overflow-hidden p-8 space-y-8">
      <div className="h-10 bg-white/5 rounded-xl w-3/4" />
      <div className="h-32 bg-white/5 rounded-2xl w-full" />
      <div className="h-48 bg-white/5 rounded-2xl w-full" />
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'READ': 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20',
    'DELIVERED': 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20',
    'SENT': 'bg-[#cfbcff]/10 text-[#cfbcff] border-[#cfbcff]/20',
    'QUEUED': 'bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]/20',
    'PROCESSING': 'bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]/20',
    'FAILED': 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${colors[status] || 'bg-white/10 text-white border-white/20'}`}>
      {status}
    </span>
  );
};

const DirectionBadge = ({ direction }: { direction: string }) => {
  const colors: Record<string, string> = {
    'OUTBOUND': 'text-[#cfbcff]',
    'INBOUND': 'text-[#00c896]',
  };
  return (
    <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/5 ${colors[direction] || 'text-[#8e8e93]'}`}>
      {direction}
    </span>
  );
};

const CodeBlock = ({ label, code, status }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
        {label} {status && <span className="text-[#34C759] text-[12px]">({status})</span>}
      </h4>
      <div className="flex gap-4 text-[12px] font-bold text-[#8e8e93]">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(code, null, 2));
            toast.info("Copied", `${label} copied to clipboard.`);
          }}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Copy
        </button>
      </div>
    </div>
    <div className="bg-[#0c0c0e] border border-white/[0.05] rounded-[24px] p-6 overflow-x-auto custom-scrollbar shadow-inner">
      <pre className="text-[13px] font-mono leading-relaxed text-[#8e8e93]">
        <code>{JSON.stringify(code, null, 2)}</code>
      </pre>
    </div>
  </div>
);

const FilterDropdown = ({ label, icon: Icon, options, selected, onSelect }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all font-bold text-[14px] border cursor-pointer ${
          isOpen ? 'bg-white/10 text-white border-white/20' : 'bg-[#1c1c1e] border-white/[0.05] text-[#8e8e93] hover:text-white'
        }`}
      >
        <Icon size={18} />
        {selected || label}
        <ChevronDown size={14} className={`ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 mt-3 w-56 bg-[#1c1c1e] border border-white/10 rounded-[24px] shadow-2xl z-[100] py-2 overflow-hidden backdrop-blur-xl"
          >
            {options.map((option: string) => (
              <button 
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-5 py-3 text-[13px] transition-colors text-left cursor-pointer ${
                  selected === option ? 'bg-[#cfbcff]/10 text-[#cfbcff] font-bold' : 'text-[#8e8e93] hover:bg-white/5 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LogsPage() {
  const [services, setServices] = React.useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>('');
  const [logs, setLogs] = React.useState<any[]>([]);
  const [selectedLog, setSelectedLog] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [cursorStack, setCursorStack] = React.useState<string[]>([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [filters, setFilters] = React.useState({
    status: 'All Status',
    direction: 'All Traffic'
  });

  const fetchServices = async () => {
    const res = await apiFetch<any[]>('/services');
    if (res.success && res.data) {
      setServices(res.data);
      if (res.data.length > 0) {
        setSelectedServiceId(res.data[0].id);
      } else {
        setIsLoading(false);
      }
    } else {
      toast.error("Logs Error", "Failed to retrieve WhatsApp services.");
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchServices();
  }, []);

  const fetchLogs = async () => {
    if (!selectedServiceId) return;
    setIsLoading(true);
    
    let url = `/logs?serviceId=${selectedServiceId}&limit=20`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }
    
    if (filters.status !== 'All Status') {
      url += `&status=${filters.status}`;
    }
    
    if (filters.direction !== 'All Traffic') {
      const dirVal = filters.direction === 'Outbound' ? 'OUTBOUND' : 'INBOUND';
      url += `&direction=${dirVal}`;
    }

    const res = await apiFetch<any>(url);
    setIsLoading(false);
    if (res.success && res.data) {
      setLogs(res.data);
      setNextCursor((res as any).pagination?.nextCursor || null);
      setHasMore((res as any).pagination?.hasMore || false);
      if (res.data.length > 0 && !selectedLog) {
        setSelectedLog(res.data[0]);
      }
    } else {
      toast.error("Fetch Failed", res.error?.message || "Could not retrieve message logs.");
    }
  };

  React.useEffect(() => {
    setCursor(null);
    setCursorStack([]);
    fetchLogs();
  }, [selectedServiceId, filters.status, filters.direction]);

  React.useEffect(() => {
    fetchLogs();
  }, [cursor]);

  const handleNext = () => {
    if (nextCursor) {
      setCursorStack(prev => [...prev, cursor || '']);
      setCursor(nextCursor);
    }
  };

  const handlePrev = () => {
    if (cursorStack.length > 0) {
      const prevCursor = cursorStack[cursorStack.length - 1];
      setCursorStack(prev => prev.slice(0, -1));
      setCursor(prevCursor || null);
    }
  };

  const handleExport = () => {
    if (logs.length === 0) {
      toast.info("Export Info", "No logs found to export.");
      return;
    }
    
    // Simple client side CSV compiler
    const headers = ['Log ID', 'Direction', 'Type', 'To', 'From', 'Status', 'Timestamp'];
    const rows = logs.map(log => [
      log.id,
      log.direction,
      log.messageType,
      log.toNumber,
      log.fromNumber || '',
      log.status,
      log.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wavo_logs_${selectedServiceId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export Successful", "Your CSV log history has been compiled and downloaded.");
  };

  // Client search filtering
  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    if (!term) return true;
    return (
      log.id.toLowerCase().includes(term) ||
      log.toNumber.toLowerCase().includes(term) ||
      (log.fromNumber && log.fromNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-white">API Traffic Logs</h1>
          <p className="text-[#8e8e93] text-[16px] font-medium mt-1">
            Real-time monitoring and deep inspection of all message transactions.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {services.length > 0 && (
            <div className="flex items-center gap-2 bg-[#1c1c1e] border border-white/5 rounded-2xl px-4 py-3">
              <Smartphone size={16} className="text-[#cfbcff]" />
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
          <button 
            onClick={handleExport}
            className="flex items-center gap-2.5 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-[14px] hover:bg-white/10 transition-all cursor-pointer"
            disabled={logs.length === 0}
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2.5 px-6 py-3 bg-[#cfbcff] text-[#381e72] rounded-2xl font-bold text-[14px] hover:opacity-90 transition-all shadow-[0_0_25px_rgba(207,188,255,0.2)] cursor-pointer"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px] flex items-center gap-4 bg-[#1c1c1e] border border-white/[0.05] rounded-2xl px-5 py-3.5 focus-within:border-[#cfbcff]/40 focus-within:bg-black/20 transition-all shadow-xl">
          <Search size={20} className="text-[#8e8e93]" />
          <input 
            type="text" 
            placeholder="Search log ID, destination number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-[15px] focus:outline-none w-full text-white placeholder:text-[#8e8e93]/40 font-medium font-mono"
          />
        </div>
        
        <FilterDropdown 
          label="Direction" 
          icon={Clock} 
          selected={filters.direction}
          options={['All Traffic', 'Outbound', 'Inbound']}
          onSelect={(val: string) => setFilters({...filters, direction: val})}
        />
        <FilterDropdown 
          label="Status" 
          icon={Filter} 
          selected={filters.status}
          options={['All Status', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED']}
          onSelect={(val: string) => setFilters({...filters, status: val})}
        />
      </div>

      {isLoading ? (
        <LogsSkeleton />
      ) : services.length === 0 ? (
        <div className="bg-[#1c1c1e] border border-white/[0.05] p-12 rounded-[32px] text-center flex flex-col items-center justify-center space-y-4">
          <Info size={40} className="text-[#cfbcff]" />
          <p className="text-white font-bold text-lg">No services found</p>
          <p className="text-[#8e8e93] text-sm">Please create a WhatsApp service first to view API traffic logs.</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-[#1c1c1e] border border-white/[0.05] p-12 rounded-[32px] text-center flex flex-col items-center justify-center space-y-4">
          <Info size={40} className="text-[#cfbcff]" />
          <p className="text-white font-bold text-lg">No logs found</p>
          <p className="text-[#8e8e93] text-sm">No transaction matches your filters for the selected service.</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden min-h-0">
          {/* Left Column: List */}
          <div className="bg-[#1c1c1e] border border-white/[0.05] rounded-[32px] flex flex-col overflow-hidden shadow-2xl h-full">
            <div className="hidden md:grid grid-cols-[130px_100px_1fr] px-8 py-5 border-b border-white/[0.05] text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.2em]">
              <div>Status</div>
              <div>Direction</div>
              <div>Recipient/Sender</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className={`
                    flex flex-col md:grid md:grid-cols-[130px_100px_1fr] items-start md:items-center 
                    px-6 py-5 md:px-8 md:py-5 border-b border-white/[0.03] cursor-pointer transition-all 
                    hover:bg-white/[0.02] group relative
                    ${selectedLog?.id === log.id ? 'bg-white/[0.04] md:border-l-4 md:border-l-[#cfbcff]' : 'md:border-l-4 md:border-l-transparent'}
                  `}
                >
                  {/* Mobile Layout */}
                  <div className="flex items-center justify-between w-full md:w-auto mb-3 md:mb-0">
                    <div className="md:w-[130px]"><StatusBadge status={log.status} /></div>
                    <div className="md:hidden"><DirectionBadge direction={log.direction} /></div>
                  </div>
                  
                  {/* Desktop Direction */}
                  <div className="hidden md:block md:w-[100px]"><DirectionBadge direction={log.direction} /></div>
                  
                  {/* Recipient / Sender */}
                  <div className="w-full">
                    <div className="text-[14px] font-mono text-white md:text-[#8e8e93] truncate group-hover:text-white transition-colors">
                      {log.direction === 'OUTBOUND' ? log.toNumber : log.fromNumber || 'Inbound Msg'}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 md:hidden">
                      <span className="text-[10px] font-bold text-[#8e8e93]/40 uppercase tracking-wider">Log ID:</span>
                      <span className="text-[11px] font-mono text-[#8e8e93]">{log.id}</span>
                    </div>
                  </div>

                  {/* Active Indicator for Mobile */}
                  {selectedLog?.id === log.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#cfbcff] md:hidden" />
                  )}
                </div>
              ))}
            </div>
            <div className="p-5 px-6 md:px-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between bg-black/10 gap-4">
              <span className="text-[12px] md:text-[13px] text-[#8e8e93] font-medium text-center md:text-left">
                Viewing <span className="text-white font-bold">{filteredLogs.length}</span> transaction logs
              </span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handlePrev}
                  disabled={cursorStack.length === 0}
                  className="p-2 text-[#8e8e93] hover:text-white transition-colors border border-white/10 rounded-xl bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[13px] font-bold text-white tracking-wide">Cursor Navigation</span>
                <button 
                  onClick={handleNext}
                  disabled={!hasMore}
                  className="p-2 text-[#8e8e93] hover:text-white transition-colors border border-white/10 rounded-xl bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Detail */}
          <div className={`
            bg-[#1c1c1e] border border-white/[0.05] rounded-[32px] flex flex-col overflow-hidden relative shadow-2xl
            fixed inset-0 z-[100] lg:relative lg:inset-auto lg:z-0
            transition-transform duration-300 ease-in-out
            ${selectedLog ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            <AnimatePresence mode="wait">
              {selectedLog && (
                <motion.div 
                  key={selectedLog.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Detail Header */}
                  <div className="p-6 md:p-8 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-4">
                      {/* Mobile Back Button */}
                      <button 
                        onClick={() => setSelectedLog(null)}
                        className="lg:hidden p-2 -ml-2 text-[#8e8e93] hover:text-white"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center hidden md:flex font-bold">
                        LOG
                      </div>
                      <h2 className="text-[15px] md:text-[16px] font-mono font-bold text-white truncate max-w-[200px] md:max-w-[320px]">
                        ID: {selectedLog.id}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLog.id);
                          toast.info("Log ID Copied", selectedLog.id);
                        }}
                        className="p-3 text-[#8e8e93] hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                      >
                        <Copy size={20} />
                      </button>
                      <button 
                        onClick={() => setSelectedLog(null)}
                        className="p-3 text-[#8e8e93] hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 md:space-y-10 custom-scrollbar">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-6 md:p-8 bg-black/30 rounded-[28px] border border-white/5 shadow-inner">
                      {[
                        { label: 'Log ID', value: selectedLog.id },
                        { label: 'Direction', value: selectedLog.direction },
                        { label: 'Message Type', value: selectedLog.messageType },
                        { label: 'Recipient (To)', value: selectedLog.toNumber },
                        { label: 'Sender (From)', value: selectedLog.fromNumber || 'N/A' },
                        { label: 'Queue Job ID', value: selectedLog.queueJobId || 'Immediate' },
                        { label: 'Timestamp', value: new Date(selectedLog.createdAt).toLocaleString() },
                        { label: 'ErrorMessage', value: selectedLog.errorMessage || 'None' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-1 md:space-y-2">
                          <p className="text-[10px] md:text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.2em]">{item.label}</p>
                          <p className={`text-[13px] md:text-[14px] font-mono truncate font-medium ${item.label === 'ErrorMessage' && selectedLog.errorMessage ? 'text-[#FF3B30]' : 'text-white'}`}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Bodies */}
                    <CodeBlock label="Request Payload" code={selectedLog.payload || {}} />
                    <CodeBlock label="Full Trace Metadata" code={{
                      id: selectedLog.id,
                      status: selectedLog.status,
                      webhookDeliveredAt: selectedLog.webhookDeliveredAt,
                      sentAt: selectedLog.sentAt,
                      deliveredAt: selectedLog.deliveredAt
                    }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
