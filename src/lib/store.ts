// ⚔️ Game Store — Zustand (no ELO, simplified)

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Match, Fighter, Move, RoundResult } from "@/types";
import { resolveRound, checkMatchWinner, aiChooseMove, evolveStyle, getArchetype, defaultStyle } from "@/lib/game-engine";

interface GameState {
  match: Match | null;
  playerMove: Move | null;
  phase: "idle" | "selecting" | "revealing" | "result" | "match_end";
  resultAnimation: RoundResult | null;
  playerFighter: Fighter | null;

  initPlayer: (address: string, name: string) => void;
  startMatch: (vsAI?: boolean) => void;
  selectMove: (move: Move) => void;
  nextRound: () => void;
  resetMatch: () => void;
}

const createAIFighter = (): Fighter => {
  const names = ["Gladiator-X", "Shadow-V", "Iron-Fist", "Ghost-0", "Razor-7", "Phantom-K", "Viper-Z", "Blaze-Q"];
  const name = names[Math.floor(Math.random() * names.length)];
  const style = defaultStyle();
  const moves: Move[] = ["rock", "paper", "scissors", "shield", "feint"];
  const bias = moves[Math.floor(Math.random() * moves.length)];
  style[bias] += 0.15;
  const total = Object.values(style).reduce((s, v) => s + v, 0);
  for (const m of moves) style[m] = Math.round((style[m] / total) * 1000) / 1000;

  return {
    address: `0xAI${nanoid(8)}`,
    name,
    isAI: true,
    style,
    record: { wins: Math.floor(Math.random() * 20), losses: Math.floor(Math.random() * 15), draws: 0 },
    rating: 0,
    earnings: Math.round(Math.random() * 50 * 100) / 100,
    archetype: getArchetype(style),
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  match: null,
  playerMove: null,
  phase: "idle",
  resultAnimation: null,
  playerFighter: null,

  initPlayer: (address, name) => {
    if (get().playerFighter?.address === address) return;
    set({
      playerFighter: {
        address, name, isAI: false,
        style: defaultStyle(),
        record: { wins: 0, losses: 0, draws: 0 },
        rating: 0, earnings: 0, archetype: "Balanced",
      },
    });
  },

  startMatch: (vsAI = true) => {
    const { playerFighter } = get();
    if (!playerFighter) return;

    const opponent = createAIFighter();
    const entryFee = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE ?? "1");
    const totalRounds = parseInt(process.env.NEXT_PUBLIC_ROUNDS ?? "5");

    set({
      match: {
        id: `match-${nanoid(8)}`,
        player1: playerFighter,
        player2: opponent,
        currentRound: 1,
        totalRounds,
        score: { p1: 0, p2: 0 },
        rounds: [],
        status: "ready",
        entryFee,
        prizePool: entryFee * 2,
        bets: [],
        winner: null,
        createdAt: Date.now(),
      },
      phase: "selecting",
      playerMove: null,
      resultAnimation: null,
    });
  },

  selectMove: (move) => {
    const { match } = get();
    if (!match || get().phase !== "selecting") return;

    const aiMove = aiChooseMove(match.player2.style);
    const result = resolveRound(move, aiMove, match.currentRound);
    const newScore = { ...match.score };
    if (result.winner === "player1") newScore.p1++;
    else if (result.winner === "player2") newScore.p2++;

    const newRounds = [...match.rounds, result];
    const matchWinner = checkMatchWinner(newScore.p1, newScore.p2, match.totalRounds);
    const isOver = !!matchWinner || match.currentRound >= match.totalRounds;

    set({ playerMove: move, phase: "revealing", resultAnimation: result });

    setTimeout(() => {
      const updatedMatch: Match = {
        ...match,
        score: newScore,
        rounds: newRounds,
        currentRound: match.currentRound + (isOver ? 0 : 1),
        status: isOver ? "finished" : "ready",
        winner: matchWinner
          ? matchWinner === "player1" ? match.player1.address : match.player2.address
          : match.currentRound >= match.totalRounds
            ? newScore.p1 > newScore.p2 ? match.player1.address
              : newScore.p2 > newScore.p1 ? match.player2.address
              : null
            : null,
      };

      if (isOver) {
        const { playerFighter } = get();
        if (playerFighter) {
          const won = updatedMatch.winner === playerFighter.address;
          const opponentMoves = newRounds.map((r) => r.p2Move);
          const newStyle = evolveStyle(playerFighter.style, opponentMoves);

          set({
            playerFighter: {
              ...playerFighter,
              record: {
                wins: playerFighter.record.wins + (won ? 1 : 0),
                losses: playerFighter.record.losses + (won ? 0 : 1),
                draws: playerFighter.record.draws + (!updatedMatch.winner ? 1 : 0),
              },
              earnings: playerFighter.earnings + (won ? updatedMatch.prizePool * 0.95 : 0),
              style: newStyle,
              archetype: getArchetype(newStyle),
            },
          });
        }
        set({ match: updatedMatch, phase: "match_end" });
      } else {
        set({ match: updatedMatch, phase: "result" });
      }
    }, 1500);
  },

  nextRound: () => set({ phase: "selecting", playerMove: null, resultAnimation: null }),
  resetMatch: () => set({ match: null, phase: "idle", playerMove: null, resultAnimation: null }),
}));
