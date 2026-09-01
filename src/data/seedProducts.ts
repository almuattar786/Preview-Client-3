import { Product } from '../types';

export const SEED_PRODUCTS: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'prod-001',
    name: 'Oud Al-Mu\'attar Royal',
    slug: 'oud-al-muattar-royal',
    description: 'The crown jewel of Al-Mu\'attar. An opulent blend of rare Cambodian Oud, smoked amber, and velvet Damask rose. Formulated for longevity and irresistible projection.',
    shortDescription: 'Opulent Cambodian Oud with smoked amber and Damask rose.',
    price: 14500,
    compareAtPrice: 17000,
    category: 'Oud',
    brand: 'Al-Mu\'attar',
    size: '100ml',
    fragranceType: 'Extrait de Parfum',
    gender: 'Unisex',
    notes: {
      top: ['Saffron', 'Bergamot', 'Bulgarian Rose'],
      heart: ['Cambodian Oud', 'Amberwood', 'Smoked Incense'],
      base: ['Pure Agarwood', 'Dark Leather', 'Vanilla Bean']
    },
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 24,
    sku: 'AM-OUD-001',
    isFeatured: true,
    isBestseller: true,
    isActive: true
  },
  {
    id: 'prod-002',
    name: 'Amber Noir Intense',
    slug: 'amber-noir-intense',
    description: 'A dark, sensual masterpiece marrying rich Baltic amber with warm spices and cream sandalwood. Perfect for evening wear and special occasions.',
    shortDescription: 'Warm Baltic amber, rich cinnamon, and creamy sandalwood.',
    price: 9800,
    compareAtPrice: 11500,
    category: 'Perfumes',
    brand: 'Al-Mu\'attar',
    size: '100ml',
    fragranceType: 'Eau de Parfum',
    gender: 'Unisex',
    notes: {
      top: ['Cardamom', 'Pink Pepper', 'Cinnamon Bark'],
      heart: ['Golden Amber', 'Myrrh', 'Labdanum'],
      base: ['Mysore Sandalwood', 'Tonka Bean', 'Cashmere Musk']
    },
    images: [
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 18,
    sku: 'AM-AMB-002',
    isFeatured: true,
    isBestseller: true,
    isActive: true
  },
  {
    id: 'prod-003',
    name: 'Dehn Al Oud Khas (Pure Oil)',
    slug: 'dehn-al-oud-khas',
    description: '100% pure aged Assam Oud oil extracted using ancient distillation methods. Unfiltered, rich, woody, and intensely long-lasting attar oil.',
    shortDescription: '100% pure aged Assam Oud attar oil in crystal bottle.',
    price: 18500,
    compareAtPrice: 22000,
    category: 'Attars',
    brand: 'Al-Mu\'attar',
    size: '12ml (1 Tola)',
    fragranceType: 'Attar Oil',
    gender: 'Unisex',
    notes: {
      top: ['Wild Aged Oud', 'Earthy Woods'],
      heart: ['Smoked Resin', 'Warm Leather'],
      base: ['Deep Agarwood Extract', 'Animalic Spice']
    },
    images: [
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 8,
    sku: 'AM-ATT-003',
    isFeatured: true,
    isBestseller: true,
    isActive: true
  },
  {
    id: 'prod-004',
    name: 'Arabian Rose Imperial',
    slug: 'arabian-rose-imperial',
    description: 'A captivating floral melody showcasing Taif Rose petals soaked in sweet vanilla nectar, white musk, and delicate sandalwood.',
    shortDescription: 'Taif rose blossom infused with vanilla nectar and white musk.',
    price: 7200,
    compareAtPrice: 8500,
    category: 'Perfumes',
    brand: 'Al-Mu\'attar',
    size: '100ml',
    fragranceType: 'Eau de Parfum',
    gender: 'Women',
    notes: {
      top: ['Taif Rose', 'Lychee', 'Mandarin Zest'],
      heart: ['Turkish Rose Absolute', 'Jasmine Sambac', 'Peony'],
      base: ['Bourbon Vanilla', 'White Musk', 'Cedarwood']
    },
    images: [
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 30,
    sku: 'AM-ROS-004',
    isFeatured: true,
    isBestseller: true,
    isActive: true
  },
  {
    id: 'prod-005',
    name: 'Sultan\'s Leather & Tobacco',
    slug: 'sultans-leather-tobacco',
    description: 'A bold, regal fragrance designed for the discerning gentleman. Combines cured Cuban tobacco leaves, Italian leather, clove, and rich amber.',
    shortDescription: 'Regal cured tobacco leaf, Italian leather, and spiced cloves.',
    price: 11200,
    compareAtPrice: 13000,
    category: 'Perfumes',
    brand: 'Al-Mu\'attar',
    size: '100ml',
    fragranceType: 'Extrait de Parfum',
    gender: 'Men',
    notes: {
      top: ['Whiskey Accord', 'Clove Bud', 'Nutmeg'],
      heart: ['Tobacco Leaf', 'Tuscan Leather', 'Patchouli'],
      base: ['Amber Resin', 'Guaiac Wood', 'Oakmoss']
    },
    images: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 14,
    sku: 'AM-MEN-005',
    isFeatured: true,
    isBestseller: true,
    isActive: true
  },
  {
    id: 'prod-006',
    name: 'Musk Blanc Supreme',
    slug: 'musk-blanc-supreme',
    description: 'An ethereal, velvety clean white musk enhanced with gentle lily of the valley, white tea, and soft iris root. Pure sophistication for daily elegance.',
    shortDescription: 'Velvety clean white musk, white tea, and iris root.',
    price: 6500,
    compareAtPrice: 7500,
    category: 'Perfumes',
    brand: 'Al-Mu\'attar',
    size: '100ml',
    fragranceType: 'Eau de Parfum',
    gender: 'Unisex',
    notes: {
      top: ['White Tea', 'Fresh Cotton', 'Bergamot'],
      heart: ['White Musk', 'Lily of the Valley', 'Iris Root'],
      base: ['Clean Amber', 'Cashmeran', 'Sandalwood']
    },
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 35,
    sku: 'AM-MSK-006',
    isFeatured: false,
    isActive: true
  },
  {
    id: 'prod-007',
    name: 'Silver Wood & Bergamot',
    slug: 'silver-wood-bergamot',
    description: 'Crisp Calabrian bergamot infused with smoky cedarwood, vetiver, and sparkling marine accords. Energetic, refined, and effortlessly modern.',
    shortDescription: 'Sparkling Calabrian bergamot with smoked cedarwood and vetiver.',
    price: 8900,
    compareAtPrice: 10200,
    category: 'Perfumes',
    brand: 'Al-Mu\'attar',
    size: '100ml',
    fragranceType: 'Eau de Parfum',
    gender: 'Men',
    notes: {
      top: ['Calabrian Bergamot', 'Grapefruit', 'Pink Pepper'],
      heart: ['Cedarwood', 'Vetiver', 'Black Pepper'],
      base: ['Ambroxan', 'Dry Woods', 'White Amber']
    },
    images: [
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 20,
    sku: 'AM-SLV-007',
    isFeatured: false,
    isActive: true
  },
  {
    id: 'prod-008',
    name: 'Jasmine Motia Concentrated Attar',
    slug: 'jasmine-motia-attar',
    description: 'Pure concentrated oil of midnight blooming Jasmine (Motia). Alcohol-free traditional oil blended with creamy sandalwood base.',
    shortDescription: 'Traditional alcohol-free midnight blooming Motia jasmine oil.',
    price: 4500,
    compareAtPrice: 5200,
    category: 'Attars',
    brand: 'Al-Mu\'attar',
    size: '12ml (1 Tola)',
    fragranceType: 'Attar Oil',
    gender: 'Unisex',
    notes: {
      top: ['Fresh Green Leaves', 'Morning Dew'],
      heart: ['Midnight Jasmine Motia', 'Tubereuse'],
      base: ['Creamy Sandalwood Oil', 'Soft Amber']
    },
    images: [
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 42,
    sku: 'AM-JAS-008',
    isFeatured: false,
    isActive: true
  },
  {
    id: 'prod-009',
    name: 'Velvet Oud Gold',
    slug: 'velvet-oud-gold',
    description: 'A luxurious unisex fragrance combining sweet caramel accord, warm amber, precious oud, and smooth Madagascar vanilla.',
    shortDescription: 'Rich gourmand oud laced with golden amber and vanilla.',
    price: 12800,
    compareAtPrice: 15000,
    category: 'Oud',
    brand: 'Al-Mu\'attar',
    size: '100ml',
    fragranceType: 'Extrait de Parfum',
    gender: 'Unisex',
    notes: {
      top: ['Salted Caramel', 'Cinnamon', 'Davana'],
      heart: ['Golden Amber', 'Precious Oud', 'Rose Absolute'],
      base: ['Madagascar Vanilla', 'Musk', 'Benzoin']
    },
    images: [
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 4, // Low stock example
    sku: 'AM-VLV-009',
    isFeatured: true,
    isActive: true
  },
  {
    id: 'bundle-001',
    name: 'Maison Discovery Bundle (Choose Any 3)',
    slug: 'maison-discovery-bundle-choose-any-3',
    description: 'Curate your bespoke fragrance wardrobe. Select any 3 full-sized artisanal fragrances from our master collection for an exclusive bundled price. Handcrafted in Lahore with the finest Cambodian Oud and French oils.',
    shortDescription: 'Build your own custom luxury bundle: select any 3 fragrances from our collection.',
    price: 24500,
    compareAtPrice: 32000,
    category: 'Perfumes',
    categories: ['Perfumes', 'Oud'],
    brand: "Al-Mu'attar House",
    size: '3 x 100ml / 50ml EDP/Extrait',
    fragranceType: 'Extrait de Parfum',
    gender: 'Unisex',
    notes: {
      top: ['Custom Selected Fragrances'],
      heart: ['Oud, Amber, White Floral, Spices'],
      base: ['Rare Woods, Vanilla & Musk']
    },
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 50,
    sku: 'AM-BNDL-001',
    isFeatured: true,
    isBestseller: true,
    isActive: true,
    isBundle: true,
    requiredSelectionCount: 3,
    eligibleProductIds: [
      'prod-001',
      'prod-002',
      'prod-003',
      'prod-004',
      'prod-005',
      'prod-006',
      'prod-007',
      'prod-008',
      'prod-009'
    ],
    bundleOptions: [
      { id: 'opt-prod-001', type: 'existing', productId: 'prod-001' },
      { id: 'opt-prod-002', type: 'existing', productId: 'prod-002' },
      { id: 'opt-prod-003', type: 'existing', productId: 'prod-003' },
      { id: 'opt-prod-004', type: 'existing', productId: 'prod-004' },
      { id: 'opt-prod-005', type: 'existing', productId: 'prod-005' },
      { id: 'opt-prod-006', type: 'existing', productId: 'prod-006' },
      { id: 'opt-prod-007', type: 'existing', productId: 'prod-007' },
      { id: 'opt-prod-008', type: 'existing', productId: 'prod-008' },
      { id: 'opt-prod-009', type: 'existing', productId: 'prod-009' },
      {
        id: 'opt-custom-001',
        type: 'custom',
        name: 'Royal Blend',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600',
        category: 'Custom Blend'
      },
      {
        id: 'opt-custom-002',
        type: 'custom',
        name: 'Arabian Rose',
        image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=600',
        category: 'Custom Blend'
      },
      {
        id: 'opt-custom-003',
        type: 'custom',
        name: 'Midnight Oud',
        image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=600',
        category: 'Custom Blend'
      }
    ],
    bundleBadge: 'Build Your Own (3 Fragrances)'
  },
  {
    id: 'bundle-002',
    name: 'Artisanal Duo Discovery Set (Choose Any 2)',
    slug: 'artisanal-duo-discovery-set-choose-any-2',
    description: 'A luxurious pairing of two signature Al-Mu\'attar fragrances of your choice. An ideal gift or addition to your private collection at a special introductory bundle rate.',
    shortDescription: 'Choose any 2 signature fragrances from our luxury collection.',
    price: 18900,
    compareAtPrice: 24000,
    category: 'Oud',
    categories: ['Oud', 'Perfumes'],
    brand: "Al-Mu'attar House",
    size: '2 x 100ml EDP',
    fragranceType: 'Eau de Parfum',
    gender: 'Unisex',
    notes: {
      top: ['Custom Selected Fragrances'],
      heart: ['Amber, Rose, Smoked Leather'],
      base: ['Precious Oud, Sandalwood']
    },
    images: [
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 35,
    sku: 'AM-BNDL-002',
    isFeatured: true,
    isActive: true,
    isBundle: true,
    requiredSelectionCount: 2,
    eligibleProductIds: [
      'prod-001',
      'prod-002',
      'prod-003',
      'prod-004',
      'prod-005',
      'prod-009'
    ],
    bundleOptions: [
      { id: 'opt-prod-001', type: 'existing', productId: 'prod-001' },
      { id: 'opt-prod-002', type: 'existing', productId: 'prod-002' },
      { id: 'opt-prod-003', type: 'existing', productId: 'prod-003' },
      { id: 'opt-prod-004', type: 'existing', productId: 'prod-004' },
      { id: 'opt-prod-005', type: 'existing', productId: 'prod-005' },
      { id: 'opt-prod-009', type: 'existing', productId: 'prod-009' },
      {
        id: 'opt-custom-004',
        type: 'custom',
        name: 'Private Reserve Oud',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=600',
        category: 'Artisanal Reserve'
      }
    ],
    bundleBadge: 'Special Value Duo (2 Fragrances)'
  }
];
