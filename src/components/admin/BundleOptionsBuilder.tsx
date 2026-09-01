import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  Package,
  Search,
  Check,
  Edit2,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Product, BundleOption } from '../../types';

interface BundleOptionsBuilderProps {
  bundleOptions: BundleOption[];
  onChange: (options: BundleOption[]) => void;
  catalogProducts: Product[];
  currentProductId?: string; // To prevent bundling the bundle into itself
  requiredSelectionCount: number;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export const BundleOptionsBuilder: React.FC<BundleOptionsBuilderProps> = ({
  bundleOptions,
  onChange,
  catalogProducts,
  currentProductId,
  requiredSelectionCount,
  onShowToast
}) => {
  // Modal / Tab state for adding options
  const [activeAddTab, setActiveAddTab] = useState<'existing' | 'custom' | null>(null);

  // Search catalog filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('All');

  // Custom Fragrance Form State (for new custom fragrance)
  const [customName, setCustomName] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state for an existing custom option
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImageMode, setEditImageMode] = useState<'upload' | 'url'>('upload');
  const [isEditUploading, setIsEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Filter available catalog products
  const availableCatalog = catalogProducts.filter((p) => {
    if (p.isBundle) return false;
    if (currentProductId && p.id === currentProductId) return false;
    return true;
  });

  const uniqueCategories = ['All', ...Array.from(new Set(availableCatalog.map((p) => p.category)))];

  const filteredCatalog = availableCatalog.filter((p) => {
    const matchesCategory = selectedCatalogCategory === 'All' || p.category === selectedCatalogCategory;
    const matchesSearch =
      catalogSearch.trim() === '' ||
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Reorder options
  const moveOption = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bundleOptions.length) return;
    const updated = [...bundleOptions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  // Remove option
  const removeOption = (id: string) => {
    const updated = bundleOptions.filter((opt) => opt.id !== id);
    onChange(updated);
    onShowToast('Bundle option removed.', 'success');
  };

  // Add existing product from catalog
  const addExistingProduct = (product: Product) => {
    const alreadyAdded = bundleOptions.some(
      (opt) => opt.type === 'existing' && (opt.productId === product.id || opt.id === `opt-${product.id}`)
    );
    if (alreadyAdded) {
      onShowToast(`"${product.name}" is already added to this bundle.`, 'error');
      return;
    }

    const newOption: BundleOption = {
      id: `opt-${product.id}`,
      type: 'existing',
      productId: product.id,
      name: product.name,
      image: product.images[0] || '',
      category: product.category,
      size: product.size,
      price: product.price
    };

    onChange([...bundleOptions, newOption]);
    onShowToast(`Added "${product.name}" to bundle options.`, 'success');
  };

  // Validate and upload image file
  const handleUploadImage = async (file: File, isEditingState: boolean = false) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onShowToast('Image file size must be 5 MB or less.', 'error');
      return;
    }

    const isTypeValid = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) || /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name);
    if (!isTypeValid) {
      onShowToast('Please upload a valid JPG, PNG, or WEBP image file.', 'error');
      return;
    }

    if (isEditingState) {
      setIsEditUploading(true);
    } else {
      setIsUploading(true);
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed. Please try again.');
      }

      if (isEditingState) {
        setEditImage(data.url);
      } else {
        setCustomImage(data.url);
      }
      onShowToast('Fragrance image uploaded successfully!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Image upload failed.', 'error');
    } finally {
      if (isEditingState) {
        setIsEditUploading(false);
        if (editFileInputRef.current) editFileInputRef.current.value = '';
      } else {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // Submit New Custom Fragrance
  const handleAddCustomFragrance = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const nameTrimmed = customName.trim();
    const imageTrimmed = customImage.trim();

    if (!nameTrimmed) {
      onShowToast('Please enter a fragrance name for the custom option.', 'error');
      return;
    }

    if (!imageTrimmed) {
      onShowToast('Please provide an image for the custom fragrance (upload or URL).', 'error');
      return;
    }

    const newOption: BundleOption = {
      id: `custom-opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'custom',
      name: nameTrimmed,
      image: imageTrimmed,
      category: customCategory.trim() || 'Custom Blend'
    };

    onChange([...bundleOptions, newOption]);
    setCustomName('');
    setCustomImage('');
    setCustomCategory('');
    setActiveAddTab(null);
    onShowToast(`Added custom fragrance "${nameTrimmed}" to bundle!`, 'success');
  };

  // Start editing an existing custom option
  const startEditingCustomOption = (opt: BundleOption) => {
    setEditingOptionId(opt.id);
    setEditName(opt.name || '');
    setEditImage(opt.image || '');
    setEditCategory(opt.category || 'Custom Blend');
    setEditImageMode('upload');
  };

  // Save edited custom option
  const handleSaveEditedCustomOption = () => {
    if (!editingOptionId) return;
    const nameTrimmed = editName.trim();
    const imageTrimmed = editImage.trim();

    if (!nameTrimmed) {
      onShowToast('Fragrance name cannot be empty.', 'error');
      return;
    }
    if (!imageTrimmed) {
      onShowToast('Fragrance image cannot be empty.', 'error');
      return;
    }

    const updated = bundleOptions.map((opt) => {
      if (opt.id === editingOptionId) {
        return {
          ...opt,
          name: nameTrimmed,
          image: imageTrimmed,
          category: editCategory.trim() || 'Custom Blend'
        };
      }
      return opt;
    });

    onChange(updated);
    setEditingOptionId(null);
    onShowToast('Custom fragrance option updated successfully.', 'success');
  };

  const existingCount = bundleOptions.filter((o) => o.type === 'existing').length;
  const customCount = bundleOptions.filter((o) => o.type === 'custom').length;
  const isBelowRequired = bundleOptions.length < requiredSelectionCount;

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20">
        <div>
          <h4 className="font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            <span>Fragrance Bundle Options ({bundleOptions.length})</span>
          </h4>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 font-mono">
            Customers will choose {requiredSelectionCount} fragrances from these {bundleOptions.length} available choices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-stone-200/70 dark:bg-[#202020] text-stone-700 dark:text-zinc-300">
            <strong>{existingCount}</strong> Catalog Products
          </span>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
            <strong>{customCount}</strong> Custom Options
          </span>
        </div>
      </div>

      {/* Insufficient items warning */}
      {isBelowRequired && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Attention:</strong> This bundle requires <strong>{requiredSelectionCount}</strong> fragrance selections, but currently has only <strong>{bundleOptions.length}</strong> option{bundleOptions.length === 1 ? '' : 's'}. Please add at least {requiredSelectionCount - bundleOptions.length} more option{requiredSelectionCount - bundleOptions.length > 1 ? 's' : ''}.
          </span>
        </div>
      )}

      {/* Action Buttons to Add Existing or Custom Fragrance */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveAddTab(activeAddTab === 'existing' ? null : 'existing')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            activeAddTab === 'existing'
              ? 'bg-stone-900 dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] shadow-md'
              : 'bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:border-[#9a7229] dark:hover:border-[#c5a059]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>+ Add Existing Catalog Product</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAddTab(activeAddTab === 'custom' ? null : 'custom')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            activeAddTab === 'custom'
              ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] shadow-md'
              : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Create Custom Fragrance Option</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER / FORM: ADD EXISTING CATALOG PRODUCT                                */}
      {/* ========================================================================= */}
      {activeAddTab === 'existing' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181818] border-2 border-stone-300 dark:border-[#c5a059]/40 shadow-lg space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h5 className="font-serif font-semibold text-sm text-stone-900 dark:text-[#f5f5f1] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
              <span>Select from Products Directory</span>
            </h5>
            <button
              type="button"
              onClick={() => setActiveAddTab(null)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search catalog products..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-[#121212] border border-stone-300 dark:border-[#c5a059]/30 text-stone-900 dark:text-[#f5f5f1] focus:ring-1 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] outline-none"
              />
            </div>
            <select
              value={selectedCatalogCategory}
              onChange={(e) => setSelectedCatalogCategory(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl bg-stone-50 dark:bg-[#121212] border border-stone-300 dark:border-[#c5a059]/30 text-stone-900 dark:text-[#f5f5f1] outline-none"
            >
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Products List Grid */}
          <div className="max-h-72 overflow-y-auto divide-y divide-stone-200 dark:divide-[#c5a059]/10 rounded-xl border border-stone-200 dark:border-[#c5a059]/20">
            {filteredCatalog.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 dark:text-zinc-400 font-mono">
                No catalog fragrances match your search.
              </div>
            ) : (
              filteredCatalog.map((prod) => {
                const isAdded = bundleOptions.some(
                  (opt) => opt.type === 'existing' && (opt.productId === prod.id || opt.id === `opt-${prod.id}`)
                );

                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-stone-50 dark:hover:bg-[#1f1f1f] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={(prod.images && prod.images[0]?.trim()) || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg object-cover bg-stone-100 dark:bg-[#101010] border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-stone-900 dark:text-[#f5f5f1] truncate">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                          {prod.category} • PKR {prod.price.toLocaleString()} • Stock: {prod.stock}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAdded}
                      onClick={() => addExistingProduct(prod)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isAdded
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 cursor-default flex items-center gap-1'
                          : 'bg-stone-900 dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:opacity-90'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <span>+ Add to Bundle</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / FORM: ADD CUSTOM FRAGRANCE OPTION                                 */}
      {/* ========================================================================= */}
      {activeAddTab === 'custom' && (
        <div
          className="p-5 rounded-2xl bg-amber-50/70 dark:bg-[#1a160f] border-2 border-amber-300 dark:border-[#c5a059]/40 shadow-lg space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-serif font-semibold text-sm text-stone-900 dark:text-[#f5f5f1] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                <span>Create Custom Fragrance Option</span>
              </h5>
              <p className="text-[11px] text-stone-600 dark:text-zinc-400 mt-0.5">
                This custom fragrance will only exist inside this bundle without creating a separate product page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveAddTab(null)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fragrance Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 dark:text-zinc-200 mb-1">
                Fragrance Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Blend, Arabian Rose, Midnight Oud"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-stone-900 dark:text-[#f5f5f1] focus:ring-1 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] outline-none"
              />
            </div>

            {/* Custom Category / Note Tag */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 dark:text-zinc-200 mb-1">
                Fragrance Note / Subtitle (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Amber & Smoked Oud, Artisanal Blend"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-stone-900 dark:text-[#f5f5f1] focus:ring-1 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] outline-none"
              />
            </div>
          </div>

          {/* Fragrance Image Source Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-stone-800 dark:text-zinc-200">
                Fragrance Image <span className="text-rose-500">*</span> (Max 5MB)
              </label>
              <div className="flex items-center rounded-lg border border-stone-300 dark:border-[#c5a059]/30 p-0.5 bg-white dark:bg-[#141414] text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-stone-900 dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold'
                      : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3 h-3 inline-block mr-1" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-stone-900 dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold'
                      : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3 h-3 inline-block mr-1" />
                  Image URL
                </button>
              </div>
            </div>

            {imageInputMode === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleUploadImage(file, false);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#9a7229] dark:border-[#c5a059] bg-[#9a7229]/10'
                    : 'border-stone-300 dark:border-[#c5a059]/30 hover:border-[#9a7229] dark:hover:border-[#c5a059] bg-white/60 dark:bg-[#141414]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(file, false);
                  }}
                />
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-[#9a7229] dark:text-[#c5a059] font-mono">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading fragrance image (max 5MB)...</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <UploadCloud className="w-6 h-6 mx-auto text-[#9a7229] dark:text-[#c5a059]" />
                    <p className="text-xs font-semibold text-stone-800 dark:text-zinc-200">
                      Click to choose image or drag & drop here
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                      JPG, PNG, WEBP up to 5 MB
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-stone-900 dark:text-[#f5f5f1] focus:ring-1 focus:ring-[#9a7229] dark:focus:ring-[#c5a059] outline-none"
              />
            )}

            {/* Live Visual Preview */}
            {customImage && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20">
                <img
                  src={customImage}
                  alt="Custom Preview"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover bg-stone-100 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/30 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=150';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-stone-900 dark:text-[#f5f5f1] truncate">
                    {customName || 'Custom Fragrance Option'}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono truncate">
                    {customCategory || 'Custom Blend'} • Custom Bundle Option
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-[#9a7229] dark:text-[#c5a059] hover:underline font-semibold"
                    >
                      Replace Image
                    </button>
                    <span className="text-stone-300 dark:text-zinc-700">•</span>
                    <button
                      type="button"
                      onClick={() => setCustomImage('')}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-amber-200 dark:border-[#c5a059]/20">
            <button
              type="button"
              onClick={() => setActiveAddTab(null)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 dark:text-zinc-400 hover:bg-stone-200/60 dark:hover:bg-[#252525]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCustomFragrance}
              disabled={!customName.trim() || !customImage.trim() || isUploading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Add Custom Fragrance to Bundle</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CURRENT BUNDLE OPTIONS LIST                                               */}
      {/* ========================================================================= */}
      {bundleOptions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-stone-50 dark:bg-[#141414] border-2 border-dashed border-stone-300 dark:border-[#c5a059]/30 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-[#9a7229] dark:text-[#c5a059] opacity-60" />
          <h5 className="font-serif font-semibold text-stone-800 dark:text-zinc-200 text-sm">
            No Fragrance Options Added Yet
          </h5>
          <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-md mx-auto">
            Add existing products from your catalog, or create custom fragrance options exclusively for this bundle.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bundleOptions.map((option, idx) => {
            const isCustom = option.type === 'custom';
            const isEditingThis = editingOptionId === option.id;

            // Resolve existing product details if type is existing
            let displayName = option.name || '';
            let displayImage = option.image || '';
            let displaySub = option.category || '';

            if (!isCustom && option.productId) {
              const matchedCatalog = catalogProducts.find((p) => p.id === option.productId);
              if (matchedCatalog) {
                displayName = matchedCatalog.name;
                displayImage = matchedCatalog.images[0] || displayImage;
                displaySub = `${matchedCatalog.category} • ${matchedCatalog.size || '50ml'}`;
              }
            }

            if (isEditingThis) {
              return (
                <div
                  key={option.id}
                  className="p-4 rounded-xl bg-amber-50/90 dark:bg-[#1c1811] border-2 border-[#9a7229] dark:border-[#c5a059] shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-900 dark:text-[#f5f5f1]">
                    <span>Edit Custom Fragrance Option</span>
                    <button
                      type="button"
                      onClick={() => setEditingOptionId(null)}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-zinc-300 mb-1">
                        Fragrance Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#121212] border border-stone-300 dark:border-[#c5a059]/40 text-stone-900 dark:text-[#f5f5f1] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-zinc-300 mb-1">
                        Subtitle / Notes Tag
                      </label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#121212] border border-stone-300 dark:border-[#c5a059]/40 text-stone-900 dark:text-[#f5f5f1] outline-none"
                      />
                    </div>
                  </div>

                  {/* Image edit */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300">
                        Fragrance Image
                      </span>
                      <div className="flex items-center rounded-lg border border-stone-300 dark:border-[#c5a059]/30 p-0.5 bg-white dark:bg-[#121212] text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setEditImageMode('upload')}
                          className={`px-2 py-0.5 rounded ${
                            editImageMode === 'upload'
                              ? 'bg-stone-900 dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold'
                              : 'text-stone-600 dark:text-zinc-400'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditImageMode('url')}
                          className={`px-2 py-0.5 rounded ${
                            editImageMode === 'url'
                              ? 'bg-stone-900 dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold'
                              : 'text-stone-600 dark:text-zinc-400'
                          }`}
                        >
                          Image URL
                        </button>
                      </div>
                    </div>

                    {editImageMode === 'upload' ? (
                      <div>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadImage(file, true);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={isEditUploading}
                          className="w-full py-2 px-3 border border-dashed border-stone-300 dark:border-[#c5a059]/40 rounded-lg text-xs font-mono text-stone-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-[#141414] transition-colors flex items-center justify-center gap-2"
                        >
                          {isEditUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9a7229] dark:text-[#c5a059]" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                          )}
                          <span>{isEditUploading ? 'Uploading...' : 'Choose new image file (Max 5MB)'}</span>
                        </button>
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#121212] border border-stone-300 dark:border-[#c5a059]/40 text-stone-900 dark:text-[#f5f5f1] outline-none"
                      />
                    )}

                    {editImage && (
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#c5a059]/20">
                        <img
                          src={editImage}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-md object-cover bg-stone-100 dark:bg-[#0a0a0a]"
                        />
                        <span className="text-[11px] text-stone-600 dark:text-zinc-400 font-mono truncate">
                          {editImage}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-amber-200 dark:border-[#c5a059]/20">
                    <button
                      type="button"
                      onClick={() => setEditingOptionId(null)}
                      className="px-3 py-1 text-xs text-stone-600 dark:text-zinc-400 hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditedCustomOption}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] hover:opacity-90"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={option.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isCustom
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                    : 'bg-white dark:bg-[#1a1a1a] border-stone-200 dark:border-[#c5a059]/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Order indicator */}
                  <span className="w-5 text-center font-mono text-[11px] text-stone-400 dark:text-zinc-500 font-bold">
                    #{idx + 1}
                  </span>

                  {/* Thumbnail */}
                  <img
                    src={displayImage || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100'}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100';
                    }}
                  />

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-xs text-stone-900 dark:text-[#f5f5f1] truncate">
                        {displayName || 'Untitled Fragrance'}
                      </h5>
                      {isCustom ? (
                        <span className="shrink-0 bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Custom Fragrance
                        </span>
                      ) : (
                        <span className="shrink-0 bg-stone-100 dark:bg-[#252525] text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-[#c5a059]/30 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Package className="w-2.5 h-2.5" />
                          Catalog Product
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono truncate">
                      {displaySub || (isCustom ? 'Custom Blend Option' : 'Catalog Fragrance')}
                    </p>
                  </div>
                </div>

                {/* Actions: Reorder, Edit (for custom), Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveOption(idx, 'up')}
                    title="Move Up"
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white disabled:opacity-20 hover:bg-stone-100 dark:hover:bg-[#252525]"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === bundleOptions.length - 1}
                    onClick={() => moveOption(idx, 'down')}
                    title="Move Down"
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white disabled:opacity-20 hover:bg-stone-100 dark:hover:bg-[#252525]"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => startEditingCustomOption(option)}
                      title="Edit Custom Fragrance"
                      className="p-1.5 rounded-lg text-stone-600 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] hover:bg-stone-100 dark:hover:bg-[#252525]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    title="Remove Option"
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
