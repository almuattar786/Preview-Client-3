import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CollectionsSectionConfig } from '../types';
import { useCart } from '../context/CartContext';

interface CollectionsSectionProps {
  onSelectGender: (gender: 'Men' | 'Women' | 'Unisex') => void;
  collectionsConfig?: CollectionsSectionConfig;
  isLoading?: boolean;
}

export const CollectionsSection: React.FC<CollectionsSectionProps> = ({
  onSelectGender,
  collectionsConfig,
  isLoading
}) => {
  const { storeSettings } = useCart();
  // If explicitly disabled in CMS, do not render
  if (collectionsConfig?.enabled === false) {
    return null;
  }

  const sectionTitle = collectionsConfig?.sectionTitle || 'Collections';
  const sectionSubtitle =
    collectionsConfig?.sectionSubtitle ||
    'Distinctive olfactory compositions tailored for Men, Women, and Unisex signatures.';

  if (isLoading && !collectionsConfig) {
    return (
      <section
        id="collections-preview-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10"
        aria-label="Fragrance Collections"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Silhouettes</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] tracking-tight">
              {sectionTitle}
            </h2>
            {sectionSubtitle && (
              <p className="text-sm text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
                {sectionSubtitle}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-[270px] sm:h-[310px] md:h-[330px] lg:h-[350px] w-full rounded-2xl bg-stone-200 dark:bg-stone-800/80 animate-pulse border border-stone-200/90 dark:border-[#c5a059]/20"
            />
          ))}
        </div>
      </section>
    );
  }

  const collectionsData: Array<{
    gender: 'Men' | 'Women' | 'Unisex';
    title: string;
    subtitle: string;
    ctaText: string;
    image: string;
    alt: string;
  }> = [
    {
      gender: 'Men',
      title: collectionsConfig?.menTitle || 'MEN',
      subtitle: collectionsConfig?.menSubtitle || 'Collection',
      ctaText: collectionsConfig?.menCtaText || 'Explore now',
      image:
        collectionsConfig?.menImage ||
        'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200',
      alt: `Men's Fragrance Collection - ${storeSettings?.storeName || 'Fragrance House'}`
    },
    {
      gender: 'Women',
      title: collectionsConfig?.womenTitle || 'Women',
      subtitle: collectionsConfig?.womenSubtitle || 'Collection',
      ctaText: collectionsConfig?.womenCtaText || 'Explore now',
      image:
        collectionsConfig?.womenImage ||
        'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1200',
      alt: `Women's Fragrance Collection - ${storeSettings?.storeName || 'Fragrance House'}`
    },
    {
      gender: 'Unisex',
      title: collectionsConfig?.unisexTitle || 'Unisex',
      subtitle: collectionsConfig?.unisexSubtitle || 'Collection',
      ctaText: collectionsConfig?.unisexCtaText || 'Explore now',
      image:
        collectionsConfig?.unisexImage ||
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200',
      alt: `Unisex Fragrance Collection - ${storeSettings?.storeName || 'Fragrance House'}`
    }
  ];

  return (
    <section
      id="collections-preview-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10"
      aria-label="Fragrance Collections"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Silhouettes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] tracking-tight">
            {sectionTitle}
          </h2>
          {sectionSubtitle && (
            <p className="text-sm text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
              {sectionSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* 3-Card Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {collectionsData.map((item) => (
          <div
            key={item.gender}
            id={`collection-card-${item.gender.toLowerCase()}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelectGender(item.gender)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectGender(item.gender);
              }
            }}
            aria-label={`Explore ${item.title} ${item.subtitle}`}
            className="group relative h-[270px] sm:h-[310px] md:h-[330px] lg:h-[350px] w-full rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 border border-stone-200/90 dark:border-[#c5a059]/20 hover:border-[#9a7229] dark:hover:border-[#c5a059] focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] flex flex-col justify-end p-4 sm:p-5 select-none bg-stone-900"
          >
            {/* Background Image with Zoom Animation */}
            <img
              src={item.image}
              alt={item.alt}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // Graceful fallback if custom image fails to load
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  target.src =
                    item.gender === 'Men'
                      ? 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200'
                      : item.gender === 'Women'
                      ? 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1200'
                      : 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200';
                }
              }}
            />

            {/* Subtle Gradient Overlays for Guaranteed Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent group-hover:from-black/55 transition-colors duration-300 pointer-events-none" />

            {/* Card Content */}
            <div className="relative z-10 space-y-1 text-white">
              {/* Subtitle / Eyebrow (e.g. Collection) */}
              <span className="text-[9.5px] sm:text-[10.5px] font-mono uppercase tracking-[0.25em] text-[#e0c078] font-medium block">
                {item.subtitle}
              </span>

              {/* Title (MEN / Women / Unisex) */}
              <h3 className="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-white tracking-tight drop-shadow-md group-hover:text-[#f3e3ba] transition-colors">
                {item.title}
              </h3>

              {/* CTA Link */}
              <div className="pt-1 flex items-center gap-2 text-[11.5px] sm:text-xs font-semibold tracking-wider text-white/95 group-hover:text-[#c5a059] transition-colors">
                <span className="border-b border-white/60 group-hover:border-[#c5a059] pb-0.5 transition-colors">
                  {item.ctaText}
                </span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform duration-300" />
              </div>
            </div>

            {/* Subtle luxury corner border accent on hover */}
            <div className="absolute top-3.5 right-3.5 w-4 h-4 border-t border-r border-white/20 group-hover:border-[#c5a059] transition-colors duration-300 rounded-tr-lg pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
};
