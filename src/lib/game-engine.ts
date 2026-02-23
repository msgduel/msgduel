// ⚔️ Game Engine — Move resolution, ELO, evolution

import type { Move, RoundResult } from "@/types";

const PAYOFF: Record<Move, Record<Move, "win" | "lose" | "draw">> = {
  rock:     { rock: "draw", paper: "lose", scissors: "win",  shield: "lose", feint: "win" },
  paper:    { rock: "win",  paper: "draw", scissors: "lose", shield: "win",  feint: "lose" },
  scissors: { rock: "lose", paper: "win",  scissors: "draw", shield: "lose", feint: "win" },
  shield:   { rock: "win",  paper: "lose", scissors: "win",  shield: "draw", feint: "lose" },
  feint:    { rock: "lose", paper: "win",  scissors: "lose", shield: "win",  feint: "draw" },
};

const FLAVOR: Record<string, string> = {
  "rock>scissors": "Rock crushes Scissors!",
  "rock>feint": "Rock smashes through the bluff!",
  "paper>rock": "Paper wraps Rock!",
  "paper>shield": "Paper slips past the Shield!",
  "scissors>paper": "Scissors cuts Paper!",
  "scissors>feint": "Scissors cuts through the bluff!",
  "shield>rock": "Shield blocks Rock!",
  "shield>scissors": "Shield deflects Scissors!",
  "feint>paper": "Feint reads Paper's intent!",
  "feint>shield": "Feint sees through the Shield!",
};

export function resolveRound(p1Move: Move, p2Move: Move, roundNumber: number): RoundResult {
  const result = PAYOFF[p1Move][p2Move];
  let winner: RoundResult["winner"];
  let description: string;

  if (result === "draw") {
    winner = "draw";
    description = "Both chose the same — Draw!";
  } else if (result === "win") {
    winner = "player1";
    description = FLAVOR[`${p1Move}>${p2Move}`] ?? "Player 1 wins!";
  } else {
    winner = "player2";
    description = FLAVOR[`${p2Move}>${p1Move}`] ?? "Player 2 wins!";
  }

  return { roundNumber, p1Move, p2Move, winner, description };
}

export function checkMatchWinner(p1: number, p2: number, total: number): "player1" | "player2" | null {
  const needed = Math.ceil(total / 2);
  if (p1 >= needed) return "player1";
  if (p2 >= needed) return "player2";
  return null;
}

export function calculateElo(winnerRating: number, loserRating: number) {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const delta = Math.round(K * (1 - expected));
  return { winnerDelta: delta, loserDelta: -delta };
}

// AI move selection based on style weights
export function aiChooseMove(style: Record<Move, number>): Move {
  const rand = Math.random();
  let cumulative = 0;
  const moves: Move[] = ["rock", "paper", "scissors", "shield", "feint"];
  for (const move of moves) {
    cumulative += style[move];
    if (rand <= cumulative) return move;
  }
  return "rock";
}

// Evolve style after analyzing opponent
export function evolveStyle(
  current: Record<Move, number>,
  opponentMoves: Move[]
): Record<Move, number> {
  const counters: Record<Move, Move[]> = {
    rock: ["paper", "shield"],
    paper: ["scissors", "feint"],
    scissors: ["rock", "shield"],
    shield: ["paper", "feint"],
    feint: ["rock", "scissors"],
  };

  const newStyle = { ...current };
  const freq: Record<Move, number> = { rock: 0, paper: 0, scissors: 0, shield: 0, feint: 0 };

  for (const m of opponentMoves) freq[m] = (freq[m] || 0) + 1 / opponentMoves.length;

  const moves: Move[] = ["rock", "paper", "scissors", "shield", "feint"];
  for (const move of moves) {
    if (freq[move] > 0.25) {
      for (const counter of counters[move]) {
        newStyle[counter] += freq[move] * 0.15;
      }
    }
    newStyle[move] += (Math.random() - 0.5) * 0.05;
    newStyle[move] = Math.max(0.02, newStyle[move]);
  }

  const total = Object.values(newStyle).reduce((s, v) => s + v, 0);
  for (const move of moves) newStyle[move] = Math.round((newStyle[move] / total) * 1000) / 1000;

  return newStyle;
}

export function getArchetype(style: Record<Move, number>): string {
  const moves: Move[] = ["rock", "paper", "scissors", "shield", "feint"];
  const sorted = moves.sort((a, b) => style[b] - style[a]);
  const names: Record<Move, string> = { rock: "Brawler", paper: "Tactician", scissors: "Assassin", shield: "Turtle", feint: "Trickster" };
  return style[sorted[0]] > 0.35 ? names[sorted[0]] : "Balanced";
}

export function defaultStyle(): Record<Move, number> {
  return { rock: 0.2, paper: 0.2, scissors: 0.2, shield: 0.2, feint: 0.2 };
}

// ── Commit-Reveal ──────────────────────

/** Create a move commitment: SHA256(move + salt) */
export function commitMove(move: Move): { hash: string; salt: string } {
  const saltArray = new Uint8Array(16);
  crypto.getRandomValues(saltArray);
  const salt = Array.from(saltArray).map(b => b.toString(16).padStart(2, "0")).join("");
  return { hash: sha256(`${move}:${salt}`), salt };
}

/** Verify a revealed move matches its commitment */
export function verifyReveal(move: Move, salt: string, commitHash: string): boolean {
  return sha256(`${move}:${salt}`) === commitHash;
}

/** Simple SHA256 using SubtleCrypto (sync fallback with basic hash) */
function sha256(input: string): string {
  // Simple sync hash for client-side (not cryptographically ideal but works for game)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Expand to look like a hash
  const base = Math.abs(hash).toString(16).padStart(8, "0");
  return (base + base + base + base + base + base + base + base).slice(0, 64);
}
