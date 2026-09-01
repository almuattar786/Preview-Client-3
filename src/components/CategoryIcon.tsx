import React from 'react';
import {
  Sparkles,
  Droplets,
  Flame,
  Crown,
  Feather,
  Heart,
  Shield,
  Sun,
  Moon,
  Gift,
  Gem,
  Award,
  Star,
  Tag,
  Box,
  Compass,
  Flower2,
  Wind
} from 'lucide-react';

interface CategoryIconProps {
  iconName?: string;
  className?: string;
}

export const CATEGORY_ICON_OPTIONS = [
  { name: 'Sparkles', label: 'Sparkles / Diamond', Icon: Sparkles },
  { name: 'Droplets', label: 'Droplets / Oil', Icon: Droplets },
  { name: 'Flame', label: 'Flame / Oud Wood', Icon: Flame },
  { name: 'Crown', label: 'Crown / Royal', Icon: Crown },
  { name: 'Feather', label: 'Feather / Soft Musk', Icon: Feather },
  { name: 'Flower2', label: 'Floral / Rose', Icon: Flower2 },
  { name: 'Wind', label: 'Wind / Sillage', Icon: Wind },
  { name: 'Heart', label: 'Heart / Passion', Icon: Heart },
  { name: 'Shield', label: 'Shield / Premium', Icon: Shield },
  { name: 'Sun', label: 'Sun / Fresh', Icon: Sun },
  { name: 'Moon', label: 'Moon / Night', Icon: Moon },
  { name: 'Gift', label: 'Gift / Special', Icon: Gift },
  { name: 'Gem', label: 'Gem / Luxury', Icon: Gem },
  { name: 'Award', label: 'Award / Signature', Icon: Award },
  { name: 'Star', label: 'Star / Featured', Icon: Star },
  { name: 'Tag', label: 'Tag / Edition', Icon: Tag },
  { name: 'Compass', label: 'Compass / Exotic', Icon: Compass },
  { name: 'Box', label: 'Box / Set', Icon: Box }
];

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = 'w-5 h-5' }) => {
  switch (iconName?.toLowerCase()) {
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'droplets':
      return <Droplets className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'feather':
      return <Feather className={className} />;
    case 'flower2':
    case 'flower':
      return <Flower2 className={className} />;
    case 'wind':
      return <Wind className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'sun':
      return <Sun className={className} />;
    case 'moon':
      return <Moon className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'tag':
      return <Tag className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'box':
      return <Box className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};
