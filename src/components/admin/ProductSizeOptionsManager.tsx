import React from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Sparkles, Layers } from 'lucide-react';
import { ProductSizeOption } from '../../types';

export interface SizeOptionFormItem {
  id: string;
  size: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  isDefault: boolean;
}

interface ProductSizeOptionsManagerProps {
  sizeOptions: SizeOptionFormItem[];
  onChange: (options: SizeOptionFormItem[]) => void;
  basePrice?: string;
  baseStock?: string;
  baseSku?: string;
  disabled?: boolean;
}

const COMMON_PRESET_SIZES = [
  { size: '6ml', label: '6ml (Pocket / Attar)', defaultPriceMultiplier: 0.3 },
  { size: '12ml', label: '12ml (1 Tola)', defaultPriceMultiplier: 0.5 },
  { size: '30ml', label: '30ml', defaultPriceMultiplier: 0.75 },
  { size: '50ml', label: '50ml (Standard)', defaultPriceMultiplier: 1.0 },
  { size: '100ml', label: '100ml (Large)', defaultPriceMultiplier: 1.7 },
  { size: '200ml', label: '200ml (Jumbo)', defaultPriceMultiplier: 3.0 }
];

export const ProductSizeOptionsManager: React.FC<ProductSizeOptionsManagerProps> = ({
  sizeOptions,
  onChange,
  basePrice = '',
  baseStock = '10',
  baseSku = '',
  disabled = false
}) => {
  const handleAddPreset = (presetSize: string, multiplier: number) => {
    const exists = sizeOptions.some((s) => s.size.trim().toLowerCase() === presetSize.toLowerCase());
    if (exists) return;

    const baseP = parseFloat(basePrice) || 0;
    const computedPrice = baseP > 0 ? Math.round(baseP * multiplier) : '';
    const isFirst = sizeOptions.length === 0;

    const newItem: SizeOptionFormItem = {
      id: `size-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      size: presetSize,
      price: computedPrice ? String(computedPrice) : '',
      compareAtPrice: '',
      stock: baseStock || '10',
      sku: baseSku ? `${baseSku}-${presetSize.toUpperCase()}` : '',
      isDefault: isFirst
    };

    onChange([...sizeOptions, newItem]);
  };

  const handleAddNewBlank = () => {
    const isFirst = sizeOptions.length === 0;
    const newItem: SizeOptionFormItem = {
      id: `size-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      size: '',
      price: basePrice || '',
      compareAtPrice: '',
      stock: baseStock || '10',
      sku: baseSku ? `${baseSku}-${sizeOptions.length + 1}` : '',
      isDefault: isFirst
    };
    onChange([...sizeOptions, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof SizeOptionFormItem, val: any) => {
    const updated = [...sizeOptions];
    if (field === 'isDefault' && val === true) {
      updated.forEach((item, i) => {
        item.isDefault = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = sizeOptions.filter((_, i) => i !== index);
    // If the removed item was default, make the first one default
    if (updated.length > 0 && !updated.some((item) => item.isDefault)) {
      updated[0].isDefault = true;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Presets Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 dark:bg-[#0a0a0a] p-3.5 rounded-xl border border-stone-200 dark:border-[#c5a059]/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          <span className="text-xs font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">
            Quick-Add Popular Fragrance Sizes:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {COMMON_PRESET_SIZES.map((preset) => {
            const isAlreadyAdded = sizeOptions.some(
              (s) => s.size.trim().toLowerCase() === preset.size.toLowerCase()
            );
            return (
              <button
                key={preset.size}
                type="button"
                disabled={disabled || isAlreadyAdded}
                onClick={() => handleAddPreset(preset.size, preset.defaultPriceMultiplier)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  isAlreadyAdded
                    ? 'bg-stone-200 dark:bg-zinc-800/80 text-stone-400 dark:text-zinc-600 opacity-60 cursor-not-allowed'
                    : 'bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-300 hover:border-[#9a7229] dark:hover:border-[#c5a059] hover:text-[#9a7229] dark:hover:text-[#c5a059] shadow-xs'
                }`}
              >
                <span>+ {preset.size}</span>
              </button>
            );
          })}

          <button
            type="button"
            disabled={disabled}
            onClick={handleAddNewBlank}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] hover:bg-[#9a7229] hover:text-white dark:hover:bg-[#c5a059] dark:hover:text-black transition-all flex items-center gap-1 cursor-pointer font-serif"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Size</span>
          </button>
        </div>
      </div>

      {/* Size Options Table / List */}
      {sizeOptions.length === 0 ? (
        <div className="text-center py-6 px-4 border border-dashed border-stone-300 dark:border-zinc-800 rounded-xl bg-stone-50/50 dark:bg-[#0e0e0e]/50">
          <Layers className="w-8 h-8 text-stone-400 dark:text-zinc-600 mx-auto mb-2 opacity-60" />
          <p className="text-xs text-stone-600 dark:text-zinc-400 font-medium">
            Single size mode active. Use the buttons above to add multiple bottle sizes (e.g. 6ml, 12ml, 50ml, 100ml).
          </p>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500 font-mono mt-1">
            When multiple sizes are configured, customers can choose their preferred size & price on the product page.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 text-[11px] font-mono text-stone-500 dark:text-zinc-400 uppercase font-semibold">
            <div className="col-span-3">Size Name (e.g. 50ml) *</div>
            <div className="col-span-2">Price (PKR) *</div>
            <div className="col-span-2">Compare Price</div>
            <div className="col-span-2">Stock Qty *</div>
            <div className="col-span-2 text-center">Default Size</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {sizeOptions.map((item, idx) => (
            <div
              key={item.id}
              className={`p-3 sm:p-2.5 rounded-xl border transition-all ${
                item.isDefault
                  ? 'bg-amber-500/5 dark:bg-[#c5a059]/10 border-[#9a7229]/40 dark:border-[#c5a059]/40 shadow-xs'
                  : 'bg-white dark:bg-[#141414] border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Size Name */}
                <div className="sm:col-span-3 space-y-1 sm:space-y-0">
                  <span className="sm:hidden text-[10px] font-mono text-stone-500 dark:text-zinc-400 uppercase font-semibold">
                    Size Name:
                  </span>
                  <input
                    type="text"
                    required
                    disabled={disabled}
                    placeholder="e.g. 50ml, 12ml (1 Tola)"
                    value={item.size}
                    onChange={(e) => handleUpdateItem(idx, 'size', e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-lg p-2 text-xs font-semibold text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                  />
                </div>

                {/* Price */}
                <div className="sm:col-span-2 space-y-1 sm:space-y-0">
                  <span className="sm:hidden text-[10px] font-mono text-stone-500 dark:text-zinc-400 uppercase font-semibold">
                    Price (PKR):
                  </span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
                      Rs.
                    </span>
                    <input
                      type="number"
                      required
                      min={0}
                      disabled={disabled}
                      placeholder="e.g. 4500"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(idx, 'price', e.target.value)}
                      className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-lg p-2 pl-7 text-xs font-mono font-bold text-[#9a7229] dark:text-[#c5a059] focus:outline-none focus:ring-1 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                    />
                  </div>
                </div>

                {/* Compare At Price */}
                <div className="sm:col-span-2 space-y-1 sm:space-y-0">
                  <span className="sm:hidden text-[10px] font-mono text-stone-500 dark:text-zinc-400 uppercase font-semibold">
                    Compare Price (PKR):
                  </span>
                  <input
                    type="number"
                    min={0}
                    disabled={disabled}
                    placeholder="e.g. 5500"
                    value={item.compareAtPrice}
                    onChange={(e) => handleUpdateItem(idx, 'compareAtPrice', e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-lg p-2 text-xs font-mono text-stone-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                  />
                </div>

                {/* Stock Quantity */}
                <div className="sm:col-span-2 space-y-1 sm:space-y-0">
                  <span className="sm:hidden text-[10px] font-mono text-stone-500 dark:text-zinc-400 uppercase font-semibold">
                    Stock Qty:
                  </span>
                  <input
                    type="number"
                    min={0}
                    disabled={disabled}
                    placeholder="10"
                    value={item.stock}
                    onChange={(e) => handleUpdateItem(idx, 'stock', e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-lg p-2 text-xs font-mono text-stone-900 dark:text-[#f5f5f1] focus:outline-none focus:ring-1 focus:ring-[#9a7229] dark:focus:ring-[#c5a059]"
                  />
                </div>

                {/* Is Default Radio */}
                <div className="sm:col-span-2 flex items-center sm:justify-center gap-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleUpdateItem(idx, 'isDefault', true)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      item.isDefault
                        ? 'bg-[#9a7229] text-white dark:bg-[#c5a059] dark:text-black font-bold shadow-xs'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {item.isDefault ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                    <span>{item.isDefault ? 'Default' : 'Set Default'}</span>
                  </button>
                </div>

                {/* Delete Action */}
                <div className="sm:col-span-1 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
                    title="Remove this size option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
              Total configured sizes: <strong className="text-[#9a7229] dark:text-[#c5a059]">{sizeOptions.length}</strong>
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={handleAddNewBlank}
              className="text-xs font-serif font-semibold text-[#9a7229] dark:text-[#c5a059] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Size Option</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
