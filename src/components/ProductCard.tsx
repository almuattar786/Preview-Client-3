import React from 'react';
import { ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { FragranceNotesBadge } from './FragranceNotesBadge';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails, onShowToast }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.isBundle) {
      onViewDetails(product);
      return;
    }
    if (product.stock <= 0) {
      onShowToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }
    addToCart(product, 1);
    onShowToast(`Added "${product.name}" to cart.`, 'success');
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="group relative bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl sm:rounded-2xl overflow-hidden shadow-md dark:shadow-xl hover:border-[#9a7229] dark:hover:border-[#c5a059]/60 transition-all duration-300 flex flex-col cursor-pointer hover:shadow-xl dark:hover:shadow-[#c5a059]/10"
    >
      {/* Product Image Header */}
      <div className="relative aspect-[4/3] bg-stone-100 dark:bg-[#141414] overflow-hidden">
        <img
          src={(product.images && product.images[0]?.trim()) || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
          alt={product.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';
          }}
        />

        {/* Badges Overlay */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 z-10">
          {product.isBundle && (
            <span className="bg-amber-800 dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-[7.5px] sm:text-[8.5px] uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 font-mono">
              <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> <span className="hidden sm:inline">{product.bundleBadge || `Bundle (${product.requiredSelectionCount || 1} Items)`}</span><span className="sm:hidden">Bundle</span>
            </span>
          )}
          {hasDiscount && (
            <span className="bg-rose-700 text-white font-bold text-[7.5px] sm:text-[8.5px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm font-mono">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Stock status overlay */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
          {isOutOfStock ? (
            <span className="bg-stone-900/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md text-rose-400 border border-rose-500/30 text-[7.5px] sm:text-[8.5px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full font-mono">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-stone-900/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md text-[#c5a059] border border-[#c5a059]/40 text-[7.5px] sm:text-[8.5px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full font-mono">
              <span className="hidden sm:inline">Only </span>{product.stock} Left
            </span>
          ) : null}
        </div>

        {/* Hover Quick Action */}
        <div className="absolute inset-0 bg-stone-900/40 dark:bg-[#0a0a0a]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 p-2 sm:p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="p-1.5 sm:p-2 rounded-full bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1] hover:bg-[#9a7229] dark:hover:bg-[#c5a059] hover:text-white dark:hover:text-[#0a0a0a] transition-colors shadow-xl"
            title={product.isBundle ? "Configure Bundle Fragrances" : "View Fragrance Details"}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="p-2 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2.5">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center justify-between text-[8.5px] sm:text-[10px] text-[#9a7229] dark:text-[#c5a059] font-mono tracking-wider uppercase font-semibold">
            <span className="truncate max-w-[65%]">{product.category}</span>
            <span className="text-stone-500 dark:text-zinc-400 font-normal shrink-0">
              {product.isBundle ? `${product.requiredSelectionCount || 1} Items` : product.size}
            </span>
          </div>

          <h3 className="text-[11.5px] sm:text-[14px] md:text-[14.5px] font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] group-hover:text-[#9a7229] dark:group-hover:text-[#c5a059] transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-[9.5px] sm:text-[11px] text-stone-600 dark:text-zinc-400 font-light line-clamp-2 leading-snug">
            {product.shortDescription || product.description}
          </p>

          {!product.isBundle && (
            <div className="hidden sm:block">
              <FragranceNotesBadge notes={product.notes} compact />
            </div>
          )}
        </div>

        {/* Footer Price & Add to Cart */}
        <div className="pt-1.5 sm:pt-2 border-t border-stone-200 dark:border-[#c5a059]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
          <div>
            <div className="text-[7.5px] sm:text-[9px] text-stone-500 dark:text-zinc-500 font-mono uppercase tracking-widest">
              {product.isBundle ? 'Bundle' : 'Price'}
            </div>
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-[11.5px] sm:text-[14px] md:text-[14.5px] font-bold font-mono text-stone-900 dark:text-[#f5f5f1]">
                Rs. {product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-[8.5px] sm:text-[10.5px] font-mono text-stone-400 dark:text-zinc-500 line-through">
                  Rs. {product.compareAtPrice!.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full sm:w-auto px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10.5px] font-semibold tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-500 dark:bg-[#262626] dark:text-zinc-500 cursor-not-allowed'
                : product.isBundle
                ? 'bg-stone-900 dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:bg-[#9a7229] dark:hover:bg-[#d4af37] active:scale-95 font-bold border border-[#9a7229]/40'
                : 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:bg-[#7a581d] dark:hover:bg-[#d4af37] active:scale-95 font-bold'
            }`}
          >
            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">
              {isOutOfStock
                ? 'Sold Out'
                : product.isBundle
                ? 'Select'
                : 'Add'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
