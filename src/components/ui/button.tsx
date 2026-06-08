import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "destructive" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-[#003262] text-white hover:bg-[#002a52] shadow-sm",
  secondary: "bg-[#238822] text-white hover:bg-[#1c6e1c] shadow-sm",
  destructive: "border border-red-200 text-red-600 bg-transparent hover:bg-red-50 hover:text-red-700",
  outline: "border border-[#003262] text-[#003262] bg-transparent hover:bg-[#003262]/5",
  ghost: "text-[#003262] bg-transparent hover:bg-[#003262]/8",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
