import { VariantProps } from "class-variance-authority";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  children?: React.ReactNode;
}

declare const badgeVariants: any;