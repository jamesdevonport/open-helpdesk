import { cn, getInitials } from "@/lib/utils";

const sizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export function Avatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initials = getInitials(name || "?");

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Avatar"}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary-100 font-medium text-primary-700",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
