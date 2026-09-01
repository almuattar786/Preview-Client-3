import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  image?: string;
  siteName?: string;
  noindex?: boolean;
  structuredData?: object | object[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage,
  image,
  siteName,
  noindex = false,
  structuredData
}) => {
  const { storeSettings } = useCart();
  const resolvedOgImage = ogImage || image || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200';
  const currentBrand = storeSettings?.storeName || (typeof window !== 'undefined' && (window as any).__INITIAL_STORE_SETTINGS__?.storeName) || "Al-Mu'attar";
  const effectiveSiteName = siteName || `${currentBrand} Luxury Fragrances`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // 2. Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;

    // 3. Update Robots
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
      }
      metaRobots.content = 'noindex, nofollow';
    } else if (metaRobots) {
      metaRobots.content = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    }

    // 4. Update Canonical URL
    const origin = window.location.origin;
    const cleanPath = canonicalPath 
      ? (canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`)
      : window.location.pathname;
    const fullCanonicalUrl = `${origin}${cleanPath === '/' ? '' : cleanPath}`;

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = fullCanonicalUrl;

    // 5. Open Graph Meta Tags
    const setMetaProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaProperty('og:title', title);
    setMetaProperty('og:description', description);
    setMetaProperty('og:type', ogType);
    setMetaProperty('og:url', fullCanonicalUrl);
    setMetaProperty('og:image', resolvedOgImage);
    setMetaProperty('og:site_name', effectiveSiteName);

    // 6. Twitter Meta Tags
    const setMetaName = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:title', title);
    setMetaName('twitter:description', description);
    setMetaName('twitter:image', resolvedOgImage);

    // 7. Structured Data (JSON-LD)
    const scriptId = 'jsonld-structured-data';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const jsonLd = document.getElementById(scriptId);
      if (jsonLd) {
        jsonLd.remove();
      }
    };
  }, [title, description, canonicalPath, ogType, resolvedOgImage, effectiveSiteName, noindex, structuredData]);

  return null;
};
