import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, StoreSettings, SelectedBundleFragrance } from '../types';
import { apiFetch } from '../lib/api';

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedProducts?: SelectedBundleFragrance[],
    sizeOption?: { size: string; price: number; stock?: number }
  ) => void;
  updateQuantity: (cartItemIdOrProductId: string, quantity: number) => void;
  removeFromCart: (cartItemIdOrProductId: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  shippingFee: number;
  freeShippingThreshold: number;
  standardShippingFee: number;
  grandTotal: number;
  storeSettings: StoreSettings | null;
  isLoadingSettings: boolean;
  announcementBarText: string;
  refreshSettings: () => Promise<void>;
}

const CART_STORAGE_KEY = 'al_muattar_cart_v1';
const SETTINGS_STORAGE_KEY = 'al_muattar_store_settings_cache_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed: CartItem[] = JSON.parse(stored);
      // Ensure every item has an id and proper price/size fields
      return parsed.map(item => {
        let id = item.id;
        if (!id) {
          if (item.product.isBundle && item.selectedProducts && item.selectedProducts.length > 0) {
            id = `${item.product.id}__bundle_${item.selectedProducts.map(p => p.id).sort().join('_')}`;
          } else if (item.selectedSize) {
            id = `${item.product.id}__size_${encodeURIComponent(item.selectedSize)}`;
          } else {
            id = item.product.id;
          }
        }
        return {
          ...item,
          id,
          selectedSize: item.selectedSize || item.product.size,
          selectedPrice: typeof item.selectedPrice === 'number' ? item.selectedPrice : item.product.price
        };
      });
    } catch (e) {
      console.error('Failed to parse stored cart:', e);
      return [];
    }
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(() => {
    try {
      if (typeof window !== 'undefined' && window.__INITIAL_STORE_SETTINGS__) {
        return window.__INITIAL_STORE_SETTINGS__;
      }
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_STORAGE_KEY) : null;
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load cached store settings:', e);
    }
    return null;
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(!storeSettings);

  const refreshSettings = async () => {
    try {
      const res = await apiFetch<{ success: boolean; settings: StoreSettings }>('/api/settings');
      if (res.success && res.settings) {
        setStoreSettings(res.settings);
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(res.settings));
        } catch (e) {
          console.error('Failed to persist store settings cache:', e);
        }
      }
    } catch (e) {
      console.error('Failed to fetch store settings in CartContext:', e);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [cart]);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedProducts?: SelectedBundleFragrance[],
    sizeOption?: { size: string; price: number; stock?: number }
  ) => {
    const selectedIds = selectedProducts ? selectedProducts.map(p => p.id) : [];
    
    let itemKey = product.id;
    if (product.isBundle && selectedIds.length > 0) {
      itemKey = `${product.id}__bundle_${[...selectedIds].sort().join('_')}`;
    } else if (sizeOption?.size) {
      itemKey = `${product.id}__size_${encodeURIComponent(sizeOption.size)}`;
    }

    const effectiveSize = sizeOption?.size || product.size || '50ml';
    const effectivePrice = sizeOption?.price !== undefined ? sizeOption.price : product.price;
    const effectiveStock = sizeOption?.stock !== undefined ? sizeOption.stock : product.stock;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => (item.id || item.product.id) === itemKey);
      const targetQty = existingIndex > -1 ? prev[existingIndex].quantity + quantity : quantity;
      
      // Bound by stock
      const safeQty = Math.max(1, Math.min(targetQty, effectiveStock > 0 ? effectiveStock : 999));

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          id: itemKey,
          quantity: safeQty,
          product,
          selectedSize: effectiveSize,
          selectedPrice: effectivePrice,
          selectedStock: effectiveStock,
          selectedProducts: selectedProducts || updated[existingIndex].selectedProducts,
          selectedProductIds: selectedIds.length > 0 ? selectedIds : updated[existingIndex].selectedProductIds
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: itemKey,
            product,
            quantity: safeQty,
            selectedSize: effectiveSize,
            selectedPrice: effectivePrice,
            selectedStock: effectiveStock,
            selectedProducts: selectedProducts || [],
            selectedProductIds: selectedIds
          }
        ];
      }
    });
  };

  const updateQuantity = (cartItemIdOrProductId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemIdOrProductId);
      return;
    }

    setCart(prev =>
      prev.map(item => {
        const key = item.id || item.product.id;
        if (key === cartItemIdOrProductId || item.product.id === cartItemIdOrProductId) {
          const maxStock = item.selectedStock !== undefined ? item.selectedStock : item.product.stock;
          const safeQty = Math.min(quantity, maxStock > 0 ? maxStock : 999);
          return { ...item, quantity: safeQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemIdOrProductId: string) => {
    setCart(prev =>
      prev.filter(item => {
        const key = item.id || item.product.id;
        return key !== cartItemIdOrProductId && item.product.id !== cartItemIdOrProductId;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = item.selectedPrice !== undefined ? item.selectedPrice : item.product.price;
    return acc + itemPrice * item.quantity;
  }, 0);
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const freeShippingThreshold = 0;
  const standardShippingFee = 0;
  const shippingFee = 0;
  const grandTotal = subtotal;

  const announcementBarText = storeSettings?.announcementBarText ||
    'Free Express Shipping Across Pakistan On All Orders | Cash on Delivery Available';

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        itemCount,
        shippingFee,
        freeShippingThreshold,
        standardShippingFee,
        grandTotal,
        storeSettings,
        isLoadingSettings,
        announcementBarText,
        refreshSettings
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
