import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Grid,
  Layers,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Sun,
  Moon,
  Star,
  Sparkles,
  FileText,
  Compass,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

interface AdminLayoutProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  onGoToStore?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  onGoToStore = () => {},
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {},
  children
}) => {
  const active = currentTab || activeTab || 'admin-dashboard';
  const changeTab = setCurrentTab || setActiveTab || (() => {});
  const { adminUser, logout, isAdminLoggedIn, isLoading, initializeAdminSession } = useAuth();
  const { storeSettings } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdminLoggedIn) {
      initializeAdminSession();
    }
  }, [isAdminLoggedIn, isLoading]);

  const menuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-orders', label: 'Orders Management', icon: ShoppingBag },
    { id: 'admin-products', label: 'Products Directory', icon: Package },
    { id: 'admin-reviews', label: 'Customer Reviews', icon: Star },
    { id: 'admin-shop-cms', label: 'Shop Banners CMS', icon: ImageIcon },
    { id: 'admin-our-collection', label: 'Our Collection CMS', icon: Compass },
    { id: 'admin-bestsellers', label: 'Best Sellers Control', icon: Sparkles },
    { id: 'admin-categories', label: 'Categories Management', icon: Grid },
    { id: 'admin-inventory', label: 'Inventory Control', icon: Layers },
    { id: 'admin-customers', label: 'Customers List', icon: Users },
    { id: 'admin-messages', label: 'Concierge Messages', icon: MessageSquare },
    { id: 'admin-homepage', label: 'Homepage CMS', icon: Sparkles },
    { id: 'admin-about', label: 'About Us CMS', icon: FileText },
    { id: 'admin-settings', label: 'Store Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onShowToast('Logged out of admin panel.', 'success');
      if (onGoToStore) {
        onGoToStore();
      }
      changeTab('home');
      if (typeof window !== 'undefined') {
        window.history.replaceState({ tab: 'home' }, '', '/');
      }
    }
  };

  const handleNav = (id: string) => {
    changeTab(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-[#f2ede2] dark:bg-[#1a1a1a] border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          {storeSettings?.logoUrl && storeSettings.logoUrl.trim() ? (
            <div className="w-6 h-6 aspect-square rounded-full overflow-hidden border border-[#9a7229]/30 dark:border-[#c5a059]/30 flex items-center justify-center shrink-0">
              <img
                src={storeSettings.logoUrl.trim()}
                alt={`${storeSettings?.storeName || 'Brand'} Logo`}
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <ShieldCheck className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059]" />
          )}
          <span className="font-serif font-bold text-sm uppercase tracking-wider text-stone-900 dark:text-[#f5f5f1]">
            {storeSettings?.storeName || "Al-Mu'attar"} Admin
          </span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`w-full md:w-64 bg-[#f2ede2] dark:bg-[#1a1a1a] border-r border-[#9a7229]/20 dark:border-[#c5a059]/20 flex flex-col justify-between shrink-0 ${
          mobileSidebarOpen ? 'block fixed inset-0 z-50 bg-[#f8f6f0] dark:bg-[#0a0a0a] p-6 space-y-6 overflow-y-auto' : 'hidden md:flex'
        }`}
      >
        <div className="space-y-6">
          {/* Header Branding */}
          <div className="p-6 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 aspect-square rounded-full overflow-hidden bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center shrink-0">
                {storeSettings?.logoUrl && storeSettings.logoUrl.trim() ? (
                  <img
                    src={storeSettings.logoUrl.trim()}
                    alt={`${storeSettings?.storeName || 'Brand'} Logo`}
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-bold text-sm">
                    {(storeSettings?.storeName || 'A').charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm tracking-wider uppercase text-stone-900 dark:text-[#f5f5f1]">
                  {storeSettings?.storeName || "Al-Mu'attar"}
                </h2>
                <span className="text-[10px] font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-widest block font-semibold">
                  Admin Control
                </span>
              </div>
            </div>
            {mobileSidebarOpen && (
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#9a7229]/15 dark:bg-[#c5a059]/20 border border-[#9a7229] dark:border-[#c5a059] text-[#9a7229] dark:text-[#c5a059] shadow-sm'
                      : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-200/70 dark:hover:bg-[#0a0a0a]/60 hover:text-stone-900 dark:hover:text-[#f5f5f1]'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#9a7229] dark:text-[#c5a059]' : 'text-stone-500 dark:text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#9a7229]/20 dark:border-[#c5a059]/20 space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-200/70 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] text-xs font-mono transition-colors"
            aria-label="Toggle Theme Mode"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-700" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#c5a059]" />
              )}
              <span>Theme: {theme === 'light' ? 'Light' : 'Dark'}</span>
            </span>
            <span className="text-[10px] text-[#9a7229] dark:text-[#c5a059] uppercase font-bold">Toggle</span>
          </button>

          <button
            onClick={onGoToStore}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-200/70 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] text-xs font-mono transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
              View Live Store
            </span>
            <span>→</span>
          </button>

          <div className="pt-2 flex items-center justify-between border-t border-[#9a7229]/20 dark:border-[#c5a059]/20 text-xs">
            <div className="truncate pr-2">
              <div className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono">Signed in as</div>
              <div className="font-mono text-stone-800 dark:text-zinc-300 text-[11px] truncate">{adminUser?.email || 'admin@store.com'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
};
