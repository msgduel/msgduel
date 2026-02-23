// ⚔️ Matchmaking — Supabase Realtime queue

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import type { Match } from "@/types";

export type QueueStatus = "idle" | "searching" | "found" | "error";

export function useMatchmaking(playerAddress: string | undefined) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>("idle");
  const [match, setMatch] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  // Register fighter if not exists
  const ensureFighter = useCallback(async () => {
    if (!playerAddress) return;
    const { data } = await supabase
      .from("fighters")
      .select("address")
      .eq("address", playerAddress)
      .single();

    if (!data) {
      await supabase.from("fighters").insert({
        address: playerAddress,
        name: `Fighter-${playerAddress.slice(0, 6)}`,
        is_ai: false,
      });
    } else {
      await supabase
        .from("fighters")
        .update({ last_seen: new Date().toISOString() })
        .eq("address", playerAddress);
    }
  }, [playerAddress]);

  // Join matchmaking queue
  const joinQueue = useCallback(async () => {
    if (!playerAddress) return;
    setQueueStatus("searching");
    setError(null);

    await ensureFighter();

    // Check if someone is already waiting
    const { data: waiting } = await supabase
      .from("matchmaking")
      .select("*")
      .eq("status", "waiting")
      .neq("player_address", playerAddress)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (waiting) {
      // Found opponent — create match
      const matchId = `match-${nanoid(8)}`;
      const entryFee = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE ?? "1");
      const totalRounds = parseInt(process.env.NEXT_PUBLIC_ROUNDS ?? "5");

      const { error: matchErr } = await supabase.from("matches").insert({
        id: matchId,
        player1: waiting.player_address,
        player2: playerAddress,
        total_rounds: totalRounds,
        entry_fee: entryFee,
        prize_pool: entryFee * 2,
        status: "ready",
      });

      if (matchErr) {
        setError("Failed to create match");
        setQueueStatus("error");
        return;
      }

      // Update both queue entries
      await supabase
        .from("matchmaking")
        .update({ status: "matched", matched_with: playerAddress, match_id: matchId })
        .eq("id", waiting.id);

      setMatch({ id: matchId, player1: waiting.player_address, player2: playerAddress });
      setQueueStatus("found");
    } else {
      // No one waiting — add self to queue
      await supabase.from("matchmaking").insert({
        player_address: playerAddress,
        entry_fee: parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE ?? "1"),
        status: "waiting",
      });

      // Listen for match via Realtime
      const channel = supabase
        .channel("matchmaking-" + playerAddress)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "matchmaking",
            filter: `player_address=eq.${playerAddress}`,
          },
          (payload: any) => {
            if (payload.new.status === "matched" && payload.new.match_id) {
              setMatch({
                id: payload.new.match_id,
                player1: playerAddress,
                player2: payload.new.matched_with,
              });
              setQueueStatus("found");
              channel.unsubscribe();
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    }
  }, [playerAddress, ensureFighter]);

  // Leave queue
  const leaveQueue = useCallback(async () => {
    if (!playerAddress) return;

    await supabase
      .from("matchmaking")
      .update({ status: "cancelled" })
      .eq("player_address", playerAddress)
      .eq("status", "waiting");

    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    setQueueStatus("idle");
    setMatch(null);
  }, [playerAddress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    queueStatus,
    match,
    error,
    joinQueue,
    leaveQueue,
  };
}
