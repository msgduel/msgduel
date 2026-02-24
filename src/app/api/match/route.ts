// ⚔️ Match API — Server-side match management + AUTO PAYOUT

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { nanoid } from "nanoid";

import { arenaWalletClient } from "@/lib/arenaWallet";
import { payPrize } from "@/lib/payments";

/* ===============================
   🧠 Helper: Calculate Winner
================================ */
function calculateWinner(rounds: any[], player1: string, player2: string) {
  let p1Score = 0;
  let p2Score = 0;

  const winMap: any = {
    rock: "scissors",
    scissors: "paper",
    paper: "rock",
  };

  for (const r of rounds) {
    if (!r.p1_move || !r.p2_move) continue;
    if (r.p1_move === r.p2_move) continue;

    if (winMap[r.p1_move] === r.p2_move) p1Score++;
    else p2Score++;
  }

  return p1Score >= p2Score ? player1 : player2;
}

/* ===============================
   POST — Create / Moves / Reveal
================================ */
export async function POST(req: Request) {
  const db = getServiceClient();
  const body = await req.json();
  const { action } = body;

  switch (action) {
    /* ===============================
       CREATE MATCH
    ================================= */
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
        paid: false,
      });

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ matchId, status: "ready" });
    }

    /* ===============================
       SUBMIT COMMIT
    ================================= */
    case "submit_move": {
      const { matchId, playerAddress, roundNumber, commitHash } = body;

      const { data: match } = await db
        .from("matches")
        .select("player1,player2")
        .eq("id", matchId)
        .single();

      if (!match)
        return NextResponse.json({ error: "Match not found" }, { status: 404 });

      const col = match.player1 === playerAddress ? "p1_commit" : "p2_commit";

      const { data: existing } = await db
        .from("rounds")
        .select("id")
        .eq("match_id", matchId)
        .eq("round_number", roundNumber)
        .single();

      if (existing) {
        await db
          .from("rounds")
          .update({ [col]: commitHash })
          .eq("match_id", matchId)
          .eq("round_number", roundNumber);
      } else {
        await db.from("rounds").insert({
          match_id: matchId,
          round_number: roundNumber,
          [col]: commitHash,
        });
      }

      return NextResponse.json({ ok: true });
    }

    /* ===============================
       REVEAL MOVE + AUTO PAYOUT
    ================================= */
    case "reveal_move": {
      const { matchId, playerAddress, roundNumber, move } = body;

      const { data: match } = await db
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!match)
        return NextResponse.json({ error: "Match not found" }, { status: 404 });

      const col = match.player1 === playerAddress ? "p1_move" : "p2_move";

      await db
        .from("rounds")
        .update({ [col]: move })
        .eq("match_id", matchId)
        .eq("round_number", roundNumber);

      /* ===============================
         AUTO FINISH MATCH
      ================================= */
      const { data: rounds } = await db
        .from("rounds")
        .select("*")
        .eq("match_id", matchId);

      const allRevealed = rounds?.every(r => r.p1_move && r.p2_move);

      if (allRevealed && !match.paid) {
        const winner = calculateWinner(rounds, match.player1, match.player2);

        try {
          const txHash = await payPrize(
            arenaWalletClient,
            winner,
            match.prize_pool
          );

          await db.from("matches").update({
            status: "finished",
            winner,
            payout_tx: txHash,
            paid: true,
          }).eq("id", matchId);

        } catch (err) {
          console.error("Payout error:", err);
        }
      }

      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

/* ===============================
   GET — Match State
================================ */
export async function GET(req: Request) {
  const db = getServiceClient();
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("id");

  if (!matchId) {
    const { data } = await db
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ matches: data ?? [] });
  }

  const { data: match } = await db
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  const { data: rounds } = await db
    .from("rounds")
    .select("*")
    .eq("match_id", matchId)
    .order("round_number");

  return NextResponse.json({ match, rounds: rounds ?? [] });
        }      const col = match.player1 === playerAddress ? "p1_commit" : "p2_commit";
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
