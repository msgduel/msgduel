"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/store";
import { MoveSelector } from "./MoveSelector";
import { MOVE_EMOJI } from "@/types";

export function BattleArena() {
  const { match, phase, playerMove, resultAnimation, selectMove, nextRound, resetMatch } = useGameStore();

  if (!match) return null;

  const p1 = match.player1;
  const p2 = match.player2;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Match Header */}
      <div className="card-arena p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs text-slate-500 tracking-wider">
            MATCH {match.id.slice(6).toUpperCase()} · ROUND {match.currentRound}/{match.totalRounds}
          </span>
          <span className="flex items-center gap-2 text-neon2 text-xs font-mono tracking-wider">
            <span className="w-2 h-2 rounded-full bg-neon2 animate-pulse-neon" />
            {match.status === "finished" ? "FINISHED" : "LIVE"}
          </span>
        </div>

        {/* Fighters */}
        <div className="grid grid-cols-3 items-center gap-4 my-6">
          <div className="text-center">
            <p className="font-display font-bold tracking-wider text-sm">{p1.name}</p>
            <p className="font-mono text-xs text-neon">{p1.rating} ELO</p>
            <p className="text-xs text-slate-500">{p1.archetype}</p>
          </div>
          <div className="text-center font-display text-3xl font-black text-gradient-fire">VS</div>
          <div className="text-center">
            <p className="font-display font-bold tracking-wider text-sm">{p2.name}</p>
            <p className="font-mono text-xs text-neon2">{p2.rating} ELO</p>
            <p className="text-xs text-slate-500">{p2.archetype}</p>
          </div>
        </div>

        {/* Score */}
        <div className="text-center font-display text-5xl font-black tracking-widest">
          <span className="text-neon">{match.score.p1}</span>
          <span className="text-slate-600 mx-2">:</span>
          <span className="text-neon2">{match.score.p2}</span>
        </div>

        {/* Round dots */}
        <div className="flex justify-center gap-2 mt-4">
          {match.rounds.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 flex items-center justify-center border text-sm
                ${r.winner === "player1" ? "border-neon bg-neon/10" : ""}
                ${r.winner === "player2" ? "border-neon2 bg-neon2/10" : ""}
                ${r.winner === "draw" ? "border-slate-600 bg-white/5" : ""}
              `}
            >
              {MOVE_EMOJI[r.p1Move]}
            </div>
          ))}
          {Array.from({ length: match.totalRounds - match.rounds.length }).map((_, i) => (
            <div key={`pending-${i}`} className="w-8 h-8 border border-arena-border opacity-30 flex items-center justify-center text-xs text-slate-600">
              {match.rounds.length + i + 1}
            </div>
          ))}
        </div>

        {/* Prize Pool */}
        <div className="text-center mt-4">
          <span className="font-mono text-xs text-slate-500">PRIZE POOL: </span>
          <span className="font-mono text-sm text-gold">${match.prizePool} USDC</span>
        </div>
      </div>

      {/* Round Result Animation */}
      <AnimatePresence>
        {(phase === "revealing" || phase === "result") && resultAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="card-arena p-6 text-center"
          >
            <div className="flex items-center justify-center gap-8 mb-4">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-5xl"
              >
                {MOVE_EMOJI[resultAnimation.p1Move]}
              </motion.div>
              <span className="font-display text-lg text-slate-500">VS</span>
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-5xl"
              >
                {MOVE_EMOJI[resultAnimation.p2Move]}
              </motion.div>
            </div>
            <p className={`font-display text-lg font-bold tracking-wider
              ${resultAnimation.winner === "player1" ? "text-neon" : ""}
              ${resultAnimation.winner === "player2" ? "text-neon2" : ""}
              ${resultAnimation.winner === "draw" ? "text-slate-400" : ""}
            `}>
              {resultAnimation.description}
            </p>
            <p className={`text-sm mt-1 font-mono
              ${resultAnimation.winner === "player1" ? "text-green-400" : ""}
              ${resultAnimation.winner === "player2" ? "text-red-400" : ""}
              ${resultAnimation.winner === "draw" ? "text-slate-500" : ""}
            `}>
              {resultAnimation.winner === "player1" ? "You win this round!" :
               resultAnimation.winner === "player2" ? "Opponent wins this round!" : "Draw!"}
            </p>

            {phase === "result" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={nextRound}
                className="btn-neon mt-4"
              >
                Next Round →
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match End */}
      {phase === "match_end" && match.winner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-arena p-8 text-center"
        >
          <p className="font-display text-2xl font-black tracking-wider mb-2">
            {match.winner === p1.address ? (
              <>
                <img src="/mascot.svg" alt="" className="w-16 h-16 mx-auto mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
                <span className="text-gradient-neon">🏆 VICTORY!</span>
              </>
            ) : (
              <span className="text-neon2">💀 DEFEAT</span>
            )}
          </p>
          <p className="text-slate-400 text-sm mb-1">
            Final Score: {match.score.p1} - {match.score.p2}
          </p>
          {match.winner === p1.address && (
            <p className="font-mono text-gold text-lg">
              +${(match.prizePool * 0.95).toFixed(2)} USDC
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => { resetMatch(); useGameStore.getState().startMatch(); }} className="btn-fire">
              Fight Again
            </button>
            <button onClick={resetMatch} className="btn-neon">
              Exit Arena
            </button>
          </div>
        </motion.div>
      )}

      {/* Move Selector */}
      {phase === "selecting" && (
        <MoveSelector onSelect={selectMove} disabled={false} selectedMove={playerMove} />
      )}
    </div>
  );
}
