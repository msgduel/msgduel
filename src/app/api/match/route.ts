// ⚔️ Match API — Server-side match management

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { nanoid } from "nanoid";

// POST — Create match or submit move
export async function POST(req: Request) {
  const db = getServiceClient();
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "create": {
      const { player1, player2, entryFee, totalRounds } = body;
      const matchId = `match-${nanoid(8)}`;

      const { error } = await db.from("matches").insert({
        id: matchId,
        player1,
        player2,
        total_rounds: totalRounds ?? 5,
        entry_fee: entryFee ?? 1,
        prize_pool: (entryFee ?? 1) * 2,
        status: "ready",
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ matchId, status: "ready" });
    }

    case "submit_move": {
      const { matchId, playerAddress, roundNumber, commitHash } = body;
      const { data: match } = await db.from("matches").select("player1,player2").eq("id", matchId).single();
      if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

      const col = match.player1 === playerAddress ? "p1_commit" : "p2_commit";
      const { data: existing } = await db.from("rounds").select("id").eq("match_id", matchId).eq("round_number", roundNumber).single();

      if (existing) {
        await db.from("rounds").update({ [col]: commitHash }).eq("match_id", matchId).eq("round_number", roundNumber);
      } else {
        await db.from("rounds").insert({ match_id: matchId, round_number: roundNumber, [col]: commitHash });
      }
      return NextResponse.json({ ok: true });
    }

    case "reveal_move": {
      const { matchId, playerAddress, roundNumber, move } = body;
      const { data: match } = await db.from("matches").select("player1,player2").eq("id", matchId).single();
      if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

      const col = match.player1 === playerAddress ? "p1_move" : "p2_move";
      await db.from("rounds").update({ [col]: move }).eq("match_id", matchId).eq("round_number", roundNumber);
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

// GET — match state
export async function GET(req: Request) {
  const db = getServiceClient();
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("id");

  if (!matchId) {
    const { data } = await db.from("matches").select("*").order("created_at", { ascending: false }).limit(20);
    return NextResponse.json({ matches: data ?? [] });
  }

  const { data: match } = await db.from("matches").select("*").eq("id", matchId).single();
  const { data: rounds } = await db.from("rounds").select("*").eq("match_id", matchId).order("round_number");
  return NextResponse.json({ match, rounds: rounds ?? [] });
}
