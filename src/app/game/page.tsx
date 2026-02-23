"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Navbar } from "@/components/layout/Navbar";
import { BattleArena } from "@/components/game/BattleArena";
import { XmtpStatus } from "@/components/game/XmtpStatus";
import { MatchChat } from "@/components/game/MatchChat";
import { MoveSelector } from "@/components/game/MoveSelector";
import { useGameStore } from "@/lib/store";
import { useXmtpMatch } from "@/hooks/useXmtpMatch";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { payEntryFee, getUsdcBalance } from "@/lib/payments";
import type { Move } from "@/types";

export default function GamePage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { match, phase, initPlayer, startMatch, playerFighter, resetMatch } = useGameStore();
  const { xmtp, messages, createMatchGroup, sendChat, sendRoundResult, sendMatchEnd } = useXmtpMatch();
  const { queueStatus, match: pvpMatch, joinQueue, leaveQueue } = useMatchmaking(address);
  const [balance, setBalance] = useState<number>(0);
  const [payingEntry, setPayingEntry] = useState(false);
  const [mode, setMode] = useState<"idle" | "ai" | "pvp">("idle");

  useEffect(() => {
    if (isConnected && address) {
      initPlayer(address, `Fighter-${address.slice(0, 6)}`);
    }
  }, [isConnected, address, initPlayer]);

  // Fetch USDC balance
  useEffect(() => {
    if (publicClient && address) {
      getUsdcBalance(publicClient, address as `0x${string}`).then(setBalance);
    }
  }, [publicClient, address]);

  // Handle entry fee payment
  const handlePayAndFight = async (vsAI: boolean) => {
    const entryFee = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE ?? "1");

    if (walletClient && entryFee > 0) {
      setPayingEntry(true);
      const txHash = await payEntryFee(walletClient, entryFee);
      setPayingEntry(false);

      if (!txHash) {
        alert("Payment failed. Try again.");
        return;
      }
    }

    if (vsAI) {
      setMode("ai");
      startMatch(true);
    } else {
      setMode("pvp");
      joinQueue();
    }
  };

  // When PvP match found, create XMTP group
  useEffect(() => {
    if (pvpMatch && xmtp.status === "connected") {
      createMatchGroup(
        pvpMatch.player2 === address ? pvpMatch.player1 : pvpMatch.player2,
        pvpMatch.id
      );
    }
  }, [pvpMatch?.id]);

  // Broadcast results over XMTP
  useEffect(() => {
    if (match && match.rounds.length > 0 && xmtp.status === "connected") {
      const lastRound = match.rounds[match.rounds.length - 1];
      sendRoundResult(match.id, lastRound, match.score);
      if (match.status === "finished") {
        sendMatchEnd(match.id, match.winner, match.score);
      }
    }
  }, [match?.rounds.length, match?.status]);

  const entryFee = process.env.NEXT_PUBLIC_ENTRY_FEE ?? "1";
  const totalRounds = process.env.NEXT_PUBLIC_ROUNDS ?? "5";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-4 pb-12">
        <div className="max-w-2xl mx-auto space-y-4">

          {isConnected && <XmtpStatus />}

          {/* Not connected */}
          {!isConnected && (
            <div className="text-center py-24">
              <img src="/mascot.svg" alt="Gladiator" className="w-24 h-24 mx-auto mb-6 opacity-60" />
              <h2 className="font-display text-3xl font-black tracking-wider mb-4">
                <span className="text-gradient-neon">Connect</span> to Fight
              </h2>
              <p className="text-slate-500">Connect your wallet to enter the arena.</p>
            </div>
          )}

          {/* Connected — mode selection */}
          {isConnected && mode === "idle" && (
            <div className="text-center py-12 space-y-8">
              <img src="/mascot.svg" alt="Gladiator" className="w-24 h-24 mx-auto opacity-80" />
              <h2 className="font-display text-3xl font-black tracking-wider">
                <span className="text-gradient-fire">⚔️ Arena</span>
              </h2>

              {/* Balance */}
              <div className="card-arena p-3 max-w-xs mx-auto flex justify-between items-center">
                <span className="font-mono text-xs text-slate-500">USDC Balance</span>
                <span className="font-mono text-sm text-gold">${balance.toFixed(2)}</span>
              </div>

              {/* Fighter stats */}
              {playerFighter && (
                <div className="card-arena p-5 max-w-sm mx-auto text-left">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-display font-bold tracking-wider">{playerFighter.name}</p>
                    <span className="text-xs text-slate-600">{playerFighter.archetype}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="font-mono text-lg text-green-400">{playerFighter.record.wins}</p>
                      <p className="text-xs text-slate-500">Wins</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg text-red-400">{playerFighter.record.losses}</p>
                      <p className="text-xs text-slate-500">Losses</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg text-gold">${playerFighter.earnings.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Earned</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode selection */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handlePayAndFight(true)}
                  disabled={payingEntry}
                  className="btn-fire text-base px-8 py-4"
                >
                  {payingEntry ? "Paying..." : "⚔️ Fight AI"}
                </button>
                <button
                  onClick={() => handlePayAndFight(false)}
                  disabled={payingEntry}
                  className="btn-neon text-base px-8 py-4"
                >
                  {payingEntry ? "Paying..." : "🤺 PvP Match"}
                </button>
              </div>

              <p className="text-slate-600 text-sm">
                Entry: ${entryFee} USDC · Best of {totalRounds}
                {xmtp.status === "connected" && <span className="text-neon"> · XMTP Encrypted</span>}
              </p>
            </div>
          )}

          {/* PvP Searching */}
          {mode === "pvp" && queueStatus === "searching" && (
            <div className="text-center py-16 space-y-6">
              <div className="w-16 h-16 mx-auto border-2 border-neon border-t-transparent rounded-full animate-spin" />
              <h3 className="font-display text-xl font-bold tracking-wider text-neon">
                Searching for opponent...
              </h3>
              <p className="text-slate-500 text-sm">Waiting in matchmaking queue</p>
              <button
                onClick={() => { leaveQueue(); setMode("idle"); }}
                className="btn-neon text-sm px-6 py-2"
              >
                Cancel
              </button>
            </div>
          )}

          {/* PvP Match Found */}
          {mode === "pvp" && queueStatus === "found" && pvpMatch && (
            <div className="text-center py-8 space-y-4">
              <p className="font-display text-xl font-bold text-gradient-fire">🤺 OPPONENT FOUND!</p>
              <p className="font-mono text-sm text-slate-400">
                {pvpMatch.player1 === address ? pvpMatch.player2 : pvpMatch.player1}
              </p>
              <p className="font-mono text-xs text-slate-600">Match: {pvpMatch.id}</p>
              {/* TODO: Integrate usePvpMatch hook here for real-time gameplay */}
              <p className="text-neon text-sm">PvP real-time battle loading...</p>
            </div>
          )}

          {/* AI Match in progress */}
          {mode === "ai" && match && <BattleArena />}

          {/* Back button when match ends */}
          {mode !== "idle" && phase === "match_end" && (
            <div className="text-center">
              <button onClick={() => { resetMatch(); setMode("idle"); }} className="btn-neon mt-4">
                ← Back to Arena
              </button>
            </div>
          )}

          {/* XMTP Chat */}
          {match && xmtp.status === "connected" && (
            <MatchChat messages={messages} onSend={sendChat} myAddress={xmtp.getInboxId()} />
          )}
        </div>
      </main>
    </>
  );
}
