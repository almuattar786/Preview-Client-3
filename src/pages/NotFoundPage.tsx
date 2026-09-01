import React from 'react';
import { Compass, Home, ShoppingBag } from 'lucide-react';

interface NotFoundPageProps {
  setActiveTab: (tab: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ setActiveTab }) => {
  return (
    <div className="bg-[#0a0a0a] text-[#f5f5f1] min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-[#c5a059]/20 rounded-3xl p-10 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center mx-auto">
          <Compass className="w-10 h-10 text-[#c5a059]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono text-[#c5a059] uppercase tracking-[0.25em]">404 Error</span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f1]">Scent Trail Lost</h1>
          <p className="text-xs text-zinc-400 font-light leading-relaxed">
            The page or fragrance you are seeking could not be found or may have been relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setActiveTab('home')}
            className="flex-1 py-3 rounded-xl bg-[#0a0a0a] border border-[#c5a059]/30 hover:bg-[#c5a059]/10 text-[#f5f5f1] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4 text-[#c5a059]" />
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className="flex-1 py-3 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Catalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
