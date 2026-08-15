export function fmtEUR(n?: number | null): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export function fmtEURCompact(n?: number | null): string {
  const v = n ?? 0;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} M€`;
  if (abs >= 1_000) return `${(v / 1_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })} k€`;
  return `${v.toLocaleString("it-IT", { maximumFractionDigits: 0 })} €`;
}

export function fmtPct(n?: number | null, digits = 0): string {
  return `${(n ?? 0).toLocaleString("it-IT", { maximumFractionDigits: digits })}%`;
}

export function fmtNum(n?: number | null, digits = 0): string {
  return (n ?? 0).toLocaleString("it-IT", { maximumFractionDigits: digits });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function shortHash(hash: string, len = 12): string {
  if (hash.length <= len + 4) return hash;
  return `${hash.slice(0, len)}…${hash.slice(-4)}`;
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "adesso";
  if (min < 60) return `${min} min fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h fa`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} g fa`;
  const months = Math.floor(days / 30);
  return `${months} mesi fa`;
}

export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
