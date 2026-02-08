"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 border-b backdrop-blur" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CloakSwap RWA"
                className="w-auto h-8"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-lg " style={{ color: 'var(--muted)' }}>CloakSwap</span>
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--btn)' }}>RWA</span>
              </div>
            </Link>
            <nav className="flex gap-4 text-sm" style={{ color: 'var(--muted)' }}>
              <Link href="/explore" className={`hover:opacity-80 ${pathname === "/explore" ? "font-medium" : ""}`} style={{ color: pathname === "/explore" ? 'var(--text)' : 'var(--muted)' }}>Explore</Link>
              <Link href="/trade" className={`hover:opacity-80 ${pathname === "/trade" ? "font-medium" : ""}`} style={{ color: pathname === "/trade" ? 'var(--text)' : 'var(--muted)' }}>Trade</Link>
              <Link href="/verify" className={`hover:opacity-80 ${pathname === "/verify" ? "font-medium" : ""}`} style={{ color: pathname === "/verify" ? 'var(--text)' : 'var(--muted)' }}>Get Verified</Link>
              <Link href="/profile" className={`hover:opacity-80 ${pathname === "/profile" ? "font-medium" : ""}`} style={{ color: pathname === "/profile" ? 'var(--text)' : 'var(--muted)' }}>Profile</Link>
              <Link href="/deposit" className={`hover:opacity-80 ${pathname === "/deposit" ? "font-medium" : ""}`} style={{ color: pathname === "/deposit" ? 'var(--text)' : 'var(--muted)' }}>Deposit</Link>
              <Link href="/docs" className={`hover:opacity-80 ${pathname === "/docs" ? "font-medium" : ""}`} style={{ color: pathname === "/docs" ? 'var(--text)' : 'var(--muted)' }}>Docs</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

      <footer className="border-t mt-12 py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs" style={{ color: 'var(--label)' }}>
          Built for hackathon demo — stores ciphertext only; shows pass/fail only.
        </div>
      </footer>
    </div>
  );
}
