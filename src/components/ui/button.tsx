import * as React from "react";
import { cn } from "@/lib/utils";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: "default"|"secondary"|"outline"|"ghost"|"destructive"; size?: "default"|"sm"|"lg"|"icon"; }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({className, variant="default", size="default", ...props}, ref)=>{
  const variantCls = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border bg-background hover:bg-accent",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  }[variant];
  const sizeCls = { default:"h-9 px-4 py-2", sm:"h-8 px-3 text-xs", lg:"h-11 px-8", icon:"h-9 w-9"}[size];
  return <button ref={ref} className={cn("inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50", variantCls, sizeCls, className)} {...props} />;
});
Button.displayName="Button";
