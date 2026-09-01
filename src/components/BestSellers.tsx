import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Award, ShieldCheck, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface BestSellersProps {
  onViewProductDetails: (product: Product) => void;
  onViewAllProducts: () => void;
}

export const BestSellers: React.FC<BestSellersProps> = ({
  onViewProductDetails,
  onViewAllProducts
}) => {
  const { storeSettings } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [sectionTitle, setSectionTitle] = useState<string>('BEST SELLERS');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Carousel navigation scroll states
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    // Allow small 5px threshold for sub-pixel calculations
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await apiFetch<{
          success: boolean;
          enabled?: boolean;
          title?: string;
          data?: Product[];
          products?: Product[];
        }>('/api/v1/products/bestsellers');

        if (isMounted) {
          if (res.success) {
            setIsEnabled(res.enabled !== false);
            if (res.title) {
              setSectionTitle(res.title);
            }
            const list = res.data || res.products || [];
            if (Array.isArray(list)) {
              setProducts(list);
            }
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error('Failed to load best sellers:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBestSellers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update scroll indicators after loading or window resize
  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [products, loading]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    // Scroll approximately 80% of visible width per click
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  // SEO: Schema.org ItemList JSON-LD structure generated from real fetched products
  useEffect(() => {
    if (!isEnabled || products.length === 0) return;

    const schemaId = 'bestsellers-jsonld';
    let scriptTag = document.getElementById(schemaId) as HTMLScriptElement | null;

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': sectionTitle,
      'description': `${storeSettings?.storeName || 'Luxury Fragrance House'} Most Popular & Best Selling Luxury Fragrances`,
      'numberOfItems': products.length,
      'itemListElement': products.map((prod, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': prod.name,
        'image': prod.images && prod.images.length > 0 ? prod.images[0] : '',
        'url': `${window.location.origin}/#product/${prod.slug || prod.id}`
      }))
    };

    scriptTag.text = JSON.stringify(itemListSchema);

    return () => {
      const tag = document.getElementById(schemaId);
      if (tag) {
        tag.remove();
      }
    };
  }, [products, isEnabled, sectionTitle]);

  // If disabled by admin or error/no products after loading, hide the section
  if (!loading && (!isEnabled || error || products.length === 0)) {
    return null;
  }

  return (
    <section
      id="bestsellers"
      className="bg-[#F7F7F5] dark:bg-[#121212] py-10 sm:py-14 md:py-16 border-y border-[#E0E0E0] dark:border-zinc-800 transition-colors duration-200 overflow-hidden w-full"
      aria-labelledby="bestsellers-heading"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 space-y-6 md:space-y-8 w-full">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative">
          <div className="text-center sm:text-left space-y-1 mx-auto sm:mx-0">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.3em] text-[#9a7229] dark:text-[#c5a059] block font-semibold">
              CURATED COLLECTION
            </span>
            <h2
              id="bestsellers-heading"
              className="text-xl sm:text-2xl md:text-3xl font-serif font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#0B1B3D] dark:text-[#f5f5f1]"
            >
              {sectionTitle}
            </h2>
            <div className="w-10 h-[1px] bg-[#9a7229]/40 dark:bg-[#c5a059]/40 sm:hidden mx-auto mt-1.5" />
          </div>
        </div>

        {/* Main Best Sellers Layout Container (Desktop: Sidebar + Products with Side Navigation Arrows, Tablet/Mobile: Products Only) */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6 w-full min-w-0">
          {/* =================================================================== */}
          {/* DESKTOP-ONLY SIDEBAR (COMPLETELY HIDDEN ON TABLET AND MOBILE) */}
          {/* =================================================================== */}
          <aside className="hidden lg:flex flex-col justify-between w-64 xl:w-72 shrink-0 bg-stone-900 dark:bg-[#151515] text-white p-6 xl:p-7 rounded-2xl border border-[#9a7229]/30 dark:border-[#c5a059]/25 shadow-xl relative overflow-hidden group">
            {/* Subtle background glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#c5a059]/10 blur-2xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-mono uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" />
                <span>Maison Best Sellers</span>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xl xl:text-2xl font-serif font-bold text-[#f5f5f1] leading-tight">
                  Most Coveted Fragrances
                </h3>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">
                  Discover our highest-rated creations, formulated with royal Cambodian Oud, Taif roses, and aged amber extracts.
                </p>
              </div>

              {/* Sidebar Feature Points */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-800 dark:border-zinc-800/80">
                <div className="flex items-start gap-2 text-xs text-zinc-300">
                  <Award className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                  <span>100% Pure Perfume Oils & Extraits</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300">
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                  <span>14+ Hours Sillage & Projection</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                  <span>Cash on Delivery Nationwide</span>
                </div>
              </div>
            </div>

            {/* Sidebar CTA Button */}
            <div className="pt-6 relative z-10">
              <button
                type="button"
                onClick={onViewAllProducts}
                className="w-full py-3 px-4 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-stone-950 font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-lg"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* =================================================================== */}
          {/* PRODUCT SHOWCASE WITH DESKTOP SIDE ARROWS (← Left Arrow | Products | Right Arrow →) */}
          {/* =================================================================== */}
          <div className="flex-1 min-w-0 w-full flex items-center gap-2 lg:gap-3">
            {/* Desktop Left Side Navigation Arrow (Hidden on Tablet and Mobile) */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous best sellers"
              className="hidden lg:flex w-9 h-9 xl:w-10 xl:h-10 rounded-full border border-stone-300 dark:border-zinc-700 bg-white dark:bg-[#1a1a1a] text-[#0B1B3D] dark:text-[#f5f5f1] hover:bg-[#0B1B3D] hover:text-white dark:hover:bg-[#c5a059] dark:hover:text-stone-900 items-center justify-center transition-all duration-200 shadow-md cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] dark:focus:ring-[#c5a059] z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Product Slider Container */}
            <div className="flex-1 min-w-0 w-full">
              {loading ? (
                <div className="border border-[#E0E0E0] dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#161616] overflow-hidden">
                  <div className="flex flex-nowrap overflow-hidden divide-x divide-[#E0E0E0] dark:divide-zinc-800">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="flex-none w-[180px] sm:w-[210px] md:w-[230px] p-4 sm:p-5 space-y-4 animate-pulse text-center"
                      >
                        <div className="w-full h-40 sm:h-48 bg-stone-200 dark:bg-zinc-800 rounded-sm mx-auto" />
                        <div className="h-3.5 bg-stone-200 dark:bg-zinc-800 rounded w-3/4 mx-auto" />
                        <div className="h-3 bg-stone-200 dark:bg-zinc-800 rounded w-1/2 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative group/slider border border-[#E0E0E0] dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#161616] shadow-xs overflow-hidden w-full">
                  {/* Scrollable Track */}
                  <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex flex-nowrap overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [msOverflowStyle:none] [scrollbar-width:none] w-full"
                  >
                    {products.map((product, i) => {
                      const imgUrl =
                        (product.images && product.images[0]?.trim()) ||
                        'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';

                      const isLast = i === products.length - 1;

                      return (
                        <article
                          key={product.id}
                          onClick={() => onViewProductDetails(product)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onViewProductDetails(product);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`View details for ${product.name}`}
                          className={`flex-none w-[170px] min-[360px]:w-[190px] sm:w-[220px] md:w-[235px] lg:w-[225px] xl:w-[245px] snap-start p-3.5 sm:p-4 md:p-5 flex flex-col justify-between items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] dark:focus:ring-[#c5a059] focus:z-10 transition-all duration-300 hover:bg-[#FAF9F6] dark:hover:bg-[#1c1c1c] ${
                            !isLast ? 'border-r border-[#E0E0E0] dark:border-zinc-800' : ''
                          }`}
                        >
                          {/* Uniform Fragrance Photography Box */}
                          <div className="w-full h-40 sm:h-48 md:h-52 flex items-center justify-center p-2 mb-3 overflow-hidden relative bg-transparent">
                            <img
                              src={imgUrl}
                              alt={product.name}
                              loading={i < 2 ? 'eager' : 'lazy'}
                              fetchPriority={i < 2 ? 'high' : 'auto'}
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out filter drop-shadow-xs"
                            />
                          </div>

                          {/* Product Typography Block */}
                          <div className="w-full text-center space-y-1 mt-auto">
                            <span className="text-[9.5px] font-mono tracking-[0.2em] uppercase text-[#9a7229] dark:text-[#c5a059] font-medium block truncate">
                              {product.category || 'LUXURY FRAGRANCE'}
                            </span>

                            <h3 className="text-xs sm:text-[13px] font-serif font-semibold uppercase text-center text-[#0B1B3D] dark:text-[#f5f5f1] group-hover:text-[#9a7229] dark:group-hover:text-[#c5a059] transition-colors leading-snug tracking-wider line-clamp-2 min-h-[2rem] flex items-center justify-center">
                              {product.name}
                            </h3>

                            {typeof product.price === 'number' && (
                              <p className="text-xs font-mono font-medium text-stone-600 dark:text-zinc-400 tracking-wider">
                                Rs. {product.price.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Right Side Navigation Arrow (Hidden on Tablet and Mobile) */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Next best sellers"
              className="hidden lg:flex w-9 h-9 xl:w-10 xl:h-10 rounded-full border border-stone-300 dark:border-zinc-700 bg-white dark:bg-[#1a1a1a] text-[#0B1B3D] dark:text-[#f5f5f1] hover:bg-[#0B1B3D] hover:text-white dark:hover:bg-[#c5a059] dark:hover:text-stone-900 items-center justify-center transition-all duration-200 shadow-md cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] dark:focus:ring-[#c5a059] z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View All Products CTA (Mobile & Tablet visible CTA) */}
        <div className="flex justify-center pt-2 lg:hidden">
          <button
            type="button"
            onClick={onViewAllProducts}
            className="w-full sm:w-auto bg-[#0B1B3D] hover:bg-[#183060] dark:bg-[#c5a059] dark:hover:bg-[#d4af6a] text-white dark:text-stone-950 font-serif text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] px-8 sm:px-14 py-3.5 sm:py-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer border border-[#0B1B3D] dark:border-[#c5a059] focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] focus:ring-offset-2 dark:focus:ring-offset-zinc-900 text-center"
          >
            VIEW ALL PRODUCTS
          </button>
        </div>
      </div>
    </section>
  );
};



