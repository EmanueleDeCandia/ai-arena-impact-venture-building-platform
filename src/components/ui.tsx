import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import type { ProjectStatus } from "@/db/schema";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/workflow";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accent ?? "bg-emerald-50 text-emerald-600")}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
          <div className="truncate text-xl font-bold text-slate-900">{value}</div>
          {sub && <div className="text-xs text-slate-500">{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        className ?? "border-slate-200 bg-slate-100 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge className={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          barClassName ?? (v >= 80 ? "bg-emerald-500" : v >= 50 ? "bg-amber-500" : "bg-rose-500")
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function ScoreRing({
  value,
  label,
  sub,
  size = 104,
  className,
}: {
  value: number;
  label?: string;
  sub?: string;
  size?: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const color = v >= 70 ? "#10b981" : v >= 50 ? "#f59e0b" : "#f43f5e";
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={9} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-slate-900 text-base font-bold"
        >
          {Math.round(v)}
        </text>
      </svg>
      {label && <div className="text-xs font-semibold text-slate-700">{label}</div>}
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

export function CheckItem({ label, passed, hint }: { label: string; passed: boolean; hint?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span
        className={cn(
          "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
        )}
      >
        {passed ? "✓" : "✕"}
      </span>
      <div>
        <div className={cn("text-sm", passed ? "text-slate-700" : "font-semibold text-slate-900")}>{label}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
      {icon}
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn("max-h-[85vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";
