import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Check,
  Edit2,
  PackageCheck,
  PackageX,
  Boxes
} from 'lucide-react';
import { Product } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminInventoryPageProps {
  onOpenEditProduct?: (product: Product) => void;
  onEditProduct?: (productId?: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminInventoryPage: React.FC<AdminInventoryPageProps> = ({
  onOpenEditProduct,
  onEditProduct,
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {}
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out' | 'healthy'>('all');
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; products: Product[] }>('/api/products?includeInactive=true');
      if (res.success) {
        setProducts(res.products);
        const initialInputs: Record<string, string> = {};
        res.products.forEach((p) => {
          initialInputs[p.id] = String(p.stock);
        });
        setStockInputs(initialInputs);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch inventory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockInputChange = (productId: string, val: string) => {
    setStockInputs((prev) => ({
      ...prev,
      [productId]: val
    }));
  };

  const handleQuickAdjust = (productId: string, delta: number) => {
    setStockInputs((prev) => {
      const currentVal = parseInt(prev[productId] || '0', 10) || 0;
      return {
        ...prev,
        [productId]: String(Math.max(0, currentVal + delta))
      };
    });
  };

  const handleSaveStock = async (product: Product) => {
    const rawVal = stockInputs[product.id];
    const newStock = parseInt(rawVal || '0', 10);
    if (isNaN(newStock) || newStock < 0) return;

    setUpdatingStockId(product.id);
    try {
      const res = await apiFetch<{ success: boolean; product: Product }>(`/api/products/${product.id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: newStock })
      });

      if (res.success && res.product) {
        onShowToast(`Stock for ${product.name} updated to ${newStock} units.`, 'success');
        setProducts((prev) => prev.map((p) => (p.id === product.id ? res.product : p)));
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update stock level.', 'error');
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleEdit = (p: Product) => {
    if (onOpenEditProduct) {
      onOpenEditProduct(p);
    } else if (onEditProduct) {
      onEditProduct(p.id);
    }
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'low') return p.stock > 0 && p.stock <= 10;
    if (filterStatus === 'out') return p.stock === 0;
    if (filterStatus === 'healthy') return p.stock > 10;
    return true;
  });

  // Inventory Metrics
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const healthyCount = products.filter((p) => p.stock > 10).length;
  const totalValuation = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  return (
    <div className="space-y-8 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen transition-colors p-4 sm:p-6 md:p-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">Stock & Supply Chain</span>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">Inventory Control Panel</h1>
        </div>
        <button
          onClick={fetchInventory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-xs font-semibold text-stone-800 dark:text-zinc-200 uppercase tracking-wider transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-[#9a7229] dark:text-[#c5a059] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Stock Units</span>
            <Boxes className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">{totalUnits.toLocaleString()} units</div>
          <p className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">Valuation: PKR {totalValuation.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Healthy Supply</span>
            <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">{healthyCount} SKUs</div>
          <p className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">&gt; 10 units available</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-amber-500/30 rounded-2xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">{lowStockCount} SKUs</div>
          <p className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">1 to 10 units remaining</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-rose-500/30 rounded-2xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Out of Stock</span>
            <PackageX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-rose-600 dark:text-rose-400">{outOfStockCount} SKUs</div>
          <p className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">Needs urgent replenishment</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, Name or Category..."
            className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 pl-10 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
          />
          <Search className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] absolute left-3 top-3" />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
              filterStatus === 'all'
                ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a]'
                : 'bg-stone-100 dark:bg-[#0a0a0a] text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white border border-stone-300 dark:border-[#c5a059]/20'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilterStatus('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
              filterStatus === 'low'
                ? 'bg-amber-500 text-stone-950 dark:text-[#0a0a0a]'
                : 'bg-stone-100 dark:bg-[#0a0a0a] text-amber-600 dark:text-amber-400 hover:text-stone-900 dark:hover:text-white border border-amber-500/30'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterStatus('out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
              filterStatus === 'out'
                ? 'bg-rose-600 dark:bg-rose-500 text-white'
                : 'bg-stone-100 dark:bg-[#0a0a0a] text-rose-600 dark:text-rose-400 hover:text-stone-900 dark:hover:text-white border border-rose-500/30'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
          <button
            onClick={() => setFilterStatus('healthy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
              filterStatus === 'healthy'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 dark:bg-[#0a0a0a] text-emerald-600 dark:text-emerald-400 hover:text-stone-900 dark:hover:text-white border border-emerald-500/30'
            }`}
          >
            Healthy ({healthyCount})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059] animate-spin mx-auto" />
            <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono">Loading inventory ledger...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-12 h-12 text-stone-400 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-serif font-semibold text-stone-700 dark:text-zinc-300">No matching fragrances found</h3>
            <p className="text-xs text-stone-500 dark:text-zinc-500">Try adjusting your search query or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 dark:bg-[#0a0a0a] text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider font-mono border-b border-stone-200 dark:border-[#c5a059]/20">
                <tr>
                  <th className="py-4 px-4">Fragrance & SKU</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Stock Status</th>
                  <th className="py-4 px-4 text-center">Adjust Quantity</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-[#c5a059]/10 text-stone-700 dark:text-zinc-300">
                {filteredProducts.map((p) => {
                  const currentInputValue = stockInputs[p.id] !== undefined ? stockInputs[p.id] : String(p.stock);
                  const isChanged = currentInputValue !== String(p.stock);
                  const isUpdating = updatingStockId === p.id;

                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      In Stock ({p.stock})
                    </span>
                  );

                  if (p.stock === 0) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                        <PackageX className="w-3 h-3" /> Out of Stock
                      </span>
                    );
                  } else if (p.stock <= 10) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Low ({p.stock} left)
                      </span>
                    );
                  }

                  return (
                    <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-[#0a0a0a]/50 transition-colors">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={(p.images && p.images[0]?.trim()) || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=200'}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-zinc-200 flex items-center gap-1.5 flex-wrap">
                              <span>{p.name}</span>
                              {p.isBundle && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#9a7229]/15 dark:bg-[#c5a059]/20 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider font-mono font-bold">
                                  Bundle ({p.requiredSelectionCount || 2})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-stone-500 dark:text-zinc-500">
                              SKU: {p.sku} | {p.size}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-stone-600 dark:text-zinc-400">{p.category}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-[#9a7229] dark:text-[#c5a059]">
                        PKR {p.price.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">{statusBadge}</td>

                      {/* Stock Adjustment Controls */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleQuickAdjust(p.id, -5)}
                            className="px-1.5 py-1 rounded bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-[10px] font-mono text-stone-600 dark:text-zinc-400"
                            title="Subtract 5"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(p.id, -1)}
                            className="p-1 rounded bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-stone-700 dark:text-zinc-300"
                            title="Subtract 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min={0}
                            value={currentInputValue}
                            onChange={(e) => handleStockInputChange(p.id, e.target.value)}
                            className="w-16 text-center bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-lg py-1 px-2 font-mono text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                          />

                          <button
                            onClick={() => handleQuickAdjust(p.id, 1)}
                            className="p-1 rounded bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-stone-700 dark:text-zinc-300"
                            title="Add 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(p.id, 5)}
                            className="px-1.5 py-1 rounded bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-[10px] font-mono text-stone-600 dark:text-zinc-400"
                            title="Add 5"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Save Button & Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSaveStock(p)}
                            disabled={!isChanged || isUpdating}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                              isChanged
                                ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:bg-[#7a581d] dark:hover:bg-[#d4af37] shadow-md'
                                : 'bg-stone-100 dark:bg-[#0a0a0a] text-stone-400 dark:text-zinc-600 border border-stone-200 dark:border-zinc-800 cursor-not-allowed'
                            }`}
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{isUpdating ? 'Saving...' : 'Update'}</span>
                          </button>

                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded-lg bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 hover:bg-[#9a7229]/10 dark:hover:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059]"
                            title="Full Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
