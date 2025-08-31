import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className,
  sizes = '100vw',
  loading = 'lazy',
  priority = false,
  quality = 85,
  format = 'webp',
}: ResponsiveImageProps) {
  // Generate srcset for different resolutions
  const generateSrcSet = (baseSrc: string, width?: number) => {
    if (!width) return undefined;
    
    const resolutions = [1, 1.5, 2, 3, 4];
    return resolutions.map(dpr => 
      `${baseSrc}?w=${width * dpr}&q=${quality}&f=${format} ${width * dpr}w`
    ).join(', ');
  };

  // Generate srcset for different widths
  const generateResponsiveSrcSet = (baseSrc: string) => {
    const widths = [320, 640, 768, 1024, 1280, 1536, 1920, 2560, 3840, 7680];
    return widths
      .map(w => `${baseSrc}?w=${w}&q=${quality}&f=${format} ${w}w`)
      .join(', ');
  };

  // Determine sizes attribute based on context
  const getSizes = () => {
    if (sizes !== '100vw') return sizes;
    
    // Mobile-first responsive sizes
    return `
      (max-width: 320px) 100vw,
      (max-width: 640px) 100vw,
      (max-width: 768px) 100vw,
      (max-width: 1024px) 100vw,
      (max-width: 1280px) 100vw,
      (max-width: 1536px) 100vw,
      (max-width: 1920px) 100vw,
      (max-width: 2560px) 100vw,
      (max-width: 3840px) 100vw,
      7680px
    `.replace(/\s+/g, ' ').trim();
  };

  const srcSet = width 
    ? generateSrcSet(src, width)
    : generateResponsiveSrcSet(src);

  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const avifSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');

  return (
    <picture className={cn("block", className)}>
      <source
        srcSet={srcSet}
        sizes={getSizes()}
        type="image/avif"
      />
      <source
        srcSet={srcSet}
        sizes={getSizes()}
        type="image/webp"
      />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding={priority ? 'sync' : 'async'}
        className="w-full h-auto"
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </picture>
  );
}

// Hook for responsive image optimization
export function useResponsiveImage(src: string) {
  return {
    src: src,
    srcWebp: src.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
    srcAvif: src.replace(/\.(jpg|jpeg|png)$/i, '.avif'),
    srcSet: {
      webp: `${src}?format=webp&width=320 320w, ${src}?format=webp&width=640 640w, ${src}?format=webp&width=768 768w, ${src}?format=webp&width=1024 1024w, ${src}?format=webp&width=1280 1280w, ${src}?format=webp&width=1536 1536w, ${src}?format=webp&width=1920 1920w, ${src}?format=webp&width=2560 2560w, ${src}?format=webp&width=3840 3840w, ${src}?format=webp&width=7680 7680w`,
      avif: `${src}?format=avif&width=320 320w, ${src}?format=avif&width=640 640w, ${src}?format=avif&width=768 768w, ${src}?format=avif&width=1024 1024w, ${src}?format=avif&width=1280 1280w, ${src}?format=avif&width=1536 1536w, ${src}?format=avif&width=1920 1920w, ${src}?format=avif&width=2560 2560w, ${src}?format=avif&width=3840 3840w, ${src}?format=avif&width=7680 7680w`,
    },
    sizes: '(max-width: 320px) 100vw, (max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, (max-width: 1536px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, (max-width: 3840px) 100vw, 7680px',
  };
}