import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  RefreshCw,
  Eye,
  Star,
  Grid,
  Layers,
  ChevronRight,
  ExternalLink,
  Award,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  Compass,
  UploadCloud
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { apiFetch } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { SingleImageUploadField } from '../../components/admin/SingleImageUploadField';

interface AdminHomePageCMSProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onGoToStore?: () => void;
  onNavigateTab?: (tab: string) => void;
}

type SectionTab = 'all' | 'hero' | 'bestsellers' | 'collections' | 'featured' | 'categories' | 'promise';

export const AdminHomePageCMS: React.FC<AdminHomePageCMSProps> = ({
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {},
  onGoToStore,
  onNavigateTab = (_tab: string) => {}
}) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SectionTab>('all');

  // Form states - Hero Section
  const [heroImageUrl, setHeroImageUrl] = useState(
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1920'
  );
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const handleHeroImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 5 MB validation
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onShowToast('Image size must be 5 MB or less.', 'error');
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
      return;
    }

    // MIME and extension verification
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExts.includes(fileExt)) {
      onShowToast('Please select a valid JPG, PNG, WEBP, GIF, or AVIF image.', 'error');
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
      return;
    }

    setIsUploadingHero(true);
    try {
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

      setHeroImageUrl(data.url);
      onShowToast('Hero background image uploaded successfully!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Hero image upload failed.', 'error');
    } finally {
      setIsUploadingHero(false);
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
    }
  };

  const [heroBadgeText, setHeroBadgeText] = useState('The Essence Of Elegance');
  const [heroHeadingLine1, setHeroHeadingLine1] = useState('Discover Your');
  const [heroHeadingGradient, setHeroHeadingGradient] = useState('Signature Scent');
  const [heroDescription, setHeroDescription] = useState(
    "Crafted with royal Cambodian Oud, Taif roses, and aged baltic amber. Experience unmatched projection and regal sillage by Al-Mu'attar."
  );
  const [announcementBarText, setAnnouncementBarText] = useState(
    'Free Express Shipping Across Pakistan On All Orders | Cash on Delivery Available'
  );

  // Form states - Collections Section (Men, Women, Unisex)
  const [collectionsEnabled, setCollectionsEnabled] = useState(true);
  const [collectionsSectionTitle, setCollectionsSectionTitle] = useState('COLLECTIONS');
  const [collectionsSectionSubtitle, setCollectionsSectionSubtitle] = useState(
    'Curated by Essence & Silhouette'
  );
  const [menImage, setMenImage] = useState(
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200'
  );
  const [womenImage, setWomenImage] = useState(
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1200'
  );
  const [unisexImage, setUnisexImage] = useState(
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200'
  );
  const [menTitle, setMenTitle] = useState('MEN');
  const [womenTitle, setWomenTitle] = useState('Women');
  const [unisexTitle, setUnisexTitle] = useState('Unisex');
  const [menSubtitle, setMenSubtitle] = useState('Collection');
  const [womenSubtitle, setWomenSubtitle] = useState('Collection');
  const [unisexSubtitle, setUnisexSubtitle] = useState('Collection');
  const [menCtaText, setMenCtaText] = useState('Explore now');
  const [womenCtaText, setWomenCtaText] = useState('Explore now');
  const [unisexCtaText, setUnisexCtaText] = useState('Explore now');

  // Form states - Categories Section
  const [homepageCategoriesCount, setHomepageCategoriesCount] = useState(6);

  // Form states - Brand Promise & Quality Section
  const [promiseStatement, setPromiseStatement] = useState(
    'We source raw ingredients directly from sustainable distillers in Assam, Cambodia, Grasse, and Taif. Every bottle undergoes batch testing for pure olfactory excellence.'
  );

  const { refreshSettings } = useCart();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; settings: StoreSettings }>('/api/settings');
      if (res.success && res.settings) {
        const s = res.settings;
        setSettings(s);
        if (s.heroImageUrl !== undefined) setHeroImageUrl(s.heroImageUrl);
        if (s.heroBadgeText !== undefined) setHeroBadgeText(s.heroBadgeText);
        if (s.heroHeadingLine1 !== undefined) setHeroHeadingLine1(s.heroHeadingLine1);
        if (s.heroHeadingGradient !== undefined) setHeroHeadingGradient(s.heroHeadingGradient);
        if (s.heroDescription !== undefined) setHeroDescription(s.heroDescription);
        if (s.promiseStatement !== undefined) setPromiseStatement(s.promiseStatement);
        if (s.announcementBarText !== undefined) setAnnouncementBarText(s.announcementBarText);
        if (s.homepageCategoriesCount !== undefined) setHomepageCategoriesCount(s.homepageCategoriesCount);

        if (s.collections) {
          if (s.collections.enabled !== undefined) setCollectionsEnabled(s.collections.enabled);
          if (s.collections.sectionTitle !== undefined) setCollectionsSectionTitle(s.collections.sectionTitle);
          if (s.collections.sectionSubtitle !== undefined) setCollectionsSectionSubtitle(s.collections.sectionSubtitle);
          if (s.collections.menImage !== undefined) setMenImage(s.collections.menImage);
          if (s.collections.womenImage !== undefined) setWomenImage(s.collections.womenImage);
          if (s.collections.unisexImage !== undefined) setUnisexImage(s.collections.unisexImage);
          if (s.collections.menTitle !== undefined) setMenTitle(s.collections.menTitle);
          if (s.collections.womenTitle !== undefined) setWomenTitle(s.collections.womenTitle);
          if (s.collections.unisexTitle !== undefined) setUnisexTitle(s.collections.unisexTitle);
          if (s.collections.menSubtitle !== undefined) setMenSubtitle(s.collections.menSubtitle);
          if (s.collections.womenSubtitle !== undefined) setWomenSubtitle(s.collections.womenSubtitle);
          if (s.collections.unisexSubtitle !== undefined) setUnisexSubtitle(s.collections.unisexSubtitle);
          if (s.collections.menCtaText !== undefined) setMenCtaText(s.collections.menCtaText);
          if (s.collections.womenCtaText !== undefined) setWomenCtaText(s.collections.womenCtaText);
          if (s.collections.unisexCtaText !== undefined) setUnisexCtaText(s.collections.unisexCtaText);
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load homepage CMS settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHomepage = async (sectionName = 'Homepage content') => {
    setSaving(true);
    try {
      const payload: Partial<StoreSettings> = {
        heroImageUrl,
        heroBadgeText,
        heroHeadingLine1,
        heroHeadingGradient,
        heroDescription,
        promiseStatement,
        announcementBarText,
        homepageCategoriesCount: Number(homepageCategoriesCount),
        collections: {
          enabled: collectionsEnabled,
          sectionTitle: collectionsSectionTitle,
          sectionSubtitle: collectionsSectionSubtitle,
          menImage,
          womenImage,
          unisexImage,
          menTitle,
          womenTitle,
          unisexTitle,
          menSubtitle,
          womenSubtitle,
          unisexSubtitle,
          menCtaText,
          womenCtaText,
          unisexCtaText
        }
      };

      const res = await apiFetch<{ success: boolean; message: string }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        await refreshSettings();
        onShowToast(`${sectionName} updated successfully!`, 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save homepage CMS.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1]">
        <RefreshCw className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059] animate-spin mx-auto" />
        <p className="text-xs font-mono text-stone-600 dark:text-zinc-400">Loading Homepage CMS...</p>
      </div>
    );
  }

  const subSections = [
    { id: 'all' as SectionTab, label: 'All Homepage Sections' },
    { id: 'hero' as SectionTab, label: '1. Hero & Banner' },
    { id: 'bestsellers' as SectionTab, label: '2. Best Sellers Showcase' },
    { id: 'collections' as SectionTab, label: '3. Collections (Men, Women, Unisex)' },
    { id: 'featured' as SectionTab, label: '4. Featured Fragrances' },
    { id: 'categories' as SectionTab, label: '5. Categories & Collections' },
    { id: 'promise' as SectionTab, label: '6. Brand Promise & Heritage' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen transition-colors p-4 sm:p-6 md:p-8 pb-20">
      {/* Header Bar */}
      <div className="border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em] font-semibold">
              Content Management System
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Homepage CMS
          </h1>
          <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">
            Manage and customize all customer-facing sections on the store homepage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onGoToStore && (
            <button
              onClick={onGoToStore}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-200 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
              <span>Preview Homepage</span>
            </button>
          )}

          <button
            onClick={() => handleSaveHomepage('All homepage sections')}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Homepage'}</span>
          </button>
        </div>
      </div>

      {/* Section Tab Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#9a7229]/15 dark:border-[#c5a059]/15 text-xs no-scrollbar">
        {subSections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSubTab(s.id)}
            className={`px-3.5 py-2 rounded-xl font-medium tracking-wide whitespace-nowrap transition-all ${
              activeSubTab === s.id
                ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] shadow-sm font-semibold'
                : 'bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/15 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-[#f5f5f1]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content Management Cards */}
      <div className="space-y-8">
        {/* =================================================================== */}
        {/* 1. HERO & BANNER SECTION */}
        {/* =================================================================== */}
        {(activeSubTab === 'all' || activeSubTab === 'hero') && (
          <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                    Hero & Main Banner
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Controls the primary welcoming viewport, background atmosphere, headline typography, and ticker.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveHomepage('Hero & Banner section')}
                disabled={saving}
                className="self-end sm:self-auto px-4 py-1.5 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/15 hover:bg-[#9a7229]/20 text-[#9a7229] dark:text-[#c5a059] text-xs font-semibold uppercase tracking-wider transition-all border border-[#9a7229]/30 dark:border-[#c5a059]/30"
              >
                Save Hero Section
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Background Image URL with Live Thumbnail */}
              <div className="space-y-3 bg-stone-50 dark:bg-[#0a0a0a] p-4 rounded-xl border border-stone-200 dark:border-[#c5a059]/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider block">
                    Hero Background Image URL
                  </label>
                  <span className="text-[10px] text-stone-500 dark:text-zinc-400">
                    Recommended: 1920x1080 landscape format (Max 5 MB)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or /api/images/..."
                      className="w-full bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] font-mono text-[11px] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                    />
                  </div>

                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={handleHeroImageFileSelect}
                  />

                  <button
                    type="button"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={isUploadingHero}
                    className="px-4 py-3 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:bg-[#7a581d] dark:hover:bg-[#d4af37] text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50"
                  >
                    {isUploadingHero ? (
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
                  <div className="w-32 h-16 rounded-lg overflow-hidden bg-stone-100 dark:bg-[#1a1a1a] border border-[#9a7229]/40 dark:border-[#c5a059]/40 shrink-0">
                    <img
                      src={heroImageUrl && heroImageUrl.trim() ? heroImageUrl.trim() : 'https://via.placeholder.com/300x150?text=Invalid+Image+URL'}
                      alt="Hero Background Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150?text=Invalid+Image+URL';
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-stone-600 dark:text-zinc-400 space-y-1">
                    <div className="text-[#9a7229] dark:text-[#c5a059] font-medium">Hero Landscape Preview</div>
                    <div>High-resolution perfume atmosphere displayed across desktop and mobile screens.</div>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    Hero Badge / Subtitle Statement
                  </label>
                  <input
                    type="text"
                    value={heroBadgeText}
                    onChange={(e) => setHeroBadgeText(e.target.value)}
                    placeholder="e.g. The Essence Of Elegance"
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  />
                  <p className="text-[10px] text-stone-500 dark:text-zinc-500">Pill badge shown with sparkle icon above the main title.</p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    Hero Main Headline (Line 1)
                  </label>
                  <input
                    type="text"
                    value={heroHeadingLine1}
                    onChange={(e) => setHeroHeadingLine1(e.target.value)}
                    placeholder="e.g. Discover Your"
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    Hero Headline Highlight (Golden Gradient Words)
                  </label>
                  <input
                    type="text"
                    value={heroHeadingGradient}
                    onChange={(e) => setHeroHeadingGradient(e.target.value)}
                    placeholder="e.g. Signature Scent"
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  />
                  <p className="text-[10px] text-stone-500 dark:text-zinc-500">Styled with luxury golden metallic gradient typography.</p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    Hero Description Statement
                  </label>
                  <textarea
                    rows={3}
                    value={heroDescription}
                    onChange={(e) => setHeroDescription(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] leading-relaxed"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    Top Announcement Bar Ticker Text
                  </label>
                  <input
                    type="text"
                    value={announcementBarText}
                    onChange={(e) => setAnnouncementBarText(e.target.value)}
                    placeholder="e.g. Free Express Shipping Across Pakistan On All Orders | Cash on Delivery Available"
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* 2. BEST SELLERS SHOWCASE */}
        {/* =================================================================== */}
        {(activeSubTab === 'all' || activeSubTab === 'bestsellers') && (
          <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                    Best Sellers Showcase Section
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Controls the prominent Best Sellers showcase carousel and grid on the homepage.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('admin-bestsellers')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-sm"
              >
                <span>Open Best Sellers Manager</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-stone-900 dark:text-[#f5f5f1] flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] fill-[#9a7229] dark:fill-[#c5a059]" />
                  <span>Configured Display: {settings?.bestsellers?.displayLimit || 8} Fragrances</span>
                </div>
                <p className="text-stone-600 dark:text-zinc-400 text-[11px] leading-relaxed max-w-xl">
                  Adjust display limits, ranking algorithms (Automatic order-based, Manual fragrance selection, or Hybrid), and customize badge titles in the dedicated Best Sellers control center.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('admin-bestsellers')}
                className="px-4 py-2 rounded-lg bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] font-semibold text-xs whitespace-nowrap hover:border-[#9a7229] dark:hover:border-[#c5a059] transition-all"
              >
                Manage Showcase ({settings?.bestsellers?.displayMode || (settings?.bestsellers as any)?.mode || 'automatic'} mode)
              </button>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* 3. COLLECTIONS PREVIEW SECTION (MEN, WOMEN, UNISEX) */}
        {/* =================================================================== */}
        {(activeSubTab === 'all' || activeSubTab === 'collections') && (
          <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                    Homepage Collections Preview (Men, Women, Unisex)
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Controls the 3-card collection banner below Best Sellers on the homepage.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectionsEnabled}
                    onChange={(e) => setCollectionsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#9a7229] dark:accent-[#c5a059] rounded cursor-pointer"
                  />
                  <span>Section Enabled</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleSaveHomepage('Collections Preview section')}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/15 hover:bg-[#9a7229]/20 text-[#9a7229] dark:text-[#c5a059] text-xs font-semibold uppercase tracking-wider transition-all border border-[#9a7229]/30 dark:border-[#c5a059]/30"
                >
                  Save Collections
                </button>
              </div>
            </div>

            {/* Section Heading Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Section Main Title
                </label>
                <input
                  type="text"
                  value={collectionsSectionTitle}
                  onChange={(e) => setCollectionsSectionTitle(e.target.value)}
                  placeholder="e.g. COLLECTIONS"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Section Subtitle / Description
                </label>
                <input
                  type="text"
                  value={collectionsSectionSubtitle}
                  onChange={(e) => setCollectionsSectionSubtitle(e.target.value)}
                  placeholder="e.g. Curated by Essence & Silhouette"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* 3 Collection Cards Image & Content Editors */}
            <div className="space-y-6 pt-2">
              <div className="border-b border-stone-200 dark:border-[#c5a059]/15 pb-2 flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9a7229] dark:text-[#c5a059] font-bold">
                  Card 1: MEN Collection
                </span>
                <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                  Filters public catalog by: Gender = Men
                </span>
              </div>

              <SingleImageUploadField
                label="Men Collection Card Image"
                sublabel="Recommended: 1200x1600 portrait format (Max 5 MB)"
                value={menImage}
                onChange={setMenImage}
                onShowToast={onShowToast}
                defaultPlaceholder="https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">Card Title</label>
                  <input
                    type="text"
                    value={menTitle}
                    onChange={(e) => setMenTitle(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">Eyebrow / Subtitle</label>
                  <input
                    type="text"
                    value={menSubtitle}
                    onChange={(e) => setMenSubtitle(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">CTA Text</label>
                  <input
                    type="text"
                    value={menCtaText}
                    onChange={(e) => setMenCtaText(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
              </div>

              {/* CARD 2: WOMEN */}
              <div className="border-b border-stone-200 dark:border-[#c5a059]/15 pb-2 pt-4 flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9a7229] dark:text-[#c5a059] font-bold">
                  Card 2: WOMEN Collection
                </span>
                <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                  Filters public catalog by: Gender = Women
                </span>
              </div>

              <SingleImageUploadField
                label="Women Collection Card Image"
                sublabel="Recommended: 1200x1600 portrait format (Max 5 MB)"
                value={womenImage}
                onChange={setWomenImage}
                onShowToast={onShowToast}
                defaultPlaceholder="https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1200"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">Card Title</label>
                  <input
                    type="text"
                    value={womenTitle}
                    onChange={(e) => setWomenTitle(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">Eyebrow / Subtitle</label>
                  <input
                    type="text"
                    value={womenSubtitle}
                    onChange={(e) => setWomenSubtitle(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">CTA Text</label>
                  <input
                    type="text"
                    value={womenCtaText}
                    onChange={(e) => setWomenCtaText(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
              </div>

              {/* CARD 3: UNISEX */}
              <div className="border-b border-stone-200 dark:border-[#c5a059]/15 pb-2 pt-4 flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9a7229] dark:text-[#c5a059] font-bold">
                  Card 3: UNISEX Collection
                </span>
                <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                  Filters public catalog by: Gender = Unisex
                </span>
              </div>

              <SingleImageUploadField
                label="Unisex Collection Card Image"
                sublabel="Recommended: 1200x1600 portrait format (Max 5 MB)"
                value={unisexImage}
                onChange={setUnisexImage}
                onShowToast={onShowToast}
                defaultPlaceholder="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">Card Title</label>
                  <input
                    type="text"
                    value={unisexTitle}
                    onChange={(e) => setUnisexTitle(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">Eyebrow / Subtitle</label>
                  <input
                    type="text"
                    value={unisexSubtitle}
                    onChange={(e) => setUnisexSubtitle(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 uppercase">CTA Text</label>
                  <input
                    type="text"
                    value={unisexCtaText}
                    onChange={(e) => setUnisexCtaText(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-2.5 text-stone-900 dark:text-[#f5f5f1]"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* 4. FEATURED FRAGRANCES SECTION */}
        {/* =================================================================== */}
        {(activeSubTab === 'all' || activeSubTab === 'featured') && (
          <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                    Featured Fragrances Grid
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Displays curated signature perfumes on the homepage grid.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('admin-products')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] text-xs font-bold uppercase tracking-wider hover:bg-[#9a7229]/10 dark:hover:bg-[#c5a059]/20 transition-all"
              >
                <span>Products Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/15 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-stone-900 dark:text-[#f5f5f1] font-semibold">
                <Sparkles className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                <span>Feature Flag Management</span>
              </div>
              <p className="text-stone-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                To feature any fragrance in the homepage signature grid, toggle the <strong>"Feature on Homepage"</strong> switch in the product editor. Items marked as featured appear automatically with royal badges.
              </p>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* 5. CATEGORIES & COLLECTIONS SECTION */}
        {/* =================================================================== */}
        {(activeSubTab === 'all' || activeSubTab === 'categories') && (
          <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
                  5
                </div>
                <div>
                  <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                    Browse By Category Showcase
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Controls the "Browse By Category" visual cards on the homepage.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('admin-categories')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-sm"
              >
                <span>Edit Categories CMS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/15 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-stone-900 dark:text-[#f5f5f1] flex items-center gap-2">
                    <Grid className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                    <span>Homepage Category Display Limit</span>
                  </div>
                  <p className="text-stone-600 dark:text-zinc-400 text-[11px] leading-relaxed max-w-xl">
                    Choose how many categories appear in the "Browse By Category" section on the homepage.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 whitespace-nowrap">
                    Show on Homepage:
                  </label>
                  <select
                    value={homepageCategoriesCount}
                    onChange={(e) => setHomepageCategoriesCount(Number(e.target.value))}
                    className="bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#9a7229] dark:text-[#c5a059] focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Category' : 'Categories'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200 dark:border-[#c5a059]/15">
                <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Total available categories in catalog: <strong>{settings?.categories?.length || 6}</strong>
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSaveHomepage('Category display settings')}
                    disabled={saving}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Category Limit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('admin-categories')}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] font-semibold text-xs whitespace-nowrap hover:border-[#9a7229] dark:hover:border-[#c5a059] transition-all"
                  >
                    Manage Categories ({settings?.categories?.length || 6})
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* 6. BRAND PROMISE & QUALITY SECTION */}
        {/* =================================================================== */}
        {(activeSubTab === 'all' || activeSubTab === 'promise') && (
          <section className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center font-bold text-xs">
                  6
                </div>
                <div>
                  <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                    Brand Promise & Quality Commitments
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Controls the Maison Promise statement and quality commitments displayed on the homepage.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveHomepage('Brand Promise')}
                disabled={saving}
                className="self-end sm:self-auto px-4 py-1.5 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/15 hover:bg-[#9a7229]/20 text-[#9a7229] dark:text-[#c5a059] text-xs font-semibold uppercase tracking-wider transition-all border border-[#9a7229]/30 dark:border-[#c5a059]/30"
              >
                Save Brand Promise
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Maison Quality Promise Statement (Uncompromising Quality Card)
                </label>
                <textarea
                  rows={3}
                  value={promiseStatement}
                  onChange={(e) => setPromiseStatement(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] leading-relaxed"
                />
                <p className="text-[10px] text-stone-500 dark:text-zinc-500">
                  Displayed prominently under the "Why Choose Al-Mu'attar" section on the homepage.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/15 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-semibold text-stone-900 dark:text-[#f5f5f1]">Need full story & heritage customization?</div>
                  <div className="text-[11px] text-stone-500 dark:text-zinc-400">Edit the dedicated About Us page story and pillars in the About Us CMS.</div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('admin-about')}
                  className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] font-semibold text-xs whitespace-nowrap hover:border-[#9a7229] dark:hover:border-[#c5a059]"
                >
                  Open About Us CMS
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
