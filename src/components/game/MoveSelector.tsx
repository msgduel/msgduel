"use client";

import { motion } from "framer-motion";
import { MOVES, MOVE_EMOJI, MOVE_NAMES, type Move } from "@/types";

interface MoveSelectorProps {
  onSelect: (move: Move) => void;
  disabled: boolean;
  selectedMove: Move | null;
}

const MOVE_COLORS: Record<Move, string> = {
  rock: "border-orange-500 hover:bg-orange-500/10 hover:shadow-orange-500/20",
  paper: "border-blue-400 hover:bg-blue-400/10 hover:shadow-blue-400/20",
  scissors: "border-red-400 hover:bg-red-400/10 hover:shadow-red-400/20",
  shield: "border-neon hover:bg-neon/10 hover:shadow-neon/20",
  feint: "border-neon3 hover:bg-neon3/10 hover:shadow-neon3/20",
};

const MOVE_TIPS: Record<Move, string> = {
  rock: "Beats Scissors & Feint",
  paper: "Beats Rock & Shield",
  scissors: "Beats Paper & Feint",
  shield: "Blocks Rock & Scissors",
  feint: "Outsmarts Paper & Shield",
};

export function MoveSelector({ onSelect, disabled, selectedMove }: MoveSelectorProps) {
  return (
    <div className="w-full">
      <p className="text-center text-slate-400 text-sm tracking-wider uppercase font-display mb-4">
        Choose Your Move
      </p>
      <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
        {MOVES.map((move, i) => (
          <motion.button
            key={move}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => !disabled && onSelect(move)}
            disabled={disabled}
            className={`
              flex flex-col items-center gap-2 p-4 border rounded-sm
              transition-all duration-300 cursor-pointer
              ${disabled ? "opacity-30 cursor-not-allowed" : MOVE_COLORS[move]}
              ${selectedMove === move ? "ring-2 ring-white bg-white/5" : ""}
              hover:-translate-y-1 hover:shadow-lg
            `}
          >
            <span className="text-3xl">{MOVE_EMOJI[move]}</span>
            <span className="font-display text-[0.65rem] tracking-widest uppercase">{MOVE_NAMES[move]}</span>
            <span className="text-[0.6rem] text-slate-500 hidden sm:block">{MOVE_TIPS[move]}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
