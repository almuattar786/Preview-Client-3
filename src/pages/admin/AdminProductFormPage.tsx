import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Sparkles, CheckSquare, Square, Package, Search, Check, Layers, Compass } from 'lucide-react';
import { Product, FragranceCategory, FragranceGender, FragranceType, BundleOption, ProductPlacement, ProductSizeOption } from '../../types';
import { apiFetch } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { ProductImageManager } from '../../components/admin/ProductImageManager';
import { BundleOptionsBuilder } from '../../components/admin/BundleOptionsBuilder';
import { ProductSizeOptionsManager, SizeOptionFormItem } from '../../components/admin/ProductSizeOptionsManager';

interface AdminProductFormPageProps {
  initialProduct?: Product | null;
  productId?: string | null;
  initialCategory?: string | null;
  onBack: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

const ALL_CATEGORIES: FragranceCategory[] = [
  'Perfumes',
  'Attars',
  'Oud'
];

export const AdminProductFormPage: React.FC<AdminProductFormPageProps> = ({
  initialProduct,
  productId,
  initialCategory,
  onBack,
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {}
}) => {
  const { storeSettings } = useCart();
  const [editingProduct, setEditingProduct] = useState<Product | null>(initialProduct || null);
  const [fetching, setFetching] = useState<boolean>(!initialProduct && Boolean(productId));

  const isEditing = Boolean(editingProduct || productId);

  // Dynamic available categories
  const dynamicCatNames = (storeSettings?.categories?.map((c) => c.name) || [])
    .filter((c) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(c));
  const availableCategories = Array.from(new Set([...dynamicCatNames, ...ALL_CATEGORIES]));

  const [name, setName] = useState(editingProduct?.name || '');
  const [slug, setSlug] = useState(editingProduct?.slug || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [shortDescription, setShortDescription] = useState(editingProduct?.shortDescription || '');

  // Collection Placement choice: 'shop' | 'our' | 'both'
  const [collectionPlacement, setCollectionPlacement] = useState<ProductPlacement>(
    editingProduct?.collectionPlacement || 'shop'
  );

  // 1. Numeric state stored as strings so '0' can be deleted completely
  const [priceInput, setPriceInput] = useState<string>(
    editingProduct?.price !== undefined && editingProduct.price > 0 ? String(editingProduct.price) : ''
  );
  const [compareAtPriceInput, setCompareAtPriceInput] = useState<string>(
    editingProduct?.compareAtPrice ? String(editingProduct.compareAtPrice) : ''
  );
  const [stockInput, setStockInput] = useState<string>(
    editingProduct?.stock !== undefined ? String(editingProduct.stock) : '10'
  );

  // 3. Multiple categories checkboxes
  const [selectedCategories, setSelectedCategories] = useState<FragranceCategory[]>(() => {
    if (editingProduct?.categories && editingProduct.categories.length > 0) {
      return editingProduct.categories;
    }
    if (editingProduct?.category) {
      return [editingProduct.category];
    }
    if (initialCategory) {
      return [initialCategory as FragranceCategory];
    }
    return ['Perfumes'];
  });

  const defaultStoreBrand = storeSettings?.storeName ? `${storeSettings.storeName} House` : "Al-Mu'attar House";
  const [brand, setBrand] = useState(editingProduct?.brand || defaultStoreBrand);
  const [size, setSize] = useState(editingProduct?.size || '50ml');
  const [sizeOptions, setSizeOptions] = useState<SizeOptionFormItem[]>(() => {
    if (editingProduct?.sizeOptions && editingProduct.sizeOptions.length > 0) {
      return editingProduct.sizeOptions.map((so, idx) => ({
        id: `size-${idx}-${Date.now()}`,
        size: so.size,
        price: String(so.price || ''),
        compareAtPrice: so.compareAtPrice ? String(so.compareAtPrice) : '',
        stock: so.stock !== undefined && so.stock !== null ? String(so.stock) : '10',
        sku: so.sku || '',
        isDefault: Boolean(so.isDefault || idx === 0)
      }));
    }
    return [];
  });
  const [fragranceType, setFragranceType] = useState<FragranceType>(editingProduct?.fragranceType || 'Eau de Parfum');
  const [gender, setGender] = useState<FragranceGender>(editingProduct?.gender || 'Unisex');
  const [sku, setSku] = useState(editingProduct?.sku || `AM-${Math.floor(100 + Math.random() * 900)}`);
  const [isFeatured, setIsFeatured] = useState<boolean>(editingProduct?.isFeatured || false);
  const [isBestseller, setIsBestseller] = useState<boolean>(editingProduct?.isBestseller || editingProduct?.is_bestseller || false);
  const [isActive, setIsActive] = useState<boolean>(editingProduct ? editingProduct.isActive : true);

  // Fragrance Bundle State
  const [isBundle, setIsBundle] = useState<boolean>(editingProduct?.isBundle || false);
  const [requiredSelectionCountInput, setRequiredSelectionCountInput] = useState<string>(
    editingProduct?.requiredSelectionCount ? String(editingProduct.requiredSelectionCount) : '2'
  );
  const [bundleBadge, setBundleBadge] = useState<string>(editingProduct?.bundleBadge || 'Discovery Set');
  const [eligibleProductIds, setEligibleProductIds] = useState<string[]>(editingProduct?.eligibleProductIds || []);
  const [bundleOptions, setBundleOptions] = useState<BundleOption[]>(editingProduct?.bundleOptions || []);
  const [bundleSearchTerm, setBundleSearchTerm] = useState<string>('');

  // 2. Empty notes by default when adding new fragrance
  const [topNotesInput, setTopNotesInput] = useState<string>(
    editingProduct?.notes?.top ? editingProduct.notes.top.join(', ') : ''
  );
  const [heartNotesInput, setHeartNotesInput] = useState<string>(
    editingProduct?.notes?.heart ? editingProduct.notes.heart.join(', ') : ''
  );
  const [baseNotesInput, setBaseNotesInput] = useState<string>(
    editingProduct?.notes?.base ? editingProduct.notes.base.join(', ') : ''
  );

  // Images state
  const [images, setImages] = useState<string[]>(
    editingProduct?.images && editingProduct.images.length > 0
      ? editingProduct.images
      : ['https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800']
  );

  // Existing store fragrances for reference by category
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    apiFetch<{ success: boolean; products: Product[] }>('/api/products')
      .then((res) => {
        if (res.success && res.products) {
          setAllProducts(res.products);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editingProduct && productId) {
      setFetching(true);
      apiFetch<{ success: boolean; product: Product }>(`/api/products/${productId}`)
        .then((res) => {
          if (res.success && res.product) {
            const p = res.product;
            setEditingProduct(p);
            setName(p.name);
            setSlug(p.slug);
            setDescription(p.description);
            setShortDescription(p.shortDescription || '');
            setPriceInput(p.price ? String(p.price) : '');
            setCompareAtPriceInput(p.compareAtPrice ? String(p.compareAtPrice) : '');
            
            if (p.categories && p.categories.length > 0) {
              setSelectedCategories(p.categories);
            } else if (p.category) {
              setSelectedCategories([p.category]);
            }

            setBrand(p.brand || "Al-Mu'attar House");
            setSize(p.size || '50ml');
            if (p.sizeOptions && p.sizeOptions.length > 0) {
              setSizeOptions(
                p.sizeOptions.map((so, idx) => ({
                  id: `size-${idx}-${Date.now()}`,
                  size: so.size,
                  price: String(so.price || ''),
                  compareAtPrice: so.compareAtPrice ? String(so.compareAtPrice) : '',
                  stock: so.stock !== undefined && so.stock !== null ? String(so.stock) : '10',
                  sku: so.sku || '',
                  isDefault: Boolean(so.isDefault || idx === 0)
                }))
              );
            } else {
              setSizeOptions([]);
            }
            setFragranceType(p.fragranceType || 'Extrait de Parfum');
            setGender(p.gender || 'Unisex');
            setStockInput(p.stock !== undefined && p.stock !== null ? String(p.stock) : '0');
            setSku(p.sku || '');
            setIsFeatured(p.isFeatured || false);
            setIsBestseller(p.isBestseller || p.is_bestseller || false);
            setIsActive(p.isActive);
            setCollectionPlacement(p.collectionPlacement || 'shop');

            // Sync bundle data
            setIsBundle(Boolean(p.isBundle));
            setRequiredSelectionCountInput(p.requiredSelectionCount ? String(p.requiredSelectionCount) : '2');
            setBundleBadge(p.bundleBadge || 'Discovery Set');
            setEligibleProductIds(p.eligibleProductIds || []);
            setBundleOptions(p.bundleOptions || []);

            setTopNotesInput(p.notes?.top ? p.notes.top.join(', ') : '');
            setHeartNotesInput(p.notes?.heart ? p.notes.heart.join(', ') : '');
            setBaseNotesInput(p.notes?.base ? p.notes.base.join(', ') : '');

            setImages(p.images && p.images.length > 0 ? p.images : ['']);
          }
        })
        .catch((err) => {
          onShowToast(err.message || 'Failed to load fragrance details.', 'error');
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [productId]);

  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing || !slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleToggleCategory = (cat: FragranceCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        onShowToast('Please select at least one category.', 'error');
        return;
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleToggleEligibleProduct = (prodId: string) => {
    if (eligibleProductIds.includes(prodId)) {
      setEligibleProductIds(eligibleProductIds.filter((id) => id !== prodId));
    } else {
      setEligibleProductIds([...eligibleProductIds, prodId]);
    }
  };

  const handleSelectAllEligible = (items: Product[]) => {
    const ids = items.map((i) => i.id);
    setEligibleProductIds(Array.from(new Set([...eligibleProductIds, ...ids])));
  };

  const handleClearEligible = () => {
    setEligibleProductIds([]);
  };

  const handleAddImageInput = () => {
    setImages([...images, '']);
  };

  const handleUpdateImageInput = (index: number, val: string) => {
    const updated = [...images];
    updated[index] = val;
    setImages(updated);
  };

  const handleRemoveImageInput = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(priceInput);
    if (!name.trim() || isNaN(price) || price <= 0 || !sku.trim()) {
      onShowToast('Please provide a valid fragrance name, price, and SKU.', 'error');
      return;
    }

    if (selectedCategories.length === 0) {
      onShowToast('Please select at least one category for this fragrance.', 'error');
      return;
    }

    const compareAtPrice = compareAtPriceInput.trim() !== '' ? parseFloat(compareAtPriceInput) : undefined;
    const stock = stockInput.trim() !== '' ? parseInt(stockInput, 10) : 0;
    const requiredSelectionCount = parseInt(requiredSelectionCountInput, 10) || 2;

    // Process and normalize size options
    const formattedSizeOptions = sizeOptions
      .filter((so) => so.size.trim() !== '' && !isNaN(parseFloat(so.price)) && parseFloat(so.price) > 0)
      .map((so) => ({
        size: so.size.trim(),
        price: parseFloat(so.price),
        compareAtPrice: so.compareAtPrice.trim() !== '' ? parseFloat(so.compareAtPrice) : undefined,
        stock: so.stock.trim() !== '' ? parseInt(so.stock, 10) : 0,
        sku: so.sku.trim(),
        isDefault: Boolean(so.isDefault)
      }));

    if (formattedSizeOptions.length > 0 && !formattedSizeOptions.some((so) => so.isDefault)) {
      formattedSizeOptions[0].isDefault = true;
    }

    let effectivePrice = price;
    let effectiveCompareAt = compareAtPrice;
    let effectiveStock = stock;
    let effectiveSize = size.trim() || '50ml';

    if (formattedSizeOptions.length > 0) {
      const defaultOption = formattedSizeOptions.find((so) => so.isDefault) || formattedSizeOptions[0];
      if (defaultOption) {
        effectivePrice = defaultOption.price;
        effectiveCompareAt = defaultOption.compareAtPrice;
        effectiveSize = defaultOption.size;
      }
      effectiveStock = formattedSizeOptions.reduce((acc, curr) => acc + curr.stock, 0);
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim(),
      shortDescription: shortDescription.trim(),
      price: effectivePrice,
      compareAtPrice: effectiveCompareAt,
      category: selectedCategories[0] || 'Perfumes',
      categories: selectedCategories,
      brand,
      size: effectiveSize,
      sizeOptions: formattedSizeOptions,
      fragranceType,
      gender,
      stock: effectiveStock,
      sku: sku.trim(),
      images: images.filter((img) => img.trim() !== ''),
      notes: {
        top: topNotesInput.split(',').map((n) => n.trim()).filter(Boolean),
        heart: heartNotesInput.split(',').map((n) => n.trim()).filter(Boolean),
        base: baseNotesInput.split(',').map((n) => n.trim()).filter(Boolean)
      },
      collectionPlacement,
      isFeatured,
      isBestseller,
      isActive,
      // Bundle parameters
      isBundle,
      requiredSelectionCount: isBundle ? Math.max(1, requiredSelectionCount) : undefined,
      eligibleProductIds: isBundle ? eligibleProductIds : [],
      bundleOptions: isBundle ? bundleOptions : [],
      bundleBadge: isBundle ? bundleBadge.trim() || 'Discovery Set' : undefined
    };

    setSubmitting(true);
    try {
      const targetId = editingProduct?.id || initialProduct?.id || productId;
      if (isEditing && targetId) {
        const res = await apiFetch<{ success: boolean }>(`/api/products/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          onShowToast('Fragrance updated successfully.', 'success');
          onBack();
        }
      } else {
        const res = await apiFetch<{ success: boolean }>('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          onShowToast('New fragrance created successfully.', 'success');
          onBack();
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error saving fragrance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-1 sm:p-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
        <div className="h-64 bg-white dark:bg-[#1a1a1a] rounded-2xl animate-pulse border border-stone-200 dark:border-[#c5a059]/10 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-1 sm:p-2">
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">Catalog Management</span>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            {isEditing ? `Edit: ${editingProduct?.name || name || 'Fragrance'}` : 'Add New Fragrance'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Overview Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-lg">
          <h3 className="text-sm font-serif font-semibold text-[#9a7229] dark:text-[#c5a059] border-b border-stone-200 dark:border-[#c5a059]/20 pb-2">
            1. Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Fragrance Name <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Imperial Oud Extrait"
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="imperial-oud-extrait"
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] font-mono placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Short Catchphrase / Subtitle
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="e.g. Majestic Royal Cambodian Oud infused with Taif Rose"
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Full Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed olfactory storytelling, scent evolution, and inspiration..."
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Pricing, Multi-Size Options & Inventory Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-2">
            <h3 className="text-sm font-serif font-semibold text-[#9a7229] dark:text-[#c5a059]">
              2. Pricing, Multi-Size Options & Inventory
            </h3>
            <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
              Set single size or configure multiple bottle sizes (e.g. 6ml, 12ml, 50ml, 100ml)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                {sizeOptions.length > 0 ? 'Primary / Starting Price (PKR)' : 'Retail Price (PKR)'} <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] font-mono placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Compare At Price (PKR)
              </label>
              <input
                type="number"
                min={0}
                value={compareAtPriceInput}
                onChange={(e) => setCompareAtPriceInput(e.target.value)}
                placeholder="e.g. 6000"
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] font-mono placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                {sizeOptions.length > 0 ? 'Overall Stock Quantity' : 'Stock Quantity'} <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                placeholder="e.g. 15"
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] font-mono placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                SKU Code <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] font-mono placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Primary Bottle Size / Volume
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="50ml / 1.7 oz"
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Fragrance Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Multiple Size & Price Variants Manager */}
          <div className="pt-4 border-t border-stone-200 dark:border-[#c5a059]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-serif font-bold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider">
                  Fragrance Bottle Sizes & Variant Pricing
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono mt-0.5">
                  Add multiple size options (e.g. 6ml, 12ml, 30ml, 50ml, 100ml) with custom prices and stock per size.
                </p>
              </div>
            </div>

            <ProductSizeOptionsManager
              sizeOptions={sizeOptions}
              onChange={setSizeOptions}
              basePrice={priceInput}
              baseStock={stockInput}
              baseSku={sku}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Categorization & Notes Pyramid */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-lg">
          <h3 className="text-sm font-serif font-semibold text-[#9a7229] dark:text-[#c5a059] border-b border-stone-200 dark:border-[#c5a059]/20 pb-2">
            3. Olfactory Classification & Multiple Categories
          </h3>

          {/* Multiple Categories Checkboxes */}
          <div className="space-y-3 bg-stone-50 dark:bg-[#0a0a0a] p-4 rounded-xl border border-stone-200 dark:border-[#c5a059]/15">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider">
                Fragrance Categories (Select All That Apply) <span className="text-[#9a7229] dark:text-[#c5a059]">*</span>
              </label>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                Selected: {selectedCategories.length} category
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {availableCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border-[#9a7229] dark:border-[#c5a059] text-[#9a7229] dark:text-[#f5f5f1] font-semibold'
                        : 'bg-white dark:bg-[#141414] border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-400 hover:border-[#9a7229]/40 dark:hover:border-[#c5a059]/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent button
                      className="w-4 h-4 accent-[#9a7229] dark:accent-[#c5a059] rounded cursor-pointer"
                    />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtered List of Existing Fragrances for Selected Category */}
          {selectedCategories.length > 0 && (
            <div className="bg-stone-50 dark:bg-[#0a0a0a] p-4 rounded-xl border border-stone-200 dark:border-[#c5a059]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#9a7229] dark:text-[#c5a059]">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-serif font-bold uppercase tracking-wider">
                    Existing Fragrances in {selectedCategories[0]}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400">
                  {
                    allProducts.filter(
                      (p) =>
                        p.category === selectedCategories[0] ||
                        (p.categories && p.categories.includes(selectedCategories[0]))
                    ).length
                  }{' '}
                  fragrances
                </span>
              </div>

              {(() => {
                const categoryFragrances = allProducts.filter(
                  (p) =>
                    p.category === selectedCategories[0] ||
                    (p.categories && p.categories.includes(selectedCategories[0]))
                );

                if (categoryFragrances.length === 0) {
                  return (
                    <p className="text-xs text-stone-500 dark:text-zinc-500 font-mono italic">
                      No existing fragrances found in "{selectedCategories[0]}". You are creating the first custom perfume for this category!
                    </p>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {categoryFragrances.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#141414] border border-stone-200 dark:border-zinc-800 flex items-center justify-between text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-md object-cover shrink-0 border border-stone-200 dark:border-[#c5a059]/20"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-stone-900 dark:text-[#f5f5f1] truncate">{p.name}</p>
                            <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">{p.fragranceType || 'Perfume'}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[#9a7229] dark:text-[#c5a059] font-bold text-xs shrink-0 ml-2">
                          Rs. {p.price?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Fragrance Concentration Type
              </label>
              <select
                value={fragranceType}
                onChange={(e) => setFragranceType(e.target.value as FragranceType)}
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all cursor-pointer"
              >
                {['Extrait de Parfum', 'Eau de Parfum', 'Eau de Toilette', 'Attar Oil', 'Pure Oud'].map((t) => (
                  <option key={t} value={t} className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                Gender Classification
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as FragranceGender)}
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all cursor-pointer"
              >
                {['Men', 'Women', 'Unisex'].map((g) => (
                  <option key={g} value={g} className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fragrance Notes (Empty by default for new fragrance) */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
              Fragrance Notes Pyramid (Empty by default for new fragrances)
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#9a7229] dark:text-[#c5a059] uppercase font-semibold">Top Notes</label>
                <input
                  type="text"
                  value={topNotesInput}
                  onChange={(e) => setTopNotesInput(e.target.value)}
                  placeholder="e.g. Bergamot, Cardamom"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#9a7229] dark:text-[#c5a059] uppercase font-semibold">Heart / Middle Notes</label>
                <input
                  type="text"
                  value={heartNotesInput}
                  onChange={(e) => setHeartNotesInput(e.target.value)}
                  placeholder="e.g. Taif Rose, Jasmine"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#9a7229] dark:text-[#c5a059] uppercase font-semibold">Base Notes</label>
                <input
                  type="text"
                  value={baseNotesInput}
                  onChange={(e) => setBaseNotesInput(e.target.value)}
                  placeholder="e.g. Cambodian Oud, Amber, Musk"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Collection Placement & Catalog Visibility */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059]" />
              <h3 className="text-sm font-serif font-semibold text-[#9a7229] dark:text-[#c5a059]">
                4. Collection Placement (Landing Page & Catalog Assignment)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
              Assign to Shop Collection, Our Collection, or Both
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'shop' as ProductPlacement,
                title: 'Shop Collection Only',
                desc: 'Displays on the main public Shop Collection store catalog.',
                badge: 'General Catalog'
              },
              {
                id: 'our' as ProductPlacement,
                title: 'Our Collection Only',
                desc: 'Displays exclusively on the dedicated "Our Collection" signature house landing page.',
                badge: 'House Signature'
              },
              {
                id: 'both' as ProductPlacement,
                title: 'Both Collections',
                desc: 'Displays seamlessly across both Shop Collection and Our Collection pages.',
                badge: 'Maximum Reach'
              }
            ].map((option) => {
              const isSelected = collectionPlacement === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCollectionPlacement(option.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border-[#9a7229] dark:border-[#c5a059] shadow-sm'
                      : 'bg-stone-50 dark:bg-[#0a0a0a] border-stone-200 dark:border-zinc-800 hover:border-[#9a7229]/40 dark:hover:border-[#c5a059]/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold font-serif ${isSelected ? 'text-[#9a7229] dark:text-[#c5a059]' : 'text-stone-900 dark:text-[#f5f5f1]'}`}>
                        {option.title}
                      </span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-[#9a7229] text-white dark:bg-[#c5a059] dark:text-[#0a0a0a] font-bold'
                          : 'bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
                      }`}>
                        {option.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-relaxed">
                      {option.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-stone-200 dark:border-zinc-800 text-[11px] font-mono">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                      isSelected 
                        ? 'border-[#9a7229] bg-[#9a7229] dark:border-[#c5a059] dark:bg-[#c5a059]' 
                        : 'border-stone-400 dark:border-zinc-600'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />}
                    </div>
                    <span className={isSelected ? 'text-[#9a7229] dark:text-[#c5a059] font-bold' : 'text-stone-500 dark:text-zinc-500'}>
                      {isSelected ? 'Selected Placement' : 'Click to select'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Fragrance Bundle / Discovery Set Configuration Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059]" />
              <h3 className="text-sm font-serif font-semibold text-[#9a7229] dark:text-[#c5a059]">
                5. Fragrance Bundle & Custom Set Configuration
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
              Build-Your-Own Discovery Sets & Multi-Packs
            </span>
          </div>

          {/* Bundle Toggle Switch */}
          <div className="bg-stone-50 dark:bg-[#0a0a0a] p-4 rounded-xl border border-stone-200 dark:border-[#c5a059]/20">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isBundle}
                onChange={(e) => setIsBundle(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-[#9a7229] dark:accent-[#c5a059] rounded cursor-pointer"
              />
              <div className="space-y-1">
                <div className="text-xs font-serif font-bold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider flex items-center gap-2">
                  <span>Enable Custom Fragrance Bundle / Discovery Set</span>
                  {isBundle && (
                    <span className="bg-[#9a7229]/20 text-[#9a7229] dark:text-[#c5a059] px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                  When enabled, customers can choose a custom selection of individual fragrances from your catalog (e.g. "Pick any 3 Attars for Rs. 9,999"). The customer pays the bundle's fixed price, and inventory stock is automatically decremented from each individually selected fragrance when ordered.
                </p>
              </div>
            </label>
          </div>

          {/* Bundle Options Form if enabled */}
          {isBundle && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Required Number of Fragrance Selections *</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={requiredSelectionCountInput}
                    onChange={(e) => setRequiredSelectionCountInput(e.target.value)}
                    placeholder="e.g. 2, 3, 5"
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
                  />
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                    How many fragrances the customer must pick (e.g., 3 for a 3-piece discovery set).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Bundle Badge Label</span>
                  </label>
                  <input
                    type="text"
                    value={bundleBadge}
                    onChange={(e) => setBundleBadge(e.target.value)}
                    placeholder="e.g. Discovery Set, Duo Pack, Trio Pack"
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl p-3 text-xs text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:ring-2 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] focus:border-transparent transition-all"
                  />
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                    Visual badge shown on product cards and bundle customizers.
                  </p>
                </div>
              </div>

              {/* Advanced Custom Bundle Fragrance Options Builder (Custom Name + Local Photo / URL) */}
              <div className="pt-4 border-t border-stone-200 dark:border-[#c5a059]/20">
                <BundleOptionsBuilder
                  bundleOptions={bundleOptions}
                  onChange={setBundleOptions}
                  catalogProducts={allProducts}
                  currentProductId={editingProduct?.id || initialProduct?.id || (productId || undefined)}
                  requiredSelectionCount={parseInt(requiredSelectionCountInput, 10) || 2}
                  onShowToast={onShowToast}
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. Fragrance Imagery & Uploads Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-2">
            <h3 className="text-sm font-serif font-semibold text-[#9a7229] dark:text-[#c5a059]">6. Fragrance Imagery</h3>
            <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
              Upload local photos or paste URLs
            </span>
          </div>

          <ProductImageManager
            images={images}
            onChange={setImages}
            onShowToast={onShowToast}
            disabled={submitting}
          />
        </div>

        {/* Toggles & Save */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-lg">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#9a7229] dark:accent-[#c5a059] rounded cursor-pointer"
              />
              <span className="text-stone-800 dark:text-zinc-200 font-medium">Feature on Homepage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 accent-[#9a7229] dark:accent-[#c5a059] rounded cursor-pointer"
              />
              <span className="text-stone-800 dark:text-zinc-200 font-medium">Mark as Best Seller</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#9a7229] dark:accent-[#c5a059] rounded cursor-pointer"
              />
              <span className="text-stone-800 dark:text-zinc-200 font-medium">Active in Public Catalog</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEditing ? 'Update Fragrance' : 'Create Fragrance'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
