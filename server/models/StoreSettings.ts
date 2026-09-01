import mongoose, { Schema } from 'mongoose';
import { StoreSettings } from '../../src/types';

export interface IStoreSettingsDoc {
  key: string;
  settings: StoreSettings;
  updatedAt: string;
}

const CategoryConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    badge: { type: String },
    iconName: { type: String }
  },
  { _id: false }
);

const BestSellersConfigSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    sectionTitle: { type: String, default: 'BEST SELLERS' },
    displayLimit: { type: Number, default: 8 },
    displayMode: { type: String, enum: ['automatic', 'manual', 'hybrid'], default: 'hybrid' },
    manualProductIds: { type: [String], default: [] }
  },
  { _id: false }
);

const AboutUsPillarSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true }
  },
  { _id: false }
);

const AboutUsPageConfigSchema = new Schema(
  {
    heroEnabled: { type: Boolean, default: true },
    heroBadgeText: { type: String, default: 'Haute Parfumerie Heritage' },
    heroTitle: { type: String, default: "The Art of Al-Mu'attar" },
    heroSubtitle: { type: String, default: "Rooted in Lahore, Pakistan, Al-Mu'attar crafts regal oriental fragrances, pure Cambodian Oud attars, and high-sillage French Extrait compositions." },

    storyEnabled: { type: Boolean, default: true },
    storyTagline: { type: String, default: 'Scent Distillation' },
    storyTitle: { type: String, default: 'Centuries of Olfactory Passion' },
    storyParagraph1: { type: String, default: 'In the ancient art of oriental perfumery, fragrance is not merely an accessory — it is an identity, a signature, and a silent ambassador of grace.' },
    storyParagraph2: { type: String, default: 'At Al-Mu\'attar, we combine traditional copper pot distillation techniques with modern perfume maceration to deliver high-concentration EDPs and pure concentrated oils that last all day.' },
    storyImageUrl: { type: String, default: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800' },
    storyImageAlt: { type: String, default: "Al-Mu'attar Craftsmanship" },

    pillarsEnabled: { type: Boolean, default: true },
    pillarsTitle: { type: String, default: 'Our Pillars of Olfactory Excellence' },
    pillars: { type: [AboutUsPillarSchema], default: [] },

    ctaEnabled: { type: Boolean, default: true },
    ctaButtonText: { type: String, default: 'Explore Our Fragrances' },
    ctaButtonTargetTab: { type: String, default: 'shop' }
  },
  { _id: false }
);

const CollectionsSectionConfigSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    sectionTitle: { type: String, default: 'COLLECTIONS' },
    sectionSubtitle: { type: String, default: 'Curated by Essence & Silhouette' },
    menImage: { type: String, default: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200' },
    womenImage: { type: String, default: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=1200' },
    unisexImage: { type: String, default: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200' },
    menTitle: { type: String, default: 'MEN' },
    womenTitle: { type: String, default: 'Women' },
    unisexTitle: { type: String, default: 'Unisex' },
    menSubtitle: { type: String, default: 'Collection' },
    womenSubtitle: { type: String, default: 'Collection' },
    unisexSubtitle: { type: String, default: 'Collection' },
    menCtaText: { type: String, default: 'Explore now' },
    womenCtaText: { type: String, default: 'Explore now' },
    unisexCtaText: { type: String, default: 'Explore now' }
  },
  { _id: false }
);

const CollectionHeroBannerConfigSchema = new Schema(
  {
    imageUrl: { type: String, default: '' },
    badgeText: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  { _id: false, strict: false }
);

const ShopPageConfigSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    defaultBanner: { type: CollectionHeroBannerConfigSchema },
    menBanner: { type: CollectionHeroBannerConfigSchema },
    womenBanner: { type: CollectionHeroBannerConfigSchema },
    unisexBanner: { type: CollectionHeroBannerConfigSchema }
  },
  { _id: false, strict: false }
);

const OurCollectionPageConfigSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    heroBadgeText: { type: String, default: "Maison Al-Mu'attar Privé" },
    heroTitle: { type: String, default: 'Our Signature Fragrance Collection' },
    heroSubtitle: { type: String, default: "Maison Al-Mu'attar Privé Accords" },
    heroDescription: { type: String, default: 'Mastercrafted in limited artisanal batches with genuine rare Cambodian agarwood, pure Taif rose absolutes, and vintage ambergris.' },
    heroImageUrl: { type: String, default: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920' },
    heroBannerUrl: { type: String, default: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920' },
    seoTitle: { type: String },
    seoDescription: { type: String },
    defaultBanner: { type: CollectionHeroBannerConfigSchema },
    menBanner: { type: CollectionHeroBannerConfigSchema },
    womenBanner: { type: CollectionHeroBannerConfigSchema },
    unisexBanner: { type: CollectionHeroBannerConfigSchema }
  },
  { _id: false, strict: false }
);

const StoreSettingsSchema = new Schema<IStoreSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: 'primary_settings', index: true },
    settings: {
      storeName: { type: String, default: "Al-Mu'attar" },
      tagline: { type: String, default: 'Haute Parfumerie Orientale' },
      currencySymbol: { type: String, default: 'Rs.' },
      shippingFee: { type: Number, default: 0 },
      standardShippingFee: { type: Number, default: 0 },
      freeShippingThreshold: { type: Number, default: 0 },
      isFreeShippingEnabled: { type: Boolean, default: true },
      isCustomShippingEnabled: { type: Boolean, default: false },
      customShippingFee: { type: Number, default: 0 },
      contactEmail: { type: String, default: 'info@almuattar.com' },
      supportEmail: { type: String, default: 'concierge@almuattar.com' },
      contactPhone: { type: String, default: '+92 300 1234567' },
      whatsappNumber: { type: String, default: '+92 300 1234567' },
      storeAddress: { type: String, default: '104 Mall Road, Gulberg III, Lahore, Pakistan' },
      announcementBarText: { type: String, default: 'Free Express Shipping Across Pakistan On All Orders | Cash on Delivery Available' },
      isLogoEnabled: { type: Boolean, default: true },
      logoUrl: { type: String },
      heroImageUrl: { type: String },
      heroBadgeText: { type: String },
      heroHeadingLine1: { type: String },
      heroHeadingGradient: { type: String },
      heroDescription: { type: String },
      promiseStatement: { type: String },
      footerText: { type: String },
      categories: { type: [CategoryConfigSchema], default: [] },
      bestsellers: { type: BestSellersConfigSchema },
      aboutUs: { type: AboutUsPageConfigSchema },
      collections: { type: CollectionsSectionConfigSchema },
      ourCollection: { type: OurCollectionPageConfigSchema },
      shopCollection: { type: ShopPageConfigSchema }
    },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: false,
    versionKey: false,
    strict: false
  }
);

export const StoreSettingsModel =
  (mongoose.models.StoreSettings as mongoose.Model<IStoreSettingsDoc>) ||
  mongoose.model<IStoreSettingsDoc>('StoreSettings', StoreSettingsSchema);
