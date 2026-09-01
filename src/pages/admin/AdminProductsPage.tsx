import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, RefreshCw, Star } from 'lucide-react';
import { Product } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminProductsPageProps {
  onOpenAddProduct?: () => void;
  onOpenEditProduct?: (product: Product) => void;
  onEditProduct?: (productId?: string) => void;
  onNavigateToBestSellers?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminProductsPage: React.FC<AdminProductsPageProps> = ({
  onOpenAddProduct = () => {},
  onOpenEditProduct,
  onEditProduct,
  onNavigateToBestSellers,
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {}
}) => {
  const handleAddProduct = () => {
    if (onOpenAddProduct) onOpenAddProduct();
    else if (onEditProduct) onEditProduct();
  };

  const handleEditProduct = (product: Product) => {
    if (onOpenEditProduct) {
      onOpenEditProduct(product);
    } else if (onEditProduct) {
      onEditProduct(product.id);
    }
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; products: Product[] }>('/api/products?includeInactive=true');
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch products list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleActive = async (product: Product) => {
    try {
      const updatedProduct = { ...product, isActive: !product.isActive };
      const res = await apiFetch(`/api/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedProduct)
      });
      if (res.success) {
        onShowToast(`Product "${product.name}" is now ${updatedProduct.isActive ? 'Active' : 'Inactive'}.`, 'success');
        fetchProducts();
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update active state.', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/products/${deleteProductTarget.id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        onShowToast(`Deleted fragrance "${deleteProductTarget.name}".`, 'success');
        setDeleteProductTarget(null);
        fetchProducts();
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete product.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.notes.top.some((n) => n.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categoriesList = ['All', 'Oud', 'Attars', 'Perfumes'];

  return (
    <div className="space-y-6 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-1 sm:p-2">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#c5a059]/20 pb-6">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">Maison Inventory</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">Products Catalog ({products.length})</h1>
        </div>
        <div className="flex items-center gap-3">
          {onNavigateToBestSellers && (
            <button
              type="button"
              onClick={onNavigateToBestSellers}
              className="px-3.5 py-2.5 rounded-xl bg-stone-200/80 dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-200 font-semibold text-xs uppercase tracking-wider hover:bg-stone-300 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Star className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
              <span>Best Sellers Control</span>
            </button>
          )}
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          </button>
          <button
            onClick={handleAddProduct}
            className="px-4 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-colors flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fragrance</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, or fragrance note..."
            className="w-full bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] pl-10 shadow-sm"
          />
          <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3.5 top-3" />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] shadow-sm cursor-pointer"
        >
          {categoriesList.map((c) => (
            <option key={c} value={c} className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 rounded-xl bg-stone-200 dark:bg-[#1a1a1a] animate-pulse border border-stone-200 dark:border-[#c5a059]/10" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-12 text-center space-y-2 shadow-sm">
          <h3 className="text-lg font-serif text-stone-900 dark:text-[#f5f5f1]">No Fragrances Found</h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400">Try clearing your search query or adding a new fragrance.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile / Tablet Touch-Optimized Cards (Tap entire card to Edit Product) */}
          <div className="block lg:hidden space-y-3">
            <div className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 px-1 flex items-center justify-between">
              <span>Tap any fragrance card to edit</span>
              <span>{filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}</span>
            </div>

            {filteredProducts.map((p) => (
              <div
                key={p.id}
                id={`mobile-product-card-${p.id}`}
                onClick={() => handleEditProduct(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleEditProduct(p);
                  }
                }}
                className="group relative bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#9a7229] dark:hover:border-[#c5a059] transition-all cursor-pointer select-none active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#9a7229]/30"
              >
                {/* Header with image, details, and price */}
                <div className="flex items-start gap-3">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300'}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-sans font-bold text-sm text-stone-900 dark:text-zinc-100 group-hover:text-[#9a7229] dark:group-hover:text-[#c5a059] transition-colors leading-tight">
                        {p.name}
                      </h3>
                      <div className="font-mono font-bold text-xs text-[#9a7229] dark:text-[#c5a059] shrink-0">
                        Rs. {p.price.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
                        SKU: <strong className="text-stone-700 dark:text-zinc-300">{p.sku}</strong>
                      </span>
                      <span className="text-stone-300 dark:text-stone-700">•</span>
                      <span className="text-[11px] text-stone-600 dark:text-zinc-400 font-medium">
                        {p.category}
                      </span>
                      {p.size && (
                        <>
                          <span className="text-stone-300 dark:text-stone-700">•</span>
                          <span className="text-[10px] text-stone-500 dark:text-zinc-500">{p.size}</span>
                        </>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {p.fragranceType && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-stone-100 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 text-stone-600 dark:text-zinc-400 font-mono">
                          {p.fragranceType}
                        </span>
                      )}
                      {p.collectionPlacement === 'our' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 uppercase tracking-wider font-mono font-bold">
                          Our Collection
                        </span>
                      )}
                      {p.collectionPlacement === 'both' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 uppercase tracking-wider font-mono font-bold">
                          Both
                        </span>
                      )}
                      {p.isBundle && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#9a7229]/15 dark:bg-[#c5a059]/20 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider font-mono font-bold">
                          Bundle ({p.requiredSelectionCount || 2})
                        </span>
                      )}
                      {(p.isBestseller || p.is_bestseller) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 uppercase tracking-widest font-mono">
                          Best Seller
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Stock, Status, Edit, Delete */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-[#c5a059]/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
                      Stock:{' '}
                      <strong className={`font-bold ${p.stock <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {p.stock}
                      </strong>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(p);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold border transition-all ${
                        p.isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-stone-100 dark:bg-[#0a0a0a] border-stone-300 dark:border-[#c5a059]/20 text-stone-500 dark:text-zinc-500'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(p);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 hover:bg-[#9a7229]/10 dark:hover:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] text-xs font-semibold flex items-center gap-1 shadow-sm"
                      title="Edit Fragrance"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteProductTarget(p);
                      }}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-[#0a0a0a] border border-rose-300 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 shadow-sm"
                      title="Delete Fragrance"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (lg: screens and above) */}
          <div className="hidden lg:block bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-stone-600 dark:text-zinc-400 uppercase bg-stone-100 dark:bg-[#0a0a0a] border-b border-stone-200 dark:border-[#c5a059]/20">
                  <tr>
                    <th className="py-3.5 px-4">Fragrance</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-[#c5a059]/10 text-stone-700 dark:text-zinc-300">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-[#0a0a0a]/50 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300'}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                        />
                        <div>
                          <div className="font-sans font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
                            <span>{p.name}</span>
                            {p.collectionPlacement === 'our' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 uppercase tracking-wider font-mono font-bold">
                                Our Collection
                              </span>
                            )}
                            {p.collectionPlacement === 'both' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 uppercase tracking-wider font-mono font-bold">
                                Both Collections
                              </span>
                            )}
                            {p.isBundle && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#9a7229]/15 dark:bg-[#c5a059]/20 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider font-mono font-bold">
                                Bundle ({p.requiredSelectionCount || 2})
                              </span>
                            )}
                            {(p.isBestseller || p.is_bestseller) && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 uppercase tracking-widest font-mono">
                                Best Seller
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-zinc-500">{p.size}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#9a7229] dark:text-[#c5a059] font-bold">{p.sku}</td>
                      <td className="py-3 px-4">{p.category}</td>
                      <td className="py-3 px-4">{p.fragranceType}</td>
                      <td className="py-3 px-4 font-bold text-stone-900 dark:text-[#f5f5f1]">Rs. {p.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${p.stock <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold border transition-all ${
                            p.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-stone-100 dark:bg-[#0a0a0a] border-stone-300 dark:border-[#c5a059]/20 text-stone-500 dark:text-zinc-500'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="p-1.5 rounded bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 hover:bg-[#9a7229]/10 dark:hover:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059]"
                          title="Edit Fragrance"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteProductTarget(p)}
                          className="p-1.5 rounded bg-stone-100 dark:bg-[#0a0a0a] border border-rose-300 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400"
                          title="Delete Fragrance"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Delete Fragrance</h3>
            <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#9a7229] dark:text-[#c5a059]">{deleteProductTarget.name}</strong> ({deleteProductTarget.sku})? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteProductTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-xs font-semibold text-stone-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold uppercase tracking-wider text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
