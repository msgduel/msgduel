// ⚔️ Payment API — Entry verification + accounting (AUTO PAYOUT handled in match router)

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

/* ===============================
   Public client for Base chain
================================ */
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function POST(req: Request) {
  const db = getServiceClient();
  const body = await req.json();
  const { action } = body;

  switch (action) {
    /* =====================================
       VERIFY ENTRY FEE TX (ONCHAIN)
    ===================================== */
    case "verify_entry": {
      const { matchId, playerAddress, txHash } = body;

      if (!matchId || !txHash) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
      }

      // 🔹 Verify transaction exists on chain
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        if (!receipt || receipt.status !== "success") {
          return NextResponse.json({ error: "TX failed" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "TX not found" }, { status: 400 });
      }

      // 🔹 Get match
      const { data: match } = await db
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!match)
        return NextResponse.json({ error: "Match not found" }, { status: 404 });

      // 🔹 Mark player as paid
      const field =
        match.player1 === playerAddress ? "p1_paid" : "p2_paid";

      await db
        .from("matches")
        .update({ [field]: true })
        .eq("id", matchId);

      // 🔹 Check if both players paid
      const bothPaid =
        (match.p1_paid || field === "p1_paid") &&
        (match.p2_paid || field === "p2_paid");

      if (bothPaid) {
        await db
          .from("matches")
          .update({ status: "in_progress" })
          .eq("id", matchId);
      }

      return NextResponse.json({
        ok: true,
        verified: true,
        matchStatus: bothPaid ? "in_progress" : "waiting_payment",
      });
    }

    /* =====================================
       ACCOUNTING ONLY (NO TRANSFER HERE)
    ===================================== */
    case "record_win": {
      const { matchId } = body;

      const { data: match } = await db
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!match || !match.paid) {
        return NextResponse.json(
          { error: "Payout not completed yet" },
          { status: 400 }
        );
      }

      const houseFee =
        parseFloat(process.env.HOUSE_FEE ?? "5") / 100;

      const netPrize = match.prize_pool * (1 - houseFee);

      // 🔹 Increment fighter earnings
      await db.rpc("increment_earnings", {
        addr: match.winner,
        amount: netPrize,
      });

      return NextResponse.json({
        ok: true,
        winner: match.winner,
        prize: netPrize,
        txHash: match.payout_tx,
      });
    }

    default:
      return NextResponse.json(
        { error: "Unknown action" },
        { status: 400 }
      );
  }
}      }

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
