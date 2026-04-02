import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "bg-surface-tertiary text-text-secondary",
  primary: "bg-primary-100 text-primary-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
