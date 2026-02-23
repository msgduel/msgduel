"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { FighterCard } from "@/components/game/FighterCard";
import { supabase } from "@/lib/supabase";
import type { Fighter } from "@/types";
import { defaultStyle, getArchetype } from "@/lib/game-engine";

export default function LeaderboardPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("fighters")
        .select("*")
        .order("wins", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        setFighters(data.map((f: any) => ({
          address: f.address,
          name: f.name,
          isAI: f.is_ai,
          style: f.style ?? defaultStyle(),
          record: { wins: f.wins, losses: f.losses, draws: f.draws },
          rating: 1000 + (f.wins - f.losses) * 25,
          earnings: f.earnings ?? 0,
          archetype: f.archetype ?? getArchetype(f.style ?? defaultStyle()),
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <img src="/mascot.svg" alt="" className="w-14 h-14 opacity-70" />
            <div>
              <p className="font-mono text-xs text-neon tracking-[0.3em] uppercase mb-1">// Rankings</p>
              <h1 className="font-display text-3xl font-black tracking-wider">
                🏆 Leaderboard
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 mx-auto border-2 border-neon border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 mt-4 text-sm">Loading fighters...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fighters.map((fighter, i) => (
                <FighterCard key={fighter.address} fighter={fighter} rank={i + 1} />
              ))}
            </div>
          )}

          {!loading && fighters.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500">No fighters yet. Be the first to battle!</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
