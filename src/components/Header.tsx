import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  ArrowRight,
  Tag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CategoryIcon } from './CategoryIcon';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onSelectCategory?: (catName: string) => void;
}

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'Perfumes',
    description: 'High sillage Extrait & Eau de Parfum compositions',
    iconName: 'Sparkles',
    badge: 'Signature'
  },
  {
    id: 'cat-2',
    name: 'Attars',
    description: 'Pure concentrated alcohol-free perfume oils',
    iconName: 'Droplets',
    badge: 'Pure Oil'
  },
  {
    id: 'cat-3',
    name: 'Oud',
    description: 'Rare aged Cambodian & Assam agarwood extracts',
    iconName: 'Flame',
    badge: 'Rare Wood'
  }
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onSelectCategory
}) => {
  const { itemCount, announcementBarText, storeSettings } = useCart();
  const { isAdminLoggedIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [mobileCategoriesExpanded, setMobileCategoriesExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasHero = activeTab === 'home';
  const isTransparent = hasHero && !isScrolled && !mobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('hero-banner') || document.querySelector('section');
      const heroHeight = heroSection ? heroSection.offsetHeight - 90 : 450;
      setIsScrolled(window.scrollY > (hasHero ? heroHeight : 20));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, hasHero]);

  const defaultLogo = '/api/images/fragrance-1787584475157-430ddcaba4074ac0.png';
  const isLogoEnabled = storeSettings?.isLogoEnabled !== false;
  const logoUrl = (storeSettings?.logoUrl && storeSettings.logoUrl.trim()) || defaultLogo;
  const storeName = storeSettings?.storeName || "Al-Mu'attar";

  const categories = (
    storeSettings?.categories && storeSettings.categories.length > 0
      ? storeSettings.categories
      : DEFAULT_CATEGORIES
  ).filter((c) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(c.name));

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'our-collection', label: 'Our Collection' },
    { id: 'categories', label: 'Categories', hasDropdown: true },
    { id: 'shop', label: 'Shop Collection' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    setCategoryDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (catName: string) => {
    setCategoryDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onSelectCategory) {
      onSelectCategory(catName);
    } else {
      setActiveTab('shop');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDropdownMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setCategoryDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setCategoryDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 w-full transition-all duration-300 ease-in-out">
      {/* 1. TOP ANNOUNCEMENT BAR (TRANSPARENT OVER HERO, SOLID WHEN SCROLLED) */}
      <div
        id="announcement-bar-banner"
        className={`relative z-30 text-xs py-2 px-3 sm:px-4 transition-all duration-300 w-full ${
          isTransparent
            ? 'bg-black/30 text-white/90 border-b border-white/10 backdrop-blur-[2px]'
            : 'bg-[#f2ede2] dark:bg-[#141414] text-stone-700 dark:text-zinc-300 border-b border-[#9a7229]/15 dark:border-[#c5a059]/10'
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center text-center font-light tracking-wider">
          <div className={`hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold shrink-0 ${
            isTransparent ? 'text-[#e0c078]' : 'text-[#9a7229] dark:text-[#c5a059]'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Fragrance House</span>
          </div>
          <p className={`mx-auto sm:mx-0 font-medium truncate max-w-full text-center px-1 text-[11px] sm:text-xs ${
            isTransparent ? 'text-white' : 'text-stone-800 dark:text-[#f5f5f1]/90'
          }`}>
            {announcementBarText}
          </p>
          <div className="hidden sm:block w-36 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* 2. MAIN NAVBAR: TRANSPARENT OVER HERO BANNER -> SOLID WHITE (LIGHT) / SOLID DARK (DARK) ON SCROLL */}
      <header className={`transition-all duration-300 ease-in-out w-full ${
        isTransparent
          ? 'bg-transparent text-white border-b border-white/10 shadow-none'
          : 'bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 shadow-md dark:shadow-2xl'
      }`}>
        <div className="max-w-7xl mx-auto px-3 min-[360px]:px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2.5 min-[360px]:gap-3 sm:gap-6 lg:gap-8 w-full">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-1.5 min-[360px]:p-2 rounded-md focus:outline-none shrink-0 cursor-pointer transition-colors ${
              isTransparent
                ? 'text-white hover:text-[#e0c078]'
                : 'text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 min-[360px]:gap-2.5 sm:gap-3.5 md:gap-4 cursor-pointer group select-none shrink-0 min-w-0"
          >
            {isLogoEnabled && (
              <div className="relative w-9 h-9 min-[360px]:w-10 min-[360px]:h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 aspect-square rounded-full overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                <img
                  src={logoUrl}
                  alt={`${storeName} Logo`}
                  className="w-full h-full object-contain rounded-full drop-shadow"
                  referrerPolicy="no-referrer"
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                />
              </div>
            )}
            <div className="flex flex-col shrink-0">
              <span className={`text-[13px] min-[360px]:text-sm min-[390px]:text-base sm:text-xl md:text-2xl font-serif tracking-[0.04em] min-[360px]:tracking-[0.07em] sm:tracking-[0.14em] md:tracking-[0.18em] font-bold sm:font-semibold transition-colors uppercase whitespace-nowrap ${
                isTransparent
                  ? 'text-white group-hover:text-[#e0c078]'
                  : 'text-stone-900 dark:text-[#f5f5f1] group-hover:text-[#9a7229] dark:group-hover:text-[#c5a059]'
              }`}>
                {storeName}
              </span>
            </div>
          </div>

          {/* Desktop Navigation with Interactive Category Dropdown */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;

              if (link.hasDropdown) {
                return (
                  <div
                    key={link.id}
                    className="relative group py-2"
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleDropdownMouseLeave}
                  >
                    <button
                      onClick={() => handleNavClick(link.id)}
                      className={`text-[13px] font-medium tracking-wider uppercase transition-all duration-200 relative py-1 inline-flex items-center gap-1 cursor-pointer ${
                        isActive || categoryDropdownOpen
                          ? isTransparent
                            ? 'text-[#e0c078] font-semibold'
                            : 'text-[#9a7229] dark:text-[#c5a059] font-semibold'
                          : isTransparent
                          ? 'text-white/90 hover:text-[#e0c078]'
                          : 'text-stone-700 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059]'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          categoryDropdownOpen
                            ? 'rotate-180 text-[#e0c078]'
                            : isTransparent
                            ? 'text-white/70'
                            : 'text-stone-400'
                        }`}
                      />
                      {isActive && (
                        <span className={`absolute bottom-0 left-0 w-full h-[2px] rounded-full shadow-[0_0_8px_#c5a059] ${
                          isTransparent ? 'bg-[#e0c078]' : 'bg-[#9a7229] dark:bg-[#c5a059]'
                        }`} />
                      )}
                    </button>

                    {/* Category Hover Dropdown Panel */}
                    {categoryDropdownOpen && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[420px] bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-stone-200 dark:border-[#c5a059]/25 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-stone-900 dark:text-[#f5f5f1]"
                        onMouseEnter={handleDropdownMouseEnter}
                        onMouseLeave={handleDropdownMouseLeave}
                      >
                        <div className="flex items-center justify-between px-2.5 pb-2.5 mb-1.5 border-b border-stone-100 dark:border-[#c5a059]/15">
                          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#9a7229] dark:text-[#c5a059] font-semibold flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Fragrance Categories
                          </span>
                          <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
                            {categories.length} Collections
                          </span>
                        </div>

                        {/* Categories List Grid */}
                        <div className="grid grid-cols-1 gap-1 max-h-[340px] overflow-y-auto pr-1">
                          {categories.map((cat) => (
                            <button
                              key={cat.id || cat.name}
                              type="button"
                              onClick={() => handleCategorySelect(cat.name)}
                              className="group/item flex items-center justify-between p-2 rounded-xl text-left hover:bg-stone-100 dark:hover:bg-[#1f1f1f] transition-all cursor-pointer border border-transparent hover:border-[#9a7229]/20 dark:hover:border-[#c5a059]/20"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-[#9a7229]/10 dark:bg-[#c5a059]/10 text-[#9a7229] dark:text-[#c5a059] group-hover/item:bg-[#9a7229] group-hover/item:text-white dark:group-hover/item:bg-[#c5a059] dark:group-hover/item:text-[#0a0a0a] transition-colors shrink-0">
                                  <CategoryIcon iconName={cat.iconName} className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-serif font-bold text-stone-900 dark:text-[#f5f5f1] group-hover/item:text-[#9a7229] dark:group-hover/item:text-[#c5a059] transition-colors truncate">
                                    {cat.name}
                                  </div>
                                  <p className="text-[10.5px] text-stone-500 dark:text-zinc-400 font-light truncate max-w-[260px]">
                                    {cat.description || `Explore authentic ${cat.name}`}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-stone-300 dark:text-zinc-600 group-hover/item:text-[#9a7229] dark:group-hover/item:text-[#c5a059] group-hover/item:translate-x-0.5 transition-all shrink-0 ml-2" />
                            </button>
                          ))}
                        </div>

                        {/* Dropdown Footer */}
                        <div className="pt-2.5 mt-1.5 border-t border-stone-100 dark:border-[#c5a059]/15 flex items-center justify-between px-2">
                          <button
                            type="button"
                            onClick={() => handleNavClick('categories')}
                            className="text-[11px] font-semibold text-[#9a7229] dark:text-[#c5a059] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Explore All Categories Overview</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategorySelect('All')}
                            className="text-[10.5px] font-mono text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            All Fragrances
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-[13px] font-medium tracking-wider uppercase transition-all duration-200 relative py-1 cursor-pointer ${
                    isActive
                      ? isTransparent
                        ? 'text-[#e0c078] font-semibold'
                        : 'text-[#9a7229] dark:text-[#c5a059] font-semibold'
                      : isTransparent
                      ? 'text-white/90 hover:text-[#e0c078]'
                      : 'text-stone-700 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className={`absolute bottom-0 left-0 w-full h-[2px] rounded-full shadow-[0_0_8px_#c5a059] ${
                      isTransparent ? 'bg-[#e0c078]' : 'bg-[#9a7229] dark:bg-[#c5a059]'
                    }`} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Right Tools */}
          <div className="flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-3 md:gap-4 lg:gap-4.5 shrink-0">
            {/* Light / Dark Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 min-[360px]:p-2 sm:p-2.5 transition-all rounded-full flex items-center justify-center border cursor-pointer ${
                isTransparent
                  ? 'text-white hover:text-[#e0c078] hover:bg-white/10 border-transparent hover:border-white/20'
                  : 'text-stone-700 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] hover:bg-stone-200/70 dark:hover:bg-[#1a1a1a] border-transparent hover:border-[#9a7229]/30 dark:hover:border-[#c5a059]/30'
              }`}
              aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              title={`Current theme: ${theme === 'light' ? 'Light Mode' : 'Dark Mode'}. Click to toggle.`}
            >
              {theme === 'light' ? (
                <Moon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:-rotate-12 ${
                  isTransparent ? 'text-white' : 'text-amber-900 hover:text-[#9a7229]'
                }`} />
              ) : (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#c5a059] transition-transform duration-300 hover:rotate-90" />
              )}
            </button>

            {/* Search trigger */}
            <button
              onClick={onOpenSearch}
              className={`p-1.5 min-[360px]:p-2 sm:p-2.5 transition-colors rounded-full cursor-pointer ${
                isTransparent
                  ? 'text-white hover:text-[#e0c078] hover:bg-white/10'
                  : 'text-stone-700 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] hover:bg-stone-200/70 dark:hover:bg-[#1a1a1a]'
              }`}
              title="Search Fragrances"
              aria-label="Search Fragrances"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Cart trigger */}
            <button
              onClick={() => handleNavClick('cart')}
              className={`relative p-1.5 min-[360px]:p-2 sm:p-2.5 transition-colors rounded-full flex items-center cursor-pointer ${
                isTransparent
                  ? 'text-white hover:text-[#e0c078] hover:bg-white/10'
                  : 'text-stone-700 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] hover:bg-stone-200/70 dark:hover:bg-[#1a1a1a]'
              }`}
              title="Shopping Cart"
              aria-label={`Shopping Cart with ${itemCount} items`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-[10px] sm:text-[11px] w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Profile / Portal Login / Admin */}
            {isAdminLoggedIn ? (
              <button
                id="navbar-admin-button"
                onClick={() => handleNavClick('admin-dashboard')}
                className={`px-2.5 py-1 min-[360px]:px-3 min-[360px]:py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isTransparent
                    ? 'text-[#e0c078] bg-black/35 hover:bg-black/50 border border-[#e0c078]/50 hover:border-[#e0c078] shadow-sm backdrop-blur-xs'
                    : 'bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/35 dark:border-[#c5a059]/35 hover:bg-[#9a7229] hover:text-white dark:hover:bg-[#c5a059] dark:hover:text-[#0a0a0a] shadow-xs'
                }`}
                title="Admin Dashboard"
                aria-label="Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                id="navbar-user-button"
                onClick={() => handleNavClick('admin-login')}
                className={`p-1.5 min-[360px]:p-2 sm:p-2.5 transition-colors rounded-full flex items-center justify-center cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:text-[#e0c078] hover:bg-white/10'
                    : 'text-stone-700 dark:text-zinc-300 hover:text-[#9a7229] dark:hover:text-[#c5a059] hover:bg-stone-200/70 dark:hover:bg-[#1a1a1a]'
                }`}
                title="Account / Portal Login"
                aria-label="Account / Portal Login"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#141414] border-b border-stone-200 dark:border-[#c5a059]/20 px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200 shadow-2xl">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                if (link.hasDropdown) {
                  return (
                    <div key={link.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setMobileCategoriesExpanded(!mobileCategoriesExpanded)}
                        className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-lg text-[13px] uppercase tracking-wider font-medium cursor-pointer transition-colors ${
                          activeTab === link.id || mobileCategoriesExpanded
                            ? 'bg-[#9a7229]/15 text-[#9a7229] border border-[#9a7229]/30 dark:bg-[#c5a059]/15 dark:text-[#c5a059] dark:border-[#c5a059]/30 font-semibold'
                            : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-[#1a1a1a] hover:text-stone-900 dark:hover:text-white'
                        }`}
                        aria-expanded={mobileCategoriesExpanded}
                        aria-label="Toggle Categories Dropdown"
                      >
                        <div className="flex items-center gap-2">
                          <span>{link.label}</span>
                          <span className="text-[10px] font-mono lowercase px-1.5 py-0.5 rounded bg-[#9a7229]/10 dark:bg-[#c5a059]/10 text-[#9a7229] dark:text-[#c5a059]">
                            {categories.length}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-500 dark:text-zinc-500 transition-transform duration-200 ${
                            mobileCategoriesExpanded ? 'rotate-180 text-[#9a7229] dark:text-[#c5a059]' : ''
                          }`}
                        />
                      </button>

                      {/* Expandable Categories Dropdown Panel on Mobile/Tablet */}
                      {mobileCategoriesExpanded && (
                        <div className="pl-2 pr-1 py-1.5 space-y-1 bg-stone-50/80 dark:bg-[#0f0f0f] rounded-xl border border-stone-200/80 dark:border-[#c5a059]/15 animate-in slide-in-from-top-2 duration-150">
                          {categories.map((cat) => (
                            <button
                              key={cat.id || cat.name}
                              type="button"
                              onClick={() => handleCategorySelect(cat.name)}
                              className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-stone-200/60 dark:hover:bg-[#1a1a1a] transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-1.5 rounded-md bg-[#9a7229]/10 dark:bg-[#c5a059]/10 text-[#9a7229] dark:text-[#c5a059] group-hover:bg-[#9a7229] group-hover:text-white dark:group-hover:bg-[#c5a059] dark:group-hover:text-black transition-colors shrink-0">
                                  <CategoryIcon iconName={cat.iconName} className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] group-hover:text-[#9a7229] dark:group-hover:text-[#c5a059] truncate">
                                    {cat.name}
                                  </div>
                                  {cat.description && (
                                    <p className="text-[10px] text-stone-500 dark:text-zinc-400 truncate max-w-[200px] font-light">
                                      {cat.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-600 group-hover:text-[#9a7229] dark:group-hover:text-[#c5a059] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                            </button>
                          ))}

                          {/* Quick direct links */}
                          <div className="pt-2 mt-1 border-t border-stone-200 dark:border-[#c5a059]/15 flex items-center justify-between px-2">
                            <button
                              type="button"
                              onClick={() => handleNavClick('categories')}
                              className="text-[11px] font-semibold text-[#9a7229] dark:text-[#c5a059] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Overview</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCategorySelect('All')}
                              className="text-[10.5px] font-mono text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              All Fragrances
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`flex items-center justify-between text-left py-2 px-3 rounded-lg text-[13px] uppercase tracking-wider font-medium cursor-pointer ${
                      activeTab === link.id
                        ? 'bg-[#9a7229]/15 text-[#9a7229] border border-[#9a7229]/30 dark:bg-[#c5a059]/15 dark:text-[#c5a059] dark:border-[#c5a059]/30 font-semibold'
                        : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-[#1a1a1a] hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="w-4 h-4 text-stone-500 dark:text-zinc-500" />
                  </button>
                );
              })}

              <div className="pt-4 border-t border-stone-200 dark:border-[#c5a059]/20 flex flex-col gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-stone-100 dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1] text-sm border border-stone-300 dark:border-[#c5a059]/20 hover:border-[#9a7229]/50 dark:hover:border-[#c5a059]/50 transition-colors cursor-pointer"
                  aria-label={`Switch theme. Current mode is ${theme === 'light' ? 'Light' : 'Dark'}`}
                >
                  <div className="flex items-center gap-2">
                    {theme === 'light' ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-700" />
                        <span className="font-medium">Theme Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-[#c5a059]" />
                        <span className="font-medium">Theme Mode</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-[#9a7229]/20 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] flex items-center gap-1.5">
                    {theme === 'light' ? <>☀️ Light Mode</> : <>🌙 Dark Mode</>}
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('cart')}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-stone-100 dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1] text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                    <span>Your Shopping Cart</span>
                  </div>
                  <span className="bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                </button>

                {isAdminLoggedIn ? (
                  <button
                    onClick={() => handleNavClick('admin-dashboard')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#9a7229]/15 dark:bg-[#c5a059]/15 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] text-sm font-mono font-semibold cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
                      <span>Admin Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('admin-login')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-stone-100 dark:bg-[#1a1a1a] text-stone-600 dark:text-zinc-400 text-xs font-mono cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-stone-500 dark:text-zinc-400" />
                      <span>Admin Portal Login</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
};

