import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, AlertCircle, Send, User, Sparkles } from 'lucide-react';
import { ProductReview } from '../types';
import { apiFetch } from '../lib/api';
import { useCart } from '../context/CartContext';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onRatingUpdated?: (avgRating: number, reviewCount: number) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  onShowToast,
  onRatingUpdated
}) => {
  const { storeSettings } = useCart();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ success: boolean; reviews: ProductReview[] }>(
        `/api/products/${productId}/reviews`
      );
      if (res.success && res.reviews) {
        setReviews(res.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    setSubmitSuccess(false);
    setShowForm(false);
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Please provide your name.', 'error');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      onShowToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      onShowToast('Please share your thoughts (minimum 5 characters).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string; review: ProductReview }>(
        `/api/products/${productId}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({
            customerName: name.trim(),
            customerEmail: email.trim(),
            rating,
            title: title.trim(),
            comment: comment.trim()
          })
        }
      );

      if (res.success) {
        setSubmitSuccess(true);
        onShowToast('Thank you! Your review has been published.', 'success');
        setName('');
        setEmail('');
        setTitle('');
        setComment('');
        setRating(5);
        fetchReviews();
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate rating stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : 5.0;

  const starCounts = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : star === 5 ? 100 : 0;
    return { star, count, percentage };
  });

  const ratingDescriptions: Record<number, string> = {
    5: 'Exceptional — Exquisite Sillage & Longevity',
    4: 'Very Good — Delightful Olfactory Balance',
    3: 'Average — Pleasing Daily Wear',
    2: 'Below Expectations',
    1: 'Disappointing'
  };

  return (
    <div className="space-y-8 pt-12 border-t border-stone-200 dark:border-[#c5a059]/20" id="customer-reviews-section">
      {/* Header & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Customer Impressions</span>
          </span>
          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Customer Fragrance Reviews
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setSubmitSuccess(false);
          }}
          className="px-6 py-3 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{showForm ? 'Close Review Form' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Ratings Summary Card */}
      <div className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Average Rating Score */}
          <div className="md:col-span-4 text-center md:border-r border-stone-200 dark:border-[#c5a059]/20 md:pr-6 space-y-2">
            <div className="text-5xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300 dark:text-zinc-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono">
              Based on {totalReviews} {totalReviews === 1 ? 'connoisseur review' : 'customer reviews'}
            </p>
          </div>

          {/* Breakdown Bars */}
          <div className="md:col-span-8 space-y-2 md:pl-2">
            {starCounts.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-12 shrink-0 font-mono text-stone-700 dark:text-zinc-300">
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2 bg-stone-100 dark:bg-[#202020] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#9a7229] to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-stone-500 dark:text-zinc-500 text-[11px]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Submission Form Drawer / Card */}
      {showForm && (
        <div className="bg-stone-50 dark:bg-[#121212] border border-[#9a7229]/30 dark:border-[#c5a059]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md transition-all">
          <div className="border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
              Share Your Experience with {productName}
            </h3>
            <p className="text-xs text-stone-600 dark:text-zinc-400 mt-1">
              Your feedback guides other fragrance lovers and helps {storeSettings?.storeName || 'our maison'} maintain peerless perfumery standards.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h4 className="text-base font-serif font-bold text-emerald-800 dark:text-emerald-300">
                Review Published Successfully!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Thank you for reviewing {productName}. Your review is now visible below.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#9a7229] dark:text-[#c5a059] flex items-center justify-between">
                  <span>Overall Rating *</span>
                  <span className="text-[11px] font-mono font-normal text-stone-500 dark:text-zinc-400">
                    {ratingDescriptions[hoverRating || rating]}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300 dark:text-zinc-700 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Al-Mansoor"
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    Your Email (Verified Purchase) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. tariq@example.com"
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                  />
                  <p className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">
                    One review allowed per verified email address.
                  </p>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Incomparable Royal Cambodian Scent — Lasts 14+ Hours!"
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                />
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                  Detailed Experience & Olfactory Impressions *
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the projection, note transitions, dry-down, and occasions you wear this fragrance..."
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] resize-none"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 dark:text-zinc-500">
                  <span>Minimum 5 characters</span>
                  <span>{comment.length} characters</span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-28 bg-white dark:bg-[#141414] rounded-2xl animate-pulse border border-stone-200 dark:border-[#c5a059]/10" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 bg-white dark:bg-[#141414] border border-dashed border-stone-300 dark:border-zinc-800 rounded-2xl text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-stone-400 dark:text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-stone-700 dark:text-zinc-300">
              No customer reviews yet for {productName}.
            </p>
            <p className="text-xs text-stone-500 dark:text-zinc-500">
              Be the first connoisseur to share your fragrance impressions!
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] text-xs font-bold uppercase tracking-wider hover:bg-[#9a7229]/20 transition-all cursor-pointer"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const reviewDate = new Date(rev.createdAt || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={rev.id}
                  className="bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/15 rounded-2xl p-5 space-y-3 shadow-xs hover:border-[#9a7229]/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#9a7229]/15 dark:bg-[#c5a059]/20 flex items-center justify-center text-[#9a7229] dark:text-[#c5a059] font-bold text-xs">
                        {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-xs text-stone-900 dark:text-[#f5f5f1]">
                            {rev.customerName}
                          </span>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                              <CheckCircle className="w-2.5 h-2.5" />
                              Verified Buyer
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
                          {reviewDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300 dark:text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.title && (
                    <h4 className="text-xs font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
                      {rev.title}
                    </h4>
                  )}

                  <p className="text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
