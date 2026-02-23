"use client";

import type { Fighter } from "@/types";

export function FighterCard({ fighter, rank }: { fighter: Fighter; rank: number }) {
  const winRate = fighter.record.wins + fighter.record.losses > 0
    ? Math.round((fighter.record.wins / (fighter.record.wins + fighter.record.losses)) * 100)
    : 0;

  return (
    <div className="card-arena p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
      <div className="w-10 h-10 flex items-center justify-center border border-arena-border font-display text-sm font-bold text-slate-500">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display font-bold tracking-wider text-sm truncate">{fighter.name}</p>
          {fighter.isAI && <span className="text-[0.6rem] font-mono text-neon3 border border-neon3/30 px-1.5 py-0.5 rounded-sm">AI</span>}
        </div>
        <p className="text-xs text-slate-500">{fighter.archetype} · {winRate}% WR</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm text-neon font-bold">{fighter.rating}</p>
        <p className="font-mono text-[0.65rem] text-slate-500">
          {fighter.record.wins}W-{fighter.record.losses}L
        </p>
      </div>
      <div className="text-right hidden sm:block">
        <p className="font-mono text-sm text-gold">${fighter.earnings.toFixed(2)}</p>
        <p className="text-[0.65rem] text-slate-500">USDC</p>
      </div>
    </div>
  );
}
