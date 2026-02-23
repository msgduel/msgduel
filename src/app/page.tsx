"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { MOVE_EMOJI, MOVES } from "@/types";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-neon/20 rounded-full font-mono text-xs text-neon tracking-wider mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse-neon" />
            XMTP × x402 × BASE
          </div>

          {/* Mascot */}
          <div className="flex justify-center mb-8">
            <img src="/mascot.svg" alt="MsgDuel Gladiator" className="w-32 h-32 sm:w-40 sm:h-40 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" />
          </div>

          <h1 className="font-display text-6xl sm:text-8xl font-black leading-none tracking-wider mb-6">
            <span className="text-gradient-neon">MSG</span>
            <span className="text-gradient-fire">DUEL</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl font-light tracking-wide max-w-md mx-auto mb-10">
            1v1 Strategy Battles over XMTP. Evolving AI fighters. USDC prizes on Base.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/game" className="btn-fire text-base px-8 py-4">
              ⚔️ Enter Arena
            </Link>
            <Link href="/leaderboard" className="btn-neon text-base px-8 py-4">
              🏆 Leaderboard
            </Link>
          </div>

          {/* Move showcase */}
          <div className="flex justify-center gap-4 mt-16">
            {MOVES.map((move) => (
              <div
                key={move}
                className="w-14 h-14 flex items-center justify-center border border-arena-border text-2xl hover:border-neon hover:-translate-y-1 hover:shadow-lg hover:shadow-neon/10 transition-all cursor-default"
              >
                {MOVE_EMOJI[move]}
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mt-24 mb-16 w-full">
          {[
            { icon: "💬", title: "XMTP Powered", desc: "Battles run over XMTP encrypted messaging. Every match is a private group chat." },
            { icon: "🧬", title: "Evolving AI", desc: "Fighters learn from every match and develop unique fighting styles over time." },
            { icon: "💳", title: "x402 Payments", desc: "Entry fees, bets, and prizes settled via x402 micropayments on Base." },
            { icon: "🔐", title: "Anti-Cheat", desc: "Commit-reveal scheme ensures fair play. No peeking, no cheating." },
            { icon: "💰", title: "USDC Prizes", desc: "Win matches, earn USDC. Spectators bet on live matches with shifting odds." },
            { icon: "🏆", title: "ELO Rankings", desc: "Competitive rating system. Climb the leaderboard. Prove your strategy." },
          ].map((f) => (
            <div key={f.title} className="card-arena p-5">
              <span className="text-2xl block mb-3">{f.icon}</span>
              <h3 className="font-display text-sm font-bold tracking-wider mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
        {/* Powered by */}
        <div className="max-w-3xl mx-auto w-full mb-16">
          <p className="text-center font-mono text-xs text-slate-600 tracking-[0.3em] uppercase mb-4">Powered by</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: "XMTP", desc: "Messaging", color: "text-purple-400" },
              { name: "x402", desc: "Payments", color: "text-neon" },
              { name: "Base", desc: "Settlement", color: "text-blue-400" },
              { name: "GPT-4o", desc: "Fighter AI", color: "text-green-400" },
            ].map((s) => (
              <div key={s.name} className="card-arena p-3 text-center">
                <p className={`font-display text-sm font-bold tracking-wider ${s.color}`}>{s.name}</p>
                <p className="text-xs text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
