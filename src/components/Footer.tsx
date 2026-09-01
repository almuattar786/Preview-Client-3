import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Shield, Truck, RefreshCw, Award } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onSelectCategory?: (category: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onShowToast, onSelectCategory }) => {
  const { storeSettings } = useCart();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      onShowToast('Please provide a valid email address.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail })
      });
      if (res.success) {
        onShowToast('Welcome to Al-Mu\'attar Privé Club! You are now subscribed.', 'success');
        setNewsletterEmail('');
      } else {
        onShowToast(res.message || 'Subscription failed.', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error subscribing.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLink = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#f2ede2] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] border-t border-[#9a7229]/20 dark:border-[#c5a059]/20 pt-16 pb-8 transition-colors">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 text-center shadow-sm dark:shadow-xl">
          <div className="flex flex-col items-center space-y-2 p-2">
            <Award className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />
            <h4 className="text-sm font-semibold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider">100% Authentic</h4>
            <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">Pure, unadulterated ingredients sourced globally.</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-2">
            <Truck className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />
            <h4 className="text-sm font-semibold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider">Nationwide Delivery</h4>
            <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">Fast & safe doorstep courier across Pakistan.</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-2">
            <Shield className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />
            <h4 className="text-sm font-semibold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider">Cash On Delivery</h4>
            <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">Inspect your package upon payment at delivery.</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-2">
            <RefreshCw className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059]" />
            <h4 className="text-sm font-semibold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider">Long Lasting Sillage</h4>
            <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">High perfume concentration for 12+ hours wear.</p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#9a7229]/20 dark:border-[#c5a059]/15">
        {/* Col 1 & 2: Brand Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif tracking-[0.2em] font-semibold text-stone-900 dark:text-[#f5f5f1] uppercase">
              {storeSettings?.storeName || "Al-Mu'attar"}
            </span>
          </div>
          <p className="text-sm text-stone-600 dark:text-zinc-400 font-light leading-relaxed max-w-md">
            {storeSettings?.tagline ? `${storeSettings.storeName} - ${storeSettings.tagline}. ` : ''}
            Crafting majestic fragrances, pure attar oils, and Cambodian Oud blends that elevate your personal signature scent.
          </p>
          <div className="pt-2 text-xs text-[#9a7229] dark:text-[#c5a059] font-mono font-semibold">
            {storeSettings?.footerText || "Maison de Parfum • Est. Lahore, Pakistan"}
          </div>
        </div>

        {/* Col 3: Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7229] dark:text-[#c5a059]">Navigation</h4>
          <ul className="space-y-2 text-sm font-light text-stone-700 dark:text-zinc-300">
            <li>
              <button onClick={() => handleLink('home')} className="hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors cursor-pointer">
                Home
              </button>
            </li>
            <li>
              <button onClick={() => handleLink('shop')} className="hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors cursor-pointer">
                Explore All Perfumes
              </button>
            </li>
            <li>
              <button onClick={() => handleLink('about')} className="hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors cursor-pointer">
                The Art of Perfumery
              </button>
            </li>
            <li>
              <button onClick={() => handleLink('contact')} className="hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors cursor-pointer">
                Contact Concierge
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Newsletter & Contact */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7229] dark:text-[#c5a059]">
            {storeSettings?.storeName ? `${storeSettings.storeName} Privé` : "Al-Mu'attar Privé"}
          </h4>
          <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">
            Subscribe for exclusive access to limited batch releases and fragrance care tips.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] pr-10"
              />
              <button
                type="submit"
                disabled={submitting}
                className="absolute right-1.5 top-1.5 p-1 text-[#9a7229] dark:text-[#c5a059] hover:text-[#7a581d] dark:hover:text-[#d4af37] disabled:opacity-50 cursor-pointer"
                aria-label="Subscribe"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
            <span>{storeSettings?.storeAddress || "Gulberg III, Lahore, Pakistan"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-zinc-400">
            <Phone className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
            <span>{storeSettings?.contactPhone || "+92 300 1234567"}</span>
          </div>
        </div>
      </div>

      {/* Bottom Legal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-zinc-500 font-light text-center sm:text-left">
        <p>© {new Date().getFullYear()} {storeSettings?.storeName || "Al-Mu'attar"} Fragrance House. All Rights Reserved.</p>
      </div>
    </footer>
  );
};
