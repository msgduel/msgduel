// ⚔️ XMTP Match Hook — Battle over XMTP messaging

"use client";

import { useState, useCallback, useRef } from "react";
import { useXmtp, type XmtpMessage } from "./useXmtp";
import { resolveRound, checkMatchWinner, aiChooseMove, commitMove, verifyReveal } from "@/lib/game-engine";
import type { Move, RoundResult, Match } from "@/types";
import { nanoid } from "nanoid";
import crypto from "crypto";

// Protocol message types sent over XMTP
interface ProtocolMessage {
  type: string;
  payload: Record<string, any>;
  matchId: string;
  sender: string;
  timestamp: number;
}

export function useXmtpMatch() {
  const xmtp = useXmtp();
  const [matchConversation, setMatchConversation] = useState<any>(null);
  const [messages, setMessages] = useState<XmtpMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef<any>(null);

  // Create a match group chat over XMTP
  const createMatchGroup = useCallback(async (opponentAddress: string, matchId: string) => {
    const group = await xmtp.createGroup(
      [opponentAddress],
      `⚔️ MsgDuel: ${matchId}`
    );
    if (group) {
      setMatchConversation(group);

      // Announce match creation
      await xmtp.sendProtocol(group, {
        type: "match:start",
        matchId,
        player1: xmtp.getAddress(),
        player2: opponentAddress,
        timestamp: Date.now(),
      });
    }
    return group;
  }, [xmtp]);

  // Join an existing match (listen for messages)
  const startListening = useCallback(async (conversation: any) => {
    if (isStreaming) return;
    setIsStreaming(true);

    const stream = await xmtp.streamMessages(conversation, (msg) => {
      setMessages((prev) => [...prev, msg]);

      // Try to parse as protocol message
      try {
        const protocol = JSON.parse(msg.content) as ProtocolMessage;
        handleProtocol(protocol);
      } catch {
        // Regular text message, ignore
      }
    });

    streamRef.current = stream;
  }, [xmtp, isStreaming]);

  // Handle incoming protocol messages
  const handleProtocol = useCallback((msg: ProtocolMessage) => {
    switch (msg.type) {
      case "match:commit":
        console.log(`[Match] ${msg.sender} committed move for round ${msg.payload.round}`);
        break;
      case "match:reveal":
        console.log(`[Match] ${msg.sender} revealed: ${msg.payload.move}`);
        break;
      case "match:round_result":
        console.log(`[Match] Round result:`, msg.payload);
        break;
      case "match:end":
        console.log(`[Match] Match ended. Winner: ${msg.payload.winner}`);
        break;
      default:
        console.log(`[Match] Unknown protocol: ${msg.type}`);
    }
  }, []);

  // Send move commitment (hash only)
  const sendCommit = useCallback(async (matchId: string, round: number, moveHash: string) => {
    if (!matchConversation) return false;
    return xmtp.sendProtocol(matchConversation, {
      type: "match:commit",
      matchId,
      payload: { round, moveHash },
      sender: xmtp.getAddress(),
      timestamp: Date.now(),
    });
  }, [matchConversation, xmtp]);

  // Send move reveal (move + salt)
  const sendReveal = useCallback(async (matchId: string, round: number, move: Move, salt: string) => {
    if (!matchConversation) return false;
    return xmtp.sendProtocol(matchConversation, {
      type: "match:reveal",
      matchId,
      payload: { round, move, salt },
      sender: xmtp.getAddress(),
      timestamp: Date.now(),
    });
  }, [matchConversation, xmtp]);

  // Send round result
  const sendRoundResult = useCallback(async (matchId: string, result: RoundResult, score: { p1: number; p2: number }) => {
    if (!matchConversation) return false;
    return xmtp.sendProtocol(matchConversation, {
      type: "match:round_result",
      matchId,
      payload: { ...result, score },
      sender: xmtp.getAddress(),
      timestamp: Date.now(),
    });
  }, [matchConversation, xmtp]);

  // Send match end
  const sendMatchEnd = useCallback(async (matchId: string, winner: string | null, score: { p1: number; p2: number }) => {
    if (!matchConversation) return false;

    // Send human-readable summary too
    const winnerLabel = winner ? `Winner: ${winner.slice(0, 10)}...` : "Draw!";
    await xmtp.sendMessage(matchConversation, 
      `🏆 MATCH OVER!\n\nScore: ${score.p1} - ${score.p2}\n${winnerLabel}`
    );

    return xmtp.sendProtocol(matchConversation, {
      type: "match:end",
      matchId,
      payload: { winner, score },
      sender: xmtp.getAddress(),
      timestamp: Date.now(),
    });
  }, [matchConversation, xmtp]);

  // Send chat message in match
  const sendChat = useCallback(async (text: string) => {
    if (!matchConversation) return false;
    return xmtp.sendMessage(matchConversation, text);
  }, [matchConversation, xmtp]);

  // Cleanup
  const stopListening = useCallback(() => {
    streamRef.current = null;
    setIsStreaming(false);
    setMessages([]);
    setMatchConversation(null);
  }, []);

  return {
    xmtp,
    matchConversation,
    messages,
    isStreaming,
    createMatchGroup,
    startListening,
    stopListening,
    sendCommit,
    sendReveal,
    sendRoundResult,
    sendMatchEnd,
    sendChat,
  };
}
