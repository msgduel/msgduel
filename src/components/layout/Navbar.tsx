"use client";

import Link from "next/link";
import { ConnectKitButton } from "connectkit";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-arena-bg/85 backdrop-blur-xl border-b border-arena-border">
      <Link href="/" className="flex items-center gap-2">
        <img src="/mascot.svg" alt="MsgDuel" className="w-8 h-8" />
        <span className="font-display text-xl font-black tracking-wider">
          <span className="text-gradient-neon">MSG</span>
          <span className="text-gradient-fire">DUEL</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/game" className="text-slate-400 font-medium text-sm tracking-wider uppercase hover:text-neon transition-colors">
          Arena
        </Link>
        <Link href="/leaderboard" className="text-slate-400 font-medium text-sm tracking-wider uppercase hover:text-neon transition-colors">
          Leaderboard
        </Link>
      </div>

      <ConnectKitButton />
    </nav>
  );
}
