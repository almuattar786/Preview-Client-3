import React from 'react';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, Truck, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartPageProps {
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onProceedToCheckout, onContinueShopping }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, shippingFee, freeShippingThreshold, grandTotal } = useCart();

  const freeShippingDiff = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  if (cart.length === 0) {
    return (
      <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-[70vh] flex items-center justify-center py-16 px-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-10 text-center space-y-6 shadow-xl dark:shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-[#141414] text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center mx-auto border border-stone-200 dark:border-[#c5a059]/30">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Your Cart is Empty</h2>
            <p className="text-xs text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
              Explore our exquisite collection of Cambodian Oud, luxury Extrait perfumes, and concentrated attar oils.
            </p>
          </div>
          <button
            onClick={onContinueShopping}
            className="w-full py-3.5 px-6 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Browse Fragrance Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-6 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-10 transition-colors w-full min-w-0">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-4 sm:pb-6 w-full">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] sm:text-xs font-mono text-[#9a7229] dark:text-[#c5a059] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em]">
            Maison Order Summary
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] break-words">
            Shopping Cart ({cart.length} {cart.length === 1 ? 'Item' : 'Items'})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-stone-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-mono flex items-center gap-1.5 self-start sm:self-auto py-1 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Items</span>
        </button>
      </div>

      {/* Free Shipping Meter */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 space-y-2 shadow-sm w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 text-xs font-medium">
          <div className="flex items-center gap-2 text-[#9a7229] dark:text-[#c5a059] min-w-0">
            <Truck className="w-4 h-4 shrink-0" />
            {freeShippingDiff === 0 ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate sm:whitespace-normal">
                Congratulations! You unlocked FREE Express Shipping.
              </span>
            ) : (
              <span className="truncate sm:whitespace-normal">
                Add <strong className="font-mono text-[#9a7229] dark:text-[#c5a059]">Rs. {freeShippingDiff.toLocaleString()}</strong> more for FREE Shipping
              </span>
            )}
          </div>
          <span className="text-stone-500 dark:text-zinc-400 font-mono text-[11px] self-end sm:self-auto shrink-0">
            {Math.round(freeShippingPercent)}%
          </span>
        </div>
        <div className="w-full h-2 bg-stone-200 dark:bg-[#141414] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#9a7229] dark:bg-[#c5a059] transition-all duration-500 rounded-full"
            style={{ width: `${freeShippingPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 w-full min-w-0">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 w-full min-w-0">
          {cart.map((item) => {
            const itemKey = item.id || item.product.id;
            const isBundle = item.product.isBundle || (item.selectedProducts && item.selectedProducts.length > 0);

            return (
              <div
                key={itemKey}
                className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 flex flex-col gap-4 hover:border-[#9a7229]/40 dark:hover:border-[#c5a059]/40 transition-colors shadow-sm dark:shadow-lg w-full min-w-0"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5 w-full min-w-0">
                  {/* Product Info */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0 flex-1">
                    <img
                      src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300'}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300';
                      }}
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#9a7229] dark:text-[#c5a059] font-semibold block truncate">
                          {item.product.category} • {item.product.size}
                        </span>
                        {isBundle && (
                          <span className="bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#9a7229]/30 dark:border-[#c5a059]/30">
                            Fragrance Bundle
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] truncate">
                        {item.product.name}
                      </h3>
                      <div className="text-xs font-mono text-stone-500 dark:text-zinc-400">
                        Rs. {item.product.price.toLocaleString()} each
                      </div>
                    </div>
                  </div>

                  {/* Quantity controls & subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-200 dark:border-[#c5a059]/15 shrink-0">
                    {/* Stepper */}
                    <div className="flex items-center bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl overflow-hidden shrink-0">
                      <button
                        onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                        className="px-2.5 sm:px-3 py-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-2.5 sm:px-3 text-xs font-mono font-bold text-stone-900 dark:text-[#f5f5f1]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="px-2.5 sm:px-3 py-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[70px] sm:min-w-[90px]">
                      <div className="text-[9px] sm:text-[10px] font-mono text-stone-500 dark:text-zinc-500 uppercase">
                        Subtotal
                      </div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-[#9a7229] dark:text-[#c5a059] whitespace-nowrap">
                        Rs. {(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(itemKey)}
                      className="p-2 text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                      title="Remove item"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bundle Selected Fragrances Details */}
                {isBundle && item.selectedProducts && item.selectedProducts.length > 0 && (
                  <div className="mt-1 pt-3 border-t border-stone-100 dark:border-[#c5a059]/10 bg-stone-50/70 dark:bg-[#141414]/60 -mx-3.5 sm:-mx-5 -mb-3.5 sm:-mb-5 p-3.5 sm:p-4 rounded-b-2xl">
                    <div className="text-[10.5px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 font-semibold mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#9a7229] dark:text-[#c5a059]" />
                      <span>Included Fragrance Selections ({item.selectedProducts.length}):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {item.selectedProducts.map((fragrance, idx) => (
                        <div
                          key={`${fragrance.id}-${idx}`}
                          className="flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20"
                        >
                          <img
                            src={fragrance.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=150'}
                            alt={fragrance.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover bg-stone-100 dark:bg-[#141414] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=150';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-serif font-medium text-stone-900 dark:text-[#f5f5f1] truncate">
                              {fragrance.name}
                            </p>
                            <p className="text-[10px] font-mono text-stone-500 dark:text-zinc-400 truncate">
                              {fragrance.size || fragrance.category || '50ml EDP'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2 sm:pt-4">
            <button
              onClick={onContinueShopping}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-5 sm:p-6 space-y-5 sm:space-y-6 h-fit shadow-md dark:shadow-xl w-full min-w-0">
          <h2 className="text-base sm:text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
            Order Total
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between text-stone-700 dark:text-zinc-300">
              <span>Items Subtotal</span>
              <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-700 dark:text-zinc-300">
              <span>Shipping Fee (Nationwide)</span>
              <span>{shippingFee === 0 ? <strong className="text-emerald-600 dark:text-emerald-400 uppercase">FREE</strong> : `Rs. ${shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-stone-700 dark:text-zinc-300">
              <span>Payment Method</span>
              <span className="text-[#9a7229] dark:text-[#c5a059] font-sans font-medium">Cash on Delivery (COD)</span>
            </div>
            <div className="border-t border-stone-200 dark:border-[#c5a059]/20 pt-3 flex justify-between text-sm font-bold text-stone-900 dark:text-[#f5f5f1]">
              <span>Grand Total</span>
              <span className="text-[#9a7229] dark:text-[#c5a059] font-mono text-base sm:text-lg">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onProceedToCheckout}
            className="w-full py-3.5 sm:py-4 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-[11px] text-stone-500 dark:text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
              <span>Guaranteed secure cash payment upon arrival.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
