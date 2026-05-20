import type { LucideIcon } from "lucide-react";

type EmptyPageProps = {
  icon: LucideIcon;
  title: string;
  message?: string;
};

export function EmptyPage({
  icon: Icon,
  title,
  message = "This section is ready for your content.",
}: EmptyPageProps) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="glass-panel relative w-full max-w-lg overflow-hidden rounded-3xl p-10 text-center ring-1 ring-white/60">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand-300/20 to-brand-500/10 blur-2xl" />
        <EmptyPageIcon icon={Icon} />
        <h2 className="relative text-xl font-bold text-surface-900">{title}</h2>
        <p className="relative mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
        <EmptyPageDots />
      </div>
    </div>
  );
}

function EmptyPageIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 shadow-lg shadow-brand-200/40 ring-1 ring-white/50">
      <Icon className="h-8 w-8" strokeWidth={1.5} />
    </div>
  );
}

function EmptyPageDots() {
  return (
    <div className="relative mt-8 flex justify-center gap-1.5">
      <span className="h-1.5 w-8 rounded-full bg-brand-400" />
      <span className="h-1.5 w-3 rounded-full bg-brand-200" />
      <span className="h-1.5 w-3 rounded-full bg-brand-200" />
    </div>
  );
}