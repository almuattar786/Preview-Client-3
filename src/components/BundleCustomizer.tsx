import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Plus, Minus, AlertCircle, ShoppingBag, Info } from 'lucide-react';
import { Product, SelectedBundleFragrance } from '../types';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface BundleCustomizerProps {
  bundleProduct: Product;
  quantity: number;
  onAddToCart: (selectedFragrances: SelectedBundleFragrance[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const BundleCustomizer: React.FC<BundleCustomizerProps> = ({
  bundleProduct,
  quantity,
  onAddToCart,
  onShowToast,
}) => {
  const { storeSettings } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFragrances, setSelectedFragrances] = useState<SelectedBundleFragrance[]>([]);

  const requiredCount = bundleProduct.requiredSelectionCount || 2;
  const eligibleIds = bundleProduct.eligibleProductIds || [];

  useEffect(() => {
    const fetchEligibleProducts = async () => {
      try {
        setLoading(true);
        const res = await apiFetch<{ success: boolean; products: Product[] }>('/api/products');
        const catalogProducts = res.success && res.products ? res.products : [];

        // If specific bundleOptions (custom fragrances + selected catalog items) are configured:
        if (bundleProduct.bundleOptions && bundleProduct.bundleOptions.length > 0) {
          const catalogMap = new Map(catalogProducts.map((p) => [p.id, p]));
          const mappedItems: Product[] = bundleProduct.bundleOptions.map((opt) => {
            if (opt.type === 'existing' && opt.productId) {
              const matched = catalogMap.get(opt.productId);
              if (matched) return matched;
            }
            // Custom fragrance option
            return {
              id: opt.id,
              name: opt.name || 'Custom Fragrance Blend',
              slug: opt.id,
              description: '',
              shortDescription: opt.category || 'Custom Bundle Option',
              price: opt.price || 0,
              category: (opt.category || 'Custom Blend') as any,
              categories: [(opt.category || 'Custom Blend') as any],
              brand: storeSettings?.storeName || "Al-Mu'attar",
              size: opt.size || '50ml',
              fragranceType: 'Eau de Parfum',
              gender: 'Unisex',
              notes: { top: [], heart: [], base: [] },
              images: [
                opt.image ||
                  'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'
              ],
              stock: 999,
              isFeatured: false,
              isBestSeller: false,
              sku: opt.id,
              isActive: true,
              createdAt: '',
              updatedAt: ''
            };
          });
          setAllProducts(mappedItems);
          return;
        }

        // Fallback: Filter catalog products
        const individualFragrances = catalogProducts.filter((p) => {
          if (p.isBundle || p.id === bundleProduct.id) return false;
          if (eligibleIds.length > 0) {
            return eligibleIds.includes(p.id);
          }
          return true;
        });
        setAllProducts(individualFragrances);
      } catch (err) {
        console.error('Failed to load eligible products for bundle:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleProducts();
  }, [bundleProduct.id, JSON.stringify(bundleProduct.bundleOptions), JSON.stringify(eligibleIds)]);

  // Add fragrance to selection
  const handleSelectFragrance = (fragrance: Product) => {
    if (fragrance.stock <= 0) {
      onShowToast(`"${fragrance.name}" is currently out of stock.`, 'error');
      return;
    }

    if (selectedFragrances.length >= requiredCount) {
      onShowToast(`You have already selected ${requiredCount} fragrances. Remove one to pick a different fragrance.`, 'error');
      return;
    }

    const newItem: SelectedBundleFragrance = {
      id: fragrance.id,
      name: fragrance.name,
      image: fragrance.images[0] || '',
      category: fragrance.category,
      size: fragrance.size,
      price: fragrance.price
    };

    setSelectedFragrances((prev) => [...prev, newItem]);
  };

  // Remove fragrance from selection by index
  const handleRemoveFragrance = (indexToRemove: number) => {
    setSelectedFragrances((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const isSelectionComplete = selectedFragrances.length === requiredCount;
  const remainingCount = requiredCount - selectedFragrances.length;

  const handleAddBundleToCart = () => {
    if (!isSelectionComplete) {
      onShowToast(`Please select ${remainingCount} more fragrance${remainingCount > 1 ? 's' : ''} to complete your bundle.`, 'error');
      return;
    }
    onAddToCart(selectedFragrances);
  };

  return (
    <div className="space-y-6 bg-white dark:bg-[#141414] border border-[#9a7229]/30 dark:border-[#c5a059]/30 rounded-2xl p-4 sm:p-6 shadow-md dark:shadow-xl">
      {/* Header */}
      <div className="space-y-1.5 border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
              Custom Fragrance Selection
            </h3>
          </div>
          <span className="bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
            {selectedFragrances.length} of {requiredCount} Chosen
          </span>
        </div>
        <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">
          Handpick any <strong className="text-stone-900 dark:text-[#f5f5f1] font-semibold">{requiredCount} luxury fragrances</strong> from our artisanal collection below to formulate your bespoke gift bundle.
        </p>
      </div>

      {/* Selected Slots Visualization */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-semibold flex items-center justify-between">
          <span>Your Selected Slots:</span>
          {isSelectionComplete ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Bundle Complete
            </span>
          ) : (
            <span className="text-[#9a7229] dark:text-[#c5a059]">
              {remainingCount} slot{remainingCount > 1 ? 's' : ''} remaining
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: requiredCount }).map((_, slotIdx) => {
            const selected = selectedFragrances[slotIdx];
            return (
              <div
                key={slotIdx}
                className={`relative p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                  selected
                    ? 'bg-[#9a7229]/5 dark:bg-[#c5a059]/10 border-[#9a7229]/40 dark:border-[#c5a059]/40'
                    : 'bg-stone-50/80 dark:bg-[#1a1a1a]/80 border-dashed border-stone-300 dark:border-[#c5a059]/30 text-stone-400 dark:text-zinc-500'
                }`}
              >
                {selected ? (
                  <>
                    <img
                      src={selected.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=150'}
                      alt={selected.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover bg-stone-100 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1 pr-6">
                      <div className="text-xs font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] truncate">
                        {selected.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#9a7229] dark:text-[#c5a059] truncate">
                        Slot {slotIdx + 1} • {selected.category}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFragrance(slotIdx)}
                      className="absolute top-2 right-2 p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Remove from bundle"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2.5 py-1 px-1 text-xs">
                    <div className="w-8 h-8 rounded-lg border border-dashed border-stone-300 dark:border-[#c5a059]/30 flex items-center justify-center font-mono text-xs text-stone-400 dark:text-zinc-500">
                      {slotIdx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-stone-600 dark:text-zinc-400">Empty Slot {slotIdx + 1}</div>
                      <div className="text-[10px] text-stone-400 dark:text-zinc-500">Select fragrance below</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Fragrances Selector Grid */}
      <div className="space-y-3 pt-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-semibold">
          Available Fragrances:
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-stone-400 dark:text-zinc-500">
            Loading fragrance collection...
          </div>
        ) : allProducts.length === 0 ? (
          <div className="p-4 rounded-xl bg-stone-100 dark:bg-[#1a1a1a] text-center text-xs text-stone-500">
            No eligible fragrances found for this bundle.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {allProducts.map((fragrance) => {
              const countInSelection = selectedFragrances.filter((s) => s.id === fragrance.id).length;
              const isOut = fragrance.stock <= 0;

              return (
                <div
                  key={fragrance.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                    countInSelection > 0
                      ? 'bg-stone-50 dark:bg-[#1f1f1f] border-[#9a7229]/60 dark:border-[#c5a059]/60 shadow-xs'
                      : 'bg-white dark:bg-[#181818] border-stone-200 dark:border-[#c5a059]/20 hover:border-[#9a7229]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={(fragrance.images && fragrance.images[0]?.trim()) || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=150'}
                      alt={fragrance.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-stone-100 dark:bg-[#0a0a0a] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] truncate">
                        {fragrance.name}
                      </h4>
                      <div className="text-[10px] font-mono text-stone-500 dark:text-zinc-400">
                        {fragrance.category} • {fragrance.size}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-[#c5a059]/10">
                    <div className="text-[10px] font-mono text-stone-500 dark:text-zinc-400">
                      {isOut ? (
                        <span className="text-rose-500 font-semibold">Out of Stock</span>
                      ) : (
                        <span>Rs. {fragrance.price.toLocaleString()}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectFragrance(fragrance)}
                      disabled={isOut || selectedFragrances.length >= requiredCount}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold tracking-wider flex items-center gap-1 transition-all ${
                        isOut || selectedFragrances.length >= requiredCount
                          ? 'bg-stone-200 dark:bg-[#262626] text-stone-400 dark:text-zinc-500 cursor-not-allowed'
                          : 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:bg-[#7a581d] dark:hover:bg-[#d4af37] active:scale-95'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{countInSelection > 0 ? `Add (${countInSelection})` : 'Select'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA Button Bar */}
      <div className="pt-3 border-t border-stone-200 dark:border-[#c5a059]/20 space-y-2">
        <button
          type="button"
          onClick={handleAddBundleToCart}
          disabled={!isSelectionComplete}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
            !isSelectionComplete
              ? 'bg-stone-200 dark:bg-[#262626] text-stone-400 dark:text-zinc-500 cursor-not-allowed'
              : 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:bg-[#7a581d] dark:hover:bg-[#d4af37] active:scale-95'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            {isSelectionComplete
              ? `Add Complete Bundle to Cart • Rs. ${(bundleProduct.price * quantity).toLocaleString()}`
              : `Select ${remainingCount} More Fragrance${remainingCount > 1 ? 's' : ''} to Add`}
          </span>
        </button>
      </div>
    </div>
  );
};
