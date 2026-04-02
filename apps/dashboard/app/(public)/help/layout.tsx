import { HelpWidgetBootstrap } from "@/components/public/HelpWidgetBootstrap";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
      <HelpWidgetBootstrap />
    </div>
  );
}
