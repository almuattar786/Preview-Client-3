import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  ImageIcon,
  Award,
  Droplets,
  Compass,
  Shield,
  Heart,
  Crown,
  Star,
  ExternalLink
} from 'lucide-react';
import { AboutUsPageConfig, AboutUsPillar } from '../../types';
import { apiFetch } from '../../lib/api';
import { AboutPage } from '../AboutPage';
import { useCart } from '../../context/CartContext';

interface AdminAboutPageProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onGoToStore?: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'Award', label: 'Award Ribbon', Icon: Award },
  { id: 'Droplets', label: 'Droplets / Oil', Icon: Droplets },
  { id: 'Compass', label: 'Compass', Icon: Compass },
  { id: 'Sparkles', label: 'Sparkles', Icon: Sparkles },
  { id: 'Shield', label: 'Shield', Icon: Shield },
  { id: 'Heart', label: 'Heart', Icon: Heart },
  { id: 'Crown', label: 'Crown', Icon: Crown },
  { id: 'Star', label: 'Star', Icon: Star }
];

export const AdminAboutPage: React.FC<AdminAboutPageProps> = ({
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {},
  onGoToStore
}) => {
  const { storeSettings } = useCart();
  const currentStoreName = storeSettings?.storeName || "Al-Mu'attar";
  const [config, setConfig] = useState<AboutUsPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Form states
  const [heroEnabled, setHeroEnabled] = useState(true);
  const [heroBadgeText, setHeroBadgeText] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');

  const [storyEnabled, setStoryEnabled] = useState(true);
  const [storyTagline, setStoryTagline] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [storyParagraph1, setStoryParagraph1] = useState('');
  const [storyParagraph2, setStoryParagraph2] = useState('');
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [storyImageAlt, setStoryImageAlt] = useState('');

  const [pillarsEnabled, setPillarsEnabled] = useState(true);
  const [pillarsTitle, setPillarsTitle] = useState('');
  const [pillars, setPillars] = useState<AboutUsPillar[]>([]);

  const [ctaEnabled, setCtaEnabled] = useState(true);
  const [ctaButtonText, setCtaButtonText] = useState('');
  const [ctaButtonTargetTab, setCtaButtonTargetTab] = useState('shop');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; config: AboutUsPageConfig }>('/api/admin/about');
      if (res.success && res.config) {
        populateForm(res.config);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load About Us page config.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (cfg: AboutUsPageConfig) => {
    setConfig(cfg);
    setHeroEnabled(cfg.heroEnabled);
    setHeroBadgeText(cfg.heroBadgeText || '');
    setHeroTitle(cfg.heroTitle || '');
    setHeroSubtitle(cfg.heroSubtitle || '');

    setStoryEnabled(cfg.storyEnabled);
    setStoryTagline(cfg.storyTagline || '');
    setStoryTitle(cfg.storyTitle || '');
    setStoryParagraph1(cfg.storyParagraph1 || '');
    setStoryParagraph2(cfg.storyParagraph2 || '');
    setStoryImageUrl(cfg.storyImageUrl || '');
    setStoryImageAlt(cfg.storyImageAlt || '');

    setPillarsEnabled(cfg.pillarsEnabled);
    setPillarsTitle(cfg.pillarsTitle || '');
    setPillars(cfg.pillars ? [...cfg.pillars] : []);

    setCtaEnabled(cfg.ctaEnabled);
    setCtaButtonText(cfg.ctaButtonText || '');
    setCtaButtonTargetTab(cfg.ctaButtonTargetTab || 'shop');
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Assemble currently edited config object for live preview
  const currentFormConfig: AboutUsPageConfig = {
    heroEnabled,
    heroBadgeText,
    heroTitle,
    heroSubtitle,
    storyEnabled,
    storyTagline,
    storyTitle,
    storyParagraph1,
    storyParagraph2,
    storyImageUrl,
    storyImageAlt,
    pillarsEnabled,
    pillarsTitle,
    pillars,
    ctaEnabled,
    ctaButtonText,
    ctaButtonTargetTab
  };

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
      setStoryImageUrl(data.url);
      onShowToast('Image uploaded successfully.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Unable to upload image. Please try again.', 'error');
    }
  };

  const handleAddPillar = () => {
    const newPillar: AboutUsPillar = {
      id: `pillar-${Date.now()}`,
      title: 'New Value / Pillar',
      description: 'Describe your brand value or craftsmanship promise here.',
      icon: 'Award'
    };
    setPillars([...pillars, newPillar]);
  };

  const handleUpdatePillar = (id: string, field: keyof AboutUsPillar, value: string) => {
    setPillars(pillars.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleRemovePillar = (id: string) => {
    setPillars(pillars.filter(p => p.id !== id));
  };

  const handleMovePillar = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pillars.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...pillars];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setPillars(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: AboutUsPageConfig = currentFormConfig;
      const res = await apiFetch<{ success: boolean; message: string; config: AboutUsPageConfig }>('/api/admin/about', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        onShowToast(res.message || 'About Us page content updated successfully.', 'success');
        if (res.config) {
          populateForm(res.config);
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save About Us configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 bg-[#f8f6f0] dark:bg-[#0a0a0a] p-4 rounded-2xl animate-pulse">
        <div className="h-8 w-64 bg-stone-200 dark:bg-[#1a1a1a] rounded-lg" />
        <div className="h-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-stone-200 dark:border-[#c5a059]/10" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-1 sm:p-2">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#c5a059]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">Website Content</span>
            <span className="text-stone-400">•</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Published Page (/about)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] flex items-center gap-3">
            <FileText className="w-7 h-7 text-[#9a7229] dark:text-[#c5a059]" />
            About Us CMS Management
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Editor / Live Preview Tabs */}
          <div className="flex bg-stone-200/70 dark:bg-[#1a1a1a] p-1 rounded-xl border border-stone-300 dark:border-[#c5a059]/20">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-[#262626] text-[#9a7229] dark:text-[#c5a059] shadow-sm'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              CMS Controls
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-[#262626] text-[#9a7229] dark:text-[#c5a059] shadow-sm'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchConfig}
            disabled={saving}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white shadow-sm"
            title="Reset Unsaved Changes"
          >
            <RefreshCw className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        /* Live Preview Mode */
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono">
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Viewing Live Interactive Preview with your current edits.
            </span>
            <button
              onClick={() => setActiveTab('editor')}
              className="font-bold underline uppercase tracking-wider hover:text-stone-900 dark:hover:text-white"
            >
              Back to Controls
            </button>
          </div>
          <div className="border border-stone-300 dark:border-[#c5a059]/30 rounded-2xl overflow-hidden bg-[#f8f6f0] dark:bg-[#0a0a0a] shadow-inner p-4">
            <AboutPage setActiveTab={() => {}} configOverride={currentFormConfig} />
          </div>
        </div>
      ) : (
        /* CMS Editor Mode */
        <form onSubmit={handleSave} className="space-y-8">
          {/* Quick Visibility Overview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 shadow-sm space-y-4">
            <h3 className="text-sm font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Section Visibility Controls
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={heroEnabled}
                  onChange={(e) => setHeroEnabled(e.target.checked)}
                  className="rounded border-stone-300 text-[#9a7229] focus:ring-[#9a7229]"
                />
                <span className="text-xs font-semibold">Hero Section</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={storyEnabled}
                  onChange={(e) => setStoryEnabled(e.target.checked)}
                  className="rounded border-stone-300 text-[#9a7229] focus:ring-[#9a7229]"
                />
                <span className="text-xs font-semibold">Our Story</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pillarsEnabled}
                  onChange={(e) => setPillarsEnabled(e.target.checked)}
                  className="rounded border-stone-300 text-[#9a7229] focus:ring-[#9a7229]"
                />
                <span className="text-xs font-semibold">Pillars of Excellence</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ctaEnabled}
                  onChange={(e) => setCtaEnabled(e.target.checked)}
                  className="rounded border-stone-300 text-[#9a7229] focus:ring-[#9a7229]"
                />
                <span className="text-xs font-semibold">Call To Action</span>
              </label>
            </div>
          </div>

          {/* 1. HERO SECTION */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/10 pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">1. Hero Section</h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">Manage the main header title, heritage badge, and introduction description.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-zinc-300">
                <span>{heroEnabled ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-stone-400" />}</span>
                <span>{heroEnabled ? 'Enabled' : 'Disabled'}</span>
                <input
                  type="checkbox"
                  checked={heroEnabled}
                  onChange={(e) => setHeroEnabled(e.target.checked)}
                  className="sr-only"
                />
              </label>
            </div>

            {heroEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                    Heritage Badge Text
                  </label>
                  <input
                    type="text"
                    value={heroBadgeText}
                    onChange={(e) => setHeroBadgeText(e.target.value)}
                    placeholder="e.g. Haute Parfumerie Heritage"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                    Hero Main Heading Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder={`e.g. The Art of ${currentStoreName}`}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-sm font-serif font-bold text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                    Hero Subtitle / Introductory Statement
                  </label>
                  <textarea
                    rows={3}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    placeholder={`e.g. Rooted in Lahore, Pakistan, ${currentStoreName} crafts regal oriental fragrances...`}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. OUR STORY / BRAND ETHOS SECTION */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/10 pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">2. Brand Story & Craftsmanship</h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">Manage the distillation story paragraphs, featured imagery, and accessible alt text.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-zinc-300">
                <span>{storyEnabled ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-stone-400" />}</span>
                <span>{storyEnabled ? 'Enabled' : 'Disabled'}</span>
                <input
                  type="checkbox"
                  checked={storyEnabled}
                  onChange={(e) => setStoryEnabled(e.target.checked)}
                  className="sr-only"
                />
              </label>
            </div>

            {storyEnabled && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                      Section Tagline
                    </label>
                    <input
                      type="text"
                      value={storyTagline}
                      onChange={(e) => setStoryTagline(e.target.value)}
                      placeholder="e.g. Scent Distillation"
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                      Story Heading
                    </label>
                    <input
                      type="text"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder="e.g. Centuries of Olfactory Passion"
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                    First Paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={storyParagraph1}
                    onChange={(e) => setStoryParagraph1(e.target.value)}
                    placeholder="In the ancient art of oriental perfumery..."
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                    Second Paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={storyParagraph2}
                    onChange={(e) => setStoryParagraph2(e.target.value)}
                    placeholder={`At ${currentStoreName}, we combine traditional copper pot distillation...`}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                  />
                </div>

                {/* Image Upload & Management */}
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 space-y-4">
                  <h4 className="text-xs font-mono uppercase text-[#9a7229] dark:text-[#c5a059] font-bold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Story Featured Image
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-1 aspect-4/3 rounded-xl border border-stone-300 dark:border-[#c5a059]/30 overflow-hidden bg-white dark:bg-[#1a1a1a] relative group">
                      {storyImageUrl ? (
                        <img
                          src={storyImageUrl}
                          alt={storyImageAlt || 'Preview'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs p-4 text-center">
                          <ImageIcon className="w-8 h-8 mb-2 stroke-1" />
                          <span>No Image Configured</span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <label className="block text-[11px] font-mono text-stone-500 dark:text-zinc-400 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={storyImageUrl}
                          onChange={(e) => setStoryImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="px-4 py-2 rounded-lg bg-stone-200 dark:bg-[#262626] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-200 hover:text-[#9a7229] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Local File</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                        </label>
                        <span className="text-[11px] text-stone-500 dark:text-zinc-500">JPG, PNG, WebP up to 5MB</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-stone-500 dark:text-zinc-400 mb-1">
                          Image Alt Text (Accessibility & SEO) *
                        </label>
                        <input
                          type="text"
                          value={storyImageAlt}
                          onChange={(e) => setStoryImageAlt(e.target.value)}
                          placeholder={`e.g. ${currentStoreName} Craftsmanship and Distillation`}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. PILLARS / VALUES SECTION */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/10 pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">3. Pillars of Olfactory Excellence</h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">Manage brand pillars, icon representations, and value statements.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-zinc-300">
                <span>{pillarsEnabled ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-stone-400" />}</span>
                <span>{pillarsEnabled ? 'Enabled' : 'Disabled'}</span>
                <input
                  type="checkbox"
                  checked={pillarsEnabled}
                  onChange={(e) => setPillarsEnabled(e.target.checked)}
                  className="sr-only"
                />
              </label>
            </div>

            {pillarsEnabled && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                    Pillars Section Title
                  </label>
                  <input
                    type="text"
                    value={pillarsTitle}
                    onChange={(e) => setPillarsTitle(e.target.value)}
                    placeholder="e.g. Our Pillars of Olfactory Excellence"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase font-bold">
                      Configured Pillars ({pillars.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPillar}
                      className="px-3 py-1.5 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] text-xs font-semibold hover:bg-[#9a7229]/20 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Pillar</span>
                    </button>
                  </div>

                  {pillars.map((pillar, idx) => (
                    <div key={pillar.id} className="p-4 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 space-y-3 relative">
                      <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/10 pb-2">
                        <span className="text-xs font-mono font-bold text-stone-700 dark:text-zinc-300">
                          Pillar #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMovePillar(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded text-stone-500 hover:text-stone-900 dark:hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePillar(idx, 'down')}
                            disabled={idx === pillars.length - 1}
                            className="p-1 rounded text-stone-500 hover:text-stone-900 dark:hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePillar(pillar.id)}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 transition-colors"
                            title="Remove Pillar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-mono text-stone-500 dark:text-zinc-400 mb-1">
                            Pillar Title
                          </label>
                          <input
                            type="text"
                            value={pillar.title}
                            onChange={(e) => handleUpdatePillar(pillar.id, 'title', e.target.value)}
                            placeholder="Title..."
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-semibold text-stone-900 dark:text-[#f5f5f1]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-stone-500 dark:text-zinc-400 mb-1">
                            Icon Representation
                          </label>
                          <select
                            value={pillar.icon}
                            onChange={(e) => handleUpdatePillar(pillar.id, 'icon', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-xs text-stone-900 dark:text-[#f5f5f1]"
                          >
                            {AVAILABLE_ICONS.map(iconOpt => (
                              <option key={iconOpt.id} value={iconOpt.id}>
                                {iconOpt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-stone-500 dark:text-zinc-400 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={pillar.description}
                          onChange={(e) => handleUpdatePillar(pillar.id, 'description', e.target.value)}
                          placeholder="Description..."
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-xs text-stone-900 dark:text-[#f5f5f1]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. CALL TO ACTION SECTION */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/10 pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">4. Call To Action (CTA)</h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">Manage bottom action button text and destination navigation tab.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-zinc-300">
                <span>{ctaEnabled ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-stone-400" />}</span>
                <span>{ctaEnabled ? 'Enabled' : 'Disabled'}</span>
                <input
                  type="checkbox"
                  checked={ctaEnabled}
                  onChange={(e) => setCtaEnabled(e.target.checked)}
                  className="sr-only"
                />
              </label>
            </div>

            {ctaEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                    Button Label Text
                  </label>
                  <input
                    type="text"
                    value={ctaButtonText}
                    onChange={(e) => setCtaButtonText(e.target.value)}
                    placeholder="e.g. Explore Our Fragrances"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 dark:text-zinc-400 mb-1">
                    Destination Tab / Route
                  </label>
                  <select
                    value={ctaButtonTargetTab}
                    onChange={(e) => setCtaButtonTargetTab(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-xs font-sans text-stone-900 dark:text-[#f5f5f1] focus:ring-2 focus:ring-[#9a7229]"
                  >
                    <option value="shop">Shop Catalog (shop)</option>
                    <option value="categories">Fragrance Categories (categories)</option>
                    <option value="contact">Contact Concierge (contact)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-[#c5a059]/20">
            <span className="text-xs text-stone-500 dark:text-zinc-400 font-mono">
              Changes apply instantly to the customer-facing /about page upon saving.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchConfig}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white text-xs font-semibold"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
