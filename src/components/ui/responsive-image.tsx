import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
  sizes?: string;
}

export const ResponsiveImage = ({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  priority = false,
  quality = 75,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: ResponsiveImageProps) => {
  if (!src) {
    return (
      <div
        className={cn(
          'bg-muted animate-pulse',
          className
        )}
        style={{ width, height }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding={priority ? 'sync' : 'async'}
      sizes={sizes}
      srcSet={`${src}?w=640&q=${quality} 640w, ${src}?w=750&q=${quality} 750w, ${src}?w=828&q=${quality} 828w, ${src}?w=1080&q=${quality} 1080w, ${src}?w=1200&q=${quality} 1200w, ${src}?w=1920&q=${quality} 1920w, ${src}?w=2048&q=${quality} 2048w, ${src}?w=3840&q=${quality} 3840w`}
    />
  );
};