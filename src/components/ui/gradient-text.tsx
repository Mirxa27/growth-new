import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "aurora" | "glow";
}

export const GradientText = ({ children, className, variant = "primary" }: GradientTextProps) => {
  const variants = {
    primary: "bg-gradient-primary bg-clip-text text-transparent",
    aurora: "bg-gradient-aurora bg-clip-text text-transparent",
    glow: "bg-gradient-glow bg-clip-text text-transparent"
  };

  return (
    <span className={cn(variants[variant], "font-bold", className)}>
      {children}
    </span>
  );
};