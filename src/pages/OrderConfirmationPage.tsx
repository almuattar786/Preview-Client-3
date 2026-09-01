import React from 'react';
import { CheckCircle2, ShoppingBag, Truck, MapPin, Phone, Mail, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Order } from '../types';

interface OrderConfirmationPageProps {
  order: Order;
  onContinueShopping: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ order, onContinueShopping }) => {
  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 transition-colors duration-200 w-full min-w-0">
      {/* Thank you Banner */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-md dark:shadow-2xl relative overflow-hidden transition-colors">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/40 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#9a7229] dark:text-[#c5a059]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] sm:text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em] font-semibold block">
            Maison Confirmation
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Order Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-300 font-light max-w-lg mx-auto leading-relaxed">
            Thank you, <strong className="text-stone-900 dark:text-[#f5f5f1] font-semibold">{order.customer.fullName}</strong>. Your luxury fragrance order has been placed successfully and is being prepared by our master perfumers.
          </p>
        </div>

        <div className="pt-2 inline-flex items-center gap-2 sm:gap-3 bg-stone-100 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/30 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-mono text-xs shadow-xs">
          <span className="text-stone-500 dark:text-zinc-400">Order Number:</span>
          <strong className="text-[#9a7229] dark:text-[#c5a059] font-bold text-xs sm:text-sm tracking-wide">
            {order.orderNumber}
          </strong>
        </div>
      </div>

      {/* Order Status Workflow Timeline */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm dark:shadow-lg transition-colors">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7229] dark:text-[#c5a059] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          <span>Fulfillment Status</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#9a7229]/15 dark:bg-[#c5a059]/20 border border-[#9a7229]/30 dark:border-[#c5a059]/40 text-[#9a7229] dark:text-[#c5a059] font-semibold flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9a7229] dark:bg-[#c5a059] animate-pulse" />
            <span>1. Pending</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/10 text-stone-400 dark:text-zinc-500 font-light flex items-center justify-center">
            <span>2. Confirmed</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/10 text-stone-400 dark:text-zinc-500 font-light flex items-center justify-center">
            <span>3. Shipped</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/10 text-stone-400 dark:text-zinc-500 font-light flex items-center justify-center">
            <span>4. Delivered</span>
          </div>
        </div>
      </div>

      {/* Itemized Order Details & Customer Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Ordered Items */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-lg transition-colors flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3 flex items-center justify-between">
              <span>Ordered Fragrances ({order.items.length})</span>
              <ShoppingBag className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs min-w-0 border-b border-stone-100 dark:border-[#c5a059]/10 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300'}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-stone-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
                          <span className="truncate">{item.productName}</span>
                          {item.isBundle && (
                            <span className="shrink-0 text-[9px] font-mono bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] px-1.5 py-0.2 rounded font-bold">
                              Bundle
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">
                          {item.size} • Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[#9a7229] dark:text-[#c5a059] whitespace-nowrap text-xs">
                      Rs. {item.subtotal.toLocaleString()}
                    </div>
                  </div>

                  {item.isBundle && item.selectedProducts && item.selectedProducts.length > 0 && (
                    <div className="pl-14 text-[10.5px] text-stone-600 dark:text-zinc-400 font-mono space-y-1">
                      <span className="text-[#9a7229] dark:text-[#c5a059] font-medium block">Selected Fragrances:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.selectedProducts.map((p, pIdx) => (
                          <span
                            key={`${p.id}-${pIdx}`}
                            className="bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-md px-2 py-0.5 text-[10px] text-stone-800 dark:text-zinc-200"
                          >
                            {p.name} ({p.size || '50ml'})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-200 dark:border-[#c5a059]/20 pt-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-stone-600 dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="font-medium text-stone-800 dark:text-zinc-200">Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-600 dark:text-zinc-400">
              <span>Shipping Fee</span>
              <span>
                {order.shippingFee === 0 ? (
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">FREE (Complimentary)</strong>
                ) : (
                  <span className="font-medium text-stone-800 dark:text-zinc-200">Rs. {order.shippingFee}</span>
                )}
              </span>
            </div>
            <div className="border-t border-stone-200 dark:border-[#c5a059]/20 pt-2.5 flex justify-between items-center text-sm font-bold text-stone-900 dark:text-[#f5f5f1]">
              <span>Total Payable (COD)</span>
              <span className="text-[#9a7229] dark:text-[#c5a059] font-mono font-bold text-base">
                Rs. {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Summary */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm dark:shadow-lg transition-colors flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3 flex items-center justify-between">
              <span>Delivery & Contact Details</span>
              <Truck className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            </h3>

            <div className="space-y-3.5 text-xs text-stone-700 dark:text-zinc-300 font-light">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 dark:text-[#f5f5f1] font-semibold block">{order.shippingAddress.fullName}</strong>
                  <span className="text-stone-700 dark:text-zinc-300 leading-relaxed block">{order.shippingAddress.address}, {order.shippingAddress.city}</span>
                  {order.shippingAddress.postalCode && (
                    <span className="text-stone-500 dark:text-zinc-400 font-mono text-[11px] block mt-0.5">Postal Code: {order.shippingAddress.postalCode}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
                <span className="font-mono font-medium text-stone-800 dark:text-zinc-200">{order.shippingAddress.phone}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
                <span className="text-stone-800 dark:text-zinc-200">{order.shippingAddress.email}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-[#c5a059]/20 space-y-1.5 bg-stone-50 dark:bg-[#141414] p-3.5 rounded-xl border border-stone-200/80 dark:border-[#c5a059]/10">
            <div className="text-[10px] uppercase font-mono text-[#9a7229] dark:text-[#c5a059] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Payment Terms</span>
            </div>
            <div className="text-xs font-semibold text-stone-900 dark:text-zinc-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Cash on Delivery (COD)</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-light leading-relaxed">
              Please keep the exact cash amount ready upon delivery arrival.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Shopping Button */}
      <div className="text-center pt-2 sm:pt-4">
        <button
          onClick={onContinueShopping}
          className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-[#9a7229] hover:bg-[#7a581d] dark:bg-[#c5a059] dark:hover:bg-[#d4af37] text-white dark:text-[#0a0a0a] font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md dark:shadow-xl inline-flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

