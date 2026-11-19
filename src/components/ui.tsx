import type { ComponentProps, ReactNode, SVGProps } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------------------------------------------------------------- icons

const paths = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  devices: "M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2",
  key: "M15 7a4 4 0 11-3.9 4.9L4 19v2h3v-2h2v-2h2l1.1-1.1A4 4 0 0115 7zM16 10h.01",
  inbox: "M3 13l3-8h12l3 8M3 13v6h18v-6M3 13h5l1 3h6l1-3h5",
  logout: "M15 17l5-5-5-5M20 12H9M12 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  menu: "M4 6h16M4 12h16M4 18h16",
  sim: "M7 3h7l5 5v13H7zM10 12h6v6h-6z",
  signal: "M4 20v-3M9 20v-7M14 20v-11M19 20V5",
  bolt: "M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z",
  shield: "M12 3l7.5 3v5.5c0 4.6-3.2 8.6-7.5 9.5-4.3-.9-7.5-4.9-7.5-9.5V6L12 3z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
} as const;
export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-5 w-5", ...p }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...p}>
      <path d={paths[name]} />
    </svg>
  );
}

export function Logo({ subtitle = "Admin" }: { subtitle?: string }) {
  return (
    <span className="flex items-center gap-2.5 font-display font-semibold text-white">
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-linear-to-br from-brand-400 to-brand-700 shadow-[0_6px_20px_-6px_rgba(16,185,138,0.8)] ring-1 ring-inset ring-white/25">
        <Icon name="check" className="h-[18px] w-[18px]" strokeWidth={2.8} />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] tracking-tight">VerifyNumber</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300">{subtitle}</span>
      </span>
    </span>
  );
}

// ---------------------------------------------------------------- controls

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary:
    "bg-linear-to-b from-brand-500 to-brand-600 text-white ring-1 ring-inset ring-white/20 shadow-[0_10px_30px_-12px_rgba(16,185,138,0.8)] hover:from-brand-400 hover:to-brand-600",
  secondary: "bg-white/[0.06] text-white ring-1 ring-inset ring-white/10 hover:bg-white/[0.1]",
  ghost: "text-ink-300 hover:bg-white/[0.06] hover:text-white",
  danger: "text-red-300 hover:bg-red-500/10 hover:text-red-200",
};

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...p}
    />
  );
}

export function Input({ className, ...p }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 transition focus:border-brand-400/60 focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-brand-400/10",
        className,
      )}
      {...p}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-300">
      {children}
    </label>
  );
}

// ---------------------------------------------------------------- display

const tones = {
  green: "bg-brand-400/10 text-brand-300 ring-brand-400/25",
  amber: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  red: "bg-red-400/10 text-red-300 ring-red-400/25",
  gray: "bg-white/[0.05] text-ink-300 ring-white/10",
};
export type Tone = keyof typeof tones;

export function Badge({ tone = "gray", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function stateTone(s: string): Tone {
  switch (s) {
    case "available":
      return "green";
    case "needs_number":
      return "amber";
    case "disabled":
      return "red";
    default:
      return "gray";
  }
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: IconName }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-400">{label}</p>
        {icon && <Icon name={icon} className="h-4 w-4 text-ink-500" />}
      </div>
      <p className="mt-2 font-display text-[28px] font-bold leading-none tracking-tight text-white tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-6 py-14 text-center text-sm text-ink-500">{children}</div>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-200">
      {children}
    </p>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {head.map((h, i) => (
                <th key={i} className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cx("whitespace-nowrap px-5 py-3 text-ink-300", className)}>{children}</td>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-white/[0.04]", className)} />;
}
