import React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  variant?: 'default' | 'rounded' | 'circular' | 'text' | 'card'
  animation?: 'pulse' | 'wave' | 'none'
}

function Skeleton({ 
  className, 
  variant = 'default',
  animation = 'pulse',
  ...props 
}: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    rounded: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-sm',
    card: 'rounded-xl'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]",
        variantClasses[variant],
        animationClasses[animation],
        "skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
}

// Skeleton components for common UI patterns
export const SkeletonCard = ({ className, ...props }: SkeletonProps) => (
  <div className={cn("p-6 space-y-3", className)} {...props}>
    <Skeleton className="h-4 w-3/4" variant="text" />
    <Skeleton className="h-4 w-1/2" variant="text" />
    <Skeleton className="h-32 w-full" variant="rounded" />
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-16" variant="rounded" />
      <Skeleton className="h-8 w-16" variant="rounded" />
    </div>
  </div>
)

export const SkeletonList = ({ 
  count = 3, 
  className, 
  ...props 
}: SkeletonProps & { count?: number }) => (
  <div className={cn("space-y-3", className)} {...props}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12" variant="circular" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" variant="text" />
          <Skeleton className="h-3 w-1/2" variant="text" />
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonTable = ({ 
  rows = 5, 
  columns = 4, 
  className,
  ...props 
}: SkeletonProps & { rows?: number; columns?: number }) => (
  <div className={cn("space-y-3", className)} {...props}>
    {/* Header */}
    <div className="flex space-x-3">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-4 flex-1" variant="text" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-6 flex-1" variant="text" />
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonAvatar = ({ className, ...props }: SkeletonProps) => (
  <Skeleton 
    className={cn("h-10 w-10", className)} 
    variant="circular" 
    {...props} 
  />
)

export const SkeletonButton = ({ className, ...props }: SkeletonProps) => (
  <Skeleton 
    className={cn("h-10 w-24", className)} 
    variant="rounded" 
    {...props} 
  />
)

export const SkeletonText = ({ 
  lines = 3, 
  className, 
  ...props 
}: SkeletonProps & { lines?: number }) => (
  <div className={cn("space-y-2", className)} {...props}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton 
        key={index} 
        className={cn(
          "h-4",
          index === lines - 1 ? "w-2/3" : "w-full"
        )} 
        variant="text" 
      />
    ))}
  </div>
)

export { Skeleton }