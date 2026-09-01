import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SlidersHorizontal,
  Search,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Tag,
  Users,
  Layers,
  CircleDollarSign,
  PackageCheck,
  ArrowUpDown,
  Sliders,
  Sparkles,
  Droplets,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { Product, FragranceCategory, FragranceGender, FragranceType, ShopPageConfig } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface ShopPageProps {
  onViewProductDetails: (product: Product) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedGender?: string;
  setSelectedGender?: (gender: string) => void;
}

interface FilterControlsProps {
  idPrefix?: string;
  search: string;
  setSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categoriesList: (FragranceCategory | 'All')[];
  gender: string;
  setGender: (g: string) => void;
  gendersList: (FragranceGender | 'All')[];
  fragranceType: string;
  setFragranceType: (t: string) => void;
  typesList: (FragranceType | 'All')[];
  minPrice: number;
  setMinPrice: (p: number) => void;
  maxPrice: number;
  setMaxPrice: (p: number) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  openSections: { [key: string]: boolean };
  toggleSection: (section: string) => void;
  activeFiltersCount: number;
  onResetFilters: () => void;
}

/**
 * FilterControls declared at the top level outside the main ShopPage component
 * to guarantee stable DOM identity and prevent input unmount / focus loss during typing.
 */
const FilterControls: React.FC<FilterControlsProps> = ({
  idPrefix = 'desktop',
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  categoriesList,
  gender,
  setGender,
  gendersList,
  fragranceType,
  setFragranceType,
  typesList,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  inStockOnly,
  setInStockOnly,
  sortBy,
  setSortBy,
  openSections,
  toggleSection,
  activeFiltersCount,
  onResetFilters
}) => {
  return (
    <div className="space-y-4 text-xs">
      {/* Search Input */}
      <div className="relative">
        <input
          id={`shop-search-input-${idPrefix}`}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fragrance, notes..."
          className="w-full bg-stone-50 dark:bg-[#101010] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl pl-8 pr-7 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
        />
        <Search className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500 absolute left-2.5 top-3 pointer-events-none" />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-3 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors"
            title="Clear search"
            aria-label="Clear search input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 1. Category Dropdown / Expandable */}
      <div className="border border-stone-200 dark:border-[#c5a059]/20 rounded-xl overflow-hidden bg-white dark:bg-[#141414]">
        <button
          type="button"
          onClick={() => toggleSection('category')}
          className="w-full px-3.5 py-3 flex items-center justify-between font-semibold text-stone-900 dark:text-[#f5f5f1] hover:bg-stone-50 dark:hover:bg-[#1c1c1c] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
            <span className="uppercase font-mono text-[11px] tracking-wider">Category</span>
            {selectedCategory !== 'All' && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-[9px] font-bold">
                1
              </span>
            )}
          </div>
          {openSections.category ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
        </button>

        {openSections.category && (
          <div className="p-2 pt-0 space-y-1 max-h-60 overflow-y-auto border-t border-stone-100 dark:border-[#c5a059]/10">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] font-bold'
                    : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-[#202020]'
                }`}
              >
                <span>{cat}</span>
                {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Gender Dropdown / Expandable */}
      <div className="border border-stone-200 dark:border-[#c5a059]/20 rounded-xl overflow-hidden bg-white dark:bg-[#141414]">
        <button
          type="button"
          onClick={() => toggleSection('gender')}
          className="w-full px-3.5 py-3 flex items-center justify-between font-semibold text-stone-900 dark:text-[#f5f5f1] hover:bg-stone-50 dark:hover:bg-[#1c1c1c] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
            <span className="uppercase font-mono text-[11px] tracking-wider">Gender</span>
            {gender !== 'All' && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-[9px] font-bold">
                1
              </span>
            )}
          </div>
          {openSections.gender ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
        </button>

        {openSections.gender && (
          <div className="p-2 pt-0 space-y-1 border-t border-stone-100 dark:border-[#c5a059]/10">
            {gendersList.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  gender === g
                    ? 'bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] font-bold'
                    : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-[#202020]'
                }`}
              >
                <span>{g}</span>
                {gender === g && <Check className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Concentration / Type Dropdown */}
      <div className="border border-stone-200 dark:border-[#c5a059]/20 rounded-xl overflow-hidden bg-white dark:bg-[#141414]">
        <button
          type="button"
          onClick={() => toggleSection('type')}
          className="w-full px-3.5 py-3 flex items-center justify-between font-semibold text-stone-900 dark:text-[#f5f5f1] hover:bg-stone-50 dark:hover:bg-[#1c1c1c] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
            <span className="uppercase font-mono text-[11px] tracking-wider">Formulation</span>
            {fragranceType !== 'All' && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-[9px] font-bold">
                1
              </span>
            )}
          </div>
          {openSections.type ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
        </button>

        {openSections.type && (
          <div className="p-2 pt-0 space-y-1 max-h-52 overflow-y-auto border-t border-stone-100 dark:border-[#c5a059]/10">
            {typesList.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFragranceType(t)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  fragranceType === t
                    ? 'bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] font-bold'
                    : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-[#202020]'
                }`}
              >
                <span>{t}</span>
                {fragranceType === t && <Check className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Price Range Dropdown */}
      <div className="border border-stone-200 dark:border-[#c5a059]/20 rounded-xl overflow-hidden bg-white dark:bg-[#141414]">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full px-3.5 py-3 flex items-center justify-between font-semibold text-stone-900 dark:text-[#f5f5f1] hover:bg-stone-50 dark:hover:bg-[#1c1c1c] transition-colors"
        >
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
            <span className="uppercase font-mono text-[11px] tracking-wider">Price Range</span>
            {(minPrice > 0 || maxPrice < 25000) && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-[9px] font-bold">
                1
              </span>
            )}
          </div>
          {openSections.price ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
        </button>

        {openSections.price && (
          <div className="p-3 pt-1 space-y-3 border-t border-stone-100 dark:border-[#c5a059]/10">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase font-mono text-stone-500 dark:text-zinc-400">Min (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-lg p-1.5 text-xs font-mono text-stone-900 dark:text-[#f5f5f1] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-mono text-stone-500 dark:text-zinc-400">Max (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-lg p-1.5 text-xs font-mono text-stone-900 dark:text-[#f5f5f1] focus:outline-none"
                />
              </div>
            </div>

            {(minPrice > 0 || maxPrice < 25000) && (
              <button
                type="button"
                onClick={() => { setMinPrice(0); setMaxPrice(25000); }}
                className="text-[10px] text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white underline"
              >
                Reset Price Range
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. In Stock Only Toggle */}
      <button
        type="button"
        onClick={() => setInStockOnly(!inStockOnly)}
        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all border ${
          inStockOnly
            ? 'bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-600 shadow-sm font-semibold'
            : 'bg-white dark:bg-[#141414] border-stone-200 dark:border-[#c5a059]/20 text-stone-800 dark:text-zinc-200 hover:border-[#9a7229] dark:hover:border-[#c5a059]'
        }`}
      >
        <div className="flex items-center gap-2">
          <PackageCheck className="w-3.5 h-3.5" />
          <span className="uppercase font-mono text-[11px] tracking-wider">In Stock Only</span>
        </div>
        {inStockOnly ? <Check className="w-3.5 h-3.5" /> : <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-zinc-600" />}
      </button>

      {/* 6. Sort Selection Dropdown */}
      <div className="border border-stone-200 dark:border-[#c5a059]/20 rounded-xl overflow-hidden bg-white dark:bg-[#141414]">
        <button
          type="button"
          onClick={() => toggleSection('sort')}
          className="w-full px-3.5 py-3 flex items-center justify-between font-semibold text-stone-900 dark:text-[#f5f5f1] hover:bg-stone-50 dark:hover:bg-[#1c1c1c] transition-colors"
        >
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
            <span className="uppercase font-mono text-[11px] tracking-wider">Sort Products</span>
          </div>
          {openSections.sort ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
        </button>

        {openSections.sort && (
          <div className="p-2 pt-0 space-y-1 border-t border-stone-100 dark:border-[#c5a059]/10">
            {[
              { id: 'featured', label: 'Featured Curations' },
              { id: 'price-asc', label: 'Price: Low to High' },
              { id: 'price-desc', label: 'Price: High to Low' },
              { id: 'newest', label: 'Newest Releases' },
              { id: 'name-asc', label: 'Name: A-Z' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSortBy(s.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  sortBy === s.id
                    ? 'bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] font-bold'
                    : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-[#202020]'
                }`}
              >
                <span>{s.label}</span>
                {sortBy === s.id && <Check className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Filters Button */}
      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full py-2 rounded-xl bg-stone-100 dark:bg-[#1f1f1f] text-stone-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Clear All ({activeFiltersCount}) Filters</span>
        </button>
      )}
    </div>
  );
};

export const ShopPage: React.FC<ShopPageProps> = ({
  onViewProductDetails,
  onShowToast,
  selectedCategory,
  setSelectedCategory,
  selectedGender = 'All',
  setSelectedGender
}) => {
  const { storeSettings, isLoadingSettings } = useCart();
  const [shopConfig, setShopConfig] = useState<ShopPageConfig | null>(storeSettings?.shopCollection || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [gender, setGender] = useState<string>(selectedGender || 'All');
  const [fragranceType, setFragranceType] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Load shop config from server
  useEffect(() => {
    let isMounted = true;
    apiFetch<{ success: boolean; config: ShopPageConfig }>('/api/shop/config')
      .then((res) => {
        if (isMounted && res.success && res.config) {
          setShopConfig(res.config);
        }
      })
      .catch((err) => console.error('Failed to load shop config', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync external selectedGender prop if it changes
  useEffect(() => {
    if (selectedGender !== undefined && selectedGender !== gender) {
      setGender(selectedGender);
      if (selectedGender !== 'All') {
        setOpenSections((prev) => ({ ...prev, gender: true }));
      }
    }
  }, [selectedGender]);

  const handleSetGender = (val: string) => {
    setGender(val);
    if (setSelectedGender) {
      setSelectedGender(val);
    }
  };

  // Debounce search query to smooth out API calls while typing continuously
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Sidebar Accordion / Dropdown open states (All closed by default, unless gender is preselected)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    category: false,
    gender: selectedGender !== 'All',
    type: false,
    price: false,
    sort: false
  });

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const defaultCategories: FragranceCategory[] = [
    'Perfumes',
    'Attars',
    'Oud'
  ];

  const dynamicCategories = (
    storeSettings?.categories && storeSettings.categories.length > 0
      ? storeSettings.categories.map((c) => c.name)
      : defaultCategories
  ).filter((catName) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(catName));

  const categoriesList: (FragranceCategory | 'All')[] = useMemo(() => [
    'All',
    ...Array.from(new Set([...dynamicCategories, ...defaultCategories]))
  ], [dynamicCategories]);

  const gendersList: (FragranceGender | 'All')[] = ['All', 'Men', 'Women', 'Unisex'];

  const typesList: (FragranceType | 'All')[] = [
    'All',
    'Extrait de Parfum',
    'Eau de Parfum',
    'Eau de Toilette',
    'Attar Oil',
    'Pure Oud'
  ];

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('collectionPlacement', 'shop');
      if (debouncedSearch.trim()) queryParams.append('search', debouncedSearch.trim());
      if (selectedCategory && selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (gender && gender !== 'All') queryParams.append('gender', gender);
      if (fragranceType && fragranceType !== 'All') queryParams.append('fragranceType', fragranceType);
      if (minPrice > 0) queryParams.append('minPrice', String(minPrice));
      if (maxPrice < 25000) queryParams.append('maxPrice', String(maxPrice));
      if (inStockOnly) queryParams.append('inStockOnly', 'true');
      if (sortBy) queryParams.append('sortBy', sortBy);

      const res = await apiFetch<{ success: boolean; products: Product[] }>(`/api/products?${queryParams.toString()}`);
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch products.', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, gender, fragranceType, minPrice, maxPrice, inStockOnly, sortBy, onShowToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    handleSetGender('All');
    setFragranceType('All');
    setMinPrice(0);
    setMaxPrice(25000);
    setInStockOnly(false);
    setSortBy('featured');
  };

  // Active filters calculation
  const activeFiltersCount = [
    selectedCategory !== 'All',
    gender !== 'All',
    fragranceType !== 'All',
    minPrice > 0 || maxPrice < 25000,
    inStockOnly,
    Boolean(search.trim())
  ].filter(Boolean).length;

  // Auto-open category accordion if a category filter is active
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All') {
      setOpenSections((prev) => ({ ...prev, category: true }));
    }
  }, [selectedCategory]);

  const activeBanner = useMemo(() => {
    const cfg = shopConfig || storeSettings?.shopCollection;
    if (gender === 'Men' && cfg?.menBanner?.imageUrl) {
      return {
        imageUrl: cfg.menBanner.imageUrl,
        badgeText: cfg.menBanner.badgeText || "Masculine Accords",
        title: cfg.menBanner.title || "Men's Fragrance Selection",
        subtitle: cfg.menBanner.subtitle || "Smoked Woods, Tuscan Leather & Spiced Ambers",
        description: cfg.menBanner.description || "Commanding olfactory profiles featuring smoked birch, Italian leather, royal ambergris, and warm oriental spices for distinguished presence."
      };
    }
    if (gender === 'Women' && cfg?.womenBanner?.imageUrl) {
      return {
        imageUrl: cfg.womenBanner.imageUrl,
        badgeText: cfg.womenBanner.badgeText || "Feminine Accords",
        title: cfg.womenBanner.title || "Women's Fragrance Selection",
        subtitle: cfg.womenBanner.subtitle || "Taif Rose Petals, Ethereal Florals & Sweet Nectars",
        description: cfg.womenBanner.description || "Enchanting floral extraits, velvety Taif rose nectars, white jasmine blossoms, and crystalline Madagascar vanilla for sublime elegance."
      };
    }
    if (gender === 'Unisex' && cfg?.unisexBanner?.imageUrl) {
      return {
        imageUrl: cfg.unisexBanner.imageUrl,
        badgeText: cfg.unisexBanner.badgeText || "Universal Harmony",
        title: cfg.unisexBanner.title || "Unisex Fragrance Selection",
        subtitle: cfg.unisexBanner.subtitle || "Harmonious Signature Scents For All Connoisseurs",
        description: cfg.unisexBanner.description || "Sophisticated signature blends designed to transcend boundaries and adapt organically with individual skin chemistry."
      };
    }

    const storeName = storeSettings?.storeName || "Al-Mu'attar";

    return {
      imageUrl: cfg?.defaultBanner?.imageUrl || "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1920",
      badgeText: cfg?.defaultBanner?.badgeText || "Curated Haute Parfumerie",
      title: cfg?.defaultBanner?.title || (selectedCategory === 'All' ? 'Shop All Fragrances' : selectedCategory),
      subtitle: cfg?.defaultBanner?.subtitle || `Maison ${storeName} Masterworks`,
      description: cfg?.defaultBanner?.description || "Explore mastercrafted Extraits de Parfum, pure Cambodian agarwood essences, and non-alcoholic attars formulated for exceptional longevity and regal sillage."
    };
  }, [shopConfig, storeSettings, gender, selectedCategory]);

  const storeName = storeSettings?.storeName || "Al-Mu'attar";
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://almuattar.com';

  const shopTitle = selectedCategory !== 'All' 
    ? `${selectedCategory} Collection | ${storeName} Luxury Fragrances`
    : `Shop All Perfumes & Attars | ${storeName}`;

  const shopDesc = selectedCategory !== 'All'
    ? `Explore our ${selectedCategory} collection. Handcrafted luxury scents, authentic notes, high longevity, and free shipping across Pakistan by ${storeName}.`
    : `Discover the complete collection of luxury fragrances, Cambodian Oud, pure non-alcoholic attars, and Extraits de Parfum at ${storeName}.`;

  const canonicalUrl = selectedCategory !== 'All'
    ? `/shop?category=${encodeURIComponent(selectedCategory)}`
    : '/shop';

  const shopStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': shopTitle,
    'description': shopDesc,
    'url': `${origin}${canonicalUrl}`,
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': products.slice(0, 20).map((prod, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': prod.name,
        'image': prod.images?.[0] || '',
        'description': prod.shortDescription || prod.description,
        'url': `${origin}/product/${prod.id}`
      }))
    }
  };

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-3 sm:py-4 px-1.5 min-[360px]:px-2 sm:px-4 lg:px-6 max-w-[1600px] mx-auto space-y-4 transition-colors">
      {/* SEO Engine */}
      <SEO
        title={shopTitle}
        description={shopDesc}
        canonicalPath={canonicalUrl}
        ogType="website"
        structuredData={shopStructuredData}
        image={activeBanner.imageUrl}
      />

      {/* Single Top Hero Banner Section */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden h-36 min-[480px]:h-44 sm:h-52 md:h-60 lg:h-auto min-h-[140px] sm:min-h-[190px] md:min-h-[230px] lg:min-h-[420px] flex items-center bg-stone-950 border border-stone-200 dark:border-[#c5a059]/20 shadow-xl transition-all duration-500">
        {/* Background Image with Subtle Natural Overlay */}
        <div className="absolute inset-0 z-0 bg-stone-950">
          <img
            key={activeBanner.imageUrl}
            src={activeBanner.imageUrl}
            alt={activeBanner.title || 'Shop All Fragrances'}
            referrerPolicy="no-referrer"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-100 object-center transition-opacity duration-700"
          />
          {/* Subtle soft dark overlay to preserve natural brightness and clarity */}
          <div className="absolute inset-0 bg-stone-950/15 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/25 via-transparent to-stone-950/10 pointer-events-none" />
        </div>
      </div>

      {/* Shop Bar (Product Count & Mobile Filters Toggle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-zinc-400">
          <span>Showing <strong className="font-semibold text-stone-900 dark:text-[#f5f5f1]">{products.length}</strong> mastercrafted fragrance items</span>
          {gender !== 'All' && (
            <span className="px-2 py-0.5 rounded-full bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] font-mono text-[10px] font-bold">
              Filter: {gender}
            </span>
          )}
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-200 text-xs font-semibold uppercase tracking-wider shadow-sm"
          >
            <Sliders className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="p-2 rounded-xl bg-[#9a7229]/10 text-[#9a7229] dark:text-[#c5a059] text-xs font-medium"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout: Left Sticky Filter Sidebar + Right Product Grid */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* =================================================================== */}
        {/* LEFT SIDEBAR: FIXED / STICKY FILTER DROPDOWNS (DESKTOP) */}
        {/* =================================================================== */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-[95px] max-h-[calc(100vh-115px)] overflow-y-auto no-scrollbar z-20">
          <div className="bg-white/90 dark:bg-[#141414]/90 backdrop-blur-md border border-stone-200 dark:border-[#c5a059]/25 rounded-2xl p-3.5 shadow-md space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-[#f5f5f1]">
                  Filter Fragrances
                </span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[10px] font-mono uppercase text-[#9a7229] dark:text-[#c5a059] hover:underline"
                >
                  Reset ({activeFiltersCount})
                </button>
              )}
            </div>

            <FilterControls
              idPrefix="desktop"
              search={search}
              setSearch={setSearch}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categoriesList={categoriesList}
              gender={gender}
              setGender={handleSetGender}
              gendersList={gendersList}
              fragranceType={fragranceType}
              setFragranceType={setFragranceType}
              typesList={typesList}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              inStockOnly={inStockOnly}
              setSortBy={setSortBy}
              sortBy={sortBy}
              setInStockOnly={setInStockOnly}
              openSections={openSections}
              toggleSection={toggleSection}
              activeFiltersCount={activeFiltersCount}
              onResetFilters={handleResetFilters}
            />
          </div>
        </aside>

        {/* =================================================================== */}
        {/* RIGHT AREA: ACTIVE CHIPS + PRODUCT GRID */}
        {/* =================================================================== */}
        <main className="flex-1 min-w-0 w-full space-y-5">
          {/* Active Filter Chips & Quick Sort Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 dark:bg-[#141414]/70 backdrop-blur-sm border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-3.5 text-xs">
            {/* Active Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-stone-500 dark:text-zinc-400 font-semibold mr-1">
                Active:
              </span>

              {selectedCategory !== 'All' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[11px] font-semibold">
                  <span>{selectedCategory}</span>
                  <button type="button" onClick={() => setSelectedCategory('All')}>
                    <X className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </span>
              ) : (
                <span className="text-[11px] text-stone-500 dark:text-zinc-400 italic">All Categories</span>
              )}

              {gender !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[11px] font-semibold">
                  <span>Gender: {gender}</span>
                  <button type="button" onClick={() => handleSetGender('All')}>
                    <X className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </span>
              )}

              {fragranceType !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[11px] font-semibold">
                  <span>Type: {fragranceType}</span>
                  <button type="button" onClick={() => setFragranceType('All')}>
                    <X className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </span>
              )}

              {(minPrice > 0 || maxPrice < 25000) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[11px] font-mono font-medium">
                  <span>Rs. {minPrice.toLocaleString()} - {maxPrice.toLocaleString()}</span>
                  <button type="button" onClick={() => { setMinPrice(0); setMaxPrice(25000); }}>
                    <X className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/40 text-[11px] font-semibold">
                  <span>In Stock</span>
                  <button type="button" onClick={() => setInStockOnly(false)}>
                    <X className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </span>
              )}

              {search.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-[#252525] text-stone-800 dark:text-zinc-200 text-[11px]">
                  <span>"{search.trim()}"</span>
                  <button type="button" onClick={() => setSearch('')}>
                    <X className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </span>
              )}
            </div>

            {/* Quick Sort Selector */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] font-mono uppercase text-stone-500 dark:text-zinc-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-stone-50 dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-[#f5f5f1] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Releases</option>
                <option value="name-asc">Name: A-Z</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3.5 lg:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="h-64 sm:h-72 rounded-xl sm:rounded-2xl bg-stone-200 dark:bg-[#1a1a1a] animate-pulse border border-stone-300 dark:border-[#c5a059]/10"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-[#141414] text-stone-500 dark:text-zinc-500 flex items-center justify-center mx-auto border border-stone-200 dark:border-[#c5a059]/20">
                <Search className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />
              </div>
              <h3 className="text-xl font-serif text-stone-900 dark:text-[#f5f5f1]">No Fragrances Found</h3>
              <p className="text-xs text-stone-600 dark:text-zinc-400 max-w-md mx-auto">
                No products match your active search or filter selection. Try adjusting or resetting your filter criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-xl bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-xs font-semibold uppercase tracking-wider hover:bg-[#9a7229]/25 dark:hover:bg-[#c5a059]/30 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3.5 lg:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={onViewProductDetails}
                  onShowToast={onShowToast}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* =================================================================== */}
      {/* MOBILE FILTER MODAL / DRAWER */}
      {/* =================================================================== */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200 lg:hidden">
          <div className="w-full max-w-xs sm:max-w-sm bg-white dark:bg-[#141414] h-full overflow-y-auto p-6 shadow-2xl space-y-6 flex flex-col justify-between border-l border-stone-200 dark:border-[#c5a059]/30">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                  <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-stone-900 dark:text-[#f5f5f1]">
                    Filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FilterControls
                idPrefix="mobile"
                search={search}
                setSearch={setSearch}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categoriesList={categoriesList}
                gender={gender}
                setGender={handleSetGender}
                gendersList={gendersList}
                fragranceType={fragranceType}
                setFragranceType={setFragranceType}
                typesList={typesList}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                inStockOnly={inStockOnly}
                setSortBy={setSortBy}
                sortBy={sortBy}
                setInStockOnly={setInStockOnly}
                openSections={openSections}
                toggleSection={toggleSection}
                activeFiltersCount={activeFiltersCount}
                onResetFilters={handleResetFilters}
              />
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-[#c5a059]/20 space-y-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold uppercase tracking-wider"
              >
                View {products.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
