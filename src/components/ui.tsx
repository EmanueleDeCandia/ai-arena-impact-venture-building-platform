import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import type { ProjectStatus } from "@/db/schema";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/workflow";

export function Card({
  children,
  className,
  raised = false,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  raised?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        raised ? "tactile-card-raised" : "tactile-card",
        interactive && "tactile-card-interactive cursor-pointer",
        "p-5",
        className
      )}
    >
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
        <h3 className="text-engraved text-sm font-black uppercase tracking-wider text-slate-700">
          {title}
        </h3>
        {subtitle && (
          <p className="text-engraved-subtle mt-1 text-xs font-medium text-slate-500">
            {subtitle}
          </p>
        )}
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
    <Card className="p-4.5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-3.5">
        {icon && (
          <div
            className={cn(
              "tactile-icon-well flex h-11 w-11 shrink-0 items-center justify-center text-base",
              accent ?? "bg-gradient-to-br from-emerald-50 to-teal-100/80 text-emerald-700"
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-engraved-subtle truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </div>
          <div className="text-engraved-strong truncate text-2xl font-black text-slate-900">
            {value}
          </div>
          {sub && (
            <div className="text-engraved-subtle mt-0.5 truncate text-xs font-medium text-slate-500">
              {sub}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "tactile-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-all",
        className ?? "border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 text-slate-700"
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
    <div className={cn("tactile-progress-track h-3.5 w-full overflow-hidden rounded-full", className)}>
      <div
        className={cn(
          "tactile-progress-fill h-full rounded-full transition-all duration-500",
          barClassName ??
            (v >= 80
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : v >= 50
              ? "bg-gradient-to-r from-amber-500 to-yellow-400"
              : "bg-gradient-to-r from-rose-500 to-red-400")
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
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="filter drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2ddd2" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
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
          className="fill-slate-900 text-lg font-black"
          style={{
            filter: "drop-shadow(0 -0.5px 0.5px rgba(0,0,0,0.5)) drop-shadow(0 1px 0 rgba(255,255,255,0.9))",
          }}
        >
          {Math.round(v)}
        </text>
      </svg>
      {label && <div className="text-engraved text-xs font-bold text-slate-800">{label}</div>}
      {sub && <div className="text-engraved-subtle text-[11px] font-medium text-slate-500">{sub}</div>}
    </div>
  );
}

export function CheckItem({ label, passed, hint }: { label: string; passed: boolean; hint?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span
        className={cn(
          "tactile-pill mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-black",
          passed
            ? "bg-gradient-to-b from-emerald-100 to-emerald-200 text-emerald-800"
            : "bg-gradient-to-b from-rose-100 to-rose-200 text-rose-700"
        )}
      >
        {passed ? "✓" : "✕"}
      </span>
      <div>
        <div className={cn("text-sm", passed ? "text-engraved text-slate-700" : "text-engraved font-bold text-slate-900")}>
          {label}
        </div>
        {hint && <div className="text-engraved-subtle text-xs text-slate-500">{hint}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="tactile-sunken flex flex-col items-center gap-2 rounded-2xl p-8 text-center">
      {icon}
      <p className="text-engraved-subtle text-sm font-medium text-slate-600">{text}</p>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={cn(
          "tactile-card-raised max-h-[88vh] w-full overflow-y-auto p-6 md:p-8",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between border-b border-slate-200/80 pb-3">
          <h2 className="text-engraved text-xl font-black text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="tactile-btn-secondary flex h-8 w-8 items-center justify-center rounded-lg p-1 text-slate-500 hover:text-slate-900"
          >
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
      <span className="text-engraved-subtle mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "tactile-input w-full px-3.5 py-2.5 text-sm font-semibold placeholder-slate-400 outline-none";

export const btnPrimary =
  "tactile-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "tactile-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "tactile-btn-ghost inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50";
