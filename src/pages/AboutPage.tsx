import React, { useState, useEffect } from 'react';
import { Sparkles, Award, Compass, Droplets, Shield, Heart, Crown, Star } from 'lucide-react';
import { AboutUsPageConfig } from '../types';
import { SEO } from '../components/SEO';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

const getDefaultConfig = (name: string): AboutUsPageConfig => ({
  heroEnabled: true,
  heroBadgeText: "Haute Parfumerie Heritage",
  heroTitle: `The Art of ${name}`,
  heroSubtitle: `Rooted in Lahore, Pakistan, ${name} crafts regal oriental fragrances, pure Cambodian Oud attars, and high-sillage French Extrait compositions.`,

  storyEnabled: true,
  storyTagline: "Scent Distillation",
  storyTitle: "Centuries of Olfactory Passion",
  storyParagraph1: "In the ancient art of oriental perfumery, fragrance is not merely an accessory — it is an identity, a signature, and a silent ambassador of grace.",
  storyParagraph2: `At ${name}, we combine traditional copper pot distillation techniques with modern perfume maceration to deliver high-concentration EDPs and pure concentrated oils that last all day.`,
  storyImageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800",
  storyImageAlt: `${name} Craftsmanship`,

  pillarsEnabled: true,
  pillarsTitle: "Our Pillars of Olfactory Excellence",
  pillars: [
    {
      id: "pillar-1",
      title: "Sustainably Sourced Oud",
      description: "We partner exclusively with certified wild and plantation agarwood growers in Assam and Cambodia.",
      icon: "Award"
    },
    {
      id: "pillar-2",
      title: "Alcohol-Free Attar Oils",
      description: "Pure concentrated oils blended in traditional sandalwood bases, gentle on skin and rich in depth.",
      icon: "Droplets"
    },
    {
      id: "pillar-3",
      title: "Macerated Formulations",
      description: "Every perfume batch is aged for a minimum of 8 weeks to achieve harmonious sillage and projection.",
      icon: "Compass"
    }
  ],

  ctaEnabled: true,
  ctaButtonText: "Explore Our Fragrances",
  ctaButtonTargetTab: "shop"
});

const ABOUT_STORAGE_KEY = 'al_muattar_about_config_cache_v1';

interface AboutPageProps {
  setActiveTab: (tab: string) => void;
  configOverride?: AboutUsPageConfig;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setActiveTab, configOverride }) => {
  const { storeSettings } = useCart();
  const storeName = storeSettings?.storeName || "Al-Mu'attar";
  
  const [config, setConfig] = useState<AboutUsPageConfig | null>(() => {
    if (configOverride) return configOverride;
    if (storeSettings?.aboutUs) return storeSettings.aboutUs;
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem(ABOUT_STORAGE_KEY) : null;
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse cached about config:', e);
    }
    return null;
  });
  
  const [loading, setLoading] = useState<boolean>(!configOverride && !config);

  const formatWithStoreName = (text: string | undefined, fallback: string = ''): string => {
    if (!text) return fallback;
    return text.replace(/Al-Mu'attar|Al Mu'attar/gi, storeName);
  };

  useEffect(() => {
    if (configOverride) {
      setConfig(configOverride);
      setLoading(false);
      return;
    }

    let isMounted = true;
    apiFetch<{ success: boolean; config: AboutUsPageConfig }>('/api/about')
      .then((res) => {
        if (isMounted && res.success && res.config) {
          setConfig(res.config);
          try {
            localStorage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(res.config));
          } catch (e) {}
        } else if (isMounted && !config) {
          setConfig(getDefaultConfig(storeName));
        }
      })
      .catch((err) => {
        console.warn('Failed to load dynamic About Us config, using fallback:', err);
        if (isMounted && !config) {
          setConfig(getDefaultConfig(storeName));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [configOverride, storeName]);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Award': return <Award className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
      case 'Droplets': return <Droplets className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
      case 'Compass': return <Compass className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
      case 'Sparkles': return <Sparkles className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
      case 'Shield': return <Shield className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
      case 'Heart': return <Heart className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
      case 'Crown': return <Crown className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
      case 'Star': return <Star className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
      default: return <Sparkles className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />;
    }
  };

  if (loading || !config) {
    return (
      <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] min-h-screen py-12 px-4 max-w-5xl mx-auto space-y-12 animate-pulse">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="h-6 w-48 bg-stone-200 dark:bg-[#1a1a1a] rounded-full mx-auto" />
          <div className="h-10 w-3/4 bg-stone-200 dark:bg-[#1a1a1a] rounded-xl mx-auto" />
          <div className="h-12 w-full bg-stone-200 dark:bg-[#1a1a1a] rounded-xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="aspect-4/3 rounded-2xl bg-stone-200 dark:bg-[#1a1a1a]" />
          <div className="space-y-4">
            <div className="h-4 w-32 bg-stone-200 dark:bg-[#1a1a1a] rounded" />
            <div className="h-8 w-3/4 bg-stone-200 dark:bg-[#1a1a1a] rounded" />
            <div className="h-20 w-full bg-stone-200 dark:bg-[#1a1a1a] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16 transition-colors">
      <SEO
        title={`The Art of Perfumery & Heritage | ${storeName}`}
        description={`Discover the craftsmanship, distillation heritage, and sustainably sourced Cambodian Oud behind ${storeName} Haute Parfumerie in Pakistan.`}
        canonicalPath="/about"
        ogType="article"
      />
      {/* Hero Section */}
      {config.heroEnabled && (
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          {config.heroBadgeText && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] text-xs font-mono uppercase tracking-[0.2em] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
              <span>{formatWithStoreName(config.heroBadgeText)}</span>
            </div>
          )}
          {config.heroTitle && (
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
              {formatWithStoreName(config.heroTitle, `The Art of ${storeName}`)}
            </h1>
          )}
          {config.heroSubtitle && (
            <p className="text-sm text-stone-700 dark:text-zinc-300 font-light leading-relaxed">
              {formatWithStoreName(config.heroSubtitle)}
            </p>
          )}
        </div>
      )}

      {/* Brand Ethos / Story Grid */}
      {config.storyEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-stone-200 dark:border-[#c5a059]/20 shadow-xl dark:shadow-2xl bg-white dark:bg-[#141414]">
            <img
              src={config.storyImageUrl || "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800"}
              alt={formatWithStoreName(config.storyImageAlt, `${storeName} Craftsmanship`)}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4">
            {config.storyTagline && (
              <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] font-semibold uppercase tracking-widest block">
                {formatWithStoreName(config.storyTagline)}
              </span>
            )}
            {config.storyTitle && (
              <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                {formatWithStoreName(config.storyTitle)}
              </h2>
            )}
            {config.storyParagraph1 && (
              <p className="text-xs text-stone-700 dark:text-zinc-300 font-light leading-relaxed">
                {formatWithStoreName(config.storyParagraph1)}
              </p>
            )}
            {config.storyParagraph2 && (
              <p className="text-xs text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
                {formatWithStoreName(config.storyParagraph2)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pillars / Values Section */}
      {config.pillarsEnabled && config.pillars && config.pillars.length > 0 && (
        <div className="space-y-6 pt-2">
          {config.pillarsTitle && (
            <div className="text-center">
              <h3 className="text-xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                {formatWithStoreName(config.pillarsTitle)}
              </h3>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {config.pillars.map((pillar) => (
              <div key={pillar.id} className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-3 shadow-md dark:shadow-lg transition-transform hover:-translate-y-1 duration-200">
                {renderIcon(pillar.icon)}
                <h4 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">{formatWithStoreName(pillar.title)}</h4>
                <p className="text-xs text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
                  {formatWithStoreName(pillar.description)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call To Action */}
      {config.ctaEnabled && (
        <div className="text-center pt-8 border-t border-stone-200 dark:border-[#c5a059]/20">
          <button
            onClick={() => setActiveTab(config.ctaButtonTargetTab || 'shop')}
            className="px-8 py-3.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-widest hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {formatWithStoreName(config.ctaButtonText, "Explore Our Fragrances")}
          </button>
        </div>
      )}
    </div>
  );
};
