import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Award,
  Flame,
  Droplets,
  ShieldCheck,
  Tag,
  Check,
  ChevronDown
} from 'lucide-react';
import { Product, FragranceCategory, FragranceGender, OurCollectionPageConfig } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface OurCollectionPageProps {
  onViewProductDetails: (product: Product) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onSelectCategory?: (cat: string) => void;
}

const OUR_COLLECTION_STORAGE_KEY = 'al_muattar_our_collection_config_cache_v1';

export const OurCollectionPage: React.FC<OurCollectionPageProps> = ({
  onViewProductDetails,
  onShowToast,
  onSelectCategory
}) => {
  const { storeSettings } = useCart();
  const [config, setConfig] = useState<OurCollectionPageConfig | null>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem(OUR_COLLECTION_STORAGE_KEY) : null;
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to load cached Our Collection config:', e);
    }
    return null;
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(!config);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, productsRes] = await Promise.all([
          apiFetch<{ success: boolean; config: OurCollectionPageConfig }>('/api/our-collection/config').catch(() => ({ success: false, config: null })),
          apiFetch<{ success: boolean; products: Product[] }>('/api/products?collectionPlacement=our')
        ]);

        if (configRes && configRes.success && configRes.config) {
          setConfig(configRes.config);
          try {
            localStorage.setItem(OUR_COLLECTION_STORAGE_KEY, JSON.stringify(configRes.config));
          } catch (e) {}
        }
        if (productsRes && productsRes.success && productsRes.products) {
          setProducts(productsRes.products);
        }
      } catch (err: any) {
        console.error('Error fetching Our Collection data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const defaultCategories = [
    'All',
    'Perfumes',
    'Attars',
    'Oud'
  ];

  // Dynamic filter lists
  const dynamicCategories = (storeSettings?.categories?.map((c) => c.name) || [])
    .filter((catName) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(catName));
  const categoriesList = ['All', ...Array.from(new Set([...dynamicCategories, ...defaultCategories.slice(1)]))];

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          search.trim() === '' ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
          (p.notes?.top && p.notes.top.some((n) => n.toLowerCase().includes(search.toLowerCase()))) ||
          (p.notes?.heart && p.notes.heart.some((n) => n.toLowerCase().includes(search.toLowerCase()))) ||
          (p.notes?.base && p.notes.base.some((n) => n.toLowerCase().includes(search.toLowerCase())));

        const matchesCat =
          selectedCategory === 'All' ||
          p.category === selectedCategory ||
          (p.categories && p.categories.includes(selectedCategory as FragranceCategory));

        const matchesGender =
          selectedGender === 'All' ||
          p.gender === selectedGender ||
          (p.gender === 'Unisex' && (selectedGender === 'Men' || selectedGender === 'Women'));

        return matchesSearch && matchesCat && matchesGender;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return (b.averageRating || 5) - (a.averageRating || 5);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, search, selectedCategory, selectedGender, sortBy]);

  const activeBanner = useMemo(() => {
    if (selectedGender === 'Men' && config?.menBanner?.imageUrl) {
      return {
        imageUrl: config.menBanner.imageUrl,
        badgeText: config.menBanner.badgeText || "Privé Masculin",
        title: config.menBanner.title || "Signature Masculine Accords",
        subtitle: config.menBanner.subtitle || "Smoked Woods, Royal Agarwood & Cured Tobacco",
        description: config.menBanner.description || "Distinguished extraits formulated with aged Cambodian oud, dark leather, and spiced cloves for commanding longevity."
      };
    }
    if (selectedGender === 'Women' && config?.womenBanner?.imageUrl) {
      return {
        imageUrl: config.womenBanner.imageUrl,
        badgeText: config.womenBanner.badgeText || "Privé Féminin",
        title: config.womenBanner.title || "Signature Feminine Accords",
        subtitle: config.womenBanner.subtitle || "Taif Rose Absolutes, White Musks & Velvet Florals",
        description: config.womenBanner.description || "Sublime floral extraits featuring morning-harvested Taif roses, blooming jasmine sambac, and aged bourbon vanilla."
      };
    }
    if (selectedGender === 'Unisex' && config?.unisexBanner?.imageUrl) {
      return {
        imageUrl: config.unisexBanner.imageUrl,
        badgeText: config.unisexBanner.badgeText || "Privé Universel",
        title: config.unisexBanner.title || "Signature Unisex Accords",
        subtitle: config.unisexBanner.subtitle || "Timeless Sillage & Balanced Rare Resins",
        description: config.unisexBanner.description || "A masterful equilibrium of rare spices, creamy sandalwood, and crystalline musks that transcend traditional categorizations."
      };
    }

    const storeName = storeSettings?.storeName || "Al-Mu'attar";

    return {
      imageUrl: config?.defaultBanner?.imageUrl || config?.heroBannerUrl || config?.heroImageUrl || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000",
      badgeText: config?.defaultBanner?.badgeText || config?.heroBadgeText || `Maison ${storeName} Privé`,
      title: config?.defaultBanner?.title || config?.heroTitle || "Our Signature House Collection",
      subtitle: config?.defaultBanner?.subtitle || config?.heroSubtitle || `Maison ${storeName} Privé Accords`,
      description: config?.defaultBanner?.description || config?.heroDescription || "Mastercrafted in limited artisanal batches with genuine rare Cambodian agarwood, pure Taif rose absolutes, and vintage ambergris. Each creation is formulated at exceptional Extrait concentration for unmatched sillage."
    };
  }, [config, selectedGender, storeSettings]);

  const storeName = storeSettings?.storeName || "Al-Mu'attar";
  const seoTitle = config?.seoTitle || `Our Collection — ${storeName} Signature Perfumes & Pure Attars`;
  const seoDesc = config?.seoDescription || `Explore ${storeName}'s proprietary house fragrances, handcrafted extraits, and rare oud essences.`;

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-3 sm:py-4 px-1.5 min-[360px]:px-2 sm:px-4 lg:px-6 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pb-16 transition-colors">
      <SEO
        title={seoTitle}
        description={seoDesc}
        image={activeBanner.imageUrl}
      />

      {/* Hero Banner Section */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden h-36 min-[480px]:h-44 sm:h-52 md:h-60 lg:h-auto min-h-[140px] sm:min-h-[190px] md:min-h-[230px] lg:min-h-[420px] flex items-center bg-stone-950 border border-stone-200 dark:border-[#c5a059]/20 shadow-xl transition-all duration-500">
        {/* Background Image with Subtle Natural Overlay */}
        <div className="absolute inset-0 z-0 bg-stone-950">
          {!loading || config ? (
            <img
              key={activeBanner.imageUrl}
              src={activeBanner.imageUrl}
              alt={activeBanner.title || 'Our Collection'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-100 object-center transition-opacity duration-700"
            />
          ) : (
            <div className="w-full h-full bg-stone-900 animate-pulse" />
          )}
          {/* Subtle soft dark overlay to preserve natural brightness and clarity */}
          <div className="absolute inset-0 bg-stone-950/15 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/25 via-transparent to-stone-950/10 pointer-events-none" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search house creations by note, name, accord..."
              className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] pl-10"
            />
            <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3.5 top-3" />
          </div>

          {/* Gender */}
          <div className="sm:col-span-3">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] cursor-pointer"
            >
              <option value="All">All Genders</option>
              <option value="Unisex">Unisex Formulations</option>
              <option value="Men">Masculine Signatures</option>
              <option value="Women">Feminine Accords</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] cursor-pointer"
            >
              <option value="featured">Featured House Picks</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Alphabetical: A-Z</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] shadow-sm'
                  : 'bg-stone-100 dark:bg-[#202020] text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Fragrances Catalog Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#9a7229] dark:text-[#c5a059] font-bold">
              Available Formulations ({filteredProducts.length})
            </span>
          </div>

          {(search || selectedCategory !== 'All' || selectedGender !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedGender('All');
                setSortBy('featured');
              }}
              className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-64 sm:h-80 bg-white dark:bg-[#141414] rounded-xl sm:rounded-2xl animate-pulse border border-stone-200 dark:border-[#c5a059]/10"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-[#141414] border border-dashed border-stone-300 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-4">
            <Sparkles className="w-12 h-12 text-[#9a7229] dark:text-[#c5a059] mx-auto opacity-40" />
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
              No House Fragrances Found
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-md mx-auto">
              No fragrances in Our Collection matched your current filters. Try changing your search query or selecting a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedGender('All');
              }}
              className="px-6 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#7a581d] transition-all cursor-pointer"
            >
              View All House Fragrances
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onViewDetails={onViewProductDetails}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* House Philosophy / Provenance Banner */}
      <div className="bg-stone-900 dark:bg-[#121212] border border-[#c5a059]/20 rounded-3xl p-8 sm:p-12 text-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono text-[#c5a059] uppercase tracking-[0.25em]">
            Artisanal Mastery
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            The {storeName} Standard of Excellence
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            Every bottle bearing the {storeName} mark undergoes multi-month cellar maceration, ensuring harmony between exotic resins and delicate florals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-stone-800">
          <div className="space-y-2 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] mx-auto sm:mx-0">
              <Droplets className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-white text-sm">Aged Natural Agarwood</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Ethically sourced from vintage wild trees across Assam, Trat, and Pursat for deep animalic warmth.
            </p>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] mx-auto sm:mx-0">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-white text-sm">Grasse Extraits</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Formulated with high concentrations of raw oils to deliver sillage that lingers intimately for hours.
            </p>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] mx-auto sm:mx-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-white text-sm">Purity Guaranteed</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Free from harsh synthetic binders or diluents. Pure, unadulterated luxury for sensitive skin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
