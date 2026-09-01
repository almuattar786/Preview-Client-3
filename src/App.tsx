import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { Product } from './types';

// Storefront Pages
import { HomePage } from './pages/HomePage';
import { OurCollectionPage } from './pages/OurCollectionPage';
import { ShopPage } from './pages/ShopPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminShopCollectionCMS } from './pages/admin/AdminShopCollectionCMS';
import { AdminOurCollectionPage } from './pages/admin/AdminOurCollectionPage';
import { AdminBestSellersPage } from './pages/admin/AdminBestSellersPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminAboutPage } from './pages/admin/AdminAboutPage';
import { AdminHomePageCMS } from './pages/admin/AdminHomePageCMS';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { Search, X } from 'lucide-react';

function MainApp() {
  const { isAdminLoggedIn, isLoading: isAuthLoading, initializeAdminSession } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetailOriginTab, setOrderDetailOriginTab] = useState<string>('admin-orders');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [preselectedCategoryForForm, setPreselectedCategoryForForm] = useState<string | null>(null);

  // Search Modal
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveSearchQuery(searchQuery.trim());
    setSearchModalOpen(false);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order: any) => {
    setLastOrderDetails(order);
    setActiveTab('order-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminSelectOrder = (orderId: string, originTab?: string) => {
    setSelectedOrderId(orderId);
    setOrderDetailOriginTab(originTab || (activeTab.startsWith('admin-') ? activeTab : 'admin-orders'));
    setActiveTab('admin-order-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminEditProduct = (productId?: string) => {
    setEditingProductId(productId || null);
    setActiveTab('admin-product-form');
  };

  // Synchronize admin session when navigating to admin routes
  React.useEffect(() => {
    if (!isAuthLoading && activeTab.startsWith('admin-') && !isAdminLoggedIn) {
      initializeAdminSession();
    }
  }, [isAdminLoggedIn, isAuthLoading, activeTab]);

  // URL path synchronization with state
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const catParam = searchParams.get('category');

      if (path === '/categories') {
        setActiveTab('categories');
      } else if (path === '/shop') {
        if (catParam) setSelectedCategory(catParam);
        setActiveTab('shop');
      } else if (path === '/our-collection') {
        setActiveTab('our-collection');
      } else if (path === '/about') {
        setActiveTab('about');
      } else if (path === '/contact') {
        setActiveTab('contact');
      } else if (path === '/cart') {
        setActiveTab('cart');
      } else if (path === '/checkout') {
        setActiveTab('checkout');
      } else if (path === '/admin-login' || path === '/admin') {
        setActiveTab('admin-dashboard');
      } else if (path.startsWith('/admin-')) {
        setActiveTab(path.substring(1));
      } else if (path === '/' || path === '') {
        setActiveTab('home');
      }
    };

    // Run on initial mount
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL on tab changes (pushState without reloading)
  React.useEffect(() => {
    let targetUrl = '/';
    if (activeTab === 'categories') {
      targetUrl = '/categories';
    } else if (activeTab === 'shop') {
      targetUrl = selectedCategory && selectedCategory !== 'All' 
        ? `/shop?category=${encodeURIComponent(selectedCategory)}` 
        : '/shop';
    } else if (activeTab === 'our-collection') {
      targetUrl = '/our-collection';
    } else if (activeTab === 'about') {
      targetUrl = '/about';
    } else if (activeTab === 'contact') {
      targetUrl = '/contact';
    } else if (activeTab === 'cart') {
      targetUrl = '/cart';
    } else if (activeTab === 'checkout') {
      targetUrl = '/checkout';
    } else if (activeTab === 'search') {
      targetUrl = `/search?q=${encodeURIComponent(activeSearchQuery)}`;
    } else if (activeTab.startsWith('admin-')) {
      targetUrl = `/${activeTab}`;
    }

    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState({ tab: activeTab, category: selectedCategory }, '', targetUrl);
    }
  }, [activeTab, selectedCategory, activeSearchQuery]);

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setActiveTab('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminView = activeTab.startsWith('admin-');

  return (
    <div className="min-h-screen w-full max-w-full bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] flex flex-col font-sans selection:bg-[#9a7229] dark:selection:bg-[#c5a059] selection:text-white dark:selection:text-[#0a0a0a] transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header - shown on non-admin pages or admin login */}
      {!isAdminView && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSearch={() => setSearchModalOpen(true)}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {/* Main Content Router */}
      <main className={`flex-1 w-full max-w-full min-w-0 ${!isAdminView && activeTab !== 'home' ? 'pt-24 sm:pt-28' : 'pt-0'}`}>
        {activeTab === 'home' && (
          <HomePage
            setActiveTab={setActiveTab}
            onViewProductDetails={handleViewProductDetails}
            onShowToast={showToast}
            setSelectedCategory={setSelectedCategory}
            setSelectedGender={setSelectedGender}
          />
        )}

        {activeTab === 'our-collection' && (
          <OurCollectionPage
            onViewProductDetails={handleViewProductDetails}
            onShowToast={showToast}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesPage
            setActiveTab={setActiveTab}
            onSelectCategory={handleSelectCategory}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'shop' && (
          <ShopPage
            onViewProductDetails={handleViewProductDetails}
            onShowToast={showToast}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedGender={selectedGender}
            setSelectedGender={setSelectedGender}
          />
        )}

        {activeTab === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            onBackToShop={() => setActiveTab('shop')}
            onShowToast={showToast}
            onViewDetails={handleViewProductDetails}
          />
        )}

        {activeTab === 'cart' && (
          <CartPage
            onProceedToCheckout={() => setActiveTab('checkout')}
            onContinueShopping={() => setActiveTab('shop')}
          />
        )}

        {activeTab === 'checkout' && (
          <CheckoutPage
            onOrderSuccess={handleOrderSuccess}
            onBackToCart={() => setActiveTab('cart')}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'order-confirmation' && (
          <OrderConfirmationPage
            order={lastOrderDetails}
            onContinueShopping={() => setActiveTab('shop')}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'contact' && (
          <ContactPage onShowToast={showToast} />
        )}

        {activeTab === 'search' && (
          <SearchResultsPage
            query={activeSearchQuery}
            onBackToShop={() => setActiveTab('shop')}
            onViewProductDetails={handleViewProductDetails}
            onShowToast={showToast}
          />
        )}

        {/* Admin Section */}
        {activeTab === 'admin-login' && (
          <AdminLoginPage
            onLoginSuccess={() => setActiveTab('admin-dashboard')}
            onShowToast={showToast}
            onGoToHome={() => setActiveTab('home')}
            onBackToStore={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'admin-dashboard' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminDashboardPage
              setCurrentTab={setActiveTab}
              setActiveTab={setActiveTab}
              onOpenOrderDetails={(order) => {
                handleAdminSelectOrder(order.id || order.orderNumber, 'admin-dashboard');
              }}
              onSelectOrder={(id) => handleAdminSelectOrder(id, 'admin-dashboard')}
              onOpenAddProduct={() => {
                setEditingProductId(null);
                setActiveTab('admin-product-form');
              }}
              onShowToast={showToast}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-orders' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminOrdersPage
              onOpenOrderDetails={(order) => {
                handleAdminSelectOrder(order.id || order.orderNumber, 'admin-orders');
              }}
              onSelectOrder={(id) => handleAdminSelectOrder(id, 'admin-orders')}
              onShowToast={showToast}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-order-detail' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminOrderDetailPage
              orderId={selectedOrderId || ''}
              backLabel={
                orderDetailOriginTab === 'admin-customers'
                  ? 'Back to Customer Directory'
                  : orderDetailOriginTab === 'admin-dashboard'
                  ? 'Back to Admin Overview'
                  : 'Back to Orders Directory'
              }
              onBack={() => {
                setActiveTab(orderDetailOriginTab || 'admin-orders');
              }}
              onShowToast={showToast}
              onNavigateToCustomer={(_customerQuery) => {
                setActiveTab('admin-customers');
              }}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-products' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminProductsPage
              onOpenAddProduct={() => {
                setEditingProductId(null);
                setActiveTab('admin-product-form');
              }}
              onOpenEditProduct={(prod) => {
                setEditingProductId(prod.id);
                setActiveTab('admin-product-form');
              }}
              onEditProduct={handleAdminEditProduct}
              onNavigateToBestSellers={() => setActiveTab('admin-bestsellers')}
              onShowToast={showToast}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-reviews' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminReviewsPage
              onShowToast={showToast}
              onNavigateToProduct={(pId) => {
                setEditingProductId(pId);
                setActiveTab('admin-product-form');
              }}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-shop-cms' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('shop')}
            onShowToast={showToast}
          >
            <AdminShopCollectionCMS
              onShowToast={showToast}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-our-collection' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('our-collection')}
            onShowToast={showToast}
          >
            <AdminOurCollectionPage
              onShowToast={showToast}
              onNavigateToProduct={(pId) => {
                setEditingProductId(pId);
                setActiveTab('admin-product-form');
              }}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-bestsellers' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminBestSellersPage
              onShowToast={showToast}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-categories' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminCategoriesPage
              onShowToast={showToast}
              onNavigateToProducts={(categoryName) => {
                setSelectedCategory(categoryName);
                setActiveTab('shop');
              }}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-product-form' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminProductFormPage
              productId={editingProductId}
              initialCategory={preselectedCategoryForForm}
              onBack={() => {
                setPreselectedCategoryForForm(null);
                setActiveTab('admin-products');
              }}
              onShowToast={showToast}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-inventory' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminInventoryPage
              onOpenEditProduct={(prod) => {
                setEditingProductId(prod.id);
                setActiveTab('admin-product-form');
              }}
              onEditProduct={handleAdminEditProduct}
              onShowToast={showToast}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-customers' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminCustomersPage
              onSelectOrder={(id) => handleAdminSelectOrder(id, 'admin-customers')}
              onShowToast={showToast}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-messages' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminMessagesPage onShowToast={showToast} />
          </AdminLayout>
        )}

        {activeTab === 'admin-homepage' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminHomePageCMS
              onShowToast={showToast}
              onGoToStore={() => setActiveTab('home')}
              onNavigateTab={setActiveTab}
            />
          </AdminLayout>
        )}

        {activeTab === 'admin-about' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminAboutPage onShowToast={showToast} onGoToStore={() => setActiveTab('about')} />
          </AdminLayout>
        )}

        {activeTab === 'admin-settings' && (
          <AdminLayout
            currentTab={activeTab}
            activeTab={activeTab}
            setCurrentTab={setActiveTab}
            setActiveTab={setActiveTab}
            onGoToStore={() => setActiveTab('home')}
            onShowToast={showToast}
          >
            <AdminSettingsPage onShowToast={showToast} onNavigateTab={setActiveTab} />
          </AdminLayout>
        )}
      </main>

      {/* Search Overlay Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[#c5a059]/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSearchModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono text-[#c5a059] uppercase tracking-[0.25em]">Concierge Search</span>
              <h3 className="text-xl font-serif font-semibold text-[#f5f5f1]">Search Fragrance Collection</h3>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, category, or note (e.g., Cambodian Oud, Rose, Amber)..."
                className="w-full bg-[#0a0a0a] border border-[#c5a059]/40 rounded-xl px-4 py-3.5 text-sm text-[#f5f5f1] placeholder-zinc-500 focus:outline-none focus:border-[#c5a059] pl-11 shadow-inner"
              />
              <Search className="w-5 h-5 text-[#c5a059] absolute left-3.5 top-3.5" />
              <button
                type="submit"
                className="absolute right-2 top-2 px-4 py-2 rounded-lg bg-[#c5a059] text-[#0a0a0a] text-xs font-bold uppercase tracking-wider hover:bg-[#d4af37] transition-colors"
              >
                Search
              </button>
            </form>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-400 font-mono text-[11px]">Popular Searches:</span>
              {['Oud', 'Attar', 'Taif Rose', 'Amber', 'Musk', 'Royal'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchQuery(term);
                    setActiveSearchQuery(term);
                    setSearchModalOpen(false);
                    setActiveTab('search');
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-[#c5a059]/20 text-[#c5a059] hover:bg-[#c5a059]/10 text-[11px]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer - shown on storefront pages */}
      {!isAdminView && (
        <Footer
          setActiveTab={setActiveTab}
          onShowToast={showToast}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setActiveTab('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
