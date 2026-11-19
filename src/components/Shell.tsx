import { useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { SITE_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Icon, Logo, Skeleton, cx } from "./ui";
import type { IconName } from "./ui";

const nav: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Devices & SIMs", icon: "devices" },
  { to: "/enrollment", label: "Enrollment codes", icon: "key" },
  { to: "/messages", label: "Inbound messages", icon: "inbox" },
];

export default function Shell() {
  const { me, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace />;

  const links = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
      {nav.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === "/"}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-white/[0.07] text-white shadow-[inset_2px_0_0_0_#34d3a3]"
                : "text-ink-400 hover:bg-white/[0.04] hover:text-white",
            )
          }
        >
          <Icon name={n.icon} className="h-[18px] w-[18px]" />
          {n.label}
        </NavLink>
      ))}
      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <a
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-400 hover:bg-white/[0.04] hover:text-white"
        >
          <Icon name="external" className="h-[18px] w-[18px]" />
          Public website
        </a>
      </div>
    </nav>
  );

  const user = (
    <div className="flex items-center gap-3 border-t border-white/[0.06] p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white">
        {me.name?.[0]?.toUpperCase() ?? "A"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{me.name}</p>
        <p className="truncate text-xs text-ink-500">{me.email}</p>
      </div>
      <button
        onClick={() => void signOut()}
        title="Sign out"
        aria-label="Sign out"
        className="rounded-lg p-2 text-ink-400 transition hover:bg-white/[0.06] hover:text-white"
      >
        <Icon name="logout" className="h-[18px] w-[18px]" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-ink-950/95 backdrop-blur lg:flex">
        <div className="flex h-16 items-center border-b border-white/[0.06] px-5">
          <Logo />
        </div>
        {links}
        {user}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-ink-950/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-ink-300 hover:bg-white/[0.06]"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 top-14 z-20 border-b border-white/[0.06] bg-ink-950 shadow-2xl lg:hidden">
          {links}
          {user}
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
