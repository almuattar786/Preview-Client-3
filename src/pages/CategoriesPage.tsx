import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Home,
  Tag,
  Search,
  Filter,
  Grid,
  Layers,
  Award,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { CategoryConfig, Product } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { SEO } from '../components/SEO';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface CategoriesPageProps {
  setActiveTab: (tab: string) => void;
  onSelectCategory: (categoryName: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'cat-1',
    name: 'Perfumes',
    description: 'High sillage artisanal Extrait de Parfum and Eau de Parfum compositions crafted with French and Oriental essences.',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
    badge: 'Signature',
    iconName: 'Sparkles'
  },
  {
    id: 'cat-2',
    name: 'Attars',
    description: '100% pure concentrated alcohol-free perfume oils distilled in traditional copper pots for intimate longevity.',
    image: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&q=80&w=800',
    badge: 'Pure Oil',
    iconName: 'Droplets'
  },
  {
    id: 'cat-3',
    name: 'Oud',
    description: 'Aged wild and plantation agarwood extracts from Assam and Cambodia, rich in resinous balsamic woods.',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800',
    badge: 'Rare Wood',
    iconName: 'Flame'
  }
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  setActiveTab,
  onSelectCategory,
  onShowToast
}) => {
  const { storeSettings, isLoadingSettings } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const storeName = storeSettings?.storeName || "Al-Mu'attar";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await apiFetch<{ success: boolean; products: Product[] }>('/api/products');
        if (res.success && res.products) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Failed to load products for category counts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Determine active categories: Settings categories from single source of truth, or fallback defaults
  const categories: CategoryConfig[] = useMemo(() => {
    const raw = storeSettings?.categories && storeSettings.categories.length > 0
      ? storeSettings.categories
      : DEFAULT_CATEGORIES;
    return raw.filter((c) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(c.name));
  }, [storeSettings]);

  // Calculate product counts per category
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      const matchName = cat.name.toLowerCase().trim();
      const count = products.filter(p => {
        if (!p.isActive && p.isActive !== undefined) return false;
        const mainCat = (p.category || '').toLowerCase().trim();
        const extraCats = Array.isArray(p.categories) ? p.categories.map(c => c.toLowerCase().trim()) : [];
        return mainCat === matchName || extraCats.includes(matchName);
      }).length;
      counts[cat.name] = count;
    });
    return counts;
  }, [categories, products]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.badge && c.badge.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const handleCategoryClick = (categoryName: string) => {
    onSelectCategory(categoryName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Structured Data Schema for Categories Landing Page
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://almuattar.com';
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': `${origin}/`
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Fragrance Categories',
          'item': `${origin}/categories`
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': `Fragrance Categories | ${storeName} Haute Parfumerie`,
      'description': `Discover all luxury perfume and attar categories by ${storeName}. Browse artisanal Extraits de Parfum, pure concentrated Attar oils, and royal Cambodian Oud.`,
      'url': `${origin}/categories`,
      'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': categories.map((cat, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'name': cat.name,
          'description': cat.description,
          'image': cat.image,
          'url': `${origin}/shop?category=${encodeURIComponent(cat.name)}`
        }))
      }
    }
  ];

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen pb-20 transition-colors duration-200">
      {/* SEO Engine */}
      <SEO
        title={`Shop Fragrance Categories | ${storeName} Luxury Perfumes`}
        description={`Explore all luxury fragrance categories by ${storeName}. Discover royal Cambodian Oud, artisanal non-alcoholic attars, men's, women's, and unisex perfume collections.`}
        canonicalPath="/categories"
        ogType="website"
        ogImage={categories[0]?.image || "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200"}
        structuredData={structuredData}
      />

      {/* 1. BREADCRUMBS */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2"
      >
        <ol className="flex items-center gap-2 text-xs font-mono tracking-wider text-stone-500 dark:text-zinc-400">
          <li className="inline-flex items-center">
            <button
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors uppercase"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          </li>
          <li className="flex items-center">
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-600" />
            <span className="ml-2 font-semibold text-[#9a7229] dark:text-[#c5a059] uppercase">
              Categories
            </span>
          </li>
        </ol>
      </nav>

      {/* 2. HERO INTRODUCTORY SECTION */}
      <section className="relative overflow-hidden pt-2 pb-5 sm:pt-4 sm:pb-6 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] tracking-tight">
              Shop Fragrance Categories
            </h1>

            {/* Quick Stats / Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                <span><strong>{categories.length}</strong> Olfactory Categories</span>
              </div>
              <span className="text-stone-300 dark:text-zinc-700">•</span>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                <span>100% Authentic Distillations</span>
              </div>
              <span className="text-stone-300 dark:text-zinc-700">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                <span>Free Express Shipping Across Pakistan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FILTER / SEARCH CONTROLS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shadow-sm">
          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <input
              id="categories-filter-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find category or fragrance note..."
              className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl pl-9 pr-8 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
            />
            <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-white p-0.5 text-xs"
                title="Clear filter"
                aria-label="Clear filter query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Direct Link to View All Products */}
          <div className="w-full sm:w-auto flex items-center justify-end gap-3">
            <button
              onClick={() => {
                onSelectCategory('All');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/10 hover:bg-[#9a7229]/20 dark:hover:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {loading || (isLoadingSettings && !storeSettings) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[280px] sm:h-[300px] md:h-[315px] rounded-2xl bg-stone-200 dark:bg-[#141414] animate-pulse border border-stone-300 dark:border-[#c5a059]/10"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4 max-w-md mx-auto bg-white dark:bg-[#141414] rounded-2xl border border-stone-200 dark:border-[#c5a059]/20 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#9a7229]/10 dark:bg-[#c5a059]/10 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
              No Matching Categories
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              We could not find any category matching "{searchQuery}". Try a different keyword or browse our entire collection.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-5 py-2 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-semibold uppercase tracking-wider"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredCategories.map((category, index) => {
              const productCount = productCountByCategory[category.name] ?? 0;
              const categoryUrl = `/shop?category=${encodeURIComponent(category.name)}`;

              return (
                <a
                  key={category.id || category.name}
                  href={categoryUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCategoryClick(category.name);
                  }}
                  className="group relative flex flex-col justify-between h-[280px] sm:h-[300px] md:h-[315px] rounded-2xl overflow-hidden border border-stone-300 dark:border-[#c5a059]/20 bg-stone-900 text-white shadow-md hover:shadow-2xl hover:border-[#9a7229] dark:hover:border-[#c5a059] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                  aria-label={`Explore ${category.name} fragrance collection`}
                >
                  {/* Background Category Image with Smooth Zoom */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={category.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                      alt={`${category.name} luxury fragrance collection by ${storeName}`}
                      referrerPolicy="no-referrer"
                      loading={index < 3 ? 'eager' : 'lazy'}
                      fetchPriority={index < 3 ? 'high' : 'auto'}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 dark:opacity-90 group-hover:opacity-100 dark:group-hover:opacity-100"
                    />
                    {/* Atmospheric Multi-Stage Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-stone-950/15 to-transparent group-hover:from-stone-950/55 transition-colors duration-300" />
                  </div>

                  {/* Top Bar: Icon + Badge */}
                  <div className="relative z-10 p-4 sm:p-4.5 flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-stone-950/80 backdrop-blur-md border border-[#c5a059]/40 text-[#c5a059] shadow-md group-hover:border-[#c5a059] group-hover:scale-105 transition-all">
                      <CategoryIcon iconName={category.iconName || 'Sparkles'} className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>

                    {category.badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#c5a059]/20 backdrop-blur-md border border-[#c5a059]/50 text-[#e0c078] text-[9px] font-mono uppercase tracking-widest font-semibold shadow-sm">
                        {category.badge}
                      </span>
                    )}
                  </div>

                  {/* Bottom Content: Crawlable Category Heading, Description, Counts & CTA */}
                  <div className="relative z-10 p-4 sm:p-4.5 space-y-1.5 bg-gradient-to-t from-stone-950 via-stone-950/90 to-transparent pt-5">
                    {productCount > 0 && (
                      <div className="text-[9.5px] font-mono text-[#c5a059] uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] inline-block animate-pulse" />
                        <span>{productCount} {productCount === 1 ? 'Fragrance' : 'Fragrances'} Available</span>
                      </div>
                    )}

                    {/* Semantic H2 Heading containing crawlable text */}
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-white group-hover:text-[#e0c078] transition-colors drop-shadow-md">
                      {category.name}
                    </h2>

                    {category.description && (
                      <p className="text-[11px] text-stone-200/90 font-light leading-relaxed line-clamp-2 drop-shadow">
                        {category.description}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-[#c5a059]/20 text-[10.5px] font-semibold text-[#c5a059]">
                      <span className="uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        Explore Collection
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
        )}
      </section>

      {/* 5. EDITORIAL OLFACTORY GUIDE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">
              The {storeName} Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
              Finding Your Scent Family
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600 dark:text-zinc-300 font-light leading-relaxed">
            <div className="space-y-2 p-4 rounded-xl bg-stone-50 dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/10">
              <h3 className="font-serif font-semibold text-sm text-stone-900 dark:text-[#f5f5f1]">
                Pure Attar Oils
              </h3>
              <p>
                Concentrated botanical and resin extracts without alcohol dilution. Apply to pulse points for warm, intimate projection that interacts directly with your skin chemistry.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-stone-50 dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/10">
              <h3 className="font-serif font-semibold text-sm text-stone-900 dark:text-[#f5f5f1]">
                Extraits de Parfum
              </h3>
              <p>
                Our signature sprays contain high oil concentrations (30%+). Formulated for commanding sillage that leaves a captivating royal trail for 14+ hours.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-stone-50 dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/10">
              <h3 className="font-serif font-semibold text-sm text-stone-900 dark:text-[#f5f5f1]">
                Rare Cambodian & Assam Oud
              </h3>
              <p>
                Naturally aged agarwood distilled sustainably. Offers deep, complex nuances of smokiness, sweet leather, dry woods, and earthy amber notes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
