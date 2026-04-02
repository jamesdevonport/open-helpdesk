import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-tertiary">
        <Icon className="h-6 w-6 text-text-tertiary" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-text-primary">{title}</h3>
      <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
