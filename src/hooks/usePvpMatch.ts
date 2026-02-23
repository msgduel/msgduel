// ⚔️ PvP Match — Supabase Realtime game sync

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { resolveRound, checkMatchWinner, commitMove, verifyReveal } from "@/lib/game-engine";
import type { Move, RoundResult } from "@/types";

interface PvpMatchState {
  matchId: string;
  player1: string;
  player2: string;
  currentRound: number;
  totalRounds: number;
  scoreP1: number;
  scoreP2: number;
  status: string;
  winner: string | null;
}

interface RoundState {
  myCommit: string | null;
  mySalt: string | null;
  myMove: Move | null;
  opponentCommitted: boolean;
  opponentMove: Move | null;
  phase: "waiting" | "committing" | "revealing" | "resolved";
}

export function usePvpMatch(matchId: string | null, playerAddress: string | undefined) {
  const [matchState, setMatchState] = useState<PvpMatchState | null>(null);
  const [roundState, setRoundState] = useState<RoundState>({
    myCommit: null, mySalt: null, myMove: null,
    opponentCommitted: false, opponentMove: null, phase: "waiting",
  });
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const isPlayer1 = matchState?.player1 === playerAddress;

  // Load match from DB
  const loadMatch = useCallback(async () => {
    if (!matchId) return;

    const { data, error: err } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (err || !data) {
      setError("Match not found");
      return;
    }

    setMatchState({
      matchId: data.id,
      player1: data.player1,
      player2: data.player2,
      currentRound: data.current_round,
      totalRounds: data.total_rounds,
      scoreP1: data.score_p1,
      scoreP2: data.score_p2,
      status: data.status,
      winner: data.winner,
    });

    // Load existing rounds
    const { data: roundsData } = await supabase
      .from("rounds")
      .select("*")
      .eq("match_id", matchId)
      .order("round_number", { ascending: true });

    if (roundsData) {
      setRounds(roundsData.map((r: any) => ({
        roundNumber: r.round_number,
        p1Move: r.p1_move as Move,
        p2Move: r.p2_move as Move,
        winner: r.winner as RoundResult["winner"],
        description: r.description,
      })));
    }
  }, [matchId]);

  // Subscribe to match updates
  useEffect(() => {
    if (!matchId || !playerAddress) return;

    loadMatch();

    const channel = supabase
      .channel(`match-${matchId}`)
      // Match state updates
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "matches",
        filter: `id=eq.${matchId}`,
      }, (payload: any) => {
        const d = payload.new;
        setMatchState((prev) => prev ? {
          ...prev,
          currentRound: d.current_round,
          scoreP1: d.score_p1,
          scoreP2: d.score_p2,
          status: d.status,
          winner: d.winner,
        } : null);
      })
      // Round updates (commits and reveals)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "rounds",
        filter: `match_id=eq.${matchId}`,
      }, (payload: any) => {
        const r = payload.new;
        if (!r) return;

        const amP1 = isPlayer1;
        const opponentCommitCol = amP1 ? "p2_commit" : "p1_commit";
        const opponentMoveCol = amP1 ? "p2_move" : "p1_move";

        // Check if opponent committed
        if (r[opponentCommitCol] && !r[opponentMoveCol]) {
          setRoundState((prev) => ({ ...prev, opponentCommitted: true }));
        }

        // Check if round resolved
        if (r.p1_move && r.p2_move && r.winner) {
          const result: RoundResult = {
            roundNumber: r.round_number,
            p1Move: r.p1_move,
            p2Move: r.p2_move,
            winner: r.winner,
            description: r.description,
          };
          setRounds((prev) => {
            const exists = prev.find((x) => x.roundNumber === r.round_number);
            return exists ? prev : [...prev, result];
          });
          setRoundState({
            myCommit: null, mySalt: null, myMove: null,
            opponentCommitted: false, opponentMove: null, phase: "resolved",
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [matchId, playerAddress]);

  // Commit my move
  const commitMyMove = useCallback(async (move: Move) => {
    if (!matchId || !matchState || !playerAddress) return;

    const { hash, salt } = commitMove(move);
    const amP1 = matchState.player1 === playerAddress;
    const commitCol = amP1 ? "p1_commit" : "p2_commit";

    // Check if round row exists, create if not
    const { data: existing } = await supabase
      .from("rounds")
      .select("id")
      .eq("match_id", matchId)
      .eq("round_number", matchState.currentRound)
      .single();

    if (!existing) {
      await supabase.from("rounds").insert({
        match_id: matchId,
        round_number: matchState.currentRound,
        [commitCol]: hash,
      });
    } else {
      await supabase
        .from("rounds")
        .update({ [commitCol]: hash })
        .eq("match_id", matchId)
        .eq("round_number", matchState.currentRound);
    }

    setRoundState((prev) => ({
      ...prev,
      myCommit: hash,
      mySalt: salt,
      myMove: move,
      phase: "committing",
    }));
  }, [matchId, matchState, playerAddress]);

  // Reveal my move (after both committed)
  const revealMyMove = useCallback(async () => {
    if (!matchId || !matchState || !playerAddress || !roundState.myMove || !roundState.mySalt) return;

    const amP1 = matchState.player1 === playerAddress;
    const moveCol = amP1 ? "p1_move" : "p2_move";

    await supabase
      .from("rounds")
      .update({ [moveCol]: roundState.myMove })
      .eq("match_id", matchId)
      .eq("round_number", matchState.currentRound);

    setRoundState((prev) => ({ ...prev, phase: "revealing" }));

    // Check if both revealed — resolve round
    const { data: roundData } = await supabase
      .from("rounds")
      .select("*")
      .eq("match_id", matchId)
      .eq("round_number", matchState.currentRound)
      .single();

    if (roundData?.p1_move && roundData?.p2_move) {
      await resolveAndUpdate(roundData);
    }
  }, [matchId, matchState, playerAddress, roundState]);

  // Resolve round and update match
  const resolveAndUpdate = async (roundData: any) => {
    if (!matchState) return;

    const result = resolveRound(roundData.p1_move, roundData.p2_move, roundData.round_number);

    // Update round with result
    await supabase
      .from("rounds")
      .update({ winner: result.winner, description: result.description })
      .eq("match_id", matchState.matchId)
      .eq("round_number", roundData.round_number);

    // Update match score
    const newP1 = matchState.scoreP1 + (result.winner === "player1" ? 1 : 0);
    const newP2 = matchState.scoreP2 + (result.winner === "player2" ? 1 : 0);
    const matchWinner = checkMatchWinner(newP1, newP2, matchState.totalRounds);
    const isLastRound = roundData.round_number >= matchState.totalRounds;
    const isOver = !!matchWinner || isLastRound;

    const updates: any = {
      score_p1: newP1,
      score_p2: newP2,
      current_round: isOver ? roundData.round_number : roundData.round_number + 1,
    };

    if (isOver) {
      updates.status = "finished";
      updates.finished_at = new Date().toISOString();
      updates.winner = matchWinner
        ? matchWinner === "player1" ? matchState.player1 : matchState.player2
        : newP1 > newP2 ? matchState.player1
        : newP2 > newP1 ? matchState.player2
        : null;

      // Update fighter records
      if (updates.winner) {
        const loser = updates.winner === matchState.player1 ? matchState.player2 : matchState.player1;
        await supabase.rpc("increment_wins", { player_addr: updates.winner });
        await supabase.rpc("increment_losses", { player_addr: loser });
      }
    }

    await supabase
      .from("matches")
      .update(updates)
      .eq("id", matchState.matchId);
  };

  // Auto-reveal when both committed
  useEffect(() => {
    if (roundState.phase === "committing" && roundState.opponentCommitted && roundState.myCommit) {
      revealMyMove();
    }
  }, [roundState.opponentCommitted, roundState.phase]);

  // Reset round state for next round
  const nextRound = useCallback(() => {
    setRoundState({
      myCommit: null, mySalt: null, myMove: null,
      opponentCommitted: false, opponentMove: null, phase: "waiting",
    });
  }, []);

  return {
    matchState,
    roundState,
    rounds,
    error,
    isPlayer1,
    commitMyMove,
    revealMyMove,
    nextRound,
    loadMatch,
  };
}
