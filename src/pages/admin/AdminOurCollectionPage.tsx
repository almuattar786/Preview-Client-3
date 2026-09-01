import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Compass,
  Layers,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Check,
  CheckCircle2,
  Upload,
  Users
} from 'lucide-react';
import { OurCollectionPageConfig, CollectionHeroBannerConfig, Product, ProductPlacement } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminOurCollectionPageProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onNavigateToProduct?: (productId: string) => void;
}

type BannerTab = 'default' | 'men' | 'women' | 'unisex';

const TAB_CONFIGS: { id: BannerTab; label: string; sublabel: string; badgeColor: string }[] = [
  { id: 'default', label: '1. Default Banner', sublabel: 'Shown when no gender filter is applied', badgeColor: 'bg-[#9a7229]/20 text-[#9a7229] dark:text-[#c5a059]' },
  { id: 'men', label: '2. Filter → Gender: Men', sublabel: 'Shown when Men gender filter is selected', badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
  { id: 'women', label: '3. Filter → Gender: Women', sublabel: 'Shown when Women gender filter is selected', badgeColor: 'bg-rose-500/20 text-rose-700 dark:text-rose-400' },
  { id: 'unisex', label: '4. Filter → Gender: Unisex', sublabel: 'Shown when Unisex gender filter is selected', badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' }
];

export const AdminOurCollectionPage: React.FC<AdminOurCollectionPageProps> = ({
  onShowToast = () => {},
  onNavigateToProduct
}) => {
  const [activeTab, setActiveTab] = useState<BannerTab>('default');
  const [config, setConfig] = useState<OurCollectionPageConfig>({
    enabled: true,
    heroBadgeText: "Maison Al-Mu'attar Privé",
    heroTitle: "Our Signature Fragrance Collection",
    heroSubtitle: "Maison Al-Mu'attar Privé Accords",
    heroDescription: "Mastercrafted in limited artisanal batches with genuine rare Cambodian agarwood, pure Taif rose absolutes, and vintage ambergris. Each creation is formulated at exceptional Extrait concentration for unmatched sillage.",
    heroImageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000",
    heroBannerUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000",
    seoTitle: "Our Collection — Al-Mu'attar Signature Perfumes & Pure Attars",
    seoDescription: "Explore Al-Mu'attar's proprietary house fragrances, handcrafted extraits, and rare oud essences.",
    defaultBanner: {
      imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000",
      badgeText: "Maison Al-Mu'attar Privé",
      title: "Our Signature House Collection",
      subtitle: "Maison Al-Mu'attar Privé Accords",
      description: "Mastercrafted in limited artisanal batches with genuine rare Cambodian agarwood, pure Taif rose absolutes, and vintage ambergris. Each creation is formulated at exceptional Extrait concentration for unmatched sillage."
    },
    menBanner: {
      imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1920",
      badgeText: "Privé Masculin",
      title: "Signature Masculine Accords",
      subtitle: "Smoked Woods, Royal Agarwood & Cured Tobacco",
      description: "Distinguished extraits formulated with aged Cambodian oud, dark leather, and spiced cloves for commanding longevity."
    },
    womenBanner: {
      imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1920",
      badgeText: "Privé Féminin",
      title: "Signature Feminine Accords",
      subtitle: "Taif Rose Absolutes, White Musks & Velvet Florals",
      description: "Sublime floral extraits featuring morning-harvested Taif roses, blooming jasmine sambac, and aged bourbon vanilla."
    },
    unisexBanner: {
      imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=1920",
      badgeText: "Privé Universel",
      title: "Signature Unisex Accords",
      subtitle: "Timeless Sillage & Balanced Rare Resins",
      description: "A masterful equilibrium of rare spices, creamy sandalwood, and crystalline musks that transcend traditional categorizations."
    }
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, productsRes] = await Promise.all([
        apiFetch<{ success: boolean; config: OurCollectionPageConfig }>('/api/admin/our-collection'),
        apiFetch<{ success: boolean; products: Product[] }>('/api/products?includeInactive=true')
      ]);

      if (configRes.success && configRes.config) {
        const c = configRes.config;
        setConfig({
          enabled: typeof c.enabled === 'boolean' ? c.enabled : true,
          heroBadgeText: c.heroBadgeText || "Maison Al-Mu'attar Privé",
          heroTitle: c.heroTitle || "Our Signature Fragrance Collection",
          heroSubtitle: c.heroSubtitle || "Maison Al-Mu'attar Privé Accords",
          heroDescription: c.heroDescription || '',
          heroImageUrl: c.heroImageUrl || c.heroBannerUrl || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000",
          heroBannerUrl: c.heroBannerUrl || c.heroImageUrl || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000",
          seoTitle: c.seoTitle || "Our Collection — Al-Mu'attar Signature Perfumes & Pure Attars",
          seoDescription: c.seoDescription || "Explore Al-Mu'attar's proprietary house fragrances, handcrafted extraits, and rare oud essences.",
          defaultBanner: c.defaultBanner || {
            imageUrl: c.heroBannerUrl || c.heroImageUrl || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000",
            badgeText: c.heroBadgeText || "Maison Al-Mu'attar Privé",
            title: c.heroTitle || "Our Signature House Collection",
            subtitle: c.heroSubtitle || "Maison Al-Mu'attar Privé Accords",
            description: c.heroDescription || "Mastercrafted in limited artisanal batches with genuine rare Cambodian agarwood, pure Taif rose absolutes, and vintage ambergris."
          },
          menBanner: c.menBanner || {
            imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1920",
            badgeText: "Privé Masculin",
            title: "Signature Masculine Accords",
            subtitle: "Smoked Woods, Royal Agarwood & Cured Tobacco",
            description: "Distinguished extraits formulated with aged Cambodian oud, dark leather, and spiced cloves for commanding longevity."
          },
          womenBanner: c.womenBanner || {
            imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1920",
            badgeText: "Privé Féminin",
            title: "Signature Feminine Accords",
            subtitle: "Taif Rose Absolutes, White Musks & Velvet Florals",
            description: "Sublime floral extraits featuring morning-harvested Taif roses, blooming jasmine sambac, and aged bourbon vanilla."
          },
          unisexBanner: c.unisexBanner || {
            imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=1920",
            badgeText: "Privé Universel",
            title: "Signature Unisex Accords",
            subtitle: "Timeless Sillage & Balanced Rare Resins",
            description: "A masterful equilibrium of rare spices, creamy sandalwood, and crystalline musks that transcend traditional categorizations."
          }
        });
      }
      if (productsRes.success && productsRes.products) {
        setAllProducts(productsRes.products);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load Our Collection configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      onShowToast('Banner image uploaded successfully.', 'success');
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
        return config.menBanner || {
          imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1920",
          badgeText: "Privé Masculin",
          title: "Signature Masculine Accords",
          subtitle: "Smoked Woods, Royal Agarwood & Cured Tobacco",
          description: "Distinguished extraits formulated with aged Cambodian oud, dark leather, and spiced cloves for commanding longevity."
        };
      case 'women':
        return config.womenBanner || {
          imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1920",
          badgeText: "Privé Féminin",
          title: "Signature Feminine Accords",
          subtitle: "Taif Rose Absolutes, White Musks & Velvet Florals",
          description: "Sublime floral extraits featuring morning-harvested Taif roses, blooming jasmine sambac, and aged bourbon vanilla."
        };
      case 'unisex':
        return config.unisexBanner || {
          imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=1920",
          badgeText: "Privé Universel",
          title: "Signature Unisex Accords",
          subtitle: "Timeless Sillage & Balanced Rare Resins",
          description: "A masterful equilibrium of rare spices, creamy sandalwood, and crystalline musks that transcend traditional categorizations."
        };
      case 'default':
      default:
        return config.defaultBanner || {
          imageUrl: config.heroBannerUrl || config.heroImageUrl || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000",
          badgeText: config.heroBadgeText || "Maison Al-Mu'attar Privé",
          title: config.heroTitle || "Our Signature House Collection",
          subtitle: config.heroSubtitle || "Maison Al-Mu'attar Privé Accords",
          description: config.heroDescription || "Mastercrafted in limited artisanal batches with genuine rare Cambodian agarwood, pure Taif rose absolutes, and vintage ambergris."
        };
    }
  };

  const updateCurrentBanner = (partial: Partial<CollectionHeroBannerConfig>) => {
    setConfig((prev) => {
      switch (activeTab) {
        case 'men':
          return {
            ...prev,
            menBanner: { ...(prev.menBanner || getCurrentBanner()), ...partial }
          };
        case 'women':
          return {
            ...prev,
            womenBanner: { ...(prev.womenBanner || getCurrentBanner()), ...partial }
          };
        case 'unisex':
          return {
            ...prev,
            unisexBanner: { ...(prev.unisexBanner || getCurrentBanner()), ...partial }
          };
        case 'default':
        default:
          const updatedDefault = { ...(prev.defaultBanner || getCurrentBanner()), ...partial };
          return {
            ...prev,
            defaultBanner: updatedDefault,
            heroBadgeText: updatedDefault.badgeText || prev.heroBadgeText,
            heroTitle: updatedDefault.title || prev.heroTitle,
            heroSubtitle: updatedDefault.subtitle || prev.heroSubtitle,
            heroDescription: updatedDefault.description || prev.heroDescription,
            heroBannerUrl: updatedDefault.imageUrl || prev.heroBannerUrl,
            heroImageUrl: updatedDefault.imageUrl || prev.heroImageUrl
          };
      }
    });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string; config: OurCollectionPageConfig }>(
        '/api/admin/our-collection',
        {
          method: 'PUT',
          body: JSON.stringify(config)
        }
      );
      if (res.success) {
        onShowToast('Our Collection landing page & hero banners saved persistently.', 'success');
        if (res.config) {
          fetchData();
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPlacementChange = async (productId: string, placement: ProductPlacement) => {
    try {
      const res = await apiFetch<{ success: boolean; product: Product }>(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ collectionPlacement: placement })
      });
      if (res.success) {
        setAllProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, collectionPlacement: placement } : p))
        );
        onShowToast(`Updated placement for "${res.product?.name || 'fragrance'}".`, 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update product placement.', 'error');
    }
  };

  // Filter products for placement management
  const ourCollectionProducts = allProducts.filter(
    (p) => p.collectionPlacement === 'our' || p.collectionPlacement === 'both'
  );

  const shopOnlyProducts = allProducts.filter(
    (p) => !p.collectionPlacement || p.collectionPlacement === 'shop'
  );

  const filteredShopProducts = shopOnlyProducts.filter(
    (p) =>
      searchProduct.trim() === '' ||
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.category.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const currentBanner = getCurrentBanner();

  return (
    <div className="space-y-8 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-1 sm:p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#c5a059]/20 pb-6">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">
            Signature CMS
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            "Our Collection" Landing Page & Hero Banners
          </h1>
          <p className="text-xs text-stone-600 dark:text-zinc-400 mt-1">
            Configure dynamic top hero banners for Default view, and Men, Women, and Unisex filter selections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white shadow-sm"
            title="Reload Data"
          >
            <RefreshCw className={`w-4 h-4 text-[#9a7229] dark:text-[#c5a059] ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-8">
        {/* 1. Page Header & Hero CMS */}
        <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
            <div className="flex items-center gap-2 text-[#9a7229] dark:text-[#c5a059]">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-serif font-bold uppercase tracking-wider">
                1. Hero Banners Customization (4 States)
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 accent-[#9a7229] dark:accent-[#c5a059] rounded cursor-pointer"
              />
              <span className="font-semibold text-stone-800 dark:text-zinc-200">
                Enable "Our Collection" Page
              </span>
            </label>
          </div>

          {/* Banner Tabs */}
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
                      src={bannerData?.imageUrl || config.heroBannerUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                      alt={tab.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent flex items-end p-1.5">
                      <span className="text-[10px] font-serif font-bold text-white truncate">
                        {bannerData?.title || tab.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Form Inputs for Current Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-7 space-y-4">
              {/* Image URL & Upload */}
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
                Live Storefront Preview ({activeTab.toUpperCase()})
              </label>

              <div className="relative w-full rounded-2xl overflow-hidden h-48 sm:h-56 lg:h-64 flex items-center bg-stone-950 border border-stone-200 dark:border-[#c5a059]/30 shadow-lg">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={currentBanner.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                    alt="Our Collection Banner Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-100 object-center"
                  />
                  <div className="absolute inset-0 bg-stone-950/15 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/25 via-transparent to-stone-950/10 pointer-events-none" />
                </div>
              </div>

              <p className="text-[11px] text-stone-500 dark:text-zinc-500 italic text-center pt-1">
                Updates are automatically displayed on Our Collection page based on selected gender filter.
              </p>
            </div>
          </div>
        </div>

        {/* 2. SEO Settings */}
        <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#9a7229] dark:text-[#c5a059] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
            <Compass className="w-5 h-5" />
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider">
              2. Search Engine Optimization (SEO Metadata)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={config.seoTitle || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, seoTitle: e.target.value }))}
                placeholder="e.g. Our Collection — Al-Mu'attar Signature Perfumes"
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                SEO Meta Description
              </label>
              <input
                type="text"
                value={config.seoDescription || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, seoDescription: e.target.value }))}
                placeholder="e.g. Explore Al-Mu'attar's proprietary house fragrances..."
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
              />
            </div>
          </div>
        </div>

        {/* 3. Assigned Products Management */}
        <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
            <div className="flex items-center gap-2 text-[#9a7229] dark:text-[#c5a059]">
              <Layers className="w-5 h-5" />
              <h3 className="text-sm font-serif font-bold uppercase tracking-wider">
                3. Fragrances Assigned to "Our Collection" ({ourCollectionProducts.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
              Change placement to "Our" or "Both"
            </span>
          </div>

          {/* Current Assigned List */}
          {ourCollectionProducts.length === 0 ? (
            <div className="p-8 bg-stone-50 dark:bg-[#0a0a0a] border border-dashed border-stone-300 dark:border-zinc-800 rounded-xl text-center space-y-2">
              <p className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                No fragrances currently assigned to Our Collection.
              </p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-500">
                Use the section below to add fragrances to this signature landing page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ourCollectionProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-white dark:bg-zinc-900 border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-[#f5f5f1] truncate">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold ${
                          p.collectionPlacement === 'both'
                            ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20'
                            : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                        }`}>
                          {p.collectionPlacement === 'both' ? 'Both' : 'Our Collection Only'}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">Rs. {p.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Switch between Our and Both */}
                    <button
                      type="button"
                      onClick={() => handleQuickPlacementChange(p.id, p.collectionPlacement === 'both' ? 'our' : 'both')}
                      className="px-2 py-1 rounded text-[10px] font-mono bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-300 dark:hover:bg-zinc-700 transition-colors"
                      title={p.collectionPlacement === 'both' ? 'Switch to Our Only' : 'Switch to Both'}
                    >
                      {p.collectionPlacement === 'both' ? 'Make Our Only' : 'Make Both'}
                    </button>

                    {/* Remove from Our Collection (sets to shop) */}
                    <button
                      type="button"
                      onClick={() => handleQuickPlacementChange(p.id, 'shop')}
                      className="p-1.5 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                      title="Remove from Our Collection (Move to Shop Only)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add More Fragrances from Catalog */}
          <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-stone-800 dark:text-zinc-200">
                Add Fragrances From Catalog ({shopOnlyProducts.length} available)
              </h4>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  placeholder="Search catalog fragrances..."
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-[#f5f5f1] pl-8 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
              {filteredShopProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover bg-stone-100 dark:bg-zinc-800 border shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-serif font-semibold text-xs text-stone-900 dark:text-[#f5f5f1] truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {p.category} • Rs. {p.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickPlacementChange(p.id, 'our')}
                      className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] hover:bg-[#9a7229]/25 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Our Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPlacementChange(p.id, 'both')}
                      className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Both</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
