import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  Truck,
  ExternalLink,
  Sparkles,
  FileText,
  Phone,
  Mail,
  MessageCircle,
  Building,
  KeyRound,
  Lock,
  Database,
  AlertCircle,
  MapPin,
  UploadCloud,
  Eye,
  EyeOff
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { apiFetch } from '../../lib/api';
import { useCart } from '../../context/CartContext';

interface AdminSettingsPageProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {},
  onNavigateTab = (_tab: string) => {}
}) => {
  const { storeSettings, refreshSettings } = useCart();
  const initialSettings = storeSettings || (typeof window !== 'undefined' ? (window as any).__INITIAL_STORE_SETTINGS__ : null);

  const [settings, setSettings] = useState<StoreSettings | null>(initialSettings);
  const [loading, setLoading] = useState(!initialSettings);
  const [saving, setSaving] = useState(false);

  // Form states - Store Identity & Logo
  const [isLogoEnabled, setIsLogoEnabled] = useState<boolean>(initialSettings?.isLogoEnabled !== false);
  const [storeName, setStoreName] = useState(initialSettings?.storeName || "Al-Mu'attar");
  const [tagline, setTagline] = useState(initialSettings?.tagline || 'Haute Parfumerie Orientale');
  const [storeAddress, setStoreAddress] = useState(initialSettings?.storeAddress || '104 Mall Road, Gulberg III, Lahore, Pakistan');
  const [supportEmail, setSupportEmail] = useState(initialSettings?.supportEmail || initialSettings?.contactEmail || 'concierge@almuattar.com');
  const [contactPhone, setContactPhone] = useState(initialSettings?.contactPhone || '+92 300 1234567');
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings?.whatsappNumber || '+92 300 1234567');
  const [logoUrl, setLogoUrl] = useState(
    initialSettings?.logoUrl ||
    "https://scontent.fmux4-1.fna.fbcdn.net/v/t39.30808-6/478027044_1019853990163594_1413852064171433507_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x566&ctp=s1000x566&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=r4pGVvvvqewQ7kNvwHL01CJ&_nc_oc=AdrWu8S341R0a0folfbe1xUS41rG-nPsaoMy-E1D_hjgEi3VRzLcWGx3jkYXIYtqwd0&_nc_zt=23&_nc_ht=scontent.fmux4-1.fna&_nc_gid=9_qzl8eMqKzXrJwbzO6o9Q&_nc_ss=7b289&oh=00_AQGxSNaHK86s60yEg2gfGkShe71jPsOy2kOyhewR-0mzBw&oe=6A82A082"
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 5 MB validation
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onShowToast('Image size must be 5 MB or less.', 'error');
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
      return;
    }

    // MIME and extension verification
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExts.includes(fileExt)) {
      onShowToast('Please select a valid JPG, PNG, WEBP, GIF, or AVIF image.', 'error');
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to upload brand logo. Please try again.');
      }

      setLogoUrl(data.url);
      onShowToast('Brand logo uploaded successfully!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Logo upload failed.', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    }
  };

  const [footerText, setFooterText] = useState('Maison de Parfum • Est. Lahore, Pakistan');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string; token?: string }>(
        '/api/admin/change-password',
        {
          method: 'POST',
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword: confirmNewPassword
          })
        }
      );

      if (res.success) {
        if (res.token) {
          localStorage.setItem('admin_token', res.token);
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordSuccess(res.message || 'Admin password changed successfully.');
        onShowToast('Admin password updated successfully!', 'success');
      } else {
        throw new Error(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change admin password. Please try again.');
      onShowToast(err.message || 'Failed to change admin password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Database status states
  const [dbStatus, setDbStatus] = useState<{
    isConnected: boolean;
    storageMode: string;
    databaseName: string;
    lastError: string | null;
    instructions: string | null;
    outboundIp?: string;
  } | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [migratingDb, setMigratingDb] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchDbStatus();
  }, []);

  const fetchDbStatus = async () => {
    try {
      const res = await apiFetch<any>('/api/admin/database-status');
      if (res.success) {
        setDbStatus(res);
      }
    } catch {
      // ignore
    }
  };

  const handleReconnectDb = async () => {
    setCheckingDb(true);
    try {
      const res = await apiFetch<any>('/api/admin/reconnect-database', { method: 'POST' });
      if (res.success) {
        setDbStatus(res);
        if (res.isConnected) {
          onShowToast('Connected to MongoDB Atlas successfully!', 'success');
        } else {
          onShowToast('Could not reach MongoDB Atlas. Check IP Access List in Atlas.', 'error');
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to reconnect to database.', 'error');
    } finally {
      setCheckingDb(false);
    }
  };

  const handleMigrateDb = async () => {
    setMigratingDb(true);
    try {
      const res = await apiFetch<any>('/api/admin/migrate-database', { method: 'POST' });
      if (res.success) {
        onShowToast('Data migrated to MongoDB Atlas successfully!', 'success');
      } else {
        onShowToast(res.message || 'Migration could not be completed.', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Migration failed.', 'error');
    } finally {
      setMigratingDb(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; settings: StoreSettings }>('/api/settings');
      if (res.success && res.settings) {
        const s = res.settings;
        setSettings(s);
        setStoreName(s.storeName !== undefined ? s.storeName : "Al-Mu'attar");
        setTagline(s.tagline !== undefined ? s.tagline : 'Haute Parfumerie Orientale');
        setStoreAddress(s.storeAddress !== undefined ? s.storeAddress : '104 Mall Road, Gulberg III, Lahore, Pakistan');
        setSupportEmail(s.supportEmail !== undefined ? s.supportEmail : (s.contactEmail !== undefined ? s.contactEmail : 'concierge@almuattar.com'));
        setContactPhone(s.contactPhone !== undefined ? s.contactPhone : '+92 300 1234567');
        setWhatsappNumber(s.whatsappNumber !== undefined ? s.whatsappNumber : '+92 300 1234567');
        if (s.isLogoEnabled !== undefined) setIsLogoEnabled(s.isLogoEnabled);
        if (s.logoUrl !== undefined) setLogoUrl(s.logoUrl);
        if (s.footerText !== undefined) setFooterText(s.footerText);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load store settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStoreIdentity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<StoreSettings> = {
        isLogoEnabled,
        storeName,
        tagline,
        storeAddress,
        contactEmail: supportEmail,
        supportEmail,
        contactPhone,
        whatsappNumber,
        logoUrl,
        footerText,
        shippingFee: 0,
        standardShippingFee: 0,
        freeShippingThreshold: 0,
        isFreeShippingEnabled: true
      };

      const res = await apiFetch<{ success: boolean; message: string }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        await refreshSettings();
        onShowToast('Store identity & contact details saved successfully!', 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save store settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1]">
        <RefreshCw className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059] animate-spin mx-auto" />
        <p className="text-xs font-mono text-stone-600 dark:text-zinc-400">Loading Store Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen transition-colors p-4 sm:p-6 md:p-8 pb-20">
      {/* Header Bar */}
      <div className="border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em] font-semibold">
              Configuration & Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Store Settings
          </h1>
          <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">
            Manage store identity, contact info, shipping policies, and administrative security credentials.
          </p>
        </div>

        <button
          onClick={() => handleSaveStoreIdentity()}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all inline-flex items-center gap-2 shadow-lg disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Quick CMS Jump Banner */}
      <div className="bg-white dark:bg-[#141414] border border-[#9a7229]/30 dark:border-[#c5a059]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
              Looking to edit Homepage or About Us content?
            </h3>
            <p className="text-xs text-stone-600 dark:text-zinc-400">
              Content customization has been separated into dedicated CMS sections for Homepage and About Us.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onNavigateTab('admin-homepage')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/15 hover:bg-[#9a7229]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Homepage CMS</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('admin-about')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-[#1a1a1a] hover:bg-stone-200 dark:hover:bg-[#252525] text-stone-800 dark:text-zinc-200 border border-stone-300 dark:border-[#c5a059]/20 text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>About Us CMS</span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* =================================================================== */}
        {/* 1. STORE IDENTITY & LOGO */}
        {/* =================================================================== */}
        <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                  Store Identity, Logo & Concierge
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Controls the brand logo, house name, tagline, email, and VIP WhatsApp lines.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveStoreIdentity()}
              disabled={saving}
              className="self-end sm:self-auto px-4 py-1.5 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/15 hover:bg-[#9a7229]/20 text-[#9a7229] dark:text-[#c5a059] text-xs font-semibold uppercase tracking-wider transition-all border border-[#9a7229]/30 dark:border-[#c5a059]/30"
            >
              Save Identity
            </button>
          </div>

          <div className="space-y-5 text-xs">
            {/* Brand Logo: Enabled / Disabled Control */}
            <div className="bg-white dark:bg-[#141414] p-4 rounded-xl border border-stone-200 dark:border-[#c5a059]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider text-xs flex items-center gap-1.5">
                    {isLogoEnabled ? (
                      <Eye className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-stone-400 dark:text-zinc-500" />
                    )}
                    <span>Brand Logo Display</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isLogoEnabled
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-stone-100 dark:bg-[#1f1f1f] text-stone-500 dark:text-zinc-400 border border-stone-300 dark:border-zinc-700'
                    }`}
                  >
                    {isLogoEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  {isLogoEnabled
                    ? 'Brand logo is currently ENABLED and visible in the website navigation bar.'
                    : 'Brand logo is currently DISABLED and cleanly hidden from the navbar. (Your saved logo URL & image are safely preserved).'}
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="text-[11px] font-medium text-stone-600 dark:text-zinc-400">
                  {isLogoEnabled ? 'Logo Visible' : 'Logo Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLogoEnabled(!isLogoEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isLogoEnabled ? 'bg-[#9a7229] dark:bg-[#c5a059]' : 'bg-stone-300 dark:bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={isLogoEnabled}
                  aria-label="Toggle Brand Logo Display"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isLogoEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Logo Image URL with Live Thumbnail Preview */}
            <div className="space-y-3 bg-stone-50 dark:bg-[#0a0a0a] p-4 rounded-xl border border-stone-200 dark:border-[#c5a059]/15">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Brand Logo URL
                </label>
                <span className="text-[10px] text-stone-500 dark:text-zinc-400">
                  Square or circular format recommended (Max 5 MB)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://... or /api/images/..."
                    className="w-full bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] font-mono text-[11px] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  />
                </div>

                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={handleLogoFileSelect}
                />

                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="px-4 py-3 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:bg-[#7a581d] dark:hover:bg-[#d4af37] text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50"
                >
                  {isUploadingLogo ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Local Image</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <div className="w-14 h-14 aspect-square rounded-full overflow-hidden bg-stone-100 dark:bg-[#1a1a1a] border border-[#9a7229]/40 dark:border-[#c5a059]/40 shrink-0 p-0.5 flex items-center justify-center relative">
                  <img
                    src={logoUrl && logoUrl.trim() ? logoUrl.trim() : 'https://via.placeholder.com/150?text=Logo'}
                    alt="Brand Logo Preview"
                    className={`w-full h-full object-contain rounded-full transition-opacity ${
                      isLogoEnabled ? 'opacity-100' : 'opacity-40 grayscale'
                    }`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Logo';
                    }}
                  />
                  {!isLogoEnabled && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                      <EyeOff className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-stone-600 dark:text-zinc-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#9a7229] dark:text-[#c5a059] font-medium">Brand Logo Preview</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                      isLogoEnabled 
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
                        : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    }`}>
                      {isLogoEnabled ? 'Active in Navbar' : 'Hidden in Navbar'}
                    </span>
                  </div>
                  <div>
                    {isLogoEnabled 
                      ? 'Displayed in website navigation bar, mobile drawer, and checkout header.' 
                      : 'Hidden from navigation bar. Toggle to Enabled above to display it.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Store / Maison Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Motto / Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                  <span>Concierge Support Email</span>
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                  <span>Contact Phone Number</span>
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                  <span>Shop / Maison Location (Physical Address & City)</span>
                </label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="e.g. 104 Mall Road, Gulberg III, Lahore, Pakistan"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Primary physical address of your boutique showroom. Displayed in the Footer, Contact Concierge page, and store communications.
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp VIP Concierge Line (Direct Link)</span>
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Footer Copyright / Origin Text
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 2. SHIPPING POLICY CONFIRMATION */}
        {/* =================================================================== */}
        <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                Nationwide Shipping Policy
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                Permanent store-wide complimentary delivery status.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 flex items-center gap-3.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <div className="font-semibold text-sm">Permanent Free Shipping Enabled Nationwide</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
                All customer orders automatically receive Free Express Courier delivery (Rs. 0 Shipping Fee) with no minimum order threshold across Pakistan.
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. CHANGE ADMIN PASSWORD */}
        {/* =================================================================== */}
        <section id="admin-change-password-section" className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                  Change Admin Password
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Update administrative authentication credentials for <span className="font-mono font-medium text-stone-700 dark:text-zinc-300">admin@store.com</span>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-stone-50 dark:bg-[#121212] border border-stone-300 dark:border-zinc-700 text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-stone-50 dark:bg-[#121212] border border-stone-300 dark:border-zinc-700 text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-stone-50 dark:bg-[#121212] border border-stone-300 dark:border-zinc-700 text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                className="px-5 py-2.5 bg-[#9a7229] hover:bg-[#836020] dark:bg-[#c5a059] dark:hover:bg-[#d4b068] text-white dark:text-black font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {changingPassword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>

              {(currentPassword || newPassword || confirmNewPassword) && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="px-3.5 py-2.5 text-xs text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </section>

        {/* =================================================================== */}
        {/* 4. ADMIN ACCESS & SERVER SECURITY */}
        {/* =================================================================== */}
        <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
            <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                Admin Access & Server Security
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                Server-controlled session authorization architecture.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#0f0f0f] border border-stone-200 dark:border-[#c5a059]/20 space-y-2">
              <div className="font-semibold text-stone-800 dark:text-zinc-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Server-Level Signed Session
              </div>
              <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-relaxed">
                Control panel sessions are cryptographically signed on the server and transmitted via secure HTTP-Only tokens. No raw passwords or sign-up forms are exposed in the client.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#0f0f0f] border border-stone-200 dark:border-[#c5a059]/20 space-y-2">
              <div className="font-semibold text-stone-800 dark:text-zinc-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                Protected Endpoints
              </div>
              <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-relaxed">
                All admin mutations (product editing, order status changes, image uploads, and store settings updates) require server-side token validation.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 5. DATABASE & CLOUD PERSISTENCE */}
        {/* =================================================================== */}
        <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                  Database & Cloud Persistence
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  MongoDB Atlas and fallback local persistence monitoring.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReconnectDb}
                disabled={checkingDb}
                className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                title="Retry MongoDB Atlas connection"
              >
                <RefreshCw className={`w-3 h-3 ${checkingDb ? 'animate-spin' : ''}`} />
                <span>{checkingDb ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#0f0f0f] border border-stone-200 dark:border-zinc-800 space-y-1">
              <div className="text-stone-500 dark:text-zinc-400 font-mono text-[10px] uppercase">Active Engine</div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{dbStatus?.storageMode || 'Local File Persistence'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#0f0f0f] border border-stone-200 dark:border-zinc-800 space-y-1">
              <div className="text-stone-500 dark:text-zinc-400 font-mono text-[10px] uppercase">Database Name</div>
              <div className="font-semibold text-sm text-stone-800 dark:text-zinc-200">
                {dbStatus?.databaseName || 'al_muattar_db'}
              </div>
            </div>
          </div>

          {dbStatus?.isConnected ? (
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-sm">MongoDB Atlas Cloud Database Connected</div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
                  All products, orders, settings, and inquiries are persisting directly to your MongoDB Atlas cluster.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleMigrateDb}
                    disabled={migratingDb}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${migratingDb ? 'animate-spin' : ''}`} />
                    <span>{migratingDb ? 'Migrating...' : 'Sync Initial JSON to MongoDB'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div className="font-semibold text-sm">MongoDB Atlas Connection Lost</div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  MongoDB Atlas is configured as the Single Source of Truth, but is currently unreachable. The server is actively retrying reconnection and will NOT serve or overwrite stale data.
                </p>
                <div className="p-3 rounded-lg bg-amber-100/60 dark:bg-amber-900/30 border border-amber-300/50 dark:border-amber-700/50 space-y-1">
                  <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    Backend Outbound IP for this Cloud Container:
                  </div>
                  <div className="font-mono text-xs text-stone-900 dark:text-white select-all bg-white dark:bg-black/50 px-2 py-1 rounded inline-block">
                    {dbStatus?.outboundIp ? `${dbStatus.outboundIp}/32` : '34.34.254.55/32'}
                  </div>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800/90 dark:text-amber-300/80 pl-1">
                  <li>Log into your <strong>MongoDB Atlas Console</strong>.</li>
                  <li>Go to <strong>Security &gt; Network Access</strong>.</li>
                  <li>Ensure <strong>0.0.0.0/0</strong> (or the active IP <strong>{dbStatus?.outboundIp ? `${dbStatus.outboundIp}/32` : '34.34.254.55/32'}</strong>) is added to your IP Access List.</li>
                  <li>Click <strong>Test Connection</strong> above to verify immediate reconnection.</li>
                </ol>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
