// ⚔️ Payment API — Verify entry fees, process payouts

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const db = getServiceClient();
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "verify_entry": {
      const { matchId, playerAddress, txHash } = body;

      // In production: verify tx on-chain via Base RPC
      // For now, trust the client and mark as paid
      // TODO: Use viem publicClient.waitForTransactionReceipt(txHash) to verify

      const { data: match } = await db.from("matches").select("*").eq("id", matchId).single();
      if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

      // Update match status
      const bothPaid = match.status === "ready"; // simplified
      if (bothPaid) {
        await db.from("matches").update({ status: "in_progress" }).eq("id", matchId);
      }

      return NextResponse.json({ ok: true, verified: true, matchStatus: bothPaid ? "in_progress" : "ready" });
    }

    case "payout": {
      const { matchId } = body;

      const { data: match } = await db.from("matches").select("*").eq("id", matchId).single();
      if (!match || match.status !== "finished" || !match.winner) {
        return NextResponse.json({ error: "Match not finished or no winner" }, { status: 400 });
      }

      const houseFee = parseFloat(process.env.NEXT_PUBLIC_HOUSE_FEE ?? "5") / 100;
      const prizeAmount = match.prize_pool * (1 - houseFee);

      // TODO: Execute USDC transfer from arena wallet to winner
      // const txHash = await payPrize(arenaWalletClient, match.winner, prizeAmount);

      // Update fighter earnings
      await db
        .from("fighters")
        .update({ earnings: prizeAmount }) // In production: increment, not set
        .eq("address", match.winner);

      return NextResponse.json({
        ok: true,
        winner: match.winner,
        prize: prizeAmount,
        // txHash,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
