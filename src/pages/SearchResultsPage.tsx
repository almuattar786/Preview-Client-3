import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { apiFetch } from '../lib/api';

interface SearchResultsPageProps {
  query: string;
  onBackToShop: () => void;
  onViewProductDetails: (product: Product) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  query,
  onBackToShop,
  onViewProductDetails,
  onShowToast
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ success: boolean; products: Product[] }>(
          `/api/products?search=${encodeURIComponent(query)}`
        );
        if (res.success) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (query) {
      performSearch();
    }
  }, [query]);

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 transition-colors">
      <div className="flex items-center justify-between border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-6">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] font-semibold uppercase tracking-[0.25em]">Search Query</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Results for "{query}"
          </h1>
          <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">Found {products.length} matching fragrances</p>
        </div>
        <button
          onClick={onBackToShop}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-stone-200 dark:bg-[#1a1a1a] animate-pulse border border-stone-300 dark:border-[#c5a059]/10" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <Search className="w-12 h-12 text-[#9a7229] dark:text-[#c5a059] mx-auto" />
          <h3 className="text-xl font-serif text-stone-900 dark:text-[#f5f5f1]">No Matching Scents</h3>
          <p className="text-xs text-stone-600 dark:text-zinc-400 max-w-md mx-auto">
            We could not find any products matching "{query}". Try searching by a note like "Oud", "Vanilla", or "Amber".
          </p>
          <button
            onClick={onBackToShop}
            className="px-6 py-2 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-semibold uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37]"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
};
