import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  Product, 
  Order, 
  Customer, 
  ContactMessage, 
  NewsletterSubscriber, 
  StoreSettings, 
  OrderStatus,
  AdminStats,
  FragranceCategory,
  BestSellersConfig,
  BestSellersDisplayMode,
  AboutUsPageConfig,
  OurCollectionPageConfig,
  ShopPageConfig,
  CollectionHeroBannerConfig,
  ProductReview
} from '../src/types';
import { SEED_PRODUCTS } from '../src/data/seedProducts';
import { connectMongo, isMongoConnected, hasMongoConfigured, getMongoStatus } from './mongodb';
import { ProductModel } from './models/Product';
import { OrderModel } from './models/Order';
import { CustomerModel } from './models/Customer';
import { ContactMessageModel } from './models/ContactMessage';
import { NewsletterSubscriberModel } from './models/NewsletterSubscriber';
import { StoreSettingsModel } from './models/StoreSettings';
import { AdminUserModel } from './models/AdminUser';
import { ProductReviewModel } from './models/ProductReview';
import { runDatabaseJsonMigration } from './migration';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export class DatabaseUnavailableError extends Error {
  public statusCode = 503;
  constructor(message?: string) {
    super(message || 'MongoDB Atlas is currently unavailable. Retrying connection...');
    this.name = 'DatabaseUnavailableError';
  }
}

interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  contactMessages: ContactMessage[];
  subscribers: NewsletterSubscriber[];
  reviews: ProductReview[];
  settings: StoreSettings;
  adminUser: {
    id: string;
    email: string;
    passwordHash: string;
    updatedAt: string;
  };
}

export const DEFAULT_SHOP_COLLECTION_CONFIG: ShopPageConfig = {
  enabled: true,
  defaultBanner: {
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1920',
    badgeText: 'Curated Haute Parfumerie',
    title: 'Shop All Fragrances',
    subtitle: "Maison Al-Mu'attar Masterworks",
    description: 'Explore mastercrafted Extraits de Parfum, pure Cambodian agarwood essences, and non-alcoholic attars formulated for exceptional longevity and regal sillage.'
  },
  menBanner: {
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1920',
    badgeText: 'Masculine Accords',
    title: "Men's Fragrance Selection",
    subtitle: 'Smoked Woods, Tuscan Leather & Spiced Ambers',
    description: 'Commanding olfactory profiles featuring smoked birch, Italian leather, royal ambergris, and warm oriental spices for distinguished presence.'
  },
  womenBanner: {
    imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1920',
    badgeText: 'Feminine Accords',
    title: "Women's Fragrance Selection",
    subtitle: 'Taif Rose Petals, Ethereal Florals & Sweet Nectars',
    description: 'Enchanting floral extraits, velvety Taif rose nectars, white jasmine blossoms, and crystalline Madagascar vanilla for sublime elegance.'
  },
  unisexBanner: {
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920',
    badgeText: 'Universal Harmony',
    title: 'Unisex Fragrance Selection',
    subtitle: 'Harmonious Signature Scents For All Connoisseurs',
    description: 'Sophisticated signature blends designed to transcend boundaries and adapt organically with individual skin chemistry.'
  }
};

export const DEFAULT_OUR_COLLECTION_CONFIG: OurCollectionPageConfig = {
  enabled: true,
  heroBadgeText: "Maison Al-Mu'attar Privé",
  heroTitle: "Our Signature Fragrance Collection",
  heroSubtitle: "Maison Al-Mu'attar Privé Accords",
  heroDescription: "Mastercrafted in limited artisanal batches with genuine rare Cambodian agarwood, pure Taif rose absolutes, and vintage ambergris. Each creation is formulated at exceptional Extrait concentration for unmatched sillage.",
  heroImageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920",
  heroBannerUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920",
  seoTitle: "Our Collection — Al-Mu'attar Signature Perfumes & Pure Attars",
  seoDescription: "Explore Al-Mu'attar's proprietary house fragrances, handcrafted extraits, and rare oud essences.",
  defaultBanner: {
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920",
    badgeText: "Signature House Reserve",
    title: "Our Signature Fragrance Collection",
    subtitle: "Maison Al-Mu'attar Privé Accords",
    description: "Mastercrafted in limited artisanal batches with genuine rare Cambodian agarwood, pure Taif rose absolutes, and vintage ambergris."
  },
  menBanner: {
    imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1920",
    badgeText: "Privé Masculin",
    title: "Signature Masculine Accords",
    subtitle: "Royal Agarwood, Smoked Amber & Cured Tobacco",
    description: "Distinguished extraits formulated with aged Cambodian oud, dark leather, and spiced cloves for commanding longevity."
  },
  womenBanner: {
    imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1920",
    badgeText: "Privé Féminin",
    title: "Signature Feminine Accords",
    subtitle: "Taif Rose Absolutes, White Musks & Velvet Florals",
    description: "Sublime floral extraits featuring morning-harvested Taif roses, blooming jasmine sambac, and aged bourbon vanilla."
  },
  unisexBanner: {
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920",
    badgeText: "Privé Universel",
    title: "Signature Unisex Accords",
    subtitle: "Timeless Sillage & Balanced Rare Resins",
    description: "A masterful equilibrium of rare spices, creamy sandalwood, and crystalline musks that transcend traditional categorizations."
  }
};

export const DEFAULT_ABOUT_US_CONFIG: AboutUsPageConfig = {
  heroEnabled: true,
  heroBadgeText: "Haute Parfumerie Heritage",
  heroTitle: "The Art of Al-Mu'attar",
  heroSubtitle: "Rooted in Lahore, Pakistan, Al-Mu'attar crafts regal oriental fragrances, pure Cambodian Oud attars, and high-sillage French Extrait compositions.",

  storyEnabled: true,
  storyTagline: "Scent Distillation",
  storyTitle: "Centuries of Olfactory Passion",
  storyParagraph1: "In the ancient art of oriental perfumery, fragrance is not merely an accessory — it is an identity, a signature, and a silent ambassador of grace.",
  storyParagraph2: "At Al-Mu'attar, we combine traditional copper pot distillation techniques with modern perfume maceration to deliver high-concentration EDPs and pure concentrated oils that last all day.",
  storyImageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800",
  storyImageAlt: "Al-Mu'attar Craftsmanship",

  pillarsEnabled: true,
  pillarsTitle: "Our Pillars of Olfactory Excellence",
  pillars: [
    {
      id: "pillar-1",
      title: "Sustainably Sourced Oud",
      description: "We partner exclusively with certified wild and plantation agarwood growers in Assam and Cambodia.",
      icon: "Award"
    },
    {
      id: "pillar-2",
      title: "Alcohol-Free Attar Oils",
      description: "Pure concentrated oils blended in traditional sandalwood bases, gentle on skin and rich in depth.",
      icon: "Droplets"
    },
    {
      id: "pillar-3",
      title: "Macerated Formulations",
      description: "Every perfume batch is aged for a minimum of 8 weeks to achieve harmonious sillage and projection.",
      icon: "Compass"
    }
  ],

  ctaEnabled: true,
  ctaButtonText: "Explore Our Fragrances",
  ctaButtonTargetTab: "shop"
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Al-Mu'attar",
  tagline: "Haute Parfumerie Orientale",
  currencySymbol: 'Rs.',
  shippingFee: 0,
  standardShippingFee: 0,
  freeShippingThreshold: 0,
  isFreeShippingEnabled: true,
  contactEmail: 'info@almuattar.com',
  supportEmail: 'concierge@almuattar.com',
  contactPhone: '+92 300 1234567',
  whatsappNumber: '+92 300 1234567',
  storeAddress: '104 Mall Road, Gulberg III, Lahore, Pakistan',
  announcementBarText: 'Free Express Shipping Across Pakistan On All Orders | Cash on Delivery Available',
  isLogoEnabled: true,
  logoUrl: 'https://scontent.fmux4-1.fna.fbcdn.net/v/t39.30808-6/478027044_1019853990163594_1413852064171433507_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x566&ctp=s1000x566&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=r4pGVvvvqewQ7kNvwHL01CJ&_nc_oc=AdrWu8S341R0a0folfbe1xUS41rG-nPsaoMy-E1D_hjgEi3VRzLcWGx3jkYXIYtqwd0&_nc_zt=23&_nc_ht=scontent.fmux4-1.fna&_nc_gid=9_qzl8eMqKzXrJwbzO6o9Q&_nc_ss=7b289&oh=00_AQGxSNaHK86s60yEg2gfGkShe71jPsOy2kOyhewR-0mzBw&oe=6A82A082',
  heroImageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1920',
  heroBadgeText: 'The Essence Of Elegance',
  heroHeadingLine1: 'Discover Your',
  heroHeadingGradient: 'Signature Scent',
  heroDescription: "Crafted with royal Cambodian Oud, Taif roses, and aged baltic amber. Experience unmatched projection and regal sillage by Al-Mu'attar.",
  promiseStatement: 'We source raw ingredients directly from sustainable distillers in Assam, Cambodia, Grasse, and Taif. Every bottle undergoes batch testing for pure olfactory excellence.',
  footerText: 'Maison de Parfum • Est. Lahore, Pakistan',
  homepageCategoriesCount: 3,
  categories: [
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
  ],
  collections: {
    enabled: true,
    sectionTitle: 'COLLECTIONS',
    sectionSubtitle: 'Curated by Essence & Silhouette',
    menImage: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200',
    womenImage: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1200',
    unisexImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200',
    menTitle: 'MEN',
    womenTitle: 'Women',
    unisexTitle: 'Unisex',
    menSubtitle: 'Collection',
    womenSubtitle: 'Collection',
    unisexSubtitle: 'Collection',
    menCtaText: 'Explore now',
    womenCtaText: 'Explore now',
    unisexCtaText: 'Explore now'
  },
  ourCollection: DEFAULT_OUR_COLLECTION_CONFIG,
  shopCollection: DEFAULT_SHOP_COLLECTION_CONFIG
};

class Database {
  private memoryDb: DatabaseSchema | null = null;
  private isInitialized = false;

  constructor() {
    this.initFallback();
  }

  private isUsingMongo(): boolean {
    return hasMongoConfigured() && isMongoConnected();
  }

  public async initialize(): Promise<void> {
    this.initFallback();
    if (this.isInitialized) return;

    if (hasMongoConfigured()) {
      try {
        const mongoOk = await connectMongo();
        if (mongoOk) {
          try {
            await runDatabaseJsonMigration();
          } catch (mErr) {
            console.error('Migration check error:', mErr);
          }

          // Ensure default admin account exists in MongoDB Atlas
          try {
            const defaultAdminEmail = process.env.ADMIN_EMAIL || 'admin@store.com';
            const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin@1234';
            const passwordHash = bcrypt.hashSync(defaultAdminPassword, 10);
            await AdminUserModel.findOneAndUpdate(
              { email: defaultAdminEmail.toLowerCase() },
              {
                $set: {
                  id: 'admin-001',
                  email: defaultAdminEmail.toLowerCase(),
                  passwordHash,
                  updatedAt: new Date().toISOString()
                }
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } catch (adminErr) {
            console.warn('Admin user seeding warning:', adminErr);
          }
        }
      } catch (err) {
        console.warn('MongoDB Atlas connection attempt warning:', err);
      }
    }
    this.isInitialized = true;
  }

  private initFallback() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const now = new Date().toISOString();
      const defaultAdminEmail = process.env.ADMIN_EMAIL || 'admin@store.com';
      const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin@1234';
      const passwordHash = bcrypt.hashSync(defaultAdminPassword, 10);

      const initialProducts: Product[] = SEED_PRODUCTS.map(p => ({
        ...p,
        createdAt: now,
        updatedAt: now
      }));

      const initialData: DatabaseSchema = {
        products: initialProducts,
        orders: [],
        customers: [],
        contactMessages: [
          {
            id: 'msg-101',
            fullName: 'Zainab Ahmed',
            email: 'zainab.a@example.com',
            phone: '+92 321 9876543',
            subject: 'Inquiry regarding custom fragrance gift box',
            message: 'Assalam o Alaikum, do you offer customized packaging for wedding gift favors with Oud Al-Mu\'attar?',
            isRead: false,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
          }
        ],
        subscribers: [
          { id: 'sub-101', email: 'perfume.lover@example.com', subscribedAt: now }
        ],
        reviews: [],
        settings: DEFAULT_SETTINGS,
        adminUser: {
          id: 'admin-001',
          email: defaultAdminEmail,
          passwordHash,
          updatedAt: now
        }
      };

      this.saveToFile(initialData);
      this.memoryDb = initialData;
    } else {
      this.loadFromFile();
    }
  }

  private loadFromFile(): DatabaseSchema {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      this.memoryDb = JSON.parse(content);
      if (!Array.isArray(this.memoryDb?.reviews)) {
        this.memoryDb!.reviews = [];
      }
      if (!this.memoryDb?.settings?.ourCollection) {
        this.memoryDb!.settings.ourCollection = DEFAULT_OUR_COLLECTION_CONFIG;
      }
      if (!this.memoryDb?.settings?.shopCollection) {
        this.memoryDb!.settings.shopCollection = DEFAULT_SHOP_COLLECTION_CONFIG;
      }
      if (this.memoryDb?.settings?.categories) {
        this.memoryDb.settings.categories = this.memoryDb.settings.categories.filter(
          (c) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(c.name)
        );
      }
      if (this.memoryDb?.products) {
        this.memoryDb.products.forEach((p) => {
          if (/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(p.category)) {
            p.category = 'Perfumes';
          }
          if (p.categories) {
            p.categories = p.categories.filter(
              (c) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(c)
            );
          }
        });
      }
      if (!this.memoryDb?.adminUser || this.memoryDb.adminUser.email === 'almuattar786@gmail.com' || this.memoryDb.adminUser.email === 'admin@almuattar.com') {
        const defaultAdminEmail = process.env.ADMIN_EMAIL || 'admin@store.com';
        const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin@1234';
        const passwordHash = bcrypt.hashSync(defaultAdminPassword, 10);
        this.memoryDb!.adminUser = {
          id: 'admin-001',
          email: defaultAdminEmail,
          passwordHash,
          updatedAt: new Date().toISOString()
        };
      }
      return this.memoryDb!;
    } catch (err) {
      console.error('Error reading fallback database file:', err);
      if (this.memoryDb) return this.memoryDb;
      throw err;
    }
  }

  private saveToFile(data: DatabaseSchema) {
    this.memoryDb = data;
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  }

  private get fileDb(): DatabaseSchema {
    if (!this.memoryDb) {
      return this.loadFromFile();
    }
    return this.memoryDb;
  }

  private async ensureConnection(): Promise<void> {
    if (hasMongoConfigured() && !isMongoConnected()) {
      await connectMongo().catch(() => {});
    }
  }

  // --- ADMIN AUTH ---
  public async getAdminUser(): Promise<{ id: string; email: string; passwordHash: string; updatedAt?: string } | null> {
    const targetEmail = (process.env.ADMIN_EMAIL || 'admin@store.com').toLowerCase();
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      let user = await AdminUserModel.findOne({ email: targetEmail }).lean();
      if (!user) {
        user = await AdminUserModel.findOne().lean();
      }
      if (user) {
        return {
          id: user.id || 'admin-001',
          email: targetEmail,
          passwordHash: user.passwordHash,
          updatedAt: user.updatedAt
        };
      }
      return null;
    }
    const admin = this.fileDb.adminUser;
    if (admin) {
      return {
        ...admin,
        email: targetEmail
      };
    }
    return null;
  }

  public async updateAdminPassword(newPasswordHash: string): Promise<void> {
    const now = new Date().toISOString();
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || 'admin@store.com').toLowerCase();

    // Always update local file DB
    try {
      const data = this.fileDb;
      if (!data.adminUser) {
        data.adminUser = {
          id: 'admin-001',
          email: defaultAdminEmail,
          passwordHash: newPasswordHash,
          updatedAt: now
        };
      } else {
        data.adminUser.email = defaultAdminEmail;
        data.adminUser.passwordHash = newPasswordHash;
        data.adminUser.updatedAt = now;
      }
      this.saveToFile(data);
    } catch (fErr) {
      console.warn('File DB admin password sync warning:', fErr);
    }

    // Also update MongoDB Atlas if configured
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      await AdminUserModel.findOneAndUpdate(
        {},
        { $set: { id: 'admin-001', email: defaultAdminEmail, passwordHash: newPasswordHash, updatedAt: now } },
        { upsert: true, new: true }
      );
    }
  }

  // --- PRODUCTS ---
  public async getProducts(filters?: {
    search?: string;
    category?: string;
    gender?: string;
    fragranceType?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sortBy?: string;
    includeInactive?: boolean;
    collectionPlacement?: string;
  }): Promise<Product[]> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const query: Record<string, any> = {};

      if (!filters?.includeInactive) {
        query.isActive = { $ne: false };
      }

      if (filters?.collectionPlacement && filters.collectionPlacement !== 'all') {
        if (filters.collectionPlacement === 'shop') {
          query.$or = [
            { collectionPlacement: 'shop' },
            { collectionPlacement: 'both' },
            { collectionPlacement: { $exists: false } },
            { collectionPlacement: null }
          ];
        } else if (filters.collectionPlacement === 'our') {
          query.collectionPlacement = { $in: ['our', 'both'] };
        } else if (filters.collectionPlacement === 'both') {
          query.collectionPlacement = 'both';
        }
      }

      if (filters?.search) {
        const q = filters.search.trim();
        const regex = new RegExp(q, 'i');
        const searchConditions = [
          { name: regex },
          { description: regex },
          { category: regex },
          { sku: regex },
          { 'notes.top': regex },
          { 'notes.heart': regex },
          { 'notes.base': regex }
        ];
        if (query.$or) {
          query.$and = [
            { $or: query.$or },
            { $or: searchConditions }
          ];
          delete query.$or;
        } else {
          query.$or = searchConditions;
        }
      }

      if (filters?.category && filters.category !== 'All') {
        const catConditions = [
          { category: filters.category },
          { categories: filters.category }
        ];
        if (query.$and) {
          query.$and.push({ $or: catConditions });
        } else if (query.$or) {
          query.$and = [
            { $or: query.$or },
            { $or: catConditions }
          ];
          delete query.$or;
        } else {
          query.$or = catConditions;
        }
      }

      if (filters?.gender && filters.gender !== 'All') {
        query.gender = filters.gender;
      }

      if (filters?.fragranceType && filters.fragranceType !== 'All') {
        query.fragranceType = filters.fragranceType;
      }

      if (filters?.minPrice !== undefined && filters.minPrice > 0) {
        query.price = { ...(query.price || {}), $gte: filters.minPrice };
      }

      if (filters?.maxPrice !== undefined && filters.maxPrice > 0) {
        query.price = { ...(query.price || {}), $lte: filters.maxPrice };
      }

      if (filters?.inStockOnly) {
        query.stock = { $gt: 0 };
      }

      let sortOption: Record<string, 1 | -1> = { isFeatured: -1, createdAt: -1 };
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price-asc':
            sortOption = { price: 1 };
            break;
          case 'price-desc':
            sortOption = { price: -1 };
            break;
          case 'newest':
            sortOption = { createdAt: -1 };
            break;
          case 'name-asc':
            sortOption = { name: 1 };
            break;
          case 'featured':
          default:
            sortOption = { isFeatured: -1, createdAt: -1 };
            break;
        }
      }

      const docs = await ProductModel.find(query).sort(sortOption).lean();
      return docs.map(d => {
        const { _id, ...rest } = d as any;
        return rest as Product;
      });
    }

    // Only executed in offline development mode without MONGODB_URI
    let result = [...this.fileDb.products];

    if (!filters?.includeInactive) {
      result = result.filter(p => p.isActive);
    }

    if (filters?.collectionPlacement && filters.collectionPlacement !== 'all') {
      if (filters.collectionPlacement === 'shop') {
        result = result.filter(p => !p.collectionPlacement || p.collectionPlacement === 'shop' || p.collectionPlacement === 'both');
      } else if (filters.collectionPlacement === 'our') {
        result = result.filter(p => p.collectionPlacement === 'our' || p.collectionPlacement === 'both');
      } else if (filters.collectionPlacement === 'both') {
        result = result.filter(p => p.collectionPlacement === 'both');
      }
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.notes.top.some(n => n.toLowerCase().includes(q)) ||
          p.notes.heart.some(n => n.toLowerCase().includes(q)) ||
          p.notes.base.some(n => n.toLowerCase().includes(q))
      );
    }

    if (filters?.category && filters.category !== 'All') {
      result = result.filter(
        p => p.category === filters.category || (p.categories && p.categories.includes(filters.category as FragranceCategory))
      );
    }

    if (filters?.gender && filters.gender !== 'All') {
      result = result.filter(p => p.gender === filters.gender);
    }

    if (filters?.fragranceType && filters.fragranceType !== 'All') {
      result = result.filter(p => p.fragranceType === filters.fragranceType);
    }

    if (filters?.minPrice !== undefined && filters.minPrice > 0) {
      result = result.filter(p => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined && filters.maxPrice > 0) {
      result = result.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters?.inStockOnly) {
      result = result.filter(p => p.stock > 0);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'name-asc':
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'featured':
        default:
          result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
      }
    }

    return result;
  }

  public async getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const doc = await ProductModel.findOne({
        $or: [{ id: idOrSlug }, { slug: idOrSlug }]
      }).lean();
      if (!doc) return null;
      const { _id, ...rest } = doc as any;
      return rest as Product;
    }
    return this.fileDb.products.find(p => p.id === idOrSlug || p.slug === idOrSlug) || null;
  }

  public async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const id = `prod-${Date.now()}`;
    const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Normalize size options if provided
    let normalizedSizeOptions = productData.sizeOptions;
    if (Array.isArray(productData.sizeOptions) && productData.sizeOptions.length > 0) {
      normalizedSizeOptions = productData.sizeOptions
        .map((so) => ({
          size: (so.size || '').trim(),
          price: Number(so.price) || 0,
          compareAtPrice: so.compareAtPrice ? Number(so.compareAtPrice) : undefined,
          stock: so.stock !== undefined && so.stock !== null ? Number(so.stock) : 0,
          sku: (so.sku || '').trim(),
          isDefault: Boolean(so.isDefault)
        }))
        .filter((so) => so.size !== '' && so.price > 0);
    }

    // Normalize bundle options if it's a bundle
    let normalizedBundleOptions = productData.bundleOptions;
    let normalizedEligibleProductIds = productData.eligibleProductIds || [];

    if (productData.isBundle) {
      if (Array.isArray(productData.bundleOptions) && productData.bundleOptions.length > 0) {
        normalizedBundleOptions = productData.bundleOptions.map((opt, idx) => {
          if (opt.type === 'custom') {
            return {
              id: opt.id || `custom-opt-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'custom' as const,
              name: (opt.name || '').trim(),
              image: (opt.image || '').trim(),
              category: opt.category || 'Custom Blend',
              size: opt.size || productData.size || '50ml'
            };
          }
          return {
            id: opt.id || (opt.productId ? `opt-${opt.productId}` : `opt-${Date.now()}-${idx}`),
            type: 'existing' as const,
            productId: opt.productId,
            name: opt.name,
            image: opt.image,
            category: opt.category,
            size: opt.size,
            price: opt.price
          };
        });

        // Sync eligibleProductIds with existing products in options
        normalizedEligibleProductIds = normalizedBundleOptions
          .filter(o => o.type === 'existing' && o.productId)
          .map(o => o.productId as string);
      } else if (Array.isArray(productData.eligibleProductIds) && productData.eligibleProductIds.length > 0) {
        normalizedBundleOptions = productData.eligibleProductIds.map(pId => ({
          id: `opt-${pId}`,
          type: 'existing' as const,
          productId: pId
        }));
      }
    }

    const newProduct: Product = {
      ...productData,
      id,
      slug,
      sizeOptions: normalizedSizeOptions,
      bundleOptions: normalizedBundleOptions,
      eligibleProductIds: normalizedEligibleProductIds,
      createdAt: now,
      updatedAt: now
    };

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      await ProductModel.create(newProduct);
      return newProduct;
    }

    const data = this.fileDb;
    data.products.unshift(newProduct);
    this.saveToFile(data);
    return newProduct;
  }

  public async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const now = new Date().toISOString();

    const normalizedUpdates = { ...updates };

    if (updates.sizeOptions !== undefined) {
      if (Array.isArray(updates.sizeOptions)) {
        normalizedUpdates.sizeOptions = updates.sizeOptions
          .map((so) => ({
            size: (so.size || '').trim(),
            price: Number(so.price) || 0,
            compareAtPrice: so.compareAtPrice ? Number(so.compareAtPrice) : undefined,
            stock: so.stock !== undefined && so.stock !== null ? Number(so.stock) : 0,
            sku: (so.sku || '').trim(),
            isDefault: Boolean(so.isDefault)
          }))
          .filter((so) => so.size !== '' && so.price > 0);
      } else {
        normalizedUpdates.sizeOptions = [];
      }
    }

    if (updates.isBundle !== undefined) {
      if (updates.isBundle) {
        if (Array.isArray(updates.bundleOptions)) {
          normalizedUpdates.bundleOptions = updates.bundleOptions.map((opt, idx) => {
            if (opt.type === 'custom') {
              return {
                id: opt.id || `custom-opt-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
                type: 'custom' as const,
                name: (opt.name || '').trim(),
                image: (opt.image || '').trim(),
                category: opt.category || 'Custom Blend',
                size: opt.size || updates.size || '50ml'
              };
            }
            return {
              id: opt.id || (opt.productId ? `opt-${opt.productId}` : `opt-${Date.now()}-${idx}`),
              type: 'existing' as const,
              productId: opt.productId,
              name: opt.name,
              image: opt.image,
              category: opt.category,
              size: opt.size,
              price: opt.price
            };
          });

          // Sync eligibleProductIds
          normalizedUpdates.eligibleProductIds = normalizedUpdates.bundleOptions
            .filter(o => o.type === 'existing' && o.productId)
            .map(o => o.productId as string);
        } else if (Array.isArray(updates.eligibleProductIds)) {
          normalizedUpdates.bundleOptions = updates.eligibleProductIds.map(pId => ({
            id: `opt-${pId}`,
            type: 'existing' as const,
            productId: pId
          }));
        }
      }
    }

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const updatedDoc = await ProductModel.findOneAndUpdate(
        { id },
        { $set: { ...normalizedUpdates, updatedAt: now } },
        { new: true }
      ).lean();
      if (updatedDoc) {
        const { _id, ...rest } = updatedDoc as any;
        return rest as Product;
      }
      return null;
    }

    const data = this.fileDb;
    const index = data.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updated: Product = {
      ...data.products[index],
      ...normalizedUpdates,
      updatedAt: now
    };

    data.products[index] = updated;
    this.saveToFile(data);
    return updated;
  }

  public async deleteProduct(id: string): Promise<boolean> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const res = await ProductModel.findOneAndDelete({ id });
      if (res) {
        // Clean up any reviews for this deleted product
        await ProductReviewModel.deleteMany({ productId: id }).catch(() => {});
        // Also clean up from BestSellers manualProductIds if present
        try {
          const cfg = await this.getBestSellersConfig();
          if (cfg.manualProductIds && cfg.manualProductIds.includes(id)) {
            await this.updateBestSellersConfig({
              manualProductIds: cfg.manualProductIds.filter(pId => pId !== id)
            });
          }
        } catch (_) {}
      }
      return Boolean(res);
    }

    const data = this.fileDb;
    const initialLen = data.products.length;
    data.products = data.products.filter(p => p.id !== id);
    if (data.products.length === initialLen) return false;

    if (Array.isArray(data.reviews)) {
      data.reviews = data.reviews.filter(r => r.productId !== id);
    }
    if (data.settings?.bestsellers?.manualProductIds) {
      data.settings.bestsellers.manualProductIds = data.settings.bestsellers.manualProductIds.filter(pId => pId !== id);
    }

    this.saveToFile(data);
    return true;
  }

  public async updateStock(id: string, newStock: number): Promise<Product | null> {
    const now = new Date().toISOString();
    const stockVal = Math.max(0, newStock);

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const doc = await ProductModel.findOneAndUpdate(
        { id },
        { $set: { stock: stockVal, updatedAt: now } },
        { new: true }
      ).lean();
      if (doc) {
        const { _id, ...rest } = doc as any;
        return rest as Product;
      }
      return null;
    }

    const data = this.fileDb;
    const product = data.products.find(p => p.id === id);
    if (!product) return null;

    product.stock = stockVal;
    product.updatedAt = now;
    this.saveToFile(data);
    return product;
  }

  // --- BEST SELLERS CONFIG & DATA ---
  public async getBestSellersConfig(): Promise<BestSellersConfig> {
    const defaultCfg: BestSellersConfig = {
      enabled: true,
      sectionTitle: 'BEST SELLERS',
      displayLimit: 8,
      displayMode: 'hybrid',
      manualProductIds: []
    };

    const s = await this.getSettings();
    if (!s || !s.bestsellers) {
      return defaultCfg;
    }
    return {
      enabled: typeof s.bestsellers.enabled === 'boolean' ? s.bestsellers.enabled : defaultCfg.enabled,
      sectionTitle: s.bestsellers.sectionTitle || defaultCfg.sectionTitle,
      displayLimit: typeof s.bestsellers.displayLimit === 'number' && s.bestsellers.displayLimit > 0 ? s.bestsellers.displayLimit : defaultCfg.displayLimit,
      displayMode: s.bestsellers.displayMode || defaultCfg.displayMode,
      manualProductIds: Array.isArray(s.bestsellers.manualProductIds) ? s.bestsellers.manualProductIds : defaultCfg.manualProductIds
    };
  }

  public async updateBestSellersConfig(newConfig: Partial<BestSellersConfig>): Promise<BestSellersConfig> {
    const current = await this.getBestSellersConfig();
    const allProducts = await this.getProducts({ includeInactive: true });

    const validProducts = new Set(allProducts.map(p => p.id));
    let cleanedManualIds = current.manualProductIds;

    if (Array.isArray(newConfig.manualProductIds)) {
      cleanedManualIds = Array.from(new Set(newConfig.manualProductIds.filter(id => validProducts.has(id))));
    }

    const updated: BestSellersConfig = {
      enabled: typeof newConfig.enabled === 'boolean' ? newConfig.enabled : current.enabled,
      sectionTitle: typeof newConfig.sectionTitle === 'string' && newConfig.sectionTitle.trim() ? newConfig.sectionTitle.trim() : current.sectionTitle,
      displayLimit: typeof newConfig.displayLimit === 'number' && newConfig.displayLimit >= 1 && newConfig.displayLimit <= 20
        ? newConfig.displayLimit
        : current.displayLimit,
      displayMode: ['automatic', 'manual', 'hybrid'].includes(newConfig.displayMode as string)
        ? (newConfig.displayMode as BestSellersDisplayMode)
        : current.displayMode,
      manualProductIds: cleanedManualIds
    };

    await this.updateSettings({ bestsellers: updated });
    return updated;
  }

  public async getBestSellersData(overrideLimit?: number): Promise<{
    enabled: boolean;
    sectionTitle: string;
    displayLimit: number;
    displayMode: BestSellersDisplayMode;
    products: Product[];
  }> {
    const cfg = await this.getBestSellersConfig();
    if (!cfg.enabled) {
      return {
        enabled: false,
        sectionTitle: cfg.sectionTitle,
        displayLimit: cfg.displayLimit,
        displayMode: cfg.displayMode,
        products: []
      };
    }

    const limit = overrideLimit && overrideLimit > 0 ? Math.min(overrideLimit, 20) : cfg.displayLimit;
    const allActive = await this.getProducts({ includeInactive: false });
    const activeProductMap = new Map(allActive.map(p => [p.id, p]));

    const result: Product[] = [];
    const resultIds = new Set<string>();

    if (cfg.displayMode === 'manual') {
      for (const id of cfg.manualProductIds) {
        if (result.length >= limit) break;
        const prod = activeProductMap.get(id);
        if (prod && !resultIds.has(prod.id)) {
          result.push(prod);
          resultIds.add(prod.id);
        }
      }
    } else if (cfg.displayMode === 'automatic') {
      const allOrders = await this.getOrders();
      const salesMap: Record<string, number> = {};
      const validOrders = allOrders.filter(o => o.orderStatus !== 'Cancelled');
      for (const order of validOrders) {
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.productId) {
              salesMap[item.productId] = (salesMap[item.productId] || 0) + (item.quantity || 1);
            }
          }
        }
      }

      const productsWithSales = allActive
        .filter(p => (salesMap[p.id] || 0) > 0)
        .sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0));

      for (const prod of productsWithSales) {
        if (result.length >= limit) break;
        result.push(prod);
        resultIds.add(prod.id);
      }

      if (result.length < limit) {
        for (const prod of allActive) {
          if (result.length >= limit) break;
          if (!resultIds.has(prod.id)) {
            result.push(prod);
            resultIds.add(prod.id);
          }
        }
      }
    } else {
      // Hybrid Mode
      const allOrders = await this.getOrders();
      const salesMap: Record<string, number> = {};
      const validOrders = allOrders.filter(o => o.orderStatus !== 'Cancelled');
      for (const order of validOrders) {
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.productId) {
              salesMap[item.productId] = (salesMap[item.productId] || 0) + (item.quantity || 1);
            }
          }
        }
      }

      const productsWithSales = allActive
        .filter(p => (salesMap[p.id] || 0) > 0)
        .sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0));

      for (const prod of productsWithSales) {
        if (result.length >= limit) break;
        result.push(prod);
        resultIds.add(prod.id);
      }

      if (result.length < limit) {
        for (const id of cfg.manualProductIds) {
          if (result.length >= limit) break;
          const prod = activeProductMap.get(id);
          if (prod && !resultIds.has(prod.id)) {
            result.push(prod);
            resultIds.add(prod.id);
          }
        }
      }

      if (result.length < limit) {
        const manualFlagged = allActive.filter(p => !resultIds.has(p.id) && Boolean(p.isBestseller || p.is_bestseller));
        for (const prod of manualFlagged) {
          if (result.length >= limit) break;
          result.push(prod);
          resultIds.add(prod.id);
        }
      }

      if (result.length < limit) {
        for (const prod of allActive) {
          if (result.length >= limit) break;
          if (!resultIds.has(prod.id)) {
            result.push(prod);
            resultIds.add(prod.id);
          }
        }
      }
    }

    return {
      enabled: cfg.enabled,
      sectionTitle: cfg.sectionTitle,
      displayLimit: cfg.displayLimit,
      displayMode: cfg.displayMode,
      products: result.slice(0, limit)
    };
  }

  public async getBestSellers(limit: number = 8): Promise<Product[]> {
    const data = await this.getBestSellersData(limit);
    return data.products;
  }

  // --- ORDERS ---
  public async getOrders(filters?: {
    search?: string;
    status?: string;
  }): Promise<Order[]> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const query: Record<string, any> = {};

      if (filters?.search) {
        const q = filters.search.trim();
        const regex = new RegExp(q, 'i');
        query.$or = [
          { orderNumber: regex },
          { 'customer.fullName': regex },
          { 'customer.phone': regex },
          { 'customer.email': regex }
        ];
      }

      if (filters?.status && filters.status !== 'All') {
        query.orderStatus = filters.status;
      }

      const docs = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
      return docs.map(d => {
        const { _id, ...rest } = d as any;
        if (!Array.isArray(rest.statusHistory)) {
          rest.statusHistory = [];
        }
        return rest as Order;
      });
    }

    let result = [...this.fileDb.orders];

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== 'All') {
      result = result.filter(o => o.orderStatus === filters.status);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result.map(o => ({
      ...o,
      statusHistory: Array.isArray(o.statusHistory) ? o.statusHistory : []
    }));
  }

  public async getOrderByIdOrNumber(idOrNumber: string): Promise<Order | null> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const doc = await OrderModel.findOne({
        $or: [{ id: idOrNumber }, { orderNumber: idOrNumber }]
      }).lean();
      if (!doc) return null;
      const { _id, ...rest } = doc as any;
      if (!Array.isArray(rest.statusHistory)) {
        rest.statusHistory = [];
      }
      return rest as Order;
    }
    const found = this.fileDb.orders.find(o => o.id === idOrNumber || o.orderNumber === idOrNumber) || null;
    if (found && !Array.isArray(found.statusHistory)) {
      found.statusHistory = [];
    }
    return found;
  }

  public async createOrder(orderPayload: {
    customer: { fullName: string; email: string; phone: string };
    shippingAddress: {
      fullName: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      postalCode?: string;
      orderNotes?: string;
    };
    items: Array<{
      productId: string;
      quantity: number;
      size?: string;
      price?: number;
      selectedProductIds?: string[];
    }>;
  }): Promise<Order> {
    const validatedItems: Order['items'] = [];
    let subtotal = 0;

    // Track stock decrements to execute atomically after all validations pass
    const stockDecrements: Array<{ productId: string; quantity: number; size?: string }> = [];

    for (const reqItem of orderPayload.items) {
      const product = await this.getProductByIdOrSlug(reqItem.productId);
      if (!product || !product.isActive) {
        throw new Error(`Product with ID ${reqItem.productId} is unavailable.`);
      }

      if (product.isBundle) {
        const requiredCount = product.requiredSelectionCount || 1;
        const selectedIds = Array.isArray(reqItem.selectedProductIds) ? reqItem.selectedProductIds : [];

        if (selectedIds.length !== requiredCount) {
          throw new Error(
            `Bundle "${product.name}" requires exactly ${requiredCount} fragrance selection${requiredCount > 1 ? 's' : ''}, but received ${selectedIds.length}.`
          );
        }

        const bundleOptions = Array.isArray(product.bundleOptions) ? product.bundleOptions : [];
        const eligibleProductIds = Array.isArray(product.eligibleProductIds) ? product.eligibleProductIds : [];
        const eligibleSet = eligibleProductIds.length > 0 ? new Set(eligibleProductIds) : null;

        const resolvedSelectedProducts: Array<{
          id: string;
          type?: 'existing' | 'custom';
          name: string;
          image: string;
          size?: string;
          price?: number;
          category?: string;
          fragranceType?: string;
          isCustom?: boolean;
        }> = [];

        for (const selId of selectedIds) {
          // 1. Check if matching option is configured in product.bundleOptions
          const matchedOpt = bundleOptions.find(
            (o) => o.id === selId || (o.type === 'existing' && o.productId === selId)
          );

          if (matchedOpt) {
            if (matchedOpt.type === 'custom') {
              const customName = (matchedOpt.name || '').trim();
              const customImage = (matchedOpt.image || '').trim();
              if (!customName || !customImage) {
                throw new Error(`Custom fragrance option in bundle "${product.name}" is incomplete.`);
              }

              resolvedSelectedProducts.push({
                id: matchedOpt.id,
                type: 'custom',
                name: customName,
                image: customImage,
                size: matchedOpt.size || product.size || '50ml',
                category: matchedOpt.category || 'Custom Blend',
                isCustom: true
              });
              // Custom fragrance options do not decrement warehouse product stock
            } else {
              const targetProdId = matchedOpt.productId || selId;
              const selProd = await this.getProductByIdOrSlug(targetProdId);
              if (!selProd || !selProd.isActive) {
                throw new Error(`Selected fragrance "${selProd?.name || targetProdId}" in bundle "${product.name}" is unavailable.`);
              }

              if (selProd.stock < reqItem.quantity) {
                throw new Error(
                  `Insufficient stock for selected fragrance "${selProd.name}" in bundle "${product.name}". Available: ${selProd.stock}, requested: ${reqItem.quantity}.`
                );
              }

              resolvedSelectedProducts.push({
                id: selProd.id,
                type: 'existing',
                name: selProd.name,
                image: selProd.images[0] || '',
                size: selProd.size,
                price: selProd.price,
                category: selProd.category,
                fragranceType: selProd.fragranceType,
                isCustom: false
              });

              stockDecrements.push({
                productId: selProd.id,
                quantity: reqItem.quantity
              });
            }
          } else if (eligibleSet && eligibleSet.has(selId)) {
            // Legacy bundle fallback matching eligibleProductIds
            const selProd = await this.getProductByIdOrSlug(selId);
            if (!selProd || !selProd.isActive) {
              throw new Error(`Selected fragrance "${selProd?.name || selId}" in bundle "${product.name}" is unavailable.`);
            }

            if (selProd.stock < reqItem.quantity) {
              throw new Error(
                `Insufficient stock for selected fragrance "${selProd.name}" in bundle "${product.name}". Available: ${selProd.stock}, requested: ${reqItem.quantity}.`
              );
            }

            resolvedSelectedProducts.push({
              id: selProd.id,
              type: 'existing',
              name: selProd.name,
              image: selProd.images[0] || '',
              size: selProd.size,
              price: selProd.price,
              category: selProd.category,
              fragranceType: selProd.fragranceType,
              isCustom: false
            });

            stockDecrements.push({
              productId: selProd.id,
              quantity: reqItem.quantity
            });
          } else if (bundleOptions.length === 0 && (!eligibleSet || eligibleSet.size === 0)) {
            // Open bundle with all catalog products eligible
            const selProd = await this.getProductByIdOrSlug(selId);
            if (!selProd || !selProd.isActive || selProd.isBundle) {
              throw new Error(`Selected fragrance "${selId}" is not a valid fragrance for bundle "${product.name}".`);
            }

            if (selProd.stock < reqItem.quantity) {
              throw new Error(
                `Insufficient stock for selected fragrance "${selProd.name}" in bundle "${product.name}". Available: ${selProd.stock}, requested: ${reqItem.quantity}.`
              );
            }

            resolvedSelectedProducts.push({
              id: selProd.id,
              type: 'existing',
              name: selProd.name,
              image: selProd.images[0] || '',
              size: selProd.size,
              price: selProd.price,
              category: selProd.category,
              fragranceType: selProd.fragranceType,
              isCustom: false
            });

            stockDecrements.push({
              productId: selProd.id,
              quantity: reqItem.quantity
            });
          } else {
            throw new Error(`Selected fragrance option "${selId}" is not an eligible option for bundle "${product.name}".`);
          }
        }

        const itemSubtotal = product.price * reqItem.quantity;
        subtotal += itemSubtotal;

        validatedItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] || '',
          size: product.size || `${requiredCount} Fragrance Bundle`,
          quantity: reqItem.quantity,
          price: product.price,
          subtotal: itemSubtotal,
          isBundle: true,
          requiredSelectionCount: requiredCount,
          selectedProductIds: selectedIds,
          selectedProducts: resolvedSelectedProducts
        });
      } else {
        // Standard single product (with possible multi-size options)
        let itemSize = product.size || '50ml';
        let itemPrice = product.price;
        let matchedSizeOption: { size: string; price: number; stock?: number } | null = null;

        if (Array.isArray(product.sizeOptions) && product.sizeOptions.length > 0) {
          if (reqItem.size) {
            const found = product.sizeOptions.find(
              (so) => so.size.trim().toLowerCase() === reqItem.size!.trim().toLowerCase()
            );
            if (found) {
              matchedSizeOption = found;
              itemSize = found.size;
              itemPrice = found.price;
            } else {
              itemSize = reqItem.size;
              if (typeof reqItem.price === 'number' && reqItem.price > 0) {
                itemPrice = reqItem.price;
              }
            }
          } else {
            // Default to marked default or first size option
            const defaultOpt = product.sizeOptions.find((so) => so.isDefault) || product.sizeOptions[0];
            if (defaultOpt) {
              matchedSizeOption = defaultOpt;
              itemSize = defaultOpt.size;
              itemPrice = defaultOpt.price;
            }
          }
        } else if (reqItem.size) {
          itemSize = reqItem.size;
          if (typeof reqItem.price === 'number' && reqItem.price > 0) {
            itemPrice = reqItem.price;
          }
        }

        // Validate stock
        if (matchedSizeOption && matchedSizeOption.stock !== undefined && matchedSizeOption.stock !== null) {
          if (matchedSizeOption.stock < reqItem.quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}" (${itemSize}). Available: ${matchedSizeOption.stock}, requested: ${reqItem.quantity}.`
            );
          }
        } else if (product.stock < reqItem.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${reqItem.quantity}.`
          );
        }

        const itemSubtotal = itemPrice * reqItem.quantity;
        subtotal += itemSubtotal;

        validatedItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] || '',
          size: itemSize,
          quantity: reqItem.quantity,
          price: itemPrice,
          subtotal: itemSubtotal,
          isBundle: false
        });

        stockDecrements.push({
          productId: product.id,
          quantity: reqItem.quantity,
          size: matchedSizeOption ? matchedSizeOption.size : undefined
        });
      }
    }

    // Reduce stock for all validated items and selected bundle items
    for (const dec of stockDecrements) {
      const p = await this.getProductByIdOrSlug(dec.productId);
      if (p) {
        if (dec.size && Array.isArray(p.sizeOptions) && p.sizeOptions.length > 0) {
          const updatedSizeOptions = p.sizeOptions.map((so) => {
            if (so.size.trim().toLowerCase() === dec.size!.trim().toLowerCase()) {
              return {
                ...so,
                stock: Math.max(0, (so.stock !== undefined ? so.stock : p.stock) - dec.quantity)
              };
            }
            return so;
          });
          const newProductStock = Math.max(0, p.stock - dec.quantity);
          await this.updateProduct(p.id, {
            stock: newProductStock,
            sizeOptions: updatedSizeOptions
          });
        } else {
          await this.updateStock(p.id, p.stock - dec.quantity);
        }
      }
    }

    const shippingFee = 0;
    const totalAmount = subtotal;
    const now = new Date().toISOString();
    
    let totalCount = 0;
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      totalCount = await OrderModel.countDocuments();
    } else {
      totalCount = this.fileDb.orders.length;
    }

    const orderNumber = `AM-2026-${totalCount + 1001}`;
    const orderId = `ord-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customer: orderPayload.customer,
      items: validatedItems,
      shippingAddress: orderPayload.shippingAddress,
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: now,
          note: 'Order placed successfully via Cash on Delivery.'
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      await OrderModel.create(newOrder);

      // Customer directory update in Mongo
      const emailLower = orderPayload.customer.email.toLowerCase();
      await CustomerModel.findOneAndUpdate(
        { email: emailLower },
        {
          $setOnInsert: { id: `cust-${Date.now()}`, createdAt: now },
          $inc: { totalOrders: 1, totalSpent: totalAmount },
          $set: {
            fullName: orderPayload.customer.fullName,
            phone: orderPayload.customer.phone,
            city: orderPayload.shippingAddress.city,
            lastOrderDate: now
          }
        },
        { upsert: true, new: true }
      );
      return newOrder;
    }

    // Offline JSON fallback (only in dev mode without MONGODB_URI)
    const data = this.fileDb;
    data.orders.unshift(newOrder);

    const existingCust = data.customers.find(
      c => c.email.toLowerCase() === orderPayload.customer.email.toLowerCase() || c.phone === orderPayload.customer.phone
    );

    if (existingCust) {
      existingCust.totalOrders += 1;
      existingCust.totalSpent += totalAmount;
      existingCust.lastOrderDate = now;
      existingCust.fullName = orderPayload.customer.fullName;
      existingCust.city = orderPayload.shippingAddress.city;
    } else {
      data.customers.unshift({
        id: `cust-${Date.now()}`,
        fullName: orderPayload.customer.fullName,
        email: orderPayload.customer.email,
        phone: orderPayload.customer.phone,
        city: orderPayload.shippingAddress.city,
        totalOrders: 1,
        totalSpent: totalAmount,
        lastOrderDate: now,
        createdAt: now
      });
    }

    this.saveToFile(data);
    return newOrder;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<Order | null> {
    const now = new Date().toISOString();
    const order = await this.getOrderByIdOrNumber(orderId);
    if (!order) return null;

    // If cancelled, restore stock for individual products or bundle selections
    if (status === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.items) {
        if (item.isBundle && Array.isArray(item.selectedProductIds) && item.selectedProductIds.length > 0) {
          for (const selId of item.selectedProductIds) {
            const prod = await this.getProductByIdOrSlug(selId);
            if (prod) {
              await this.updateStock(prod.id, prod.stock + item.quantity);
            }
          }
        } else {
          const prod = await this.getProductByIdOrSlug(item.productId);
          if (prod) {
            await this.updateStock(prod.id, prod.stock + item.quantity);
          }
        }
      }
    }

    const paymentStatus = status === 'Delivered' ? 'Paid' : order.paymentStatus;
    const newHistoryEntry = {
      status,
      timestamp: now,
      note: note || `Order status updated to ${status}.`
    };

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const doc = await OrderModel.findOneAndUpdate(
        { $or: [{ id: orderId }, { orderNumber: orderId }] },
        {
          $set: { orderStatus: status, paymentStatus, updatedAt: now },
          $push: { statusHistory: newHistoryEntry }
        },
        { new: true }
      ).lean();
      if (doc) {
        const { _id, ...rest } = doc as any;
        return rest as Order;
      }
      return null;
    }

    const data = this.fileDb;
    const fOrder = data.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!fOrder) return null;

    fOrder.orderStatus = status;
    fOrder.paymentStatus = paymentStatus;
    fOrder.updatedAt = now;
    fOrder.statusHistory.push(newHistoryEntry);
    this.saveToFile(data);
    return fOrder;
  }

  // --- CUSTOMERS ---
  public async getCustomers(search?: string): Promise<Customer[]> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const query: Record<string, any> = {};
      if (search) {
        const q = search.trim();
        const regex = new RegExp(q, 'i');
        query.$or = [
          { fullName: regex },
          { email: regex },
          { phone: regex },
          { city: regex }
        ];
      }
      const docs = await CustomerModel.find(query).sort({ lastOrderDate: -1 }).lean();
      return docs.map(d => {
        const { _id, ...rest } = d as any;
        return rest as Customer;
      });
    }

    let result = [...this.fileDb.customers];
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        c =>
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public async getCustomerById(id: string): Promise<Customer | null> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const doc = await CustomerModel.findOne({ id }).lean();
      if (!doc) return null;
      const { _id, ...rest } = doc as any;
      return rest as Customer;
    }
    return this.fileDb.customers.find(c => c.id === id) || null;
  }

  // --- CONTACT MESSAGES ---
  public async getContactMessages(search?: string): Promise<ContactMessage[]> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const query: Record<string, any> = {};
      if (search) {
        const q = search.trim();
        const regex = new RegExp(q, 'i');
        query.$or = [
          { fullName: regex },
          { email: regex },
          { subject: regex },
          { message: regex }
        ];
      }
      const docs = await ContactMessageModel.find(query).sort({ createdAt: -1 }).lean();
      return docs.map(d => {
        const { _id, ...rest } = d as any;
        return rest as ContactMessage;
      });
    }

    let result = [...this.fileDb.contactMessages];
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        m =>
          m.fullName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createContactMessage(payload: Omit<ContactMessage, 'id' | 'isRead' | 'createdAt'>): Promise<ContactMessage> {
    const now = new Date().toISOString();
    const newMsg: ContactMessage = {
      ...payload,
      id: `msg-${Date.now()}`,
      isRead: false,
      createdAt: now
    };

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      await ContactMessageModel.create(newMsg);
      return newMsg;
    }

    const data = this.fileDb;
    data.contactMessages.unshift(newMsg);
    this.saveToFile(data);
    return newMsg;
  }

  public async markMessageRead(id: string, isRead: boolean): Promise<ContactMessage | null> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const doc = await ContactMessageModel.findOneAndUpdate(
        { id },
        { $set: { isRead } },
        { new: true }
      ).lean();
      if (doc) {
        const { _id, ...rest } = doc as any;
        return rest as ContactMessage;
      }
      return null;
    }

    const data = this.fileDb;
    const msg = data.contactMessages.find(m => m.id === id);
    if (!msg) return null;
    msg.isRead = isRead;
    this.saveToFile(data);
    return msg;
  }

  public async deleteContactMessage(id: string): Promise<boolean> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const res = await ContactMessageModel.findOneAndDelete({ id });
      return Boolean(res);
    }

    const data = this.fileDb;
    const index = data.contactMessages.findIndex(m => m.id === id);
    if (index === -1) return false;
    data.contactMessages.splice(index, 1);
    this.saveToFile(data);
    return true;
  }

  // --- NEWSLETTER ---
  public async addNewsletterSubscriber(email: string): Promise<NewsletterSubscriber> {
    const emailClean = email.trim().toLowerCase();
    const now = new Date().toISOString();

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const existing = await NewsletterSubscriberModel.findOne({ email: emailClean }).lean();
      if (existing) {
        const { _id, ...rest } = existing as any;
        return rest as NewsletterSubscriber;
      }
      const newSub: NewsletterSubscriber = {
        id: `sub-${Date.now()}`,
        email: emailClean,
        subscribedAt: now
      };
      await NewsletterSubscriberModel.create(newSub);
      return newSub;
    }

    const data = this.fileDb;
    const existing = data.subscribers.find(s => s.email.toLowerCase() === emailClean);
    if (existing) return existing;

    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: emailClean,
      subscribedAt: now
    };
    data.subscribers.unshift(newSub);
    this.saveToFile(data);
    return newSub;
  }

  // --- ABOUT US PAGE CONFIG ---
  public async getAboutUsConfig(): Promise<AboutUsPageConfig> {
    const s = await this.getSettings();
    const storeName = s?.storeName || "Al-Mu'attar";

    const formatStoreText = (text: string | undefined, fallback: string): string => {
      if (text === undefined || text === null) return fallback;
      return text.replace(/Al-Mu'attar|Al Mu'attar/gi, storeName);
    };

    const dynamicDefault: AboutUsPageConfig = {
      heroEnabled: true,
      heroBadgeText: DEFAULT_ABOUT_US_CONFIG.heroBadgeText,
      heroTitle: `The Art of ${storeName}`,
      heroSubtitle: `Rooted in Lahore, Pakistan, ${storeName} crafts regal oriental fragrances, pure Cambodian Oud attars, and high-sillage French Extrait compositions.`,

      storyEnabled: true,
      storyTagline: DEFAULT_ABOUT_US_CONFIG.storyTagline,
      storyTitle: DEFAULT_ABOUT_US_CONFIG.storyTitle,
      storyParagraph1: DEFAULT_ABOUT_US_CONFIG.storyParagraph1,
      storyParagraph2: `At ${storeName}, we combine traditional copper pot distillation techniques with modern perfume maceration to deliver high-concentration EDPs and pure concentrated oils that last all day.`,
      storyImageUrl: DEFAULT_ABOUT_US_CONFIG.storyImageUrl,
      storyImageAlt: `${storeName} Craftsmanship`,

      pillarsEnabled: true,
      pillarsTitle: DEFAULT_ABOUT_US_CONFIG.pillarsTitle,
      pillars: DEFAULT_ABOUT_US_CONFIG.pillars,

      ctaEnabled: true,
      ctaButtonText: DEFAULT_ABOUT_US_CONFIG.ctaButtonText,
      ctaButtonTargetTab: DEFAULT_ABOUT_US_CONFIG.ctaButtonTargetTab
    };

    if (!s || !s.aboutUs) {
      return dynamicDefault;
    }

    const cfg = s.aboutUs;
    return {
      heroEnabled: typeof cfg.heroEnabled === 'boolean' ? cfg.heroEnabled : dynamicDefault.heroEnabled,
      heroBadgeText: cfg.heroBadgeText !== undefined ? formatStoreText(cfg.heroBadgeText, dynamicDefault.heroBadgeText) : dynamicDefault.heroBadgeText,
      heroTitle: cfg.heroTitle !== undefined ? formatStoreText(cfg.heroTitle, dynamicDefault.heroTitle) : dynamicDefault.heroTitle,
      heroSubtitle: cfg.heroSubtitle !== undefined ? formatStoreText(cfg.heroSubtitle, dynamicDefault.heroSubtitle) : dynamicDefault.heroSubtitle,

      storyEnabled: typeof cfg.storyEnabled === 'boolean' ? cfg.storyEnabled : dynamicDefault.storyEnabled,
      storyTagline: cfg.storyTagline !== undefined ? formatStoreText(cfg.storyTagline, dynamicDefault.storyTagline) : dynamicDefault.storyTagline,
      storyTitle: cfg.storyTitle !== undefined ? formatStoreText(cfg.storyTitle, dynamicDefault.storyTitle) : dynamicDefault.storyTitle,
      storyParagraph1: cfg.storyParagraph1 !== undefined ? formatStoreText(cfg.storyParagraph1, dynamicDefault.storyParagraph1) : dynamicDefault.storyParagraph1,
      storyParagraph2: cfg.storyParagraph2 !== undefined ? formatStoreText(cfg.storyParagraph2, dynamicDefault.storyParagraph2) : dynamicDefault.storyParagraph2,
      storyImageUrl: cfg.storyImageUrl !== undefined ? cfg.storyImageUrl : dynamicDefault.storyImageUrl,
      storyImageAlt: cfg.storyImageAlt !== undefined ? formatStoreText(cfg.storyImageAlt, dynamicDefault.storyImageAlt) : dynamicDefault.storyImageAlt,

      pillarsEnabled: typeof cfg.pillarsEnabled === 'boolean' ? cfg.pillarsEnabled : dynamicDefault.pillarsEnabled,
      pillarsTitle: cfg.pillarsTitle !== undefined ? formatStoreText(cfg.pillarsTitle, dynamicDefault.pillarsTitle) : dynamicDefault.pillarsTitle,
      pillars: Array.isArray(cfg.pillars) ? cfg.pillars.map(p => ({
        ...p,
        title: formatStoreText(p.title, p.title),
        description: formatStoreText(p.description, p.description)
      })) : dynamicDefault.pillars,

      ctaEnabled: typeof cfg.ctaEnabled === 'boolean' ? cfg.ctaEnabled : dynamicDefault.ctaEnabled,
      ctaButtonText: cfg.ctaButtonText !== undefined ? formatStoreText(cfg.ctaButtonText, dynamicDefault.ctaButtonText) : dynamicDefault.ctaButtonText,
      ctaButtonTargetTab: cfg.ctaButtonTargetTab !== undefined ? cfg.ctaButtonTargetTab : dynamicDefault.ctaButtonTargetTab
    };
  }

  public async updateAboutUsConfig(newConfig: Partial<AboutUsPageConfig>): Promise<AboutUsPageConfig> {
    const current = await this.getAboutUsConfig();

    const updated: AboutUsPageConfig = {
      heroEnabled: typeof newConfig.heroEnabled === 'boolean' ? newConfig.heroEnabled : current.heroEnabled,
      heroBadgeText: typeof newConfig.heroBadgeText === 'string' ? newConfig.heroBadgeText.trim() : current.heroBadgeText,
      heroTitle: typeof newConfig.heroTitle === 'string' ? newConfig.heroTitle.trim() : current.heroTitle,
      heroSubtitle: typeof newConfig.heroSubtitle === 'string' ? newConfig.heroSubtitle.trim() : current.heroSubtitle,

      storyEnabled: typeof newConfig.storyEnabled === 'boolean' ? newConfig.storyEnabled : current.storyEnabled,
      storyTagline: typeof newConfig.storyTagline === 'string' ? newConfig.storyTagline.trim() : current.storyTagline,
      storyTitle: typeof newConfig.storyTitle === 'string' ? newConfig.storyTitle.trim() : current.storyTitle,
      storyParagraph1: typeof newConfig.storyParagraph1 === 'string' ? newConfig.storyParagraph1.trim() : current.storyParagraph1,
      storyParagraph2: typeof newConfig.storyParagraph2 === 'string' ? newConfig.storyParagraph2.trim() : current.storyParagraph2,
      storyImageUrl: typeof newConfig.storyImageUrl === 'string' ? newConfig.storyImageUrl.trim() : current.storyImageUrl,
      storyImageAlt: typeof newConfig.storyImageAlt === 'string' ? newConfig.storyImageAlt.trim() : current.storyImageAlt,

      pillarsEnabled: typeof newConfig.pillarsEnabled === 'boolean' ? newConfig.pillarsEnabled : current.pillarsEnabled,
      pillarsTitle: typeof newConfig.pillarsTitle === 'string' ? newConfig.pillarsTitle.trim() : current.pillarsTitle,
      pillars: Array.isArray(newConfig.pillars) ? newConfig.pillars : current.pillars,

      ctaEnabled: typeof newConfig.ctaEnabled === 'boolean' ? newConfig.ctaEnabled : current.ctaEnabled,
      ctaButtonText: typeof newConfig.ctaButtonText === 'string' ? newConfig.ctaButtonText.trim() : current.ctaButtonText,
      ctaButtonTargetTab: typeof newConfig.ctaButtonTargetTab === 'string' ? newConfig.ctaButtonTargetTab.trim() : current.ctaButtonTargetTab
    };

    await this.updateSettings({ aboutUs: updated });
    return updated;
  }

  // --- SHOP COLLECTION PAGE CONFIG ---
  public async getShopCollectionConfig(): Promise<ShopPageConfig> {
    const s = await this.getSettings();
    if (!s || !s.shopCollection) {
      return DEFAULT_SHOP_COLLECTION_CONFIG;
    }
    const cfg = s.shopCollection;
    return {
      enabled: typeof cfg.enabled === 'boolean' ? cfg.enabled : DEFAULT_SHOP_COLLECTION_CONFIG.enabled,
      defaultBanner: {
        imageUrl: cfg.defaultBanner?.imageUrl !== undefined ? cfg.defaultBanner.imageUrl : DEFAULT_SHOP_COLLECTION_CONFIG.defaultBanner.imageUrl,
        badgeText: cfg.defaultBanner?.badgeText !== undefined ? cfg.defaultBanner.badgeText : DEFAULT_SHOP_COLLECTION_CONFIG.defaultBanner.badgeText,
        title: cfg.defaultBanner?.title !== undefined ? cfg.defaultBanner.title : DEFAULT_SHOP_COLLECTION_CONFIG.defaultBanner.title,
        subtitle: cfg.defaultBanner?.subtitle !== undefined ? cfg.defaultBanner.subtitle : DEFAULT_SHOP_COLLECTION_CONFIG.defaultBanner.subtitle,
        description: cfg.defaultBanner?.description !== undefined ? cfg.defaultBanner.description : DEFAULT_SHOP_COLLECTION_CONFIG.defaultBanner.description,
      },
      menBanner: {
        imageUrl: cfg.menBanner?.imageUrl !== undefined ? cfg.menBanner.imageUrl : DEFAULT_SHOP_COLLECTION_CONFIG.menBanner.imageUrl,
        badgeText: cfg.menBanner?.badgeText !== undefined ? cfg.menBanner.badgeText : DEFAULT_SHOP_COLLECTION_CONFIG.menBanner.badgeText,
        title: cfg.menBanner?.title !== undefined ? cfg.menBanner.title : DEFAULT_SHOP_COLLECTION_CONFIG.menBanner.title,
        subtitle: cfg.menBanner?.subtitle !== undefined ? cfg.menBanner.subtitle : DEFAULT_SHOP_COLLECTION_CONFIG.menBanner.subtitle,
        description: cfg.menBanner?.description !== undefined ? cfg.menBanner.description : DEFAULT_SHOP_COLLECTION_CONFIG.menBanner.description,
      },
      womenBanner: {
        imageUrl: cfg.womenBanner?.imageUrl !== undefined ? cfg.womenBanner.imageUrl : DEFAULT_SHOP_COLLECTION_CONFIG.womenBanner.imageUrl,
        badgeText: cfg.womenBanner?.badgeText !== undefined ? cfg.womenBanner.badgeText : DEFAULT_SHOP_COLLECTION_CONFIG.womenBanner.badgeText,
        title: cfg.womenBanner?.title !== undefined ? cfg.womenBanner.title : DEFAULT_SHOP_COLLECTION_CONFIG.womenBanner.title,
        subtitle: cfg.womenBanner?.subtitle !== undefined ? cfg.womenBanner.subtitle : DEFAULT_SHOP_COLLECTION_CONFIG.womenBanner.subtitle,
        description: cfg.womenBanner?.description !== undefined ? cfg.womenBanner.description : DEFAULT_SHOP_COLLECTION_CONFIG.womenBanner.description,
      },
      unisexBanner: {
        imageUrl: cfg.unisexBanner?.imageUrl !== undefined ? cfg.unisexBanner.imageUrl : DEFAULT_SHOP_COLLECTION_CONFIG.unisexBanner.imageUrl,
        badgeText: cfg.unisexBanner?.badgeText !== undefined ? cfg.unisexBanner.badgeText : DEFAULT_SHOP_COLLECTION_CONFIG.unisexBanner.badgeText,
        title: cfg.unisexBanner?.title !== undefined ? cfg.unisexBanner.title : DEFAULT_SHOP_COLLECTION_CONFIG.unisexBanner.title,
        subtitle: cfg.unisexBanner?.subtitle !== undefined ? cfg.unisexBanner.subtitle : DEFAULT_SHOP_COLLECTION_CONFIG.unisexBanner.subtitle,
        description: cfg.unisexBanner?.description !== undefined ? cfg.unisexBanner.description : DEFAULT_SHOP_COLLECTION_CONFIG.unisexBanner.description,
      }
    };
  }

  public async updateShopCollectionConfig(newConfig: Partial<ShopPageConfig>): Promise<ShopPageConfig> {
    const current = await this.getShopCollectionConfig();
    const updated: ShopPageConfig = {
      enabled: typeof newConfig.enabled === 'boolean' ? newConfig.enabled : current.enabled,
      defaultBanner: {
        imageUrl: typeof newConfig.defaultBanner?.imageUrl === 'string' ? newConfig.defaultBanner.imageUrl.trim() : current.defaultBanner.imageUrl,
        badgeText: typeof newConfig.defaultBanner?.badgeText === 'string' ? newConfig.defaultBanner.badgeText.trim() : current.defaultBanner.badgeText,
        title: typeof newConfig.defaultBanner?.title === 'string' ? newConfig.defaultBanner.title.trim() : current.defaultBanner.title,
        subtitle: typeof newConfig.defaultBanner?.subtitle === 'string' ? newConfig.defaultBanner.subtitle.trim() : current.defaultBanner.subtitle,
        description: typeof newConfig.defaultBanner?.description === 'string' ? newConfig.defaultBanner.description.trim() : current.defaultBanner.description,
      },
      menBanner: {
        imageUrl: typeof newConfig.menBanner?.imageUrl === 'string' ? newConfig.menBanner.imageUrl.trim() : current.menBanner.imageUrl,
        badgeText: typeof newConfig.menBanner?.badgeText === 'string' ? newConfig.menBanner.badgeText.trim() : current.menBanner.badgeText,
        title: typeof newConfig.menBanner?.title === 'string' ? newConfig.menBanner.title.trim() : current.menBanner.title,
        subtitle: typeof newConfig.menBanner?.subtitle === 'string' ? newConfig.menBanner.subtitle.trim() : current.menBanner.subtitle,
        description: typeof newConfig.menBanner?.description === 'string' ? newConfig.menBanner.description.trim() : current.menBanner.description,
      },
      womenBanner: {
        imageUrl: typeof newConfig.womenBanner?.imageUrl === 'string' ? newConfig.womenBanner.imageUrl.trim() : current.womenBanner.imageUrl,
        badgeText: typeof newConfig.womenBanner?.badgeText === 'string' ? newConfig.womenBanner.badgeText.trim() : current.womenBanner.badgeText,
        title: typeof newConfig.womenBanner?.title === 'string' ? newConfig.womenBanner.title.trim() : current.womenBanner.title,
        subtitle: typeof newConfig.womenBanner?.subtitle === 'string' ? newConfig.womenBanner.subtitle.trim() : current.womenBanner.subtitle,
        description: typeof newConfig.womenBanner?.description === 'string' ? newConfig.womenBanner.description.trim() : current.womenBanner.description,
      },
      unisexBanner: {
        imageUrl: typeof newConfig.unisexBanner?.imageUrl === 'string' ? newConfig.unisexBanner.imageUrl.trim() : current.unisexBanner.imageUrl,
        badgeText: typeof newConfig.unisexBanner?.badgeText === 'string' ? newConfig.unisexBanner.badgeText.trim() : current.unisexBanner.badgeText,
        title: typeof newConfig.unisexBanner?.title === 'string' ? newConfig.unisexBanner.title.trim() : current.unisexBanner.title,
        subtitle: typeof newConfig.unisexBanner?.subtitle === 'string' ? newConfig.unisexBanner.subtitle.trim() : current.unisexBanner.subtitle,
        description: typeof newConfig.unisexBanner?.description === 'string' ? newConfig.unisexBanner.description.trim() : current.unisexBanner.description,
      }
    };

    await this.updateSettings({ shopCollection: updated });
    return updated;
  }

  // --- OUR COLLECTION PAGE CONFIG ---
  public async getOurCollectionConfig(): Promise<OurCollectionPageConfig> {
    const s = await this.getSettings();
    if (!s || !s.ourCollection) {
      return DEFAULT_OUR_COLLECTION_CONFIG;
    }
    const cfg = s.ourCollection;
    const defaultHeroImg = cfg.defaultBanner?.imageUrl !== undefined 
      ? cfg.defaultBanner.imageUrl 
      : (cfg.heroBannerUrl !== undefined ? cfg.heroBannerUrl : (cfg.heroImageUrl !== undefined ? cfg.heroImageUrl : DEFAULT_OUR_COLLECTION_CONFIG.heroBannerUrl!));
    
    return {
      enabled: typeof cfg.enabled === 'boolean' ? cfg.enabled : DEFAULT_OUR_COLLECTION_CONFIG.enabled,
      heroBadgeText: cfg.heroBadgeText !== undefined ? cfg.heroBadgeText : DEFAULT_OUR_COLLECTION_CONFIG.heroBadgeText,
      heroTitle: cfg.heroTitle !== undefined ? cfg.heroTitle : DEFAULT_OUR_COLLECTION_CONFIG.heroTitle,
      heroSubtitle: cfg.heroSubtitle !== undefined ? cfg.heroSubtitle : DEFAULT_OUR_COLLECTION_CONFIG.heroSubtitle,
      heroDescription: cfg.heroDescription !== undefined ? cfg.heroDescription : DEFAULT_OUR_COLLECTION_CONFIG.heroDescription,
      heroImageUrl: cfg.heroImageUrl !== undefined ? cfg.heroImageUrl : defaultHeroImg,
      heroBannerUrl: cfg.heroBannerUrl !== undefined ? cfg.heroBannerUrl : defaultHeroImg,
      seoTitle: cfg.seoTitle !== undefined ? cfg.seoTitle : DEFAULT_OUR_COLLECTION_CONFIG.seoTitle,
      seoDescription: cfg.seoDescription !== undefined ? cfg.seoDescription : DEFAULT_OUR_COLLECTION_CONFIG.seoDescription,
      defaultBanner: {
        imageUrl: cfg.defaultBanner?.imageUrl !== undefined ? cfg.defaultBanner.imageUrl : defaultHeroImg,
        badgeText: cfg.defaultBanner?.badgeText !== undefined ? cfg.defaultBanner.badgeText : (cfg.heroBadgeText !== undefined ? cfg.heroBadgeText : DEFAULT_OUR_COLLECTION_CONFIG.defaultBanner!.badgeText),
        title: cfg.defaultBanner?.title !== undefined ? cfg.defaultBanner.title : (cfg.heroTitle !== undefined ? cfg.heroTitle : DEFAULT_OUR_COLLECTION_CONFIG.defaultBanner!.title),
        subtitle: cfg.defaultBanner?.subtitle !== undefined ? cfg.defaultBanner.subtitle : (cfg.heroSubtitle !== undefined ? cfg.heroSubtitle : DEFAULT_OUR_COLLECTION_CONFIG.defaultBanner!.subtitle),
        description: cfg.defaultBanner?.description !== undefined ? cfg.defaultBanner.description : (cfg.heroDescription !== undefined ? cfg.heroDescription : DEFAULT_OUR_COLLECTION_CONFIG.defaultBanner!.description),
      },
      menBanner: {
        imageUrl: cfg.menBanner?.imageUrl !== undefined ? cfg.menBanner.imageUrl : DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.imageUrl,
        badgeText: cfg.menBanner?.badgeText !== undefined ? cfg.menBanner.badgeText : DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.badgeText,
        title: cfg.menBanner?.title !== undefined ? cfg.menBanner.title : DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.title,
        subtitle: cfg.menBanner?.subtitle !== undefined ? cfg.menBanner.subtitle : DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.subtitle,
        description: cfg.menBanner?.description !== undefined ? cfg.menBanner.description : DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.description,
      },
      womenBanner: {
        imageUrl: cfg.womenBanner?.imageUrl !== undefined ? cfg.womenBanner.imageUrl : DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.imageUrl,
        badgeText: cfg.womenBanner?.badgeText !== undefined ? cfg.womenBanner.badgeText : DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.badgeText,
        title: cfg.womenBanner?.title !== undefined ? cfg.womenBanner.title : DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.title,
        subtitle: cfg.womenBanner?.subtitle !== undefined ? cfg.womenBanner.subtitle : DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.subtitle,
        description: cfg.womenBanner?.description !== undefined ? cfg.womenBanner.description : DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.description,
      },
      unisexBanner: {
        imageUrl: cfg.unisexBanner?.imageUrl !== undefined ? cfg.unisexBanner.imageUrl : DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.imageUrl,
        badgeText: cfg.unisexBanner?.badgeText !== undefined ? cfg.unisexBanner.badgeText : DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.badgeText,
        title: cfg.unisexBanner?.title !== undefined ? cfg.unisexBanner.title : DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.title,
        subtitle: cfg.unisexBanner?.subtitle !== undefined ? cfg.unisexBanner.subtitle : DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.subtitle,
        description: cfg.unisexBanner?.description !== undefined ? cfg.unisexBanner.description : DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.description,
      }
    };
  }

  public async updateOurCollectionConfig(newConfig: Partial<OurCollectionPageConfig>): Promise<OurCollectionPageConfig> {
    const current = await this.getOurCollectionConfig();

    const heroImg = typeof newConfig.defaultBanner?.imageUrl === 'string' && newConfig.defaultBanner.imageUrl.trim()
      ? newConfig.defaultBanner.imageUrl.trim()
      : (typeof newConfig.heroBannerUrl === 'string' && newConfig.heroBannerUrl.trim()
        ? newConfig.heroBannerUrl.trim()
        : (typeof newConfig.heroImageUrl === 'string' && newConfig.heroImageUrl.trim() ? newConfig.heroImageUrl.trim() : (current.defaultBanner?.imageUrl || current.heroBannerUrl)));

    const defaultBannerConfig = {
      imageUrl: typeof newConfig.defaultBanner?.imageUrl === 'string'
        ? newConfig.defaultBanner.imageUrl.trim()
        : (heroImg || current.defaultBanner?.imageUrl || current.heroBannerUrl || ''),
      badgeText: typeof newConfig.defaultBanner?.badgeText === 'string'
        ? newConfig.defaultBanner.badgeText.trim()
        : (typeof newConfig.heroBadgeText === 'string' ? newConfig.heroBadgeText.trim() : (current.defaultBanner?.badgeText ?? current.heroBadgeText)),
      title: typeof newConfig.defaultBanner?.title === 'string'
        ? newConfig.defaultBanner.title.trim()
        : (typeof newConfig.heroTitle === 'string' ? newConfig.heroTitle.trim() : (current.defaultBanner?.title ?? current.heroTitle)),
      subtitle: typeof newConfig.defaultBanner?.subtitle === 'string'
        ? newConfig.defaultBanner.subtitle.trim()
        : (typeof newConfig.heroSubtitle === 'string' ? newConfig.heroSubtitle.trim() : (current.defaultBanner?.subtitle ?? current.heroSubtitle)),
      description: typeof newConfig.defaultBanner?.description === 'string'
        ? newConfig.defaultBanner.description.trim()
        : (typeof newConfig.heroDescription === 'string' ? newConfig.heroDescription.trim() : (current.defaultBanner?.description ?? current.heroDescription)),
    };

    const updated: OurCollectionPageConfig = {
      enabled: typeof newConfig.enabled === 'boolean' ? newConfig.enabled : current.enabled,
      heroBadgeText: typeof newConfig.heroBadgeText === 'string' ? newConfig.heroBadgeText.trim() : defaultBannerConfig.badgeText,
      heroTitle: typeof newConfig.heroTitle === 'string' ? newConfig.heroTitle.trim() : defaultBannerConfig.title,
      heroSubtitle: typeof newConfig.heroSubtitle === 'string' ? newConfig.heroSubtitle.trim() : defaultBannerConfig.subtitle,
      heroDescription: typeof newConfig.heroDescription === 'string' ? newConfig.heroDescription.trim() : defaultBannerConfig.description,
      heroImageUrl: heroImg || current.heroImageUrl,
      heroBannerUrl: heroImg || current.heroBannerUrl,
      seoTitle: typeof newConfig.seoTitle === 'string' ? newConfig.seoTitle.trim() : current.seoTitle,
      seoDescription: typeof newConfig.seoDescription === 'string' ? newConfig.seoDescription.trim() : current.seoDescription,
      defaultBanner: defaultBannerConfig,
      menBanner: {
        imageUrl: typeof newConfig.menBanner?.imageUrl === 'string' ? newConfig.menBanner.imageUrl.trim() : current.menBanner?.imageUrl || DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.imageUrl,
        badgeText: typeof newConfig.menBanner?.badgeText === 'string' ? newConfig.menBanner.badgeText.trim() : current.menBanner?.badgeText || DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.badgeText,
        title: typeof newConfig.menBanner?.title === 'string' ? newConfig.menBanner.title.trim() : current.menBanner?.title || DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.title,
        subtitle: typeof newConfig.menBanner?.subtitle === 'string' ? newConfig.menBanner.subtitle.trim() : current.menBanner?.subtitle || DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.subtitle,
        description: typeof newConfig.menBanner?.description === 'string' ? newConfig.menBanner.description.trim() : current.menBanner?.description || DEFAULT_OUR_COLLECTION_CONFIG.menBanner!.description,
      },
      womenBanner: {
        imageUrl: typeof newConfig.womenBanner?.imageUrl === 'string' ? newConfig.womenBanner.imageUrl.trim() : current.womenBanner?.imageUrl || DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.imageUrl,
        badgeText: typeof newConfig.womenBanner?.badgeText === 'string' ? newConfig.womenBanner.badgeText.trim() : current.womenBanner?.badgeText || DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.badgeText,
        title: typeof newConfig.womenBanner?.title === 'string' ? newConfig.womenBanner.title.trim() : current.womenBanner?.title || DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.title,
        subtitle: typeof newConfig.womenBanner?.subtitle === 'string' ? newConfig.womenBanner.subtitle.trim() : current.womenBanner?.subtitle || DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.subtitle,
        description: typeof newConfig.womenBanner?.description === 'string' ? newConfig.womenBanner.description.trim() : current.womenBanner?.description || DEFAULT_OUR_COLLECTION_CONFIG.womenBanner!.description,
      },
      unisexBanner: {
        imageUrl: typeof newConfig.unisexBanner?.imageUrl === 'string' ? newConfig.unisexBanner.imageUrl.trim() : current.unisexBanner?.imageUrl || DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.imageUrl,
        badgeText: typeof newConfig.unisexBanner?.badgeText === 'string' ? newConfig.unisexBanner.badgeText.trim() : current.unisexBanner?.badgeText || DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.badgeText,
        title: typeof newConfig.unisexBanner?.title === 'string' ? newConfig.unisexBanner.title.trim() : current.unisexBanner?.title || DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.title,
        subtitle: typeof newConfig.unisexBanner?.subtitle === 'string' ? newConfig.unisexBanner.subtitle.trim() : current.unisexBanner?.subtitle || DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.subtitle,
        description: typeof newConfig.unisexBanner?.description === 'string' ? newConfig.unisexBanner.description.trim() : current.unisexBanner?.description || DEFAULT_OUR_COLLECTION_CONFIG.unisexBanner!.description,
      }
    };

    await this.updateSettings({ ourCollection: updated });
    return updated;
  }

  // --- PRODUCT REVIEWS ---
  public async getProductReviews(productId: string): Promise<ProductReview[]> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const docs = await ProductReviewModel.find({ productId }).sort({ createdAt: -1 }).lean();
      return docs.map(d => {
        const { _id, ...rest } = d as any;
        return rest as ProductReview;
      });
    }

    const data = this.fileDb;
    return (data.reviews || [])
      .filter(r => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getAllReviews(filters?: { search?: string; rating?: number; productId?: string }): Promise<ProductReview[]> {
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const query: Record<string, any> = {};

      if (filters?.productId) {
        query.productId = filters.productId;
      }

      if (filters?.rating && filters.rating > 0) {
        query.rating = filters.rating;
      }

      if (filters?.search) {
        const q = filters.search.trim();
        const regex = new RegExp(q, 'i');
        query.$or = [
          { customerName: regex },
          { customerEmail: regex },
          { productName: regex },
          { title: regex },
          { comment: regex }
        ];
      }

      const docs = await ProductReviewModel.find(query).sort({ createdAt: -1 }).lean();
      return docs.map(d => {
        const { _id, ...rest } = d as any;
        return rest as ProductReview;
      });
    }

    let result = [...(this.fileDb.reviews || [])];

    if (filters?.productId) {
      result = result.filter(r => r.productId === filters.productId);
    }

    if (filters?.rating && filters.rating > 0) {
      result = result.filter(r => r.rating === filters.rating);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        r =>
          r.customerName.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q) ||
          (r.productName && r.productName.toLowerCase().includes(q)) ||
          (r.title && r.title.toLowerCase().includes(q)) ||
          r.comment.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }

  public async createProductReview(data: {
    productId: string;
    customerName: string;
    customerEmail: string;
    rating: number;
    title?: string;
    comment: string;
  }): Promise<ProductReview> {
    const emailClean = data.customerEmail.toLowerCase().trim();
    const product = await this.getProductByIdOrSlug(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if customer already reviewed this product
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const existing = await ProductReviewModel.findOne({
        productId: product.id,
        customerEmail: emailClean
      }).lean();

      if (existing) {
        throw new Error('You have already submitted a review for this fragrance.');
      }
    } else {
      const existing = (this.fileDb.reviews || []).find(
        r => r.productId === product.id && r.customerEmail.toLowerCase() === emailClean
      );
      if (existing) {
        throw new Error('You have already submitted a review for this fragrance.');
      }
    }

    // Check if verified buyer (has completed or placed order containing this product)
    let isVerifiedBuyer = false;
    try {
      const orders = await this.getOrders();
      isVerifiedBuyer = orders.some(
        o =>
          (o.customer?.email?.toLowerCase() === emailClean || (o as any).email?.toLowerCase() === emailClean) &&
          o.items?.some(i => i.productId === product.id)
      );
    } catch {
      // Ignored
    }

    const now = new Date().toISOString();
    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      customerName: data.customerName.trim(),
      customerEmail: emailClean,
      rating: Math.max(1, Math.min(5, Math.round(data.rating))),
      title: data.title ? data.title.trim() : '',
      comment: data.comment.trim(),
      isVerifiedBuyer,
      createdAt: now
    };

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      await ProductReviewModel.create(newReview);
    } else {
      const fDb = this.fileDb;
      if (!Array.isArray(fDb.reviews)) {
        fDb.reviews = [];
      }
      fDb.reviews.unshift(newReview);
      this.saveToFile(fDb);
    }

    // Recalculate product rating
    await this.recalculateProductRating(product.id);

    return newReview;
  }

  public async deleteProductReview(reviewId: string): Promise<boolean> {
    let productId = '';

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const rev = await ProductReviewModel.findOne({ id: reviewId }).lean();
      if (!rev) return false;
      productId = rev.productId;
      await ProductReviewModel.deleteOne({ id: reviewId });
    } else {
      const fDb = this.fileDb;
      const index = (fDb.reviews || []).findIndex(r => r.id === reviewId);
      if (index === -1) return false;
      productId = fDb.reviews[index].productId;
      fDb.reviews.splice(index, 1);
      this.saveToFile(fDb);
    }

    if (productId) {
      await this.recalculateProductRating(productId);
    }

    return true;
  }

  public async recalculateProductRating(productId: string): Promise<void> {
    let reviews: ProductReview[] = [];
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const docs = await ProductReviewModel.find({ productId }).lean();
      reviews = docs.map(d => {
        const { _id, ...rest } = d as any;
        return rest as ProductReview;
      });
    } else {
      reviews = (this.fileDb.reviews || []).filter(r => r.productId === productId);
    }

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

    await this.updateProduct(productId, {
      averageRating,
      reviewCount
    });
  }

  // --- SETTINGS ---
  public async getSettings(): Promise<StoreSettings> {
    let settings: StoreSettings;
    if (this.isUsingMongo()) {
      await this.ensureConnection();
      const doc = await StoreSettingsModel.findOne({ key: 'primary_settings' }).lean();
      settings = (doc && doc.settings) ? doc.settings : DEFAULT_SETTINGS;
    } else {
      settings = this.fileDb.settings;
    }
    if (settings?.categories) {
      settings.categories = settings.categories.filter(
        (c) => !/men'?s\s*fragrance|women'?s\s*fragrance|unisex\s*fragrance/i.test(c.name)
      );
    }
    return settings;
  }

  public async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getSettings();
    const shippingFee = updates.shippingFee !== undefined 
      ? Number(updates.shippingFee) 
      : updates.standardShippingFee !== undefined 
      ? Number(updates.standardShippingFee) 
      : current.shippingFee;

    const standardShippingFee = updates.standardShippingFee !== undefined 
      ? Number(updates.standardShippingFee) 
      : shippingFee;

    const freeShippingThreshold = updates.freeShippingThreshold !== undefined 
      ? Number(updates.freeShippingThreshold) 
      : current.freeShippingThreshold;

    const merged: StoreSettings = {
      ...current,
      ...updates,
      shippingFee,
      standardShippingFee,
      freeShippingThreshold
    };

    if (updates.storeName && updates.storeName !== current.storeName) {
      const oldName = current.storeName || "Al-Mu'attar";
      const newName = updates.storeName;
      const rx = new RegExp(`${oldName}|Al-Mu'attar|Al Mu'attar`, 'gi');
      if (merged.aboutUs) {
        if (merged.aboutUs.heroTitle) merged.aboutUs.heroTitle = merged.aboutUs.heroTitle.replace(rx, newName);
        if (merged.aboutUs.heroSubtitle) merged.aboutUs.heroSubtitle = merged.aboutUs.heroSubtitle.replace(rx, newName);
        if (merged.aboutUs.storyParagraph2) merged.aboutUs.storyParagraph2 = merged.aboutUs.storyParagraph2.replace(rx, newName);
        if (merged.aboutUs.storyImageAlt) merged.aboutUs.storyImageAlt = merged.aboutUs.storyImageAlt.replace(rx, newName);
      }
      if (merged.ourCollection) {
        if (merged.ourCollection.heroBadgeText) merged.ourCollection.heroBadgeText = merged.ourCollection.heroBadgeText.replace(rx, newName);
        if (merged.ourCollection.heroSubtitle) merged.ourCollection.heroSubtitle = merged.ourCollection.heroSubtitle.replace(rx, newName);
        if (merged.ourCollection.seoTitle) merged.ourCollection.seoTitle = merged.ourCollection.seoTitle.replace(rx, newName);
        if (merged.ourCollection.seoDescription) merged.ourCollection.seoDescription = merged.ourCollection.seoDescription.replace(rx, newName);
        if (merged.ourCollection.defaultBanner?.badgeText) merged.ourCollection.defaultBanner.badgeText = merged.ourCollection.defaultBanner.badgeText.replace(rx, newName);
        if (merged.ourCollection.defaultBanner?.subtitle) merged.ourCollection.defaultBanner.subtitle = merged.ourCollection.defaultBanner.subtitle.replace(rx, newName);
      }
      if (merged.shopCollection && merged.shopCollection.defaultBanner?.subtitle) {
        merged.shopCollection.defaultBanner.subtitle = merged.shopCollection.defaultBanner.subtitle.replace(rx, newName);
      }
      if (merged.heroDescription) {
        merged.heroDescription = merged.heroDescription.replace(rx, newName);
      }
    }

    if (this.isUsingMongo()) {
      await this.ensureConnection();
      await StoreSettingsModel.findOneAndUpdate(
        { key: 'primary_settings' },
        { $set: { key: 'primary_settings', settings: merged, updatedAt: new Date().toISOString() } },
        { upsert: true, new: true }
      );
      return merged;
    }

    const data = this.fileDb;
    data.settings = merged;
    this.saveToFile(data);
    return merged;
  }

  // --- ADMIN DASHBOARD STATS ---
  public async getAdminStats(): Promise<AdminStats> {
    const allOrders = await this.getOrders();
    const allProducts = await this.getProducts({ includeInactive: true });
    const allCustomers = await this.getCustomers();

    const validOrders = allOrders.filter(o => o.orderStatus !== 'Cancelled');
    const totalSales = validOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const pendingOrders = allOrders.filter(o => o.orderStatus === 'Pending').length;
    const activeProducts = allProducts.filter(p => p.isActive);
    const lowStockThreshold = 5;
    const lowStockProducts = activeProducts.filter(p => p.stock <= lowStockThreshold);

    return {
      totalSales,
      totalOrders: allOrders.length,
      pendingOrders,
      totalProducts: activeProducts.length,
      lowStockCount: lowStockProducts.length,
      totalCustomers: allCustomers.length,
      recentOrders: allOrders.slice(0, 5),
      lowStockProducts
    };
  }
}

export const db = new Database();

