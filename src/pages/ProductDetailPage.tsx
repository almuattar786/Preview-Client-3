import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, Sparkles, Check, Heart, Star } from 'lucide-react';
import { Product, SelectedBundleFragrance, ProductSizeOption } from '../types';
import { useCart } from '../context/CartContext';
import { FragranceNotesBadge } from '../components/FragranceNotesBadge';
import { ProductCard } from '../components/ProductCard';
import { BundleCustomizer } from '../components/BundleCustomizer';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { SEO } from '../components/SEO';
import { apiFetch } from '../lib/api';

interface ProductDetailPageProps {
  product: Product;
  onBackToShop: () => void;
  onViewDetails: (product: Product) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBackToShop,
  onViewDetails,
  onShowToast
}) => {
  const { addToCart, storeSettings } = useCart();
  const storeName = storeSettings?.storeName || "Al-Mu'attar";
  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const [selectedSizeOption, setSelectedSizeOption] = useState<ProductSizeOption | null>(() => {
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      return product.sizeOptions.find((so) => so.isDefault) || product.sizeOptions[0];
    }
    return null;
  });

  useEffect(() => {
    setSelectedImage(product.images[0] || '');
    setQuantity(1);
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      setSelectedSizeOption(product.sizeOptions.find((so) => so.isDefault) || product.sizeOptions[0]);
    } else {
      setSelectedSizeOption(null);
    }

    const fetchRelated = async () => {
      try {
        const res = await apiFetch<{ success: boolean; products: Product[] }>(
          `/api/products?category=${encodeURIComponent(product.category)}`
        );
        if (res.success) {
          setRelatedProducts(res.products.filter((p) => p.id !== product.id).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load related products:', err);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [product]);

  const currentPrice = selectedSizeOption ? selectedSizeOption.price : product.price;
  const currentComparePrice = selectedSizeOption?.compareAtPrice !== undefined ? selectedSizeOption.compareAtPrice : product.compareAtPrice;
  const currentStock = selectedSizeOption?.stock !== undefined ? selectedSizeOption.stock : product.stock;
  const isOutOfStock = currentStock <= 0;
  const hasDiscount = currentComparePrice !== undefined && currentComparePrice > currentPrice;

  const handleQuantityChange = (delta: number) => {
    const nextQty = quantity + delta;
    if (nextQty >= 1 && nextQty <= (currentStock > 0 ? currentStock : 1)) {
      setQuantity(nextQty);
    }
  };

  const handleAddToCart = () => {
    if (currentStock <= 0) {
      onShowToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }
    if (selectedSizeOption) {
      addToCart(product, quantity, undefined, {
        size: selectedSizeOption.size,
        price: selectedSizeOption.price,
        stock: selectedSizeOption.stock
      });
      onShowToast(`Added ${quantity}x "${product.name} (${selectedSizeOption.size})" to cart.`, 'success');
    } else {
      addToCart(product, quantity);
      onShowToast(`Added ${quantity}x "${product.name}" to cart.`, 'success');
    }
  };

  const handleAddBundleToCart = (selectedFragrances: SelectedBundleFragrance[]) => {
    if (currentStock <= 0) {
      onShowToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }
    addToCart(product, quantity, selectedFragrances);
    onShowToast(`Added ${quantity}x "${product.name}" custom bundle to cart!`, 'success');
  };
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://almuattar.com';

  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': product.images,
    'description': product.shortDescription || product.description,
    'brand': {
      '@type': 'Brand',
      'name': storeName
    },
    'category': product.category,
    'sku': product.id,
    'offers': {
      '@type': 'Offer',
      'url': `${origin}/product/${product.id}`,
      'priceCurrency': 'PKR',
      'price': product.price,
      'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'itemCondition': 'https://schema.org/NewCondition'
    }
  };

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 transition-colors">
      {/* SEO Engine */}
      <SEO
        title={`${product.name} | ${product.category} | ${storeName}`}
        description={product.shortDescription || product.description?.slice(0, 155) || `Buy ${product.name} luxury fragrance online with Cash on Delivery in Pakistan.`}
        canonicalPath={`/product/${product.id}`}
        ogType="product"
        ogImage={product.images[0]}
        structuredData={productStructuredData}
      />
      {/* Back button navigation */}
      <div>
        <button
          onClick={onBackToShop}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </button>
      </div>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-white dark:bg-[#141414] rounded-2xl overflow-hidden border border-stone-200 dark:border-[#c5a059]/20 shadow-xl dark:shadow-2xl">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
              alt={product.name}
              referrerPolicy="no-referrer"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
            {product.isFeatured && (
              <span className="absolute top-4 left-4 bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                Featured Signature
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images && product.images.filter(img => Boolean(img && img.trim())).length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.filter(img => Boolean(img && img.trim())).map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === imgUrl ? 'border-[#9a7229] dark:border-[#c5a059] opacity-100' : 'border-stone-300 dark:border-[#c5a059]/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Specifications & Actions */}
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-mono text-[#9a7229] dark:text-[#c5a059] font-semibold uppercase tracking-widest">
              <span>{product.brand}</span>
              <span>•</span>
              <span>{product.category}</span>
              <span>•</span>
              <span>{product.gender}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars Summary Link */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(product.averageRating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300 dark:text-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-mono font-bold text-stone-800 dark:text-zinc-200">
                {(product.averageRating || 5.0).toFixed(1)}
              </span>
              <span className="text-stone-400 dark:text-zinc-600">•</span>
              <a
                href="#customer-reviews-section"
                className="text-xs font-medium text-[#9a7229] dark:text-[#c5a059] hover:underline cursor-pointer"
              >
                {product.reviewCount ? `${product.reviewCount} customer reviews` : 'Customer Reviews'}
              </a>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[#9a7229] dark:text-[#c5a059]">
                  Rs. {currentPrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-base font-mono text-stone-400 dark:text-zinc-500 line-through">
                    Rs. {currentComparePrice!.toLocaleString()}
                  </span>
                )}
              </div>

              {isOutOfStock ? (
                <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-xs font-semibold px-3 py-1 rounded-full">
                  Out of Stock
                </span>
              ) : (
                <span className="bg-[#9a7229]/10 dark:bg-[#c5a059]/10 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-xs font-semibold px-3 py-1 rounded-full">
                  In Stock ({currentStock} available)
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-stone-700 dark:text-zinc-300 font-light leading-relaxed">
            {product.description}
          </p>

          {/* If bundle: Render Interactive Bundle Customizer */}
          {product.isBundle ? (
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                  Bundle Package Quantity:
                </span>
                <div className="flex items-center border border-stone-300 dark:border-[#c5a059]/30 rounded-xl bg-white dark:bg-[#1a1a1a] p-1">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-8 h-8 flex items-center justify-center text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono font-semibold text-stone-900 dark:text-[#f5f5f1] text-xs">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= currentStock || isOutOfStock}
                    className="w-8 h-8 flex items-center justify-center text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <BundleCustomizer
                bundleProduct={product}
                quantity={quantity}
                onAddToCart={handleAddBundleToCart}
                onShowToast={onShowToast}
              />
            </div>
          ) : (
            <>
              {/* Multiple Size Selection Options */}
              {product.sizeOptions && product.sizeOptions.length > 1 ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-[#f5f5f1]">
                      Select Bottle Size:
                    </span>
                    {selectedSizeOption && (
                      <span className="font-mono text-[#9a7229] dark:text-[#c5a059] font-bold">
                        {selectedSizeOption.size} • Rs. {selectedSizeOption.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {product.sizeOptions.map((opt) => {
                      const isSelected = selectedSizeOption?.size === opt.size;
                      const isOptOutOfStock = opt.stock !== undefined && opt.stock <= 0;

                      return (
                        <button
                          key={opt.size}
                          type="button"
                          onClick={() => {
                            setSelectedSizeOption(opt);
                            setQuantity(1);
                          }}
                          disabled={isOptOutOfStock}
                          className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#9a7229] dark:border-[#c5a059] bg-[#9a7229]/10 dark:bg-[#c5a059]/15 shadow-sm ring-1 ring-[#9a7229] dark:ring-[#c5a059]'
                              : isOptOutOfStock
                              ? 'border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-[#121212] opacity-50 cursor-not-allowed'
                              : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#141414] hover:border-[#9a7229]/50 dark:hover:border-[#c5a059]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold ${isSelected ? 'text-[#9a7229] dark:text-[#c5a059]' : 'text-stone-900 dark:text-[#f5f5f1]'}`}>
                              {opt.size}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                            )}
                          </div>

                          <div className="pt-1.5 flex items-baseline justify-between gap-1">
                            <span className="text-xs font-mono font-bold text-stone-800 dark:text-zinc-200">
                              Rs. {opt.price.toLocaleString()}
                            </span>
                            {opt.compareAtPrice && opt.compareAtPrice > opt.price && (
                              <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500 line-through">
                                Rs. {opt.compareAtPrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {isOptOutOfStock && (
                            <span className="text-[10px] font-mono text-rose-500 mt-1">
                              Out of Stock
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                product.size && (
                  <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-zinc-400 font-mono">
                    <span className="font-semibold text-stone-900 dark:text-zinc-200">Bottle Size:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#141414] border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-[#f5f5f1]">
                      {product.size}
                    </span>
                  </div>
                )
              )}

              {/* Fragrance Notes Pyramid */}
              <FragranceNotesBadge notes={product.notes} />

              {/* Actions Bar */}
              <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-[#c5a059]/20">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center border border-stone-300 dark:border-[#c5a059]/30 rounded-xl bg-white dark:bg-[#1a1a1a] p-1">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="w-10 h-10 flex items-center justify-center text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-mono font-semibold text-stone-900 dark:text-[#f5f5f1] text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= currentStock || isOutOfStock}
                      className="w-10 h-10 flex items-center justify-center text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      isOutOfStock
                        ? 'bg-stone-200 dark:bg-[#262626] text-stone-500 dark:text-zinc-500 cursor-not-allowed'
                        : 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:bg-[#7a581d] dark:hover:bg-[#d4af37] active:scale-95'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isOutOfStock
                        ? 'Sold Out'
                        : `Add ${quantity} to Cart • Rs. ${(currentPrice * quantity).toLocaleString()}`}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200 dark:border-[#c5a059]/15 text-xs text-stone-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
              <span>100% Authentic Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
              <span>Nationwide Fast Courier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Product Reviews Section */}
      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        onShowToast={onShowToast}
      />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-8 pt-12 border-t border-stone-200 dark:border-[#c5a059]/20">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-widest font-semibold">
              Fragrance Pairing
            </span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
              More From {product.category}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onViewDetails={onViewDetails}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
