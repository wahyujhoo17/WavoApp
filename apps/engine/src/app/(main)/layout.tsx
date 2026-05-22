"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Smartphone, 
  Key, 
  Webhook, 
  ClipboardList, 
  FileText, 
  Settings, 
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Activity
} from 'lucide-react';

import { useAuth } from '@/components/AuthProvider';

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

const SidebarLink = ({ href, icon: Icon, label, active = false, minimized = false }: { href: string; icon: any; label: string; active?: boolean; minimized?: boolean }) => (
  <Link href={href}>
    <div className={`flex items-center gap-3.5 transition-all duration-200 group relative h-12 ${active ? 'text-white' : 'text-[#8e8e93] hover:text-white'} ${minimized ? 'justify-center px-0' : 'px-6'}`}>
      {active && (
        <motion.div 
          layoutId="sidebar-active-indicator"
          className="absolute left-0 w-[3px] h-6 bg-primary rounded-r-full"
        />
      )}
      {Icon === WhatsAppIcon ? <Icon size={20} className={active ? 'text-primary' : 'text-[#8e8e93] group-hover:text-white transition-colors'} /> : <Icon size={20} className={active ? 'text-primary' : 'text-[#8e8e93] group-hover:text-white transition-colors'} />}
      {!minimized && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[15px] font-medium tracking-tight whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
      {minimized && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-[#1c1c1e] text-white text-[12px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/5">
          {label}
        </div>
      )}
    </div>
  </Link>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ title: string, message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const { user, logout } = useAuth();

  // Global toast listener
  React.useEffect(() => {
    const handleToast = (event: any) => {
      setToast(event.detail);
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        animate={{ width: isMinimized ? 80 : 280 }}
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#0c0c0e] border-r border-white/[0.05] flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className={`px-6 pt-6 pb-12 flex items-center ${isMinimized ? 'justify-center px-0' : 'justify-between'}`}>
          <Link href="/dashboard" className={`relative block transition-all duration-300 ${isMinimized ? 'w-10 h-10' : 'w-[140px] h-[40px]'}`}>
            <Image 
              src={isMinimized ? "/img/logo/logo.png" : "/img/logo/fulllogo.png"}
              alt="Wavo Logo" 
              fill
              sizes={isMinimized ? "40px" : "140px"}
              className="object-contain"
              priority
            />
          </Link>
          
          {/* Toggle Button - Now positioned on the border */}
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className={`
              absolute -right-3 top-12 w-6 h-6 rounded-full bg-[#1c1c1e] border border-white/10 text-[#8e8e93] hover:text-white flex items-center justify-center transition-all z-[60] shadow-xl
              lg:flex hidden
            `}
          >
            {isMinimized ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === '/dashboard'} minimized={isMinimized} />
          <SidebarLink href="/whatsapp-services" icon={WhatsAppIcon} label="WhatsApp Services" active={pathname.startsWith('/whatsapp-services')} minimized={isMinimized} />
          <SidebarLink href="/webhooks" icon={Webhook} label="Webhooks" active={pathname === '/webhooks'} minimized={isMinimized} />
          <SidebarLink href="/logs" icon={ClipboardList} label="Logs" active={pathname === '/logs'} minimized={isMinimized} />
          <SidebarLink href="/docs" icon={FileText} label="Documentation" active={pathname === '/docs'} minimized={isMinimized} />
          <SidebarLink href="/settings" icon={Settings} label="Settings" active={pathname === '/settings'} minimized={isMinimized} />
        </nav>

        <div className={`p-6 space-y-6 ${isMinimized ? 'px-4' : ''}`}>
          {!isMinimized ? (
            <button className="w-full bg-[#cfbcff] text-[#381e72] py-3.5 rounded-xl font-bold text-[15px] shadow-[0_0_20px_rgba(207,188,255,0.2)] hover:opacity-90 transition-all">
              Upgrade Plan ({user?.plan || 'FREE'})
            </button>
          ) : (
            <button className="w-full h-12 bg-[#cfbcff] text-[#381e72] flex items-center justify-center rounded-xl font-bold hover:opacity-90 transition-all group relative">
              <Plus size={20} />
              <div className="absolute left-full ml-4 px-2 py-1 bg-[#cfbcff] text-[#381e72] text-[12px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Upgrade ({user?.plan || 'FREE'})
              </div>
            </button>
          )}
          
          <div className="pt-6 border-t border-white/[0.05] space-y-1">
            <Link href="/dashboard/help" className={`flex items-center gap-3.5 py-3 text-[#8e8e93] hover:text-white transition-all group relative ${isMinimized ? 'justify-center px-0' : 'px-2'}`}>
              <HelpCircle size={20} className="group-hover:text-white transition-colors" />
              {!isMinimized && <span className="text-[15px] font-medium">Help</span>}
              {isMinimized && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-[#1c1c1e] text-white text-[12px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/5">
                  Help
                </div>
              )}
            </Link>
            <button 
              onClick={logout}
              className={`w-full flex items-center gap-3.5 py-3 text-[#8e8e93] hover:text-white transition-all group relative ${isMinimized ? 'justify-center px-0' : 'px-2'}`}
            >
              <LogOut size={20} className="group-hover:text-white transition-colors" />
              {!isMinimized && <span className="text-[15px] font-medium">Sign Out</span>}
              {isMinimized && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-[#1c1c1e] text-white text-[12px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/5">
                  Sign Out
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] border-b border-white/[0.05] flex items-center justify-between px-8 shrink-0 bg-[#0a0a0c]/80 backdrop-blur-xl relative z-[40]">
          {/* Left Navigation */}
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#8e8e93] hover:text-white"
            >
              <Menu size={24} />
            </button>
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/dashboard" className={`text-[14px] font-bold transition-colors ${pathname === '/dashboard' ? 'text-white' : 'text-[#8e8e93] hover:text-white'}`}>
                Dashboard
              </Link>
              <Link href="/docs" className="text-[14px] font-bold text-[#8e8e93] hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/support" className="text-[14px] font-bold text-[#8e8e93] hover:text-white transition-colors">
                Support
              </Link>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* Pill Search Bar */}
            <div className="hidden md:flex items-center gap-3 bg-[#1c1c1e] border border-white/[0.05] rounded-full px-5 py-2 w-[320px] group focus-within:border-primary/50 transition-all">
              <Search size={16} className="text-[#8e8e93] group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none text-[13px] focus:outline-none w-full text-white placeholder:text-[#8e8e93]/40 font-medium"
              />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4">
              {/* Notification Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`p-2 transition-colors relative rounded-lg ${isNotificationOpen ? 'bg-white/10 text-white' : 'text-[#8e8e93] hover:text-white'}`}
                >
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-[#0a0a0c]" />
                </button>

                <AnimatePresence>
                  {isNotificationOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsNotificationOpen(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-[380px] bg-[#1c1c1e] border border-white/10 rounded-[24px] shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-5 border-b border-white/5 flex items-center justify-between">
                          <h3 className="text-[16px] font-bold text-white">Notifications</h3>
                          <button className="text-[12px] font-bold text-primary hover:opacity-80 transition-opacity">Mark all as read</button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          {[
                            { title: 'New Message Received', desc: 'Marketing Bot received a message from +123456789', time: '2 mins ago', type: 'info', icon: WhatsAppIcon },
                            { title: 'Webhook Delivery Failed', desc: 'Endpoint https://api.example.com/webhook returned 500', time: '15 mins ago', type: 'error', icon: Webhook },
                            { title: 'Service Connected', desc: 'Support Channel is now active and ready', time: '1 hour ago', type: 'success', icon: CheckCircle2 }
                          ].map((item, i) => (
                            <div key={i} className="p-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer group">
                              <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  item.type === 'error' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                                  item.type === 'success' ? 'bg-[#34C759]/10 text-[#34C759]' : 
                                  'bg-primary/10 text-primary'
                                }`}>
                                  <item.icon size={20} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-[14px] font-bold text-white group-hover:text-primary transition-colors">{item.title}</h4>
                                  <p className="text-[12px] text-[#8e8e93] leading-relaxed line-clamp-2">{item.desc}</p>
                                  <p className="text-[11px] text-[#8e8e93]/50 font-medium pt-1">{item.time}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="w-full p-4 text-[13px] font-bold text-[#8e8e93] hover:text-white hover:bg-white/5 transition-all text-center">
                          View all notifications
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button className="p-2 text-[#8e8e93] hover:text-white transition-colors">
                <Settings size={20} />
              </button>
              <div className="h-4 w-[1px] bg-white/[0.1] mx-1" />
              <button className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 border border-white/10 p-[2px] hover:border-primary/50 transition-all overflow-hidden">
                <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center overflow-hidden">
                   <Image 
                     src={`https://avatar.vercel.sh/${user?.email || 'wavo'}`} 
                     alt="User Avatar"
                     width={36}
                     height={36}
                     className="object-cover"
                   />
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Top Glow Progress Bar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`progress-${pathname}`}
            initial={{ width: "0%", opacity: 0 }}
            animate={{ width: "100%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent z-[100] shadow-[0_0_15px_rgba(207,188,255,0.8)]"
          />
        </AnimatePresence>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0c]">
          <div className="min-h-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.99, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.01, filter: "blur(4px)" }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for premium feel
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[1000] flex items-center gap-3 bg-[#1c1c1e] border border-white/10 px-6 py-4 rounded-2xl shadow-2xl min-w-[300px]"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-[#34C759]/10 text-[#34C759]' : 
              toast.type === 'error' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
              'bg-[#cfbcff]/10 text-[#cfbcff]'
            }`}>
              {toast.type === 'success' ? <ShieldCheck size={20} /> : <Activity size={20} />}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-white">{toast.title}</p>
              <p className="text-[12px] text-[#8e8e93] font-medium">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-[#8e8e93] hover:text-white transition-colors"
            >
              <LogOut size={16} className="rotate-90" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
