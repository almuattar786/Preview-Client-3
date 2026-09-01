import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Sparkles,
  RefreshCw,
  Upload,
  Layers,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { ShopPageConfig, CollectionHeroBannerConfig } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminShopCollectionCMSProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

type BannerTab = 'default' | 'men' | 'women' | 'unisex';

const TAB_CONFIGS: { id: BannerTab; label: string; sublabel: string; badgeColor: string }[] = [
  { id: 'default', label: '1. Default Banner', sublabel: 'Shown when no gender filter is applied', badgeColor: 'bg-[#9a7229]/20 text-[#9a7229] dark:text-[#c5a059]' },
  { id: 'men', label: '2. Filter → Gender: Men', sublabel: 'Shown when Men gender filter is selected', badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
  { id: 'women', label: '3. Filter → Gender: Women', sublabel: 'Shown when Women gender filter is selected', badgeColor: 'bg-rose-500/20 text-rose-700 dark:text-rose-400' },
  { id: 'unisex', label: '4. Filter → Gender: Unisex', sublabel: 'Shown when Unisex gender filter is selected', badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' }
];

export const AdminShopCollectionCMS: React.FC<AdminShopCollectionCMSProps> = ({
  onShowToast = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<BannerTab>('default');
  const [config, setConfig] = useState<ShopPageConfig>({
    enabled: true,
    defaultBanner: {
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1920',
      badgeText: 'Curated Haute Parfumerie',
      title: 'Shop All Fragrances',
      subtitle: "Maison Al-Mu'attar Masterworks",
      description: 'Explore mastercrafted Extraits de Parfum, pure Cambodian agarwood essences, and non-alcoholic attars formulated for exceptional longevity and regal sillage.'
    },
    menBanner: {
      imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1920',
      badgeText: 'Masculine Accords',
      title: "Men's Fragrance Selection",
      subtitle: 'Smoked Woods, Tuscan Leather & Spiced Ambers',
      description: 'Commanding olfactory profiles featuring smoked birch, Italian leather, royal ambergris, and warm oriental spices for distinguished presence.'
    },
    womenBanner: {
      imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1920',
      badgeText: 'Feminine Accords',
      title: "Women's Fragrance Selection",
      subtitle: 'Taif Rose Petals, Ethereal Florals & Sweet Nectars',
      description: 'Enchanting floral extraits, velvety Taif rose nectars, white jasmine blossoms, and crystalline Madagascar vanilla for sublime elegance.'
    },
    unisexBanner: {
      imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920',
      badgeText: 'Universal Harmony',
      title: 'Unisex Fragrance Selection',
      subtitle: 'Harmonious Signature Scents For All Connoisseurs',
      description: 'Sophisticated signature blends designed to transcend boundaries and adapt organically with individual skin chemistry.'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ success: boolean; config: ShopPageConfig }>('/api/admin/shop-config');
      if (res.success && res.config) {
        setConfig(res.config);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load Shop Collection configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('Image size must not exceed 5 MB.', 'error');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to upload image. Please try again.');
      }

      updateCurrentBanner({ imageUrl: data.url });
      onShowToast('Banner background image uploaded successfully.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Unable to upload image. Please try again.', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getCurrentBanner = (): CollectionHeroBannerConfig => {
    switch (activeTab) {
      case 'men':
        return config.menBanner;
      case 'women':
        return config.womenBanner;
      case 'unisex':
        return config.unisexBanner;
      case 'default':
      default:
        return config.defaultBanner;
    }
  };

  const updateCurrentBanner = (partial: Partial<CollectionHeroBannerConfig>) => {
    setConfig((prev) => {
      switch (activeTab) {
        case 'men':
          return { ...prev, menBanner: { ...prev.menBanner, ...partial } };
        case 'women':
          return { ...prev, womenBanner: { ...prev.womenBanner, ...partial } };
        case 'unisex':
          return { ...prev, unisexBanner: { ...prev.unisexBanner, ...partial } };
        case 'default':
        default:
          return { ...prev, defaultBanner: { ...prev.defaultBanner, ...partial } };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string; config: ShopPageConfig }>(
        '/api/admin/shop-config',
        {
          method: 'PUT',
          body: JSON.stringify(config)
        }
      );
      if (res.success) {
        onShowToast('Shop Collection hero banners saved persistently.', 'success');
        if (res.config) {
          setConfig(res.config);
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save Shop Collection banners.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentBanner = getCurrentBanner();

  return (
    <div className="space-y-8 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-1 sm:p-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#c5a059]/20 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] text-[11px] font-mono uppercase tracking-[0.2em] font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Shop Collection Hero CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Shop Collection Hero Banners
          </h1>
          <p className="text-xs text-stone-600 dark:text-zinc-400 mt-1">
            Configure dynamic top hero banners for Default view, and Men, Women, and Unisex filter selections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchConfig}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white shadow-sm"
            title="Reload Config"
          >
            <RefreshCw className={`w-4 h-4 text-[#9a7229] dark:text-[#c5a059] ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save All Banners'}</span>
          </button>
        </div>
      </div>

      {/* Banner Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TAB_CONFIGS.map((tab) => {
          const isCurrent = activeTab === tab.id;
          const bannerData = tab.id === 'men' ? config.menBanner : tab.id === 'women' ? config.womenBanner : tab.id === 'unisex' ? config.unisexBanner : config.defaultBanner;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-3 cursor-pointer ${
                isCurrent
                  ? 'bg-white dark:bg-[#181818] border-[#9a7229] dark:border-[#c5a059] shadow-md ring-2 ring-[#9a7229]/20 dark:ring-[#c5a059]/20'
                  : 'bg-white/60 dark:bg-[#121212] border-stone-200 dark:border-[#c5a059]/15 hover:border-stone-300 dark:hover:border-[#c5a059]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${tab.badgeColor}`}>
                    {tab.label}
                  </span>
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-[#9a7229] dark:bg-[#c5a059]" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2">
                  {tab.sublabel}
                </p>
              </div>

              {/* Mini Thumbnail */}
              <div className="relative h-16 w-full rounded-lg overflow-hidden bg-stone-900 border border-stone-200 dark:border-[#c5a059]/20">
                <img
                  src={bannerData.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                  alt={tab.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent flex items-end p-1.5">
                  <span className="text-[10px] font-serif font-bold text-white truncate">
                    {bannerData.title || tab.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Banner Customization Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059]" />
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
                Customizing: {TAB_CONFIGS.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                {TAB_CONFIGS.find((t) => t.id === activeTab)?.sublabel}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider font-semibold">
            Active Filter State: {activeTab === 'default' ? 'No Filter / All' : activeTab.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-7 space-y-4">
            {/* Background Image URL & File Upload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Hero Background Image URL *
                </label>
                <span className="text-[10px] font-mono text-stone-500">1920x1080 (16:9 / Full-Bleed)</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={currentBanner.imageUrl}
                  onChange={(e) => updateCurrentBanner({ imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... or upload"
                  className="flex-1 bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-4 py-3 rounded-xl bg-stone-200 dark:bg-[#1f1f1f] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-200 text-xs font-medium hover:bg-stone-300 dark:hover:bg-[#282828] transition-colors shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className={`w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059] ${uploadingImage ? 'animate-bounce' : ''}`} />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Luxury Banner Preview */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
              Live Storefront Preview
            </label>

            <div className="relative w-full rounded-2xl overflow-hidden h-48 sm:h-56 lg:h-64 flex items-center bg-stone-950 border border-stone-200 dark:border-[#c5a059]/30 shadow-lg">
              {/* Background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={currentBanner.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                  alt="Shop Hero Banner Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-100 object-center"
                />
                <div className="absolute inset-0 bg-stone-950/15 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/25 via-transparent to-stone-950/10 pointer-events-none" />
              </div>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-zinc-500 italic text-center pt-1">
              Changes are immediately applied on the Shop Collection page once saved.
            </p>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex justify-end pt-4 border-t border-stone-200 dark:border-[#c5a059]/20">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Shop Collection Banners'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
