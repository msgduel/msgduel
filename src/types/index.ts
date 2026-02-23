// ⚔️ MsgDuel Types

export type Move = "rock" | "paper" | "scissors" | "shield" | "feint";

export interface Fighter {
  address: string;
  name: string;
  isAI: boolean;
  style: Record<Move, number>;
  record: { wins: number; losses: number; draws: number };
  rating: number;
  earnings: number;
  archetype: string;
}

export interface Match {
  id: string;
  player1: Fighter;
  player2: Fighter;
  currentRound: number;
  totalRounds: number;
  score: { p1: number; p2: number };
  rounds: RoundResult[];
  status: "waiting" | "ready" | "committing" | "revealing" | "resolved" | "finished";
  entryFee: number;
  prizePool: number;
  bets: Bet[];
  winner: string | null;
  createdAt: number;
}

export interface RoundResult {
  roundNumber: number;
  p1Move: Move;
  p2Move: Move;
  winner: "player1" | "player2" | "draw";
  description: string;
}

export interface Bet {
  id: string;
  matchId: string;
  bettorAddress: string;
  backedPlayer: "player1" | "player2";
  amount: number;
  odds: number;
  status: "active" | "won" | "lost";
}

export interface BettingOdds {
  player1Odds: number;
  player2Odds: number;
  totalPool: number;
}

export const MOVES: Move[] = ["rock", "paper", "scissors", "shield", "feint"];

export const MOVE_EMOJI: Record<Move, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
  shield: "🛡️",
  feint: "👻",
};

export const MOVE_NAMES: Record<Move, string> = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
  shield: "Shield",
  feint: "Feint",
};
