import React, { useState, useEffect } from 'react';
import {
  Star,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
  Package,
  Layers,
  Sparkles,
  HelpCircle,
  X,
  Filter
} from 'lucide-react';
import { Product, BestSellersConfig, BestSellersDisplayMode } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminBestSellersPageProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminBestSellersPage: React.FC<AdminBestSellersPageProps> = ({
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {}
}) => {
  const [config, setConfig] = useState<BestSellersConfig>({
    enabled: true,
    sectionTitle: 'BEST SELLERS',
    displayLimit: 8,
    displayMode: 'hybrid',
    manualProductIds: []
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Search & Filter state for Modal Picker
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('All');

  // Load Bestsellers Config & Products
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{
        success: boolean;
        config: BestSellersConfig;
        products: Product[];
      }>('/api/admin/bestsellers');

      if (res.success) {
        if (res.config) {
          setConfig(res.config);
        }
        if (Array.isArray(res.products)) {
          setAllProducts(res.products);
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load best sellers configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map product IDs to Product objects in current manual order
  const productMap = new Map(allProducts.map((p) => [p.id, p]));
  const selectedManualProducts: Product[] = config.manualProductIds
    .map((id) => productMap.get(id))
    .filter((p): p is Product => Boolean(p));

  // Save changes handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Partial<BestSellersConfig> = {
        enabled: config.enabled,
        sectionTitle: config.sectionTitle.trim() || 'BEST SELLERS',
        displayLimit: Math.min(Math.max(Number(config.displayLimit) || 8, 1), 20),
        displayMode: config.displayMode,
        manualProductIds: config.manualProductIds
      };

      const res = await apiFetch<{
        success: boolean;
        message: string;
        config: BestSellersConfig;
      }>('/api/admin/bestsellers', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        if (res.config) {
          setConfig(res.config);
        }
        onShowToast('Best Sellers section settings updated successfully!', 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reorder manual products
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIds = [...config.manualProductIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newIds.length) return;

    const temp = newIds[index];
    newIds[index] = newIds[targetIndex];
    newIds[targetIndex] = temp;

    setConfig({ ...config, manualProductIds: newIds });
  };

  // Remove product from manual list
  const handleRemoveProduct = (productId: string) => {
    const newIds = config.manualProductIds.filter((id) => id !== productId);
    setConfig({ ...config, manualProductIds: newIds });
  };

  // Toggle selection in Modal Picker
  const handleToggleSelectInModal = (productId: string) => {
    if (config.manualProductIds.includes(productId)) {
      handleRemoveProduct(productId);
    } else {
      setConfig({
        ...config,
        manualProductIds: [...config.manualProductIds, productId]
      });
    }
  };

  // Categories list for modal filter
  const categories = Array.from(
    new Set(allProducts.map((p) => p.category).filter(Boolean))
  );

  // Filtered products for modal search
  const filteredProductsForModal = allProducts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(modalSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(modalSearch.toLowerCase());

    const matchCategory =
      modalCategory === 'All' || p.category === modalCategory;

    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-[#9a7229] dark:text-[#c5a059]">
          <Star className="w-6 h-6 animate-spin" />
          <span className="font-serif text-sm tracking-wider uppercase font-semibold">
            Loading Best Sellers Configuration...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#9a7229]/10 dark:bg-[#c5a059]/10 rounded-lg text-[#9a7229] dark:text-[#c5a059]">
              <Star className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-stone-900 dark:text-[#f5f5f1]">
              Best Sellers Control
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-400 mt-1">
            Configure visibility, display mode, limits, and manually curate fragrances from your Products Directory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={saving}
            className="px-4 py-2 bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#0B1B3D] dark:bg-[#c5a059] hover:bg-[#183060] dark:hover:bg-[#d4af6a] text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider rounded shadow transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Grid Settings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Section Toggle & Basic Settings */}
          <div className="bg-white dark:bg-[#141414] p-6 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <h2 className="font-serif text-base font-bold uppercase tracking-wider text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
              Section Visibility & Content
            </h2>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-stone-50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-zinc-100">
                  {config.enabled ? (
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-rose-500" />
                  )}
                  <span>Show Best Sellers Section</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Toggle whether the Best Sellers showcase appears on the customer homepage.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Section Title Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                Section Heading Title
              </label>
              <input
                type="text"
                value={config.sectionTitle}
                onChange={(e) => setConfig({ ...config, sectionTitle: e.target.value })}
                placeholder="BEST SELLERS"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-zinc-700 rounded text-stone-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] dark:focus:ring-[#c5a059]"
              />
            </div>

            {/* Display Limit Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                  Number of Products to Display
                </label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200">
                  {config.displayLimit} Products
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="1"
                value={config.displayLimit}
                onChange={(e) => setConfig({ ...config, displayLimit: parseInt(e.target.value, 10) || 8 })}
                className="w-full accent-[#0B1B3D] dark:accent-[#c5a059] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 dark:text-zinc-500 font-mono">
                <span>4 products</span>
                <span>8 products (default)</span>
                <span>12 products</span>
              </div>
            </div>
          </div>

          {/* 2. Display Source Mode */}
          <div className="bg-white dark:bg-[#141414] p-6 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <h2 className="font-serif text-base font-bold uppercase tracking-wider text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
              Best Sellers Source Mode
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Hybrid Mode */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, displayMode: 'hybrid' })}
                className={`p-4 rounded-lg border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer ${
                  config.displayMode === 'hybrid'
                    ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border-[#9a7229] dark:border-[#c5a059] ring-2 ring-[#9a7229]/20'
                    : 'bg-stone-50 dark:bg-zinc-900/40 border-stone-200 dark:border-zinc-800 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs uppercase tracking-wider text-stone-900 dark:text-zinc-100">
                      Hybrid Mode
                    </span>
                    {config.displayMode === 'hybrid' && (
                      <CheckCircle2 className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-snug">
                    Sales Data + Manual Fallback. Uses order history first; fills empty slots with manual selections.
                  </p>
                </div>
                <span className="inline-block text-[10px] font-mono font-medium text-[#9a7229] dark:text-[#c5a059]">
                  Recommended
                </span>
              </button>

              {/* Automatic Mode */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, displayMode: 'automatic' })}
                className={`p-4 rounded-lg border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer ${
                  config.displayMode === 'automatic'
                    ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border-[#9a7229] dark:border-[#c5a059] ring-2 ring-[#9a7229]/20'
                    : 'bg-stone-50 dark:bg-zinc-900/40 border-stone-200 dark:border-zinc-800 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs uppercase tracking-wider text-stone-900 dark:text-zinc-100">
                      Automatic Mode
                    </span>
                    {config.displayMode === 'automatic' && (
                      <CheckCircle2 className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-snug">
                    Pure Sales Volume. Dynamically calculates highest selling fragrances from customer orders.
                  </p>
                </div>
                <span className="inline-block text-[10px] font-mono text-stone-500">
                  Data Driven
                </span>
              </button>

              {/* Manual Mode */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, displayMode: 'manual' })}
                className={`p-4 rounded-lg border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer ${
                  config.displayMode === 'manual'
                    ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border-[#9a7229] dark:border-[#c5a059] ring-2 ring-[#9a7229]/20'
                    : 'bg-stone-50 dark:bg-zinc-900/40 border-stone-200 dark:border-zinc-800 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs uppercase tracking-wider text-stone-900 dark:text-zinc-100">
                      Manual Mode
                    </span>
                    {config.displayMode === 'manual' && (
                      <CheckCircle2 className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-snug">
                    Strict Admin Selection. Displays ONLY your chosen products in exact configured sequence.
                  </p>
                </div>
                <span className="inline-block text-[10px] font-mono text-stone-500">
                  Admin Curated
                </span>
              </button>
            </div>
          </div>

          {/* 3. Manually Curated Fragrances List */}
          <div className="bg-white dark:bg-[#141414] p-6 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-base font-bold uppercase tracking-wider text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                  Selected Products List
                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
                    {selectedManualProducts.length} Selected
                  </span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                  Products selected here are pulled directly from your existing Products Directory.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#0B1B3D] dark:bg-[#c5a059] hover:bg-[#183060] dark:hover:bg-[#d4af6a] text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider rounded shadow transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Select Products</span>
              </button>
            </div>

            {selectedManualProducts.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-lg space-y-3">
                <Package className="w-8 h-8 mx-auto text-stone-400 dark:text-zinc-600" />
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  No products manually selected yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-1.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  Browse Products Directory
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedManualProducts.map((prod, index) => {
                  const imgUrl =
                    (prod.images && prod.images[0]?.trim()) ||
                    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';

                  return (
                    <div
                      key={prod.id}
                      className="p-3 bg-stone-50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-lg flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Position Tag */}
                        <span className="w-6 h-6 rounded bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>

                        {/* Thumbnail */}
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          className="w-10 h-10 rounded object-cover bg-white dark:bg-[#161616] border border-stone-200 dark:border-zinc-800 shrink-0"
                        />

                        {/* Info */}
                        <div className="min-w-0">
                          <h4 className="font-sans text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                            <span>SKU: {prod.sku}</span>
                            <span>•</span>
                            <span>Rs. {prod.price.toLocaleString()}</span>
                            <span>•</span>
                            <span>{prod.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === selectedManualProducts.length - 1}
                          title="Move Down"
                          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(prod.id)}
                          title="Remove from Best Sellers"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Live Preview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#141414] p-6 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-4 shadow-sm sticky top-6">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
              Live Homepage Preview
            </h3>

            {!config.enabled ? (
              <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-lg text-center space-y-2">
                <EyeOff className="w-6 h-6 mx-auto text-rose-500" />
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Section Currently Disabled
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  This section will not be displayed to customers on the homepage.
                </p>
              </div>
            ) : (
              <div className="border border-stone-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-[#F5F5F5] dark:bg-[#121212] p-4 space-y-4">
                <h4 className="font-serif font-bold text-center text-sm uppercase tracking-wider text-[#0B1B3D] dark:text-[#f5f5f1]">
                  {config.sectionTitle || 'BEST SELLERS'}
                </h4>

                <div className="grid grid-cols-2 gap-2 border-y border-stone-200 dark:border-zinc-800 py-3">
                  {(selectedManualProducts.length > 0
                    ? selectedManualProducts.slice(0, Math.min(config.displayLimit, 4))
                    : allProducts.slice(0, Math.min(config.displayLimit, 4))
                  ).map((p) => (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-[#161616] p-2 rounded text-center space-y-1 shadow-xs border border-stone-200/60 dark:border-zinc-800"
                    >
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                        alt={p.name}
                        className="w-full h-16 object-contain mx-auto"
                      />
                      <p className="text-[10px] font-serif font-semibold uppercase text-stone-900 dark:text-zinc-100 truncate">
                        {p.name}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-center text-stone-500 dark:text-zinc-500 font-mono">
                  Displaying {Math.min(config.displayLimit, selectedManualProducts.length || allProducts.length)} items in {config.displayMode} mode
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCT PICKER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif font-bold text-base uppercase tracking-wider text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059]" />
                  Select Products from Directory
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Select existing products from your master directory to add to Best Sellers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Bar */}
            <div className="p-4 bg-stone-50 dark:bg-zinc-900/40 border-b border-stone-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search by product name, SKU, or brand..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-zinc-700 rounded text-xs text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] dark:focus:ring-[#c5a059]"
                />
              </div>

              <div className="relative shrink-0">
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-zinc-700 rounded text-xs text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] dark:focus:ring-[#c5a059] cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Product List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 scrollbar-thin">
              {filteredProductsForModal.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500 dark:text-zinc-400">
                  No products found matching your search query.
                </div>
              ) : (
                filteredProductsForModal.map((prod) => {
                  const isSelected = config.manualProductIds.includes(prod.id);
                  const imgUrl =
                    (prod.images && prod.images[0]?.trim()) ||
                    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleToggleSelectInModal(prod.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border-[#9a7229] dark:border-[#c5a059]'
                          : 'bg-white dark:bg-[#181818] border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          className="w-10 h-10 rounded object-cover bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-sans text-xs font-semibold text-stone-900 dark:text-zinc-100 truncate">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                            <span>SKU: {prod.sku}</span>
                            <span>•</span>
                            <span>Rs. {prod.price.toLocaleString()}</span>
                            <span>•</span>
                            <span>{prod.category}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                            : 'bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono text-stone-600 dark:text-zinc-400">
                {config.manualProductIds.length} Products Selected
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-[#0B1B3D] dark:bg-[#c5a059] hover:bg-[#183060] dark:hover:bg-[#d4af6a] text-white dark:text-stone-950 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
