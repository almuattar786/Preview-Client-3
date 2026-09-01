import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Truck, CheckCircle2, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Order } from '../types';
import { apiFetch } from '../lib/api';

interface CheckoutPageProps {
  onBackToCart: () => void;
  onOrderSuccess: (order: Order) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToCart, onOrderSuccess, onShowToast }) => {
  const { cart, subtotal, shippingFee, grandTotal, clearCart } = useCart();

  // Customer & Shipping Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [postalCode, setPostalCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const PAKISTAN_CITIES = [
    'Lahore',
    'Karachi',
    'Islamabad',
    'Rawalpindi',
    'Faisalabad',
    'Peshawar',
    'Multan',
    'Quetta',
    'Sialkot',
    'Gujranwala',
    'Hyderabad',
    'Bahawalpur',
    'Sargodha',
    'Abbottabad',
    'Other City'
  ];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !email.trim() || !address.trim() || !city.trim()) {
      onShowToast('Please fill in all required customer & shipping fields.', 'error');
      return;
    }

    if (cart.length === 0) {
      onShowToast('Your cart is empty. Add fragrances before checking out.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        customer: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim()
        },
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim()
        },
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          category: item.product.category,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0] || '',
          selectedProductIds: item.selectedProductIds || [],
          selectedProducts: item.selectedProducts || []
        })),
        subtotal,
        shippingFee,
        total: grandTotal,
        notes: orderNotes.trim(),
        paymentMethod: 'COD'
      };

      const res = await apiFetch<{ success: boolean; order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      if (res.success && res.order) {
        clearCart();
        onOrderSuccess(res.order);
      } else {
        onShowToast('Failed to place order. Please try again.', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error processing order.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-6 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 transition-colors w-full min-w-0">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-4 sm:pb-6 gap-3">
        <div className="min-w-0">
          <span className="text-[11px] sm:text-xs font-mono text-[#9a7229] dark:text-[#c5a059] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em]">Maison Checkout</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] truncate">Complete Your Order</h1>
        </div>
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors shrink-0 py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </button>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 w-full min-w-0">
        {/* Left Column: Customer & Shipping Address Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Information */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
              <span className="w-6 h-6 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Customer Contact Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Full Name <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tariq Mahmood"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Phone Number (for Courier COD) <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0300 1234567"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Email Address <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tariq@example.com"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
              <span className="w-6 h-6 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Shipping Address (Pakistan)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Complete Street Address <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Apartment #, Street, Sector / Colony / Area..."
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  City <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Postal Code (Optional)
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 54000"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Special Order / Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Call before delivery or leave with gate security"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Option */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
              <span className="w-6 h-6 rounded-full bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Payment Method</h2>
            </div>

            <div className="p-4 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider">
                  Cash on Delivery (COD)
                </h4>
                <p className="text-xs text-stone-700 dark:text-zinc-300 font-light leading-relaxed">
                  Pay cash directly to the courier agent when your parcel is delivered to your address. No advance payment required.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Confirmation Submit */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-md dark:shadow-xl sticky top-28">
            <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
              Items Summary ({cart.length})
            </h2>

            {/* Cart item summary list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => {
                const itemKey = item.id || item.product.id;
                const isBundle = item.product.isBundle || (item.selectedProducts && item.selectedProducts.length > 0);

                return (
                  <div key={itemKey} className="space-y-1 text-xs min-w-0 border-b border-stone-100 dark:border-[#c5a059]/10 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300'}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-stone-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
                            <span className="truncate">{item.product.name}</span>
                            {isBundle && (
                              <span className="shrink-0 text-[9px] font-mono bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] px-1.5 py-0.2 rounded font-bold">
                                Bundle
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">
                            {item.quantity}x @ Rs. {item.product.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-[#9a7229] dark:text-[#c5a059] text-xs shrink-0 whitespace-nowrap">
                        Rs. {(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    {isBundle && item.selectedProducts && item.selectedProducts.length > 0 && (
                      <div className="pl-14 text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                        <span className="text-[#9a7229] dark:text-[#c5a059] font-medium">Includes: </span>
                        {item.selectedProducts.map(p => p.name).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-stone-200 dark:border-[#c5a059]/20 pt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-stone-700 dark:text-zinc-300">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-700 dark:text-zinc-300">
                <span>Shipping Fee</span>
                <span>{shippingFee === 0 ? <strong className="text-emerald-600 dark:text-emerald-400 uppercase">FREE</strong> : `Rs. ${shippingFee}`}</span>
              </div>
              <div className="border-t border-stone-200 dark:border-[#c5a059]/20 pt-3 flex justify-between text-sm font-bold text-stone-900 dark:text-[#f5f5f1]">
                <span>Total Amount Due</span>
                <span className="text-[#9a7229] dark:text-[#c5a059] font-mono text-lg">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Processing Order...' : 'Confirm & Place Order (COD)'}</span>
            </button>

            <div className="p-3 rounded-xl bg-stone-100 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 text-[11px] text-stone-600 dark:text-zinc-400 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[#9a7229] dark:text-[#c5a059] font-semibold">
                <Truck className="w-3.5 h-3.5" />
                <span>Fast Express Courier</span>
              </div>
              <p>Estimated delivery within 2 to 4 business days.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
