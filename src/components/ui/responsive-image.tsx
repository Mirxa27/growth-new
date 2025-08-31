import { ImgHTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  loadingType?: "lazy" | "eager";
  webpSrcSet?: string;
  fallbackSrcSet?: string;
}

export const ResponsiveImage = ({
  src,
  alt,
  className,
  sizes = "100vw",
  loadingType = "lazy",
  webpSrcSet,
  fallbackSrcSet,
  ...props
}: ResponsiveImageProps) => {
  // Convert non-SVG images to WebP format and generate responsive srcsets
  const isWebP = src.endsWith('.webp');
  const isSVG = src.endsWith('.svg');
  
  if (isSVG) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-auto", className)}
        loading={loadingType}
        {...props}
      />
    );
  }

  const generateSrcSet = (path: string, format: string) => {
    const widths = [320, 640, 768, 1024, 1280, 1536, 1920];
    return widths
      .map((width) => {
        const quality = width <= 768 ? 80 : 90; // Lower quality for mobile
        return `${path}?w=${width}&q=${quality}&fmt=${format} ${width}w`;
      })
      .join(', ');
  };

  return (
    <picture>
      {webpSrcSet && (
        <source
          type="image/webp"
          srcSet={webpSrcSet}
          sizes={sizes}
        />
      )}
      {!webpSrcSet && !isWebP && !isSVG && (
        <source
          type="image/webp"
          srcSet={generateSrcSet(src, 'webp')}
          sizes={sizes}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-auto", className)}
        loading={loadingType}
        srcSet={fallbackSrcSet || (!isSVG && !isWebP ? generateSrcSet(src, 'jpg') : undefined)}
        sizes={sizes}
        {...props}
      />
    </picture>
  );
};