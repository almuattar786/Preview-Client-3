import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Award, ShieldCheck, Flame, Heart, Droplets, Star, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { BestSellers } from '../components/BestSellers';
import { CollectionsSection } from '../components/CollectionsSection';
import { CategoryIcon } from '../components/CategoryIcon';
import { SEO } from '../components/SEO';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
  onViewProductDetails: (product: Product) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedGender?: (gender: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setActiveTab,
  onViewProductDetails,
  onShowToast,
  setSelectedCategory,
  setSelectedGender
}) => {
  const { storeSettings, isLoadingSettings } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await apiFetch<{ success: boolean; products: Product[] }>('/api/products?sortBy=featured');
        if (res.success) {
          setFeaturedProducts(res.products.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleCollectionClick = (gender: 'Men' | 'Women' | 'Unisex') => {
    setSelectedCategory('All');
    if (setSelectedGender) {
      setSelectedGender(gender);
    }
    setActiveTab('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const defaultCategories = [
    {
      name: 'Perfumes',
      desc: 'High sillage Extrait & Eau de Parfum sprays',
      iconName: 'Sparkles',
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Attars',
      desc: 'Pure concentrated alcohol-free perfume oils',
      iconName: 'Droplets',
      image: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Oud',
      desc: 'Rare Cambodian & Assam Oud extracts',
      iconName: 'Flame',
      image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800'
    }
  ];

  const effectiveHeroImageUrl = storeSettings?.heroImageUrl || "/api/images/fragrance-1787583098886-c15e2217bb5653a6.jpg";

  // Preload hero image with highest priority
  useEffect(() => {
    const preloadId = 'hero-image-preload';
    let link = document.getElementById(preloadId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = preloadId;
      link.rel = 'preload';
      link.as = 'image';
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    }
    link.href = effectiveHeroImageUrl;
  }, [effectiveHeroImageUrl]);

  const rawCategories = (
    storeSettings?.categories && storeSettings.categories.length > 0
      ? storeSettings.categories.map((c) => ({
          name: c.name,
          desc: c.description || 'Curated luxury collection',
          iconName: c.iconName || 'Sparkles',
          image: c.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'
        }))
      : defaultCategories
  ).filter((c) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(c.name));

  const homepageCategoriesLimit = typeof storeSettings?.homepageCategoriesCount === 'number'
    ? storeSettings.homepageCategoriesCount
    : 6;

  const categories = homepageCategoriesLimit > 0
    ? rawCategories.slice(0, homepageCategoriesLimit)
    : rawCategories;

  const testimonials = [
    {
      name: 'Dr. Tariq Mahmood',
      city: 'Islamabad',
      comment: 'Oud Al-Mu\'attar Royal is undoubtedly the finest Cambodian Oud spray in Pakistan. The sillage lasts easily 14+ hours.',
      rating: 5,
      fragrance: 'Oud Al-Mu\'attar Royal'
    },
    {
      name: 'Ayesha Siddiqui',
      city: 'Karachi',
      comment: 'The Taif Rose Attar oil is divine. 100% pure, alcohol-free and beautifully packaged. Arrived safely in Karachi.',
      rating: 5,
      fragrance: 'Taif Rose Pure Attar'
    },
    {
      name: 'Hamza Khan',
      city: 'Lahore',
      comment: 'Fast cash on delivery in Lahore! Smells identical to high-end niche fragrance houses but with twice the concentration.',
      rating: 5,
      fragrance: 'Leather & Amber Extrait'
    }
  ];

  const handleCategoryClick = (catName: string) => {
    setSelectedCategory(catName);
    setActiveTab('shop');
  };

  const storeName = storeSettings?.storeName || "Al-Mu'attar";
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://almuattar.com';

  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    'name': storeName,
    'description': "Artisanal oriental fragrances, rare Cambodian Oud, pure attars, and luxury Extraits de Parfum.",
    'url': origin,
    'logo': storeSettings?.logoUrl,
    'currenciesAccepted': 'PKR',
    'paymentAccepted': 'Cash on Delivery, Bank Transfer',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': storeSettings?.storeAddress || '104 Mall Road, Gulberg III',
      'addressLocality': 'Lahore',
      'addressCountry': 'PK'
    },
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': 'Luxury Fragrance Catalog',
      'itemListElement': categories.map((cat, idx) => ({
        '@type': 'OfferCatalog',
        'name': cat.name,
        'position': idx + 1
      }))
    }
  };

  return (
    <div className="space-y-16 sm:space-y-20 pb-16 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors duration-200">
      {/* SEO Engine */}
      <SEO
        title={`${storeName} | Luxury Oriental Perfumes & Pure Attars`}
        description={`Discover ${storeName}'s exquisite luxury fragrances. Pure Cambodian Oud, artisanal non-alcoholic attars, and high-sillage French Extrait de Parfum in Pakistan.`}
        canonicalPath="/"
        ogType="website"
        ogImage={storeSettings?.heroImageUrl || (isLoadingSettings && !storeSettings ? undefined : "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200")}
        structuredData={homeStructuredData}
      />
      {/* 1. HERO BANNER */}
      <section id="hero-banner" className="relative min-h-[56vh] sm:min-h-[66vh] lg:min-h-[82vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f1] border-b border-[#9a7229]/20 dark:border-[#c5a059]/20">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
          <img
            src={effectiveHeroImageUrl}
            alt={`${storeSettings?.storeName || "Al-Mu'attar"} Luxury Perfumes`}
            referrerPolicy="no-referrer"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-[center_35%] sm:object-center opacity-100 scale-100 lg:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/25 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/8 via-transparent to-[#0a0a0a]/8" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-6 lg:space-y-8 pt-24 sm:pt-28 lg:pt-36 pb-8 sm:pb-12 lg:pb-20">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[10.5px] sm:text-xs font-mono uppercase tracking-[0.14em] sm:tracking-[0.2em] shadow-inner max-w-[92vw] sm:max-w-full">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{storeSettings?.heroBadgeText || "The Essence Of Elegance"}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#f5f5f1] leading-[1.18]">
            {storeSettings?.heroHeadingLine1 || "Discover Your"} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e0c078] via-[#c5a059] to-[#997730]">
              {storeSettings?.heroHeadingGradient || "Signature Scent"}
            </span>
          </h1>

          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => setActiveTab('shop')}
              className="w-auto px-6 py-2.5 sm:px-10 sm:py-4 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs sm:text-sm tracking-wider uppercase hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-xl flex items-center justify-center gap-2 group"
            >
              <span>Shop Collection</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="pt-6 sm:pt-8 lg:pt-12 grid grid-cols-3 gap-4 sm:gap-6 max-w-xl mx-auto border-t border-[#c5a059]/20 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#c5a059]">100%</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-mono">Pure Oils</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#c5a059]">14+ Hrs</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-mono">Sillage Wear</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#c5a059]">COD</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-mono">All Pakistan</div>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS SECTION */}
      <BestSellers
        onViewProductDetails={onViewProductDetails}
        onViewAllProducts={() => setActiveTab('shop')}
      />

      {/* COLLECTIONS PREVIEW SECTION (MEN, WOMEN, UNISEX) */}
      <CollectionsSection
        onSelectGender={handleCollectionClick}
        collectionsConfig={storeSettings?.collections}
        isLoading={isLoadingSettings && !storeSettings}
      />

      {/* 2. FEATURED PRODUCTS COLLECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-6">
          <div className="space-y-2">
            <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">
              Handcrafted Masterpieces
            </span>
            <h2 className="text-3xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Featured Fragrances</h2>
          </div>
          <button
            onClick={() => setActiveTab('shop')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9a7229] dark:text-[#c5a059] hover:text-[#7a581d] dark:hover:text-[#d4af37] transition-colors uppercase tracking-wider"
          >
            <span>View Full Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-stone-200 dark:bg-[#1a1a1a] animate-pulse border border-stone-300 dark:border-[#c5a059]/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onViewDetails={onViewProductDetails}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. FRAGRANCE CATEGORIES GRID */}
      <section className="bg-[#f2ede2] dark:bg-[#141414] border-y border-[#9a7229]/20 dark:border-[#c5a059]/20 py-14 sm:py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-5">
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">
                Tailored Olfactory Experiences
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
                Browse By Category
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-400 font-light max-w-xl">
                From pure Cambodian Oud extracts to ethereal Taif Rose floral compositions and high-concentration Extraits.
              </p>
            </div>

            {/* Prominent Header Arrow CTA to dedicated Categories Landing Page */}
            <button
              onClick={() => {
                setActiveTab('categories');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] hover:bg-[#9a7229] hover:text-white dark:hover:bg-[#c5a059] dark:hover:text-[#0a0a0a] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm group self-start sm:self-auto shrink-0"
              aria-label="Explore all fragrance categories"
            >
              <span>Explore All Categories</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {categories.map((cat, index) => {
              const categoryUrl = `/shop?category=${encodeURIComponent(cat.name)}`;
              return (
                <a
                  key={cat.name}
                  href={categoryUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCategoryClick(cat.name);
                  }}
                  className="group relative h-64 sm:h-72 rounded-2xl overflow-hidden border border-stone-300 dark:border-[#c5a059]/20 cursor-pointer shadow-md hover:shadow-2xl hover:border-[#9a7229] dark:hover:border-[#c5a059] transition-all duration-300 bg-stone-950 flex flex-col justify-between p-4 sm:p-5 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                  aria-label={`Browse ${cat.name} fragrance collection`}
                >
                  {/* Category Image */}
                  <img
                    src={cat.image}
                    alt={`${cat.name} fragrance category`}
                    referrerPolicy="no-referrer"
                    loading={index < 3 ? 'eager' : 'lazy'}
                    fetchPriority={index < 3 ? 'auto' : 'low'}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 dark:opacity-90 group-hover:opacity-100 dark:group-hover:opacity-100"
                  />
                  {/* Atmospheric Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-stone-950/15 to-transparent group-hover:from-stone-950/55 transition-colors duration-300 pointer-events-none" />

                  {/* Top Bar: Icon */}
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-stone-900/85 backdrop-blur-md border border-[#c5a059]/40 text-[#c5a059] shadow-md group-hover:border-[#c5a059] group-hover:scale-105 transition-all">
                      <CategoryIcon iconName={cat.iconName} className="w-4.5 h-4.5" />
                    </div>
                  </div>

                  {/* Bottom Content */}
                  <div className="relative z-10 space-y-1.5 text-white">
                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-[#e0c078] transition-colors drop-shadow-md">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-stone-200/90 font-light leading-relaxed line-clamp-2">
                      {cat.desc}
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-[#c5a059]/20 text-[10.5px] font-semibold text-[#c5a059]">
                      <span className="uppercase tracking-wider">
                        Shop {cat.name}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#c5a059]/20 group-hover:bg-[#c5a059] text-[#c5a059] group-hover:text-stone-950 flex items-center justify-center transition-colors">
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Bottom Action Card linking to Categories Landing Page */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-[#9a7229]/20 dark:border-[#c5a059]/20 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
                Looking for our complete olfactory taxonomy?
              </h4>
              <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">
                Explore detailed fragrance family profiles, distillation methods, and perfume classifications.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('categories');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all flex items-center justify-center gap-2 group shadow-md shrink-0"
            >
              <span>View All Categories & Guides</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE THE MAISON */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">The Maison Promise</span>
          <h2 className="text-3xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Why Choose {storeName}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-4 hover:border-[#9a7229] dark:hover:border-[#c5a059]/50 transition-colors shadow-sm dark:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Uncompromising Quality</h3>
            <p className="text-sm text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
              {storeSettings?.promiseStatement || "We source raw ingredients directly from sustainable distillers in Assam, Cambodia, Grasse, and Taif. Every bottle undergoes batch testing for pure olfactory excellence."}
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-4 hover:border-[#9a7229] dark:hover:border-[#c5a059]/50 transition-colors shadow-sm dark:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Intense Long-Lasting Sillage</h3>
            <p className="text-sm text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
              Formulated at high perfume oil concentrations (Extrait de Parfum & Pure Attars) ensuring your presence lingers elegantly throughout the day.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-4 hover:border-[#9a7229] dark:hover:border-[#c5a059]/50 transition-colors shadow-sm dark:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Secure Cash on Delivery</h3>
            <p className="text-sm text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
              Order with confidence across Pakistan. Pay upon physical delivery at your doorstep with full tracking updates.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CUSTOMER TESTIMONIALS */}
      <section className="bg-[#f2ede2] dark:bg-[#141414] py-16 border-t border-[#9a7229]/20 dark:border-[#c5a059]/20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">Patron Reviews</span>
            <h2 className="text-3xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Words from Fragrance Enthusiasts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-4 flex flex-col justify-between shadow-sm dark:shadow-lg">
                <div className="space-y-3">
                  <div className="flex gap-1 text-[#9a7229] dark:text-[#c5a059]">
                    {[...Array(t.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-[#9a7229] dark:fill-[#c5a059] text-[#9a7229] dark:text-[#c5a059]" />
                    ))}
                  </div>
                  <p className="text-sm text-stone-700 dark:text-zinc-300 font-light italic leading-relaxed">"{t.comment}"</p>
                </div>
                <div className="pt-4 border-t border-stone-200 dark:border-[#c5a059]/15 flex justify-between items-end">
                  <div>
                    <div className="text-sm font-semibold text-stone-900 dark:text-[#f5f5f1]">{t.name}</div>
                    <div className="text-xs text-stone-500 dark:text-zinc-500">{t.city}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#9a7229] dark:text-[#c5a059] bg-[#9a7229]/10 dark:bg-[#c5a059]/10 px-2 py-0.5 rounded border border-[#9a7229]/20 dark:border-[#c5a059]/20 font-semibold">
                    {t.fragrance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
