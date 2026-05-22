"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Settings, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Sliders, 
  Check, 
  ChevronDown, 
  AlertTriangle,
  Smartphone,
  Calendar,
  Lock,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { useAuth } from '@/components/AuthProvider';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useConfirmation } from '@/components/ConfirmationProvider';

const AdminSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-[#1c1c1e] border border-white/[0.05] rounded-[24px]" />
      ))}
    </div>
    <div className="h-96 bg-[#1c1c1e] border border-white/[0.05] rounded-[32px]" />
  </div>
);

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { confirm } = useConfirmation();
  const [mounted, setMounted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [users, setUsers] = React.useState<any[]>([]);
  const [configs, setConfigs] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('ALL');
  const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);
  const [updatingConfigKey, setUpdatingConfigKey] = React.useState<string | null>(null);

  // Quick Stats
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    activeInstances: 0
  });

  // Dynamic config edit states
  const [freeLimit, setFreeLimit] = React.useState<number>(100);
  const [proLimit, setProLimit] = React.useState<number>(5000);
  const [businessLimit, setBusinessLimit] = React.useState<number>(50000);

  // Add User states
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserPassword, setNewUserPassword] = React.useState('');
  const [newUserPlan, setNewUserPlan] = React.useState('FREE');
  const [newUserRole, setNewUserRole] = React.useState('USER');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const generateRandomPassword = React.useCallback(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(pass);
  }, []);

  React.useEffect(() => {
    if (isAddModalOpen) {
      generateRandomPassword();
    }
  }, [isAddModalOpen, generateRandomPassword]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error("Validation Error", "All fields are required.");
      return;
    }
    
    setIsSubmitting(true);
    const res = await apiFetch<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        fullName: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        plan: newUserPlan,
        role: newUserRole
      })
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success("User Created", `Successfully created developer account for "${newUserName}".`);
      setIsAddModalOpen(false);
      // Reset form
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPlan('FREE');
      setNewUserRole('USER');
      fetchAdminData();
    } else {
      toast.error("Creation Failed", res.error?.message || "Failed to create user account.");
    }
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch users & configs from Admin APIs
  const fetchAdminData = React.useCallback(async () => {
    try {
      const [usersRes, configsRes] = await Promise.all([
        apiFetch<any[]>('/admin/users'),
        apiFetch<any[]>('/admin/configs')
      ]);

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
        
        // Calculate stats
        const active = usersRes.data.filter((u: any) => u.isActive).length;
        let instances = 0;
        usersRes.data.forEach((u: any) => {
          instances += u.services?.length || 0;
        });

        setStats({
          totalUsers: usersRes.data.length,
          activeUsers: active,
          suspendedUsers: usersRes.data.length - active,
          activeInstances: instances
        });
      }

      if (configsRes.success && configsRes.data) {
        setConfigs(configsRes.data);
        
        // Populate inputs
        const free = configsRes.data.find((c: any) => c.key === 'rate_limit.free.daily');
        const pro = configsRes.data.find((c: any) => c.key === 'rate_limit.pro.daily');
        const biz = configsRes.data.find((c: any) => c.key === 'rate_limit.business.daily');
        
        if (free) setFreeLimit(Number(free.value));
        if (pro) setProLimit(Number(pro.value));
        if (biz) setBusinessLimit(Number(biz.value));
      }
    } catch (err) {
      console.error(err);
      toast.error("Fetch Failed", "Could not load administrative console data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    
    // Safety redirect if not admin
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      toast.error("Unauthorized", "You do not have access to the Admin Panel.");
      router.push('/dashboard');
      return;
    }

    fetchAdminData();
  }, [mounted, user, router, fetchAdminData]);

  // Handle User Status toggle (Active/Suspended)
  const handleToggleStatus = async (targetUser: any) => {
    setUpdatingUserId(targetUser.id);
    const newStatus = !targetUser.isActive;
    
    const res = await apiFetch<any>(`/admin/users/${targetUser.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: newStatus })
    });

    setUpdatingUserId(null);

    if (res.success) {
      toast.success(
        newStatus ? "User Reactivated" : "User Suspended", 
        `"${targetUser.fullName}" is now ${newStatus ? 'active' : 'suspended'}.`
      );
      fetchAdminData();
    } else {
      toast.error("Update Failed", res.error?.message || "Failed to update user status.");
    }
  };

  // Handle Plan Tier change
  const handleChangePlan = async (targetUser: any, newPlan: string) => {
    setUpdatingUserId(targetUser.id);

    const res = await apiFetch<any>(`/admin/users/${targetUser.id}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan: newPlan })
    });

    setUpdatingUserId(null);

    if (res.success) {
      toast.success("Plan Updated", `"${targetUser.fullName}" tier upgraded to ${newPlan}.`);
      fetchAdminData();
    } else {
      toast.error("Update Failed", res.error?.message || "Failed to change user plan.");
    }
  };

  // Handle User Deletion
  const handleDeleteUser = (targetUser: any) => {
    confirm({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user "${targetUser.fullName}"? This action will disconnect all active WhatsApp sessions, wipe related service data, terminate user sessions, and completely revoke their platform access. This action is irreversible.`,
      confirmText: 'Delete User',
      type: 'danger',
      onConfirm: async () => {
        setUpdatingUserId(targetUser.id);
        
        const res = await apiFetch<any>(`/admin/users/${targetUser.id}`, {
          method: 'DELETE'
        });

        setUpdatingUserId(null);

        if (res.success) {
          toast.success("User Deleted", `Successfully deleted user account for "${targetUser.fullName}".`);
          fetchAdminData();
        } else {
          toast.error("Deletion Failed", res.error?.message || "Failed to delete user account.");
        }
      }
    });
  };

  // Handle Dynamic Limits Save
  const handleSaveConfig = async (key: string, value: number) => {
    setUpdatingConfigKey(key);

    const res = await apiFetch<any>(`/admin/configs/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });

    setUpdatingConfigKey(null);

    if (res.success) {
      toast.success("Limit Saved", `Config key "${key}" updated successfully.`);
      fetchAdminData();
    } else {
      toast.error("Update Failed", res.error?.message || "Failed to update configuration limit.");
    }
  };

  // Filters logic
  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'ALL' || u.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  if (!mounted) return null;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.05] pb-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="text-primary w-9 h-9" />
            Admin Console
          </h1>
          <p className="text-[#8e8e93] text-[16px] font-medium mt-1">
            Global system settings, user management, and dynamic rate limit controls.
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-5 py-3 rounded-2xl font-bold text-[14px] transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={16} />
          Create User
        </button>
      </div>

      {isLoading ? (
        <AdminSkeleton />
      ) : (
        <div className="space-y-10">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: stats.totalUsers, color: 'text-white', bg: 'bg-white/5' },
              { label: 'Active Users', value: stats.activeUsers, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10 border-[#34C759]/20' },
              { label: 'Suspended Users', value: stats.suspendedUsers, color: 'text-[#ff3b30]', bg: 'bg-[#ff3b30]/10 border-[#ff3b30]/20' },
              { label: 'WA Instances', value: stats.activeInstances, color: 'text-[#cfbcff]', bg: 'bg-[#cfbcff]/10 border-[#cfbcff]/20' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-[24px] border border-white/[0.05] bg-[#1c1c1e] shadow-xl flex items-center justify-between ${stat.bg}`}
              >
                <div>
                  <p className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-[32px] font-extrabold mt-1 tracking-tight ${stat.color}`}>{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#8e8e93]">
                  <Users size={20} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left/Main Column: User Directory */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-[20px] font-bold text-white tracking-tight">User Directory</h3>
                    <p className="text-[14px] text-[#8e8e93] mt-1 font-medium">Manage user credentials, plans, and system access.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl px-4 py-3 w-64 focus-within:border-primary/40 transition-all">
                      <Search size={16} className="text-[#8e8e93]" />
                      <input 
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none text-[14px] text-white focus:outline-none w-full placeholder:text-[#8e8e93]/50 font-medium"
                      />
                    </div>

                    {/* Filter Selector */}
                    <div className="relative">
                      <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="bg-[#1c1c1e] border border-white/10 rounded-2xl pl-4 pr-10 py-3 text-white text-[14px] outline-none appearance-none cursor-pointer font-bold focus:border-primary/40 transition-all"
                      >
                        <option value="ALL">All Plans</option>
                        <option value="FREE">Free</option>
                        <option value="PRO">Pro</option>
                        <option value="BUSINESS">Business</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e8e93] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">
                        <th className="pb-4 px-4">User Details</th>
                        <th className="pb-4 px-4 text-center">WA Sockets</th>
                        <th className="pb-4 px-4">Subscription Plan</th>
                        <th className="pb-4 px-4">Access Status</th>
                        <th className="pb-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-[#8e8e93] font-medium">
                            No users match the active search filters.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((item) => {
                          const initials = item.fullName
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || 'WA';

                          return (
                            <tr key={item.id} className="group hover:bg-white/[0.01] transition-colors">
                              {/* Details */}
                              <td className="py-5 px-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-[14px]">
                                    {initials}
                                  </div>
                                  <div>
                                    <h4 className="text-[14px] font-bold text-white tracking-tight">{item.fullName}</h4>
                                    <p className="text-[12px] text-[#8e8e93] font-medium font-mono">{item.email}</p>
                                  </div>
                                </div>
                              </td>

                              {/* WA Service Count */}
                              <td className="py-5 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-bold text-[13px] text-white">
                                  <Smartphone size={13} className="text-[#8e8e93]" />
                                  {item.services?.length || 0}
                                </div>
                              </td>

                              {/* Subscription Plan */}
                              <td className="py-5 px-4">
                                <div className="relative inline-block w-36">
                                  <select 
                                    value={item.plan}
                                    onChange={(e) => handleChangePlan(item, e.target.value)}
                                    disabled={updatingUserId === item.id}
                                    className="bg-black/40 border border-white/5 rounded-xl pl-3 pr-8 py-2 w-full text-white text-[13px] font-bold outline-none cursor-pointer appearance-none focus:border-primary/40 transition-all disabled:opacity-50"
                                  >
                                    <option value="FREE">Free</option>
                                    <option value="PRO">Pro</option>
                                    <option value="BUSINESS">Business</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e93] pointer-events-none" />
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-5 px-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                  item.isActive 
                                    ? 'bg-[#34C759]/10 border-[#34C759]/20 text-[#34C759]' 
                                    : 'bg-[#ff3b30]/10 border-[#ff3b30]/20 text-[#ff3b30]'
                                }`}>
                                  {item.isActive ? 'Active' : 'Suspended'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-5 px-4 text-right">
                                {user?.id !== item.id ? (
                                  <div className="flex items-center justify-end gap-2.5">
                                    <button
                                      onClick={() => handleToggleStatus(item)}
                                      disabled={updatingUserId === item.id}
                                      className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
                                        item.isActive
                                          ? 'bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#ff3b30]'
                                          : 'bg-[#34C759]/10 hover:bg-[#34C759]/20 text-[#34C759]'
                                      }`}
                                    >
                                      {updatingUserId === item.id ? '...' : item.isActive ? 'Suspend' : 'Activate'}
                                    </button>

                                    {/* Delete User Button - authorized for SUPER_ADMIN or if the target is a standard USER */}
                                    {((user?.role === 'SUPER_ADMIN') || (item.role === 'USER')) && (
                                      <button
                                        onClick={() => handleDeleteUser(item)}
                                        disabled={updatingUserId === item.id}
                                        className="p-2 bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#ff3b30] border border-[#ff3b30]/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                        title="Delete User"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[12px] text-[#8e8e93] font-bold font-mono px-4">Admin Self</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic System Limits Configuration */}
            <div className="space-y-8">
              <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] shadow-xl space-y-6">
                <div>
                  <h3 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
                    <Sliders className="text-[#cfbcff] w-5 h-5" />
                    Tier Quotas
                  </h3>
                  <p className="text-[14px] text-[#8e8e93] mt-1 font-medium">Edit outbound daily message limits dynamically.</p>
                </div>

                <div className="space-y-6 pt-4">
                  {/* Free Plan Input */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">Free Tier Limit</span>
                      <span className="text-[11px] font-bold text-[#34C759] uppercase">Active Outbound Limit</span>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="number"
                        value={freeLimit}
                        onChange={(e) => setFreeLimit(Number(e.target.value))}
                        className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-[15px] outline-none focus:border-primary/40 font-bold"
                      />
                      <button
                        onClick={() => handleSaveConfig('rate_limit.free.daily', freeLimit)}
                        disabled={updatingConfigKey === 'rate_limit.free.daily'}
                        className="px-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-[14px] transition-all flex items-center justify-center"
                      >
                        {updatingConfigKey === 'rate_limit.free.daily' ? '...' : <Check size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Pro Plan Input */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">Pro Tier Limit</span>
                      <span className="text-[11px] font-bold text-[#cfbcff] uppercase">Active Outbound Limit</span>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="number"
                        value={proLimit}
                        onChange={(e) => setProLimit(Number(e.target.value))}
                        className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-[15px] outline-none focus:border-primary/40 font-bold"
                      />
                      <button
                        onClick={() => handleSaveConfig('rate_limit.pro.daily', proLimit)}
                        disabled={updatingConfigKey === 'rate_limit.pro.daily'}
                        className="px-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-[14px] transition-all flex items-center justify-center"
                      >
                        {updatingConfigKey === 'rate_limit.pro.daily' ? '...' : <Check size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Business Plan Input */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">Business Tier Limit</span>
                      <span className="text-[11px] font-bold text-[#FFCC00] uppercase">Active Outbound Limit</span>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="number"
                        value={businessLimit}
                        onChange={(e) => setBusinessLimit(Number(e.target.value))}
                        className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-[15px] outline-none focus:border-primary/40 font-bold"
                      />
                      <button
                        onClick={() => handleSaveConfig('rate_limit.business.daily', businessLimit)}
                        disabled={updatingConfigKey === 'rate_limit.business.daily'}
                        className="px-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-[14px] transition-all flex items-center justify-center"
                      >
                        {updatingConfigKey === 'rate_limit.business.daily' ? '...' : <Check size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex gap-3 text-[13px] text-primary leading-relaxed font-medium mt-4">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>
                    Saving any limit updates here propagates changes globally and immediately. Users will observe updated quotas on their settings/dashboard pages instantly.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] md:top-[15%] md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-[#1c1c1e] border border-white/10 rounded-[32px] shadow-2xl p-8 z-[110] overflow-hidden flex flex-col gap-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-[22px] font-bold text-white tracking-tight">Create User</h3>
                  <p className="text-[13px] text-[#8e8e93] mt-0.5 font-medium">Add a new developer account to the platform.</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest block px-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/40 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest block px-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/40 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2 font-sans">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Password</label>
                    <button 
                      type="button" 
                      onClick={generateRandomPassword}
                      className="text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-80 transition-opacity"
                    >
                      Generate Secure
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/40 transition-all font-medium font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest block px-1">Subscription Plan</label>
                    <div className="relative">
                      <select 
                        value={newUserPlan}
                        onChange={(e) => setNewUserPlan(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl pl-4 pr-10 py-3 text-white text-sm font-bold outline-none cursor-pointer appearance-none focus:border-primary/40 transition-all"
                      >
                        <option value="FREE">Free</option>
                        <option value="PRO">Pro</option>
                        <option value="BUSINESS">Business</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e8e93] pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest block px-1">Access Role</label>
                    <div className="relative">
                      <select 
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl pl-4 pr-10 py-3 text-white text-sm font-bold outline-none cursor-pointer appearance-none focus:border-primary/40 transition-all"
                      >
                        <option value="USER">User (Standard)</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e8e93] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-primary/20 text-primary border border-primary/20 rounded-2xl font-bold text-sm hover:bg-primary/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
