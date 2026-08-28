import { cn } from "@/lib/utils";
export function Badge({className, variant="default", ...props}: React.HTMLAttributes<HTMLDivElement> & {variant?: "default"|"secondary"|"outline"|"success"|"warning"|"destructive"}) {
  const map:any = {
    default:"bg-primary text-primary-foreground",
    secondary:"bg-secondary text-secondary-foreground",
    outline:"border text-foreground",
    success:"bg-emerald-500 text-white",
    warning:"bg-amber-500 text-white",
    destructive:"bg-destructive text-destructive-foreground",
  };
  return <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[variant], className)} {...props}/>;
}
