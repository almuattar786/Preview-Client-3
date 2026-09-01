/**
 * Types & Interfaces for Al-Mu'attar E-Commerce Application
 */

export type FragranceGender = 'Men' | 'Women' | 'Unisex';

export type ProductPlacement = 'shop' | 'our' | 'both';

export type FragranceCategory = string;

export interface CategoryConfig {
  id: string;
  name: string;
  description: string;
  image: string;
  badge?: string;
  iconName?: string;
}

export type FragranceType = 'Extrait de Parfum' | 'Eau de Parfum' | 'Eau de Toilette' | 'Attar Oil' | 'Pure Oud';

export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface ProductSizeOption {
  size: string; // e.g. "6ml", "12ml", "30ml", "50ml", "100ml"
  price: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  category: FragranceCategory;
  categories?: FragranceCategory[];
  brand: string;
  size: string; // e.g. "50ml", "100ml", "12ml (1 Tola)"
  sizeOptions?: ProductSizeOption[];
  fragranceType: FragranceType;
  gender: FragranceGender;
  notes: FragranceNotes;
  images: string[];
  stock: number;
  sku: string;
  isFeatured: boolean;
  isBestseller?: boolean;
  is_bestseller?: boolean;
  isActive: boolean;
  isFreeShipping?: boolean;
  customShippingFee?: number;
  collectionPlacement?: ProductPlacement;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;

  // Bundle Configuration Fields
  isBundle?: boolean;
  requiredSelectionCount?: number;
  eligibleProductIds?: string[];
  bundleOptions?: BundleOption[];
  bundleBadge?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  isVerifiedBuyer?: boolean;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

export type BundleOptionType = 'existing' | 'custom';

export interface BundleOption {
  id: string; // Unique option ID (e.g. "opt-prod-001" or "custom-1718000000000-xyz")
  type: BundleOptionType;
  productId?: string; // Set when type === 'existing'
  name?: string;      // Set when type === 'custom' (or snapshot name)
  image?: string;     // Set when type === 'custom' (or snapshot image)
  category?: string;  // Optional category display
  size?: string;      // Optional size display
  price?: number;     // Optional original price reference
}

export interface SelectedBundleFragrance {
  id: string;
  type?: BundleOptionType;
  name: string;
  image: string;
  size?: string;
  price?: number;
  category?: string;
  fragranceType?: string;
  isCustom?: boolean;
}

export interface CartItem {
  id?: string; // Unique cart item identifier (supports distinct bundle configurations or size choices)
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedPrice?: number;
  selectedStock?: number;
  selectedProductIds?: string[];
  selectedProducts?: SelectedBundleFragrance[];
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  quantity: number;
  price: number;
  subtotal: number;
  isBundle?: boolean;
  requiredSelectionCount?: number;
  selectedProductIds?: string[];
  selectedProducts?: SelectedBundleFragrance[];
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode?: string;
  orderNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'Cash on Delivery';
  paymentStatus: 'Pending' | 'Paid';
  orderStatus: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export type BestSellersDisplayMode = 'automatic' | 'manual' | 'hybrid';

export interface BestSellersConfig {
  enabled: boolean;
  sectionTitle: string;
  displayLimit: number;
  displayMode: BestSellersDisplayMode;
  manualProductIds: string[];
}

export interface AboutUsPillar {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface AboutUsPageConfig {
  heroEnabled: boolean;
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;

  storyEnabled: boolean;
  storyTagline: string;
  storyTitle: string;
  storyParagraph1: string;
  storyParagraph2: string;
  storyImageUrl: string;
  storyImageAlt: string;

  pillarsEnabled: boolean;
  pillarsTitle: string;
  pillars: AboutUsPillar[];

  ctaEnabled: boolean;
  ctaButtonText: string;
  ctaButtonTargetTab: string;
}

export interface CollectionsSectionConfig {
  enabled?: boolean;
  sectionTitle?: string;
  sectionSubtitle?: string;
  menImage?: string;
  womenImage?: string;
  unisexImage?: string;
  menTitle?: string;
  womenTitle?: string;
  unisexTitle?: string;
  menSubtitle?: string;
  womenSubtitle?: string;
  unisexSubtitle?: string;
  menCtaText?: string;
  womenCtaText?: string;
  unisexCtaText?: string;
}

export interface CollectionHeroBannerConfig {
  imageUrl: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

export interface ShopPageConfig {
  enabled?: boolean;
  defaultBanner: CollectionHeroBannerConfig;
  menBanner: CollectionHeroBannerConfig;
  womenBanner: CollectionHeroBannerConfig;
  unisexBanner: CollectionHeroBannerConfig;
}

export interface OurCollectionPageConfig {
  enabled: boolean;
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImageUrl: string;
  heroBannerUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  defaultBanner?: CollectionHeroBannerConfig;
  menBanner?: CollectionHeroBannerConfig;
  womenBanner?: CollectionHeroBannerConfig;
  unisexBanner?: CollectionHeroBannerConfig;
}

export interface StoreSettings {
  storeName: string;
  tagline?: string;
  currencySymbol: string;
  shippingFee: number;
  standardShippingFee?: number;
  freeShippingThreshold: number;
  isFreeShippingEnabled?: boolean;
  isCustomShippingEnabled?: boolean;
  customShippingFee?: number;
  contactEmail: string;
  supportEmail?: string;
  contactPhone: string;
  whatsappNumber?: string;
  storeAddress: string;
  announcementBarText?: string;
  // Customizable Pictures & Statements
  isLogoEnabled?: boolean;
  logoUrl?: string;
  heroImageUrl?: string;
  heroBadgeText?: string;
  heroHeadingLine1?: string;
  heroHeadingGradient?: string;
  heroDescription?: string;
  promiseStatement?: string;
  footerText?: string;
  homepageCategoriesCount?: number;
  categories?: CategoryConfig[];
  bestsellers?: BestSellersConfig;
  aboutUs?: AboutUsPageConfig;
  collections?: CollectionsSectionConfig;
  ourCollection?: OurCollectionPageConfig;
  shopCollection?: ShopPageConfig;
}

export interface FilterState {
  search: string;
  category: string;
  gender: string;
  fragranceType: string;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'name-asc';
}
