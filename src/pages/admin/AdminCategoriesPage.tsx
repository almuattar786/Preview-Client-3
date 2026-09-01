import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  Sparkles,
  Package,
  X,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  ListFilter,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { CategoryConfig, Product } from '../../types';
import { CategoryIcon, CATEGORY_ICON_OPTIONS } from '../../components/CategoryIcon';
import { apiFetch } from '../../lib/api';
import { useCart } from '../../context/CartContext';

interface AdminCategoriesPageProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onNavigateToProducts?: (categoryName: string) => void;
}

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'cat-1',
    name: 'Perfumes',
    description: 'Artisanal Extraits & Eau de Parfums',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
    badge: 'Best Seller',
    iconName: 'Sparkles'
  },
  {
    id: 'cat-2',
    name: 'Attars',
    description: 'Pure Concentrated Perfume Oils',
    image: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&q=80&w=800',
    badge: 'Traditional',
    iconName: 'Droplets'
  },
  {
    id: 'cat-3',
    name: 'Oud',
    description: 'Aged Cambodian & Indian Dehn Al Oud',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800',
    badge: 'Pure Wood',
    iconName: 'Flame'
  }
];

export const AdminCategoriesPage: React.FC<AdminCategoriesPageProps> = ({
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {},
  onNavigateToProducts
}) => {
  const { storeSettings, refreshSettings } = useCart();
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homepageCategoriesCount, setHomepageCategoriesCount] = useState<number>(6);

  // Expanded card state to view assigned products per category
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

  // Create / Edit Category Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formIconName, setFormIconName] = useState('Sparkles');
  const [formImage, setFormImage] = useState('');
  const [formSelectedProductIds, setFormSelectedProductIds] = useState<string[]>([]);
  const [formProductSearch, setFormProductSearch] = useState('');

  // Category Image Upload state
  const [imageInputTab, setImageInputTab] = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  const handleCategoryFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onShowToast('Image size must be 5 MB or less.', 'error');
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      onShowToast('Please select a valid JPG, PNG, WEBP, or GIF image.', 'error');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed.');
      }
      setFormImage(data.url);
      onShowToast('Category image uploaded successfully.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to upload category image.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Assign Fragrances Modal state (Dedicated workflow)
  const [assigningCat, setAssigningCat] = useState<CategoryConfig | null>(null);
  const [assignSelectedIds, setAssignSelectedIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignFilter, setAssignFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Delete modal confirmation
  const [deletingCat, setDeletingCat] = useState<CategoryConfig | null>(null);

  useEffect(() => {
    loadData();
  }, [storeSettings]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch all products (including inactive ones) from Products Directory
      const prodRes = await apiFetch<{ success: boolean; products: Product[] }>('/api/admin/products');
      if (prodRes.success && prodRes.products) {
        setProducts(prodRes.products);
      } else {
        // Fallback to public products endpoint if admin route isn't available
        const pubRes = await apiFetch<{ success: boolean; products: Product[] }>('/api/products');
        if (pubRes.success && pubRes.products) {
          setProducts(pubRes.products);
        }
      }

      const settingsCats = (
        storeSettings?.categories && storeSettings.categories.length > 0
          ? storeSettings.categories
          : DEFAULT_CATEGORIES
      ).filter((c) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(c.name));

      setCategories(settingsCats);
      if (storeSettings?.homepageCategoriesCount !== undefined) {
        setHomepageCategoriesCount(storeSettings.homepageCategoriesCount);
      }
    } catch (err) {
      console.error('Failed to load categories data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHomepageCategoriesCount = async (count: number) => {
    setHomepageCategoriesCount(count);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ homepageCategoriesCount: count })
      });
      if (res.success) {
        await refreshSettings();
        onShowToast(`Homepage display count updated to ${count} categories.`, 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update homepage category limit.', 'error');
    }
  };

  // Helper to get assigned products for a category
  const getProductsForCategory = (catName: string): Product[] => {
    return products.filter((p) => {
      if (p.category === catName) return true;
      if (p.categories && p.categories.includes(catName)) return true;
      return false;
    });
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormBadge('');
    setFormIconName('Sparkles');
    setFormImage('');
    setFormSelectedProductIds([]);
    setFormProductSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryConfig) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormBadge(cat.badge || '');
    setFormIconName(cat.iconName || 'Sparkles');
    setFormImage(cat.image || '');

    // Pre-select product IDs assigned to this category from Products Directory
    const assignedIds = getProductsForCategory(cat.name).map((p) => p.id);
    setFormSelectedProductIds(assignedIds);
    setFormProductSearch('');
    setIsModalOpen(true);
  };

  // Save Category & Sync assigned products
  const handleSaveCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim()) {
      onShowToast('Category name is required.', 'error');
      return;
    }

    const categoryNameTrimmed = formName.trim();
    const updatedCatList = [...categories];

    if (editingCategory) {
      // Edit mode
      const idx = updatedCatList.findIndex((c) => c.id === editingCategory.id);
      if (idx !== -1) {
        updatedCatList[idx] = {
          ...editingCategory,
          name: categoryNameTrimmed,
          description: formDescription.trim(),
          badge: formBadge.trim() || undefined,
          iconName: formIconName,
          image: formImage.trim() || DEFAULT_CATEGORY_IMAGE
        };
      }
    } else {
      // Add new category mode
      const newCat: CategoryConfig = {
        id: `cat-${Date.now()}`,
        name: categoryNameTrimmed,
        description: formDescription.trim() || 'Curated luxury collection',
        badge: formBadge.trim() || undefined,
        iconName: formIconName,
        image: formImage.trim() || DEFAULT_CATEGORY_IMAGE
      };
      updatedCatList.push(newCat);
    }

    const saved = await saveCategoriesToBackend(
      updatedCatList,
      editingCategory ? 'Category updated successfully!' : 'New category created successfully!'
    );

    if (saved) {
      // Update product category assignments in backend for selected products
      await updateProductCategoryAssignments(categoryNameTrimmed, formSelectedProductIds);
      setIsModalOpen(false);
      await loadData();
    }
  };

  // Open dedicated Assign Fragrances Modal
  const handleOpenAssignModal = (cat: CategoryConfig) => {
    setAssigningCat(cat);
    const assignedIds = getProductsForCategory(cat.name).map((p) => p.id);
    setAssignSelectedIds(assignedIds);
    setAssignSearch('');
    setAssignFilter('all');
  };

  // Save product assignments for a category
  const handleSaveAssignments = async () => {
    if (!assigningCat) return;

    setSavingAssignments(true);
    try {
      await updateProductCategoryAssignments(assigningCat.name, assignSelectedIds);
      onShowToast(`Fragrance assignments saved for "${assigningCat.name}".`, 'success');
      setAssigningCat(null);
      await loadData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update fragrance assignments.', 'error');
    } finally {
      setSavingAssignments(false);
    }
  };

  // Bulk update product category records in Products Directory
  const updateProductCategoryAssignments = async (targetCategoryName: string, targetProductIds: string[]) => {
    const updatePromises = products.map(async (p) => {
      const isSelected = targetProductIds.includes(p.id);
      const currentCats = p.categories && p.categories.length > 0 ? p.categories : [p.category];
      const belongsToCat = currentCats.includes(targetCategoryName) || p.category === targetCategoryName;

      if (isSelected && !belongsToCat) {
        // Assign target category to product
        const newCats = Array.from(new Set([...currentCats, targetCategoryName]));
        const primaryCat = p.category && p.category !== 'Uncategorized' ? p.category : targetCategoryName;
        return apiFetch(`/api/admin/products/${p.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            category: primaryCat,
            categories: newCats
          })
        });
      } else if (!isSelected && belongsToCat) {
        // Remove target category from product
        const newCats = currentCats.filter((c) => c !== targetCategoryName);
        let primaryCat = p.category;
        if (p.category === targetCategoryName) {
          primaryCat = newCats[0] || 'Perfumes';
        }
        return apiFetch(`/api/admin/products/${p.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            category: primaryCat,
            categories: newCats
          })
        });
      }
    });

    await Promise.all(updatePromises);
  };

  // Unassign a single product from a category directly
  const handleUnassignSingleProduct = async (catName: string, prod: Product) => {
    try {
      const currentCats = prod.categories && prod.categories.length > 0 ? prod.categories : [prod.category];
      const newCats = currentCats.filter((c) => c !== catName);
      let primaryCat = prod.category;
      if (prod.category === catName) {
        primaryCat = newCats[0] || 'Perfumes';
      }

      const res = await apiFetch<{ success: boolean }>(`/api/admin/products/${prod.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          category: primaryCat,
          categories: newCats
        })
      });

      if (res.success) {
        onShowToast(`Removed "${prod.name}" from ${catName}.`, 'success');
        await loadData();
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to remove product from category.', 'error');
    }
  };

  const handleDeleteCategory = async (cat: CategoryConfig) => {
    const remaining = categories.filter((c) => c.id !== cat.id);
    await saveCategoriesToBackend(remaining, `Category "${cat.name}" removed.`);
    setDeletingCat(null);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const newArr = [...categories];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;

    setCategories(newArr);
    await saveCategoriesToBackend(newArr, 'Categories reordered.');
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset categories list to original defaults?')) {
      await saveCategoriesToBackend(DEFAULT_CATEGORIES, 'Categories reset to defaults.');
    }
  };

  const saveCategoriesToBackend = async (catList: CategoryConfig[], successMsg: string): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          categories: catList
        })
      });

      if (res.success) {
        setCategories(catList);
        await refreshSettings();
        onShowToast(successMsg, 'success');
        return true;
      } else {
        onShowToast('Failed to save categories.', 'error');
        return false;
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error saving categories.', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#9a7229] dark:text-[#c5a059] animate-spin mx-auto" />
        <p className="text-sm text-stone-600 dark:text-zinc-400 font-mono">Loading categories & products directory...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner - Responsive Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f2ede2] dark:bg-[#1a1a1a] p-4 sm:p-6 rounded-2xl border border-[#9a7229]/20 dark:border-[#c5a059]/20 shadow-sm transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 sm:w-6 sm:h-6 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
              Category Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Organize storefront categories and assign existing fragrances from the Products Directory.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-3.5 py-2.5 rounded-xl bg-stone-200/80 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-stone-700 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] text-xs font-mono transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            title="Reset to default categories"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-colors shadow-md flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Homepage Display Control & Info Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-stone-900 dark:text-amber-200">Products Directory First Rule: </strong>
            Fragrances must be created in the <strong>Products Directory</strong> first. Category Management assigns existing fragrances to categories and does not create new products.
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-[#9a7229]/20 dark:border-[#c5a059]/20 shadow-sm flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-stone-900 dark:text-[#f5f5f1] flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
              <span>Homepage Display</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400">
              Categories shown on home:
            </p>
          </div>
          <select
            value={homepageCategoriesCount}
            onChange={(e) => handleSaveHomepageCategoriesCount(Number(e.target.value))}
            className="bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 rounded-xl px-3 py-1.5 text-xs font-bold text-[#9a7229] dark:text-[#c5a059] focus:outline-none cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Category' : 'Categories'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Categories Grid - Responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {categories.map((cat, index) => {
          const categoryProducts = getProductsForCategory(cat.name);
          const productCount = categoryProducts.length;
          const isExpanded = expandedCatId === cat.id;

          return (
            <div
              key={cat.id || cat.name}
              className="group bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-stone-200 dark:border-[#c5a059]/20 shadow-sm hover:border-[#9a7229] dark:hover:border-[#c5a059] transition-all flex flex-col justify-between"
            >
              {/* Category Cover Image Header */}
              <div className="relative h-36 sm:h-44 overflow-hidden bg-stone-100 dark:bg-[#0a0a0a]">
                <img
                  src={cat.image || DEFAULT_CATEGORY_IMAGE}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_CATEGORY_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/40 to-transparent p-3.5 sm:p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-stone-900/80 backdrop-blur-md border border-[#c5a059]/30 text-[#c5a059]">
                      <CategoryIcon iconName={cat.iconName} className="w-4 h-4" />
                    </div>

                    {cat.badge && (
                      <span className="px-2.5 py-1 rounded-full bg-[#c5a059] text-[#0a0a0a] font-bold text-[10px] uppercase tracking-wider shadow">
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-white drop-shadow">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                <p className="text-xs text-stone-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>

                {/* Primary Action: Assign Existing Fragrances from Products Directory */}
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenAssignModal(cat)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] hover:bg-[#9a7229] dark:hover:bg-[#c5a059] hover:text-white dark:hover:text-[#0a0a0a] font-bold text-xs transition-all flex items-center justify-center gap-2 min-h-[40px] shadow-sm"
                  >
                    <ListFilter className="w-4 h-4" />
                    <span>Assign Existing Fragrances ({productCount})</span>
                  </button>
                </div>

                {/* Assigned Perfumes Counter & Accordion Toggle */}
                <div className="pt-3 border-t border-stone-200 dark:border-[#c5a059]/15 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                    className="flex items-center gap-1.5 text-stone-700 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] font-mono text-[11px] transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                    <span>{productCount} {productCount === 1 ? 'Fragrance' : 'Fragrances'} Assigned</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {onNavigateToProducts && (
                    <button
                      onClick={() => onNavigateToProducts(cat.name)}
                      className="text-[11px] font-mono text-[#9a7229] dark:text-[#c5a059] hover:underline flex items-center gap-1"
                    >
                      <span>Storefront</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Collapsible List of assigned perfumes */}
                {isExpanded && (
                  <div className="pt-2 space-y-2 border-t border-stone-100 dark:border-zinc-800 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                      <span>Assigned in {cat.name}:</span>
                      <button
                        onClick={() => handleOpenAssignModal(cat)}
                        className="text-[#9a7229] dark:text-[#c5a059] hover:underline"
                      >
                        + Manage Selection
                      </button>
                    </div>

                    {categoryProducts.length === 0 ? (
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] text-center space-y-2">
                        <p className="text-xs text-stone-500 dark:text-zinc-400">No fragrances currently assigned to this category.</p>
                        <button
                          onClick={() => handleOpenAssignModal(cat)}
                          className="text-xs text-[#9a7229] dark:text-[#c5a059] font-mono underline"
                        >
                          Select Existing Fragrances Now
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                        {categoryProducts.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 rounded-lg bg-stone-50 dark:bg-[#0a0a0a] flex items-center justify-between text-xs border border-stone-200/60 dark:border-zinc-800"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={p.images?.[0] || DEFAULT_CATEGORY_IMAGE}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded object-cover shrink-0 border border-stone-200 dark:border-zinc-700"
                              />
                              <div className="min-w-0">
                                <span className="font-medium text-stone-900 dark:text-zinc-200 truncate block">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">
                                  {p.sku} • Rs. {p.price.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleUnassignSingleProduct(cat.name, p)}
                              className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors shrink-0 ml-1"
                              title={`Remove ${p.name} from ${cat.name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="px-4 sm:px-5 py-3 bg-stone-50 dark:bg-[#141414] border-t border-stone-200 dark:border-[#c5a059]/15 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0 || saving}
                    className="p-1.5 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Move Category Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === categories.length - 1 || saving}
                    className="p-1.5 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Move Category Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-stone-200/80 dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-200 hover:text-[#9a7229] dark:hover:text-[#c5a059] text-xs font-mono transition-colors flex items-center gap-1 min-h-[36px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingCat(cat)}
                    disabled={saving}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DEDICATED ASSIGN EXISTING FRAGRANCES MODAL */}
      {assigningCat && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-[#c5a059]/20 flex items-center justify-between shrink-0 bg-stone-50/80 dark:bg-[#141414]">
              <div className="flex items-center gap-2.5">
                <ListFilter className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059]" />
                <div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
                    Assign Existing Fragrances
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Category: <strong className="text-[#9a7229] dark:text-[#c5a059]">{assigningCat.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningCat(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Important rule note */}
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-[#0a0a0a] border border-stone-200 dark:border-zinc-800 text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                💡 <strong className="text-stone-900 dark:text-zinc-200">Products Directory Rule:</strong> Only fragrances already created in the Products Directory appear below. Check or uncheck fragrances to assign or remove them from <strong>{assigningCat.name}</strong>.
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    placeholder="Search existing fragrances by name, SKU..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  />
                  <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {(['all', 'assigned', 'unassigned'] as const).map((filterOpt) => (
                    <button
                      key={filterOpt}
                      onClick={() => setAssignFilter(filterOpt)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono capitalize transition-colors ${
                        assignFilter === filterOpt
                          ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold'
                          : 'bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-stone-700 dark:text-zinc-300'
                      }`}
                    >
                      {filterOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select All / Deselect All Bar */}
              <div className="flex items-center justify-between text-xs font-mono text-stone-600 dark:text-zinc-400 pt-1 border-b border-stone-200 dark:border-zinc-800 pb-2">
                <span>
                  Selected: <strong className="text-[#9a7229] dark:text-[#c5a059]">{assignSelectedIds.length}</strong> of {products.length} fragrances
                </span>

                <div className="flex items-center gap-3 text-[11px]">
                  <button
                    onClick={() => setAssignSelectedIds(products.map((p) => p.id))}
                    className="text-[#9a7229] dark:text-[#c5a059] hover:underline"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setAssignSelectedIds([])}
                    className="text-stone-500 dark:text-zinc-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Product List */}
              {(() => {
                const filteredProds = products.filter((p) => {
                  const isAssigned = assignSelectedIds.includes(p.id);
                  if (assignFilter === 'assigned' && !isAssigned) return false;
                  if (assignFilter === 'unassigned' && isAssigned) return false;

                  if (assignSearch.trim()) {
                    const q = assignSearch.toLowerCase().trim();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.sku.toLowerCase().includes(q) ||
                      p.category.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                if (products.length === 0) {
                  return (
                    <div className="p-8 text-center bg-stone-50 dark:bg-[#0a0a0a] rounded-xl border border-stone-200 dark:border-zinc-800 space-y-2">
                      <Package className="w-8 h-8 text-stone-400 dark:text-zinc-600 mx-auto" />
                      <p className="text-sm font-semibold text-stone-900 dark:text-[#f5f5f1]">No Products Found in Directory</p>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">Please add products in the Products Directory first before assigning them to categories.</p>
                    </div>
                  );
                }

                if (filteredProds.length === 0) {
                  return (
                    <div className="p-6 text-center text-xs text-stone-500 dark:text-zinc-400 font-mono">
                      No fragrances match your filter criteria.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredProds.map((p) => {
                      const isSelected = assignSelectedIds.includes(p.id);

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (isSelected) {
                              setAssignSelectedIds(assignSelectedIds.filter((id) => id !== p.id));
                            } else {
                              setAssignSelectedIds([...assignSelectedIds, p.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border-[#9a7229] dark:border-[#c5a059]'
                              : 'bg-stone-50 dark:bg-[#0a0a0a] border-stone-200 dark:border-zinc-800 hover:border-stone-400 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 text-[#9a7229] dark:text-[#c5a059]">
                              {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-stone-400 dark:text-zinc-600" />}
                            </div>

                            <img
                              src={p.images?.[0] || DEFAULT_CATEGORY_IMAGE}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover bg-stone-200 dark:bg-zinc-800 shrink-0"
                            />

                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-stone-900 dark:text-[#f5f5f1] truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono flex items-center gap-2">
                                <span>SKU: {p.sku}</span>
                                <span>•</span>
                                <span>Category: {p.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-xs text-stone-900 dark:text-[#f5f5f1]">
                              Rs. {p.price.toLocaleString()}
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              isSelected
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                                : 'bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
                            }`}>
                              {isSelected ? 'Assigned' : 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-[#c5a059]/20 flex items-center justify-between gap-3 bg-stone-50/80 dark:bg-[#141414] shrink-0">
              <button
                type="button"
                onClick={() => setAssigningCat(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-[#c5a059]/20 text-stone-700 dark:text-zinc-300 text-xs font-mono hover:bg-stone-200 dark:hover:bg-[#0a0a0a]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={savingAssignments}
                className="px-5 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-colors flex items-center gap-2 shadow"
              >
                {savingAssignments ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Category Assignments</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-[#c5a059]/20 flex items-center justify-between shrink-0 bg-stone-50/50 dark:bg-[#141414]/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059]" />
                <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSaveCategory} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bakhoor & Incense"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-stone-900 dark:text-[#f5f5f1] text-sm focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Traditional slow burn aromatic chips & resin"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-stone-900 dark:text-[#f5f5f1] text-sm focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                />
              </div>

              {/* Badge & Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Best Seller, New, Traditional"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-stone-900 dark:text-[#f5f5f1] text-sm focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                    Category Icon
                  </label>
                  <select
                    value={formIconName}
                    onChange={(e) => setFormIconName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-stone-900 dark:text-[#f5f5f1] text-sm focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                  >
                    {CATEGORY_ICON_OPTIONS.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Cover Image: Local Upload or URL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-300 font-semibold">
                    Category Cover Image
                  </label>
                  
                  {/* Mode Tabs */}
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#0a0a0a] p-0.5 rounded-lg border border-stone-200 dark:border-[#c5a059]/20">
                    <button
                      type="button"
                      onClick={() => setImageInputTab('upload')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                        imageInputTab === 'upload'
                          ? 'bg-white dark:bg-[#1a1a1a] text-[#9a7229] dark:text-[#c5a059] font-bold shadow-xs'
                          : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputTab('url')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                        imageInputTab === 'url'
                          ? 'bg-white dark:bg-[#1a1a1a] text-[#9a7229] dark:text-[#c5a059] font-bold shadow-xs'
                          : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {imageInputTab === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={categoryFileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleCategoryFileUpload(file);
                        }
                        e.target.value = '';
                      }}
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          handleCategoryFileUpload(file);
                        }
                      }}
                      onClick={() => categoryFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                        isDraggingImage
                          ? 'border-[#9a7229] dark:border-[#c5a059] bg-[#9a7229]/10 dark:bg-[#c5a059]/10'
                          : 'border-stone-300 dark:border-zinc-700 hover:border-[#9a7229] dark:hover:border-[#c5a059] bg-stone-50/50 dark:bg-[#0a0a0a]'
                      }`}
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#9a7229] dark:text-[#c5a059]" />
                          <p className="text-xs font-mono text-stone-600 dark:text-zinc-400">Uploading category photo...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <div className="w-10 h-10 rounded-full bg-[#9a7229]/10 dark:bg-[#c5a059]/10 flex items-center justify-center text-[#9a7229] dark:text-[#c5a059]">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-medium text-stone-800 dark:text-zinc-200">
                            Click to browse or drag & drop category photo
                          </p>
                          <p className="text-[10px] font-mono text-stone-500 dark:text-zinc-500">
                            JPG, PNG, WEBP, GIF up to 5 MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-stone-900 dark:text-[#f5f5f1] text-xs focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
                    />
                  </div>
                )}

                {/* Preview */}
                <div className="relative h-28 rounded-xl overflow-hidden border border-stone-300 dark:border-[#c5a059]/30 bg-stone-100 dark:bg-[#0a0a0a]">
                  <img
                    src={formImage.trim() || DEFAULT_CATEGORY_IMAGE}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_CATEGORY_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-end justify-between">
                    <div className="flex items-center gap-2 text-white min-w-0">
                      <CategoryIcon iconName={formIconName} className="w-4 h-4 text-[#c5a059] shrink-0" />
                      <span className="font-serif font-bold text-sm truncate">{formName || 'Category Name'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {formBadge && (
                        <span className="px-2 py-0.5 rounded bg-[#c5a059] text-black text-[10px] font-bold">
                          {formBadge}
                        </span>
                      )}
                      {formImage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormImage('');
                          }}
                          className="px-2 py-0.5 rounded bg-black/60 hover:bg-rose-600/80 text-white text-[10px] font-mono transition-colors"
                          title="Reset to default image"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Assign Existing Fragrances from Products Directory */}
              <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-[#c5a059]/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-stone-900 dark:text-[#f5f5f1] font-bold">
                    Assign Existing Fragrances ({formSelectedProductIds.length} Selected)
                  </label>
                  <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400">Products Directory</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={formProductSearch}
                    onChange={(e) => setFormProductSearch(e.target.value)}
                    placeholder="Search existing fragrances to assign..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500 absolute left-2.5 top-2.5" />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-stone-50 dark:bg-[#0a0a0a] rounded-xl border border-stone-200 dark:border-zinc-800">
                  {products
                    .filter((p) => {
                      if (!formProductSearch.trim()) return true;
                      const q = formProductSearch.toLowerCase().trim();
                      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                    })
                    .map((p) => {
                      const isChecked = formSelectedProductIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#141414] border border-stone-200 dark:border-zinc-800 cursor-pointer hover:border-[#9a7229] dark:hover:border-[#c5a059] text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormSelectedProductIds([...formSelectedProductIds, p.id]);
                                } else {
                                  setFormSelectedProductIds(formSelectedProductIds.filter((id) => id !== p.id));
                                }
                              }}
                              className="w-4 h-4 accent-[#9a7229] dark:accent-[#c5a059] rounded cursor-pointer"
                            />
                            <span className="font-medium text-stone-900 dark:text-zinc-200 truncate">{p.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-stone-500 dark:text-zinc-400 shrink-0">Rs. {p.price}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Submit / Actions Footer inside modal */}
              <div className="pt-4 border-t border-stone-200 dark:border-[#c5a059]/20 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-[#c5a059]/20 text-stone-700 dark:text-zinc-300 text-xs font-mono hover:bg-stone-100 dark:hover:bg-[#0a0a0a] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-2 shadow"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-950/50 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-[#f5f5f1]">
                  Delete Category?
                </h3>
                <p className="text-xs text-stone-600 dark:text-zinc-400">
                  This will remove <span className="font-bold">{deletingCat.name}</span> from the category showcase.
                </p>
              </div>
            </div>

            {getProductsForCategory(deletingCat.name).length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Warning: <strong className="font-semibold">{getProductsForCategory(deletingCat.name).length} products</strong> are assigned to this category. They will remain in the store under their current category tag.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingCat(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-[#c5a059]/20 text-stone-700 dark:text-zinc-300 text-xs font-mono min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(deletingCat)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs font-mono transition-colors shadow min-h-[40px]"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

