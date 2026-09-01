import React, { useState, useEffect } from 'react';
import {
  Star,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  X
} from 'lucide-react';
import { ProductReview, Product } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminReviewsPageProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onNavigateToProduct?: (productId: string) => void;
}

export const AdminReviewsPage: React.FC<AdminReviewsPageProps> = ({
  onShowToast = () => {},
  onNavigateToProduct
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [deletingReview, setDeletingReview] = useState<ProductReview | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, productsRes] = await Promise.all([
        apiFetch<{ success: boolean; reviews: ProductReview[] }>('/api/admin/reviews'),
        apiFetch<{ success: boolean; products: Product[] }>('/api/products?includeInactive=true')
      ]);

      if (reviewsRes.success && reviewsRes.reviews) {
        setReviews(reviewsRes.reviews);
      }
      if (productsRes.success && productsRes.products) {
        setProducts(productsRes.products);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    setActionLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        `/api/admin/reviews/${deletingReview.id}`,
        { method: 'DELETE' }
      );
      if (res.success) {
        onShowToast('Review removed successfully and product rating recalculated.', 'success');
        setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
        setDeletingReview(null);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete review.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Map product metadata
  const productMap = new Map<string, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  const filteredReviews = reviews.filter((rev) => {
    const product = productMap.get(rev.productId);
    const productName = product?.name || rev.productName || '';

    const matchesSearch =
      search.trim() === '' ||
      rev.customerName.toLowerCase().includes(search.toLowerCase()) ||
      rev.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      rev.comment.toLowerCase().includes(search.toLowerCase()) ||
      (rev.title && rev.title.toLowerCase().includes(search.toLowerCase())) ||
      productName.toLowerCase().includes(search.toLowerCase());

    const matchesRating =
      ratingFilter === 'All' || rev.rating === Number(ratingFilter);

    const matchesProduct =
      productFilter === 'All' || rev.productId === productFilter;

    return matchesSearch && matchesRating && matchesProduct;
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const criticalCount = reviews.filter((r) => r.rating <= 2).length;

  return (
    <div className="space-y-6 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-1 sm:p-2">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#c5a059]/20 pb-6">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">
            Customer Feedback
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Customer Reviews Management ({totalReviews})
          </h1>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white shadow-sm flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
        >
          <RefreshCw className={`w-4 h-4 text-[#9a7229] dark:text-[#c5a059] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Reviews
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] mt-1">
            {totalReviews}
          </div>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            Average Score
          </div>
          <div className="text-2xl font-serif font-bold text-[#9a7229] dark:text-[#c5a059] mt-1 flex items-center gap-1.5">
            <span>{avgRating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            5-Star Praise
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {fiveStarCount}
          </div>
        </div>

        <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            Critical (1-2 Stars)
          </div>
          <div className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-1">
            {criticalCount}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviewer name, email, fragrance, or review text..."
            className="w-full bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] pl-10 shadow-sm"
          />
          <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3.5 top-3" />
        </div>

        <div className="sm:col-span-3">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] shadow-sm cursor-pointer"
          >
            <option value="All">All Star Ratings</option>
            <option value="5">5 Stars (Masterpiece)</option>
            <option value="4">4 Stars (Very Good)</option>
            <option value="3">3 Stars (Good)</option>
            <option value="2">2 Stars (Fair)</option>
            <option value="1">1 Star (Disappointing)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] shadow-sm cursor-pointer truncate"
          >
            <option value="All">All Fragrances</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-stone-100 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquare className="w-12 h-12 text-stone-300 dark:text-zinc-700 mx-auto" />
            <p className="text-sm font-semibold text-stone-700 dark:text-zinc-300">
              No customer reviews found matching your filters.
            </p>
            <p className="text-xs text-stone-500 dark:text-zinc-500">
              Try adjusting your search terms or clearing selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 dark:text-zinc-300">
              <thead className="bg-stone-50 dark:bg-[#101010] border-b border-stone-200 dark:border-[#c5a059]/20 font-serif font-bold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Fragrance</th>
                  <th className="py-3.5 px-4">Reviewer</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Review Details</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                {filteredReviews.map((rev) => {
                  const product = productMap.get(rev.productId);
                  const productName = product?.name || rev.productName || 'Unknown Fragrance';
                  const productImage = product?.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';

                  const dateStr = new Date(rev.createdAt || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={rev.id} className="hover:bg-stone-50 dark:hover:bg-[#0a0a0a]/60 transition-colors">
                      {/* Fragrance info */}
                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={productImage}
                            alt={productName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-serif font-bold text-stone-900 dark:text-[#f5f5f1] block truncate">
                              {productName}
                            </span>
                            {product && onNavigateToProduct && (
                              <button
                                type="button"
                                onClick={() => onNavigateToProduct(product.id)}
                                className="text-[10px] text-[#9a7229] dark:text-[#c5a059] hover:underline inline-flex items-center gap-1 font-mono cursor-pointer"
                              >
                                <span>Edit Fragrance</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reviewer info */}
                      <td className="py-4 px-4 min-w-[160px]">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <span>{rev.customerName}</span>
                            {rev.isVerifiedPurchase && (
                              <span className="text-emerald-600 dark:text-emerald-400" title="Verified Customer">
                                <CheckCircle2 className="w-3.5 h-3.5 inline" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-stone-500 dark:text-zinc-500">
                            {rev.customerEmail}
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300 dark:text-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400 block mt-0.5">
                          {rev.rating} / 5 Stars
                        </span>
                      </td>

                      {/* Review text */}
                      <td className="py-4 px-4 max-w-md">
                        <div className="space-y-1">
                          {rev.title && (
                            <div className="font-serif font-bold text-stone-900 dark:text-[#f5f5f1] text-xs">
                              {rev.title}
                            </div>
                          )}
                          <p className="text-xs text-stone-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                            {rev.comment}
                          </p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 font-mono text-[11px] text-stone-500 dark:text-zinc-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeletingReview(rev)}
                          className="p-2 rounded-lg bg-stone-100 dark:bg-[#1a1a1a] border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/30 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-serif font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Delete Customer Review?</span>
              </div>
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-600 dark:text-zinc-300">
              <p>
                Are you sure you want to permanently delete the review by{' '}
                <strong className="text-stone-900 dark:text-[#f5f5f1]">{deletingReview.customerName}</strong>?
              </p>
              <div className="p-3 bg-stone-50 dark:bg-[#0a0a0a] rounded-xl border border-stone-200 dark:border-zinc-800 font-mono text-[11px] italic">
                "{deletingReview.comment}"
              </div>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                The product's average star rating and review count will be recalculated immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
