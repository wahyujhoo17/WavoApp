"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  ChevronDown,
  ArrowRight,
  Activity,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/lib/toast';
import { useAuth } from '@/components/AuthProvider';
import { useConfirmation } from '@/components/ConfirmationProvider';
import { apiFetch, setTokens } from '@/lib/api';

const SettingsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
    {/* Left Column */}
    <div className="lg:col-span-2 space-y-8">
      {/* Profile Card Skeleton */}
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/5" />
          <div className="space-y-2">
            <div className="h-6 bg-white/5 rounded-lg w-40" />
            <div className="h-4 bg-white/5 rounded-lg w-56" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="h-3 bg-white/5 rounded w-20" />
            <div className="h-14 bg-white/5 rounded-2xl w-full" />
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-white/5 rounded w-20" />
            <div className="h-14 bg-white/5 rounded-2xl w-full" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-white/5 rounded w-20" />
          <div className="h-14 bg-white/5 rounded-2xl w-full" />
        </div>
        <div className="flex justify-end pt-4">
          <div className="h-14 bg-white/5 rounded-2xl w-40" />
        </div>
      </div>

      {/* Security Card Skeleton */}
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] space-y-8">
        <div className="h-6 bg-white/5 rounded-lg w-1/3" />
        <div className="h-24 bg-white/5 rounded-[24px] w-full" />
        <div className="space-y-4">
          <div className="h-20 bg-white/5 rounded-[24px] w-full" />
          <div className="h-20 bg-white/5 rounded-[24px] w-full" />
        </div>
      </div>
    </div>

    {/* Right Column */}
    <div className="space-y-8">
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] space-y-8">
        <div className="h-6 bg-white/5 rounded-lg w-1/2" />
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl w-full" />)}
        </div>
      </div>
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] space-y-6">
        <div className="h-6 bg-white/5 rounded-lg w-1/3" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl w-full" />)}
        </div>
      </div>
      <div className="bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] h-64" />
    </div>
  </div>
);

const Card = ({ title, subtitle, children, extra, className = "" }: any) => (
  <div className={`bg-[#1c1c1e] border border-white/[0.05] p-8 rounded-[32px] shadow-xl ${className}`}>
    <div className="flex justify-between items-start mb-8">
      <div>
        <h3 className="text-[20px] font-bold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-[14px] text-[#8e8e93] font-medium mt-1.5">{subtitle}</p>}
      </div>
      {extra}
    </div>
    {children}
  </div>
);

const UsageBar = ({ label, current, max, color }: any) => {
  const percentage = (current / max) * 100;
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[12px] font-bold">
        <span className="text-[#8e8e93] uppercase tracking-[0.15em]">{label}</span>
        <span className="text-white">{current.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-[2px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

const PlainUsageStat = ({ label, value, color }: any) => {
  return (
    <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.15em]">{label}</span>
      </div>
      <span className="text-[16px] font-extrabold text-white">{value.toLocaleString()}</span>
    </div>
  );
};

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { confirm } = useConfirmation();
  const [isLoading, setIsLoading] = React.useState(true);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Change Password States
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

  // Dynamic States
  const [apiKeys, setApiKeys] = React.useState<any[]>([]);
  const [usageStats, setUsageStats] = React.useState<any>({ messagesSent: 0, apiRequests: 0, dailyUsage: 0 });
  const [services, setServices] = React.useState<any[]>([]);

  // Key Generation Modal State
  const [showNewKeyModal, setShowNewKeyModal] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [newKeyServiceId, setNewKeyServiceId] = React.useState('');
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Inline Copy State to show Checkmark for individual keys
  const [copiedKeyId, setCopiedKeyId] = React.useState<string | null>(null);

  // 2FA States
  const [show2faSetupModal, setShow2faSetupModal] = React.useState(false);
  const [show2faDisableModal, setShow2faDisableModal] = React.useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = React.useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = React.useState('');
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = React.useState('');
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = React.useState('');
  const [isEnabling2fa, setIsEnabling2fa] = React.useState(false);
  const [isDisabling2fa, setIsDisabling2fa] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    
    setFullName(user.fullName || '');
    setEmail(user.email || '');

    const fetchData = async () => {
      try {
        const [keysRes, usageRes, servicesRes] = await Promise.all([
          apiFetch<any[]>('/api-keys'),
          apiFetch<any>('/auth/usage'),
          apiFetch<any[]>('/services')
        ]);

        if (keysRes.success && keysRes.data) {
          setApiKeys(keysRes.data);
        }
        if (usageRes.success && usageRes.data) {
          setUsageStats(usageRes.data);
        }
        if (servicesRes.success && servicesRes.data) {
          setServices(servicesRes.data);
        }
      } catch (err) {
        console.error("Failed to load settings data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Validation Error", "Full name and email cannot be empty.");
      return;
    }

    setIsSaving(true);
    const res = await apiFetch<{ user: any; accessToken: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName, email }),
    });
    setIsSaving(false);

    if (res.success && res.data) {
      const { user: updatedUser, accessToken } = res.data;
      const refreshToken = localStorage.getItem('wavo_refresh_token') || '';
      
      // Update session tokens and state
      setTokens(accessToken, refreshToken);
      localStorage.setItem('wavo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success("Profile Updated", "Your profile has been saved successfully.");
    } else {
      toast.error("Update Failed", res.error?.message || "An error occurred while updating your profile.");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Validation Error", "All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Validation Error", "New password and confirmation password do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Validation Error", "New password must be at least 8 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    const res = await apiFetch<any>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    setIsUpdatingPassword(false);

    if (res.success) {
      toast.success("Password Updated", "Your password has been changed successfully.");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error("Update Failed", res.error?.message || "Failed to update password.");
    }
  };

  const handleCopy = (keyText: string, keyId: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(keyId);
    toast.info("Copied to Clipboard", "API key prefix has been copied.");
    setTimeout(() => {
      setCopiedKeyId(null);
    }, 2000);
  };

  const handleRevokeKey = (key: any) => {
    confirm({
      title: 'Revoke API Key',
      message: `Are you sure you want to revoke "${key.name}"? Any applications or integrations using this key will immediately lose access. This action is irreversible.`,
      confirmText: 'Revoke Key',
      type: 'danger',
      onConfirm: async () => {
        // Optimistic UI updates - instantly vanish
        const previousKeys = [...apiKeys];
        setApiKeys(prev => prev.filter(k => k.id !== key.id));

        const res = await apiFetch(`/api-keys/${key.id}`, {
          method: 'DELETE'
        });

        if (res.success) {
          toast.success("Key Revoked", `"${key.name}" has been successfully revoked.`);
        } else {
          toast.error("Revocation Failed", res.error?.message || "Failed to revoke API key.");
          // Rollback if failure
          setApiKeys(previousKeys);
        }
      }
    });
  };

  const handleOpenNewKeyModal = () => {
    if (services.length === 0) {
      toast.error("No WhatsApp Services", "You need to create at least one WhatsApp Service instance before you can generate API Keys.");
      return;
    }
    setNewKeyName('');
    setNewKeyServiceId(services[0]?.id || '');
    setGeneratedKey(null);
    setShowNewKeyModal(true);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Validation Error", "Please enter a key name.");
      return;
    }
    if (!newKeyServiceId) {
      toast.error("Validation Error", "Please select a WhatsApp service instance.");
      return;
    }

    setIsGenerating(true);
    const res = await apiFetch<any>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        name: newKeyName,
        serviceId: newKeyServiceId
      })
    });
    setIsGenerating(false);

    if (res.success && res.data) {
      const newKey = res.data;
      setGeneratedKey(newKey.apiKey);
      // Refresh the API keys list
      const keysRes = await apiFetch<any[]>('/api-keys');
      if (keysRes.success && keysRes.data) {
        setApiKeys(keysRes.data);
      }
      toast.success("API Key Generated", `"${newKeyName}" was successfully generated.`);
    } else {
      toast.error("Generation Failed", res.error?.message || "Failed to generate API key.");
    }
  };

  const handle2faToggle = async () => {
    if (user?.twoFactorEnabled) {
      setTwoFactorDisablePassword('');
      setShow2faDisableModal(true);
    } else {
      setIsEnabling2fa(true);
      const res = await apiFetch<any>('/auth/2fa/setup', { method: 'POST' });
      setIsEnabling2fa(false);
      
      if (res.success && res.data) {
        setTwoFactorSecret(res.data.secret);
        setTwoFactorQrCode(res.data.qrCode);
        setTwoFactorVerifyCode('');
        setShow2faSetupModal(true);
      } else {
        toast.error("2FA Setup Failed", res.error?.message || "Could not initialize two-factor auth.");
      }
    }
  };

  const handle2faEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorVerifyCode || twoFactorVerifyCode.length !== 6) return;

    setIsEnabling2fa(true);
    const res = await apiFetch<any>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code: twoFactorVerifyCode })
    });
    setIsEnabling2fa(false);

    if (res.success) {
      toast.success("2FA Enabled", "Two-factor authentication has been successfully enabled.");
      setShow2faSetupModal(false);
      
      const updatedUser = { ...user, twoFactorEnabled: true } as any;
      localStorage.setItem('wavo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      toast.error("Verification Failed", res.error?.message || "Invalid code. Please try again.");
    }
  };

  const handle2faDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorDisablePassword) return;

    setIsDisabling2fa(true);
    const res = await apiFetch<any>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password: twoFactorDisablePassword })
    });
    setIsDisabling2fa(false);

    if (res.success) {
      toast.success("2FA Disabled", "Two-factor authentication has been disabled.");
      setShow2faDisableModal(false);
      
      const updatedUser = { ...user, twoFactorEnabled: false } as any;
      localStorage.setItem('wavo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      toast.error("Deactivation Failed", res.error?.message || "Incorrect password.");
    }
  };

  const getLimits = () => {
    switch (user?.plan) {
      case 'PRO':
        return { messages: 100000, apiRequests: 500000, daily: 5000 };
      case 'BUSINESS':
        return { messages: 500000, apiRequests: 2500000, daily: 50000 };
      case 'ENTERPRISE':
        return { messages: 5000000, apiRequests: 25000000, daily: 999999 };
      default: // FREE
        return { messages: 10000, apiRequests: 50000, daily: 100 };
    }
  };

  const limits = getLimits();

  const renderContent = () => {
    if (isLoading) return <SettingsSkeleton />;

    // Generate avatar initials
    const initials = fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'WA';

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card title="User Profile" subtitle="Update your photo and personal details.">
            <div className="flex items-center gap-6 mb-10">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 p-1.5 flex items-center justify-center bg-[#2c2c2e]">
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                  {initials}
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-[20px] font-bold text-white">{fullName}</h4>
                <p className="text-[14px] text-[#8e8e93] font-medium">{email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider px-1">Full Name</label>
                <input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-primary/40 transition-all font-medium"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider px-1">Email Address</label>
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-primary/40 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-3 mb-10">
              <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider px-1">Developer Role</label>
              <div className="relative">
                <select 
                  value={user?.role}
                  disabled
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white/50 text-[15px] outline-none appearance-none cursor-not-allowed font-medium"
                >
                  <option value="SUPER_ADMIN">Super Administrator</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="USER">Standard User</option>
                </select>
                <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8e8e93] pointer-events-none" />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/[0.03]">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-10 py-4 bg-[#cfbcff] text-[#381e72] rounded-2xl font-bold text-[15px] hover:opacity-90 transition-all shadow-[0_0_30px_rgba(207,188,255,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card title="Change Password" subtitle="Update your account password periodically to remain secure.">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider px-1">Current Password</label>
                  <input 
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-primary/40 transition-all font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider px-1">New Password</label>
                  <input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-primary/40 transition-all font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider px-1">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-primary/40 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.03]">
                <button 
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-10 py-4 bg-[#cfbcff] text-[#381e72] rounded-2xl font-bold text-[15px] hover:opacity-90 transition-all shadow-[0_0_30px_rgba(207,188,255,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </Card>

          <Card 
            title="Security & API" 
            subtitle="Manage your credentials and access tokens."
            extra={
              <button 
                onClick={handleOpenNewKeyModal}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-[14px] hover:bg-white/10 transition-all active:scale-[0.95]"
              >
                <Plus size={18} />
                New Key
              </button>
            }
          >
            <div className="mt-4 space-y-6">
              <div className={`p-6 bg-black/20 rounded-[24px] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all ${user?.twoFactorEnabled ? '' : 'opacity-90'}`}>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#cfbcff]/10 flex items-center justify-center text-[#cfbcff] shadow-inner">
                    <Shield size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[15px] font-bold text-white">Two-Factor Authentication</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${user?.twoFactorEnabled ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20'}`}>
                        {user?.twoFactorEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#8e8e93] font-medium">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer" onClick={handle2faToggle}>
                  <input type="checkbox" checked={!!user?.twoFactorEnabled} readOnly className="sr-only peer" />
                  <div className={`w-12 h-7 rounded-full transition-colors relative ${user?.twoFactorEnabled ? 'bg-[#cfbcff]' : 'bg-white/5'} after:content-[''] after:absolute after:top-[4px] after:bg-white after:rounded-full after:h-[19px] after:w-[19px] after:transition-all ${user?.twoFactorEnabled ? 'after:left-[25px]' : 'after:left-[4px]'}`}></div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h5 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.25em] px-1">Active API Keys</h5>
                {apiKeys.length === 0 ? (
                  <div className="p-8 text-center bg-black/10 border border-dashed border-white/5 rounded-[24px] space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#8e8e93] mx-auto">
                      <Key size={20} />
                    </div>
                    <p className="text-[14px] text-[#8e8e93] font-medium">No active API keys found.</p>
                    <p className="text-[12px] text-[#8e8e93]/60 font-medium">Generate a new API key to authenticate your applications.</p>
                  </div>
                ) : (
                  apiKeys.map((item) => (
                    <div key={item.id} className="p-5 bg-black/20 border border-white/5 rounded-[24px] flex items-center justify-between group hover:bg-black/30 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#8e8e93] group-hover:text-white transition-colors">
                          <Key size={18} />
                        </div>
                        <div>
                          <p className="text-[14px] font-mono text-white font-bold tracking-tight flex items-center gap-2">
                            {item.keyPrefix}...
                            <span className="text-[10px] font-sans font-medium px-2 py-0.5 bg-primary/15 text-primary border border-primary/20 rounded-md">
                              {item.service?.name || 'WhatsApp Service'}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[13px] font-bold text-white/80">{item.name}</p>
                            <span className="text-[#8e8e93]">•</span>
                            <p className="text-[12px] text-[#8e8e93] font-medium">Created {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleCopy(item.keyPrefix + '...', item.id)}
                          className="p-2.5 bg-white/5 text-[#8e8e93] hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          title="Copy Key Prefix"
                        >
                          {copiedKeyId === item.id ? <Check size={16} className="text-[#34C759]" /> : <Copy size={16} />}
                        </button>
                        <button 
                          onClick={() => handleRevokeKey(item)}
                          className="p-2.5 bg-white/5 text-[#ff3b30]/60 hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-xl transition-all"
                          title="Revoke Key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <Card title="Resource Usage" subtitle={`Consumption of your ${user?.plan || 'FREE'} plan.`}>
            <div className="space-y-8 mt-6">
              <PlainUsageStat label="Messages Sent" value={usageStats.messagesSent} color="bg-[#cfbcff]" />
              <PlainUsageStat label="API Requests" value={usageStats.apiRequests} color="bg-[#FFCC00]" />
              <UsageBar label="Daily Usage" current={usageStats.dailyUsage} max={usageStats.dailyLimit || limits.daily} color="bg-[#34C759]" />
              <div className="pt-6 border-t border-white/[0.03]">
                <button 
                  onClick={() => toast.info("Subscription Management", "Subscription upgrades are currently managed by contacting support or your system administrator.")}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-[14px] hover:bg-white/10 transition-all shadow-xl active:scale-[0.98]"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </Card>

          <Card 
            title="Team" 
            extra={
              <button 
                onClick={() => toast.info("Invite Team Member", "Team management features are coming soon for Enterprise customers.")}
                className="text-[13px] font-bold text-[#cfbcff] hover:underline transition-all"
              >
                Invite
              </button>
            }
          >
            <div className="space-y-5 mt-4 opacity-70">
              <div className="flex items-center justify-between group p-2 rounded-2xl transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 overflow-hidden border border-primary/20 flex items-center justify-center text-primary text-[14px] font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-white leading-none">{fullName} (You)</p>
                    <p className="text-[11px] text-[#8e8e93] mt-1.5 font-medium">{email}</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-1 bg-white/5 text-[#8e8e93] rounded-lg border border-white/5 uppercase tracking-widest">
                  {user?.role || 'USER'}
                </span>
              </div>
              <div className="text-[12px] text-[#8e8e93]/70 text-center pt-2 font-medium">
                Multiple user accounts and organizations are coming soon.
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-br from-[#1c1c1e] to-[#0c0c0e] p-8 rounded-[32px] border border-white/[0.05] relative overflow-hidden group shadow-2xl">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Activity size={24} />
            </div>
            <h3 className="text-[18px] font-bold text-white mb-2">Need more scale?</h3>
            <p className="text-[14px] text-[#8e8e93] leading-relaxed mb-8 font-medium">
              Enterprise plans offer unlimited messages and 24/7 dedicated support.
            </p>
            <button 
              onClick={() => toast.info("Contact Sales", "You can reach out to our enterprise sales team at sales@wavo.io.")}
              className="flex items-center gap-2 text-[14px] font-bold text-[#cfbcff] hover:gap-3 transition-all cursor-pointer"
            >
              Contact Sales <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      <div className="mb-10">
        <h1 className="text-[32px] font-bold tracking-tight text-white">Settings</h1>
        <p className="text-[#8e8e93] text-[16px] font-medium mt-1">
          Manage your account preferences, security settings, and API integrations.
        </p>
      </div>
      {renderContent()}

      {/* Premium Key Generation Modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1c1c1e] border border-white/[0.08] rounded-[32px] max-w-[500px] w-full overflow-hidden shadow-2xl p-8 space-y-6 relative"
            >
              <button 
                onClick={() => setShowNewKeyModal(false)}
                className="absolute right-6 top-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#8e8e93] hover:text-white transition-all"
              >
                <X size={18} />
              </button>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Key size={24} />
                </div>
                <h3 className="text-[22px] font-bold text-white tracking-tight">Generate API Key</h3>
                <p className="text-[14px] text-[#8e8e93] leading-relaxed">
                  {!generatedKey 
                    ? "Generate a secure token to authenticate your API calls for a specific WhatsApp service instance."
                    : "Your new API key has been generated. Please copy and save it now — for security reasons, it cannot be shown again."}
                </p>
              </div>

              {!generatedKey ? (
                <form onSubmit={handleCreateKey} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">Key Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. My Production Integration"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-primary/40 transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider">WhatsApp Service Instance</label>
                    <div className="relative">
                      <select 
                        value={newKeyServiceId}
                        onChange={(e) => setNewKeyServiceId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all font-medium"
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id} className="bg-[#1c1c1e] text-white">
                            {s.name} ({s.phoneNumber || 'Unlinked'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8e8e93] pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewKeyModal(false)}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-[15px] transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="flex-1 py-4 bg-[#cfbcff] text-[#381e72] rounded-2xl font-bold text-[15px] hover:opacity-90 transition-all shadow-[0_0_30px_rgba(207,188,255,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? "Generating..." : "Generate Key"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Generated Key Box */}
                  <div className="p-5 bg-[#34C759]/5 border border-[#34C759]/20 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2.5 text-[#34C759] font-bold text-[14px]">
                      <Check size={18} />
                      Generated Successfully
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[14px] text-white select-all break-all relative">
                      <span className="flex-1 tracking-tight select-all">{generatedKey}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey);
                          toast.info("Copied to Clipboard", "API key copied successfully.");
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all active:scale-95"
                        title="Copy API Key"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-[#FFCC00]/5 border border-[#FFCC00]/20 rounded-2xl flex gap-3 text-[13px] text-[#FFCC00] leading-relaxed font-medium">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <span>
                      For your security, we only display this token once. Please make sure to copy it now and store it in a secure password manager.
                    </span>
                  </div>

                  <button
                    onClick={() => setShowNewKeyModal(false)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-[15px] transition-all active:scale-[0.98]"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {show2faSetupModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1c1c1e] border border-white/[0.08] rounded-[32px] max-w-[500px] w-full overflow-hidden shadow-2xl p-8 space-y-6 relative"
            >
              <button 
                onClick={() => setShow2faSetupModal(false)}
                className="absolute right-6 top-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#8e8e93] hover:text-white transition-all"
              >
                <X size={18} />
              </button>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#cfbcff]/10 border border-[#cfbcff]/20 flex items-center justify-center text-[#cfbcff]">
                  <Shield size={24} />
                </div>
                <h3 className="text-[22px] font-bold text-white tracking-tight">Setup Two-Factor Authentication</h3>
                <p className="text-[14px] text-[#8e8e93] leading-relaxed">
                  Scan the QR code below using Google Authenticator or another TOTP authenticator app.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center bg-black/20 p-6 rounded-2xl border border-white/5">
                {twoFactorQrCode ? (
                  <img src={twoFactorQrCode} alt="2FA QR Code" className="w-[180px] h-[180px] rounded-xl border border-white/10 p-2 bg-white" />
                ) : (
                  <div className="w-[180px] h-[180px] rounded-xl border border-white/10 bg-white/5 animate-pulse" />
                )}
                <div className="mt-4 text-center space-y-1 w-full">
                  <p className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">Secret Key</p>
                  <p className="text-[14px] font-mono text-white select-all tracking-wider break-all bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">{twoFactorSecret}</p>
                </div>
              </div>

              <form onSubmit={handle2faEnable} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider block px-1">Verification Code</label>
                  <input 
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={twoFactorVerifyCode}
                    onChange={(e) => setTwoFactorVerifyCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-[#cfbcff]/40 transition-all font-medium text-center tracking-[0.25em]"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShow2faSetupModal(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-[15px] transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEnabling2fa || twoFactorVerifyCode.length !== 6}
                    className="flex-1 py-4 bg-[#cfbcff] text-[#381e72] rounded-2xl font-bold text-[15px] hover:opacity-90 transition-all shadow-[0_0_30px_rgba(207,188,255,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isEnabling2fa ? "Verifying..." : "Enable 2FA"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {show2faDisableModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1c1c1e] border border-white/[0.08] rounded-[32px] max-w-[500px] w-full overflow-hidden shadow-2xl p-8 space-y-6 relative"
            >
              <button 
                onClick={() => setShow2faDisableModal(false)}
                className="absolute right-6 top-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#8e8e93] hover:text-white transition-all"
              >
                <X size={18} />
              </button>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Shield size={24} />
                </div>
                <h3 className="text-[22px] font-bold text-white tracking-tight">Disable Two-Factor Authentication</h3>
                <p className="text-[14px] text-[#8e8e93] leading-relaxed">
                  To protect your account, please enter your password to disable 2FA.
                </p>
              </div>

              <form onSubmit={handle2faDisable} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#8e8e93] uppercase tracking-wider block px-1">Confirm Password</label>
                  <input 
                    type="password"
                    placeholder="Enter your current password"
                    value={twoFactorDisablePassword}
                    onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-red-500/40 transition-all font-medium"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShow2faDisableModal(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-[15px] transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDisabling2fa || !twoFactorDisablePassword}
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold text-[15px] hover:opacity-90 transition-all shadow-[0_0_30px_rgba(239,68,68,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isDisabling2fa ? "Disabling..." : "Disable 2FA"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
