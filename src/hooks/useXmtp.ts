// ⚔️ XMTP Client Hook — Browser SDK integration

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWalletClient } from "wagmi";
import { toBytes } from "viem";

// Dynamic import to avoid SSR issues with WASM
let XmtpClient: any = null;
let IdentifierKind: any = null;

async function loadXmtp() {
  if (!XmtpClient) {
    const mod = await import("@xmtp/browser-sdk");
    XmtpClient = mod.Client;
    IdentifierKind = mod.IdentifierKind;
  }
}

export type XmtpStatus = "disconnected" | "connecting" | "connected" | "error";

export interface XmtpMessage {
  id: string;
  senderAddress: string;
  content: string;
  timestamp: number;
}

export function useXmtp() {
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<XmtpStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);

  // Connect to XMTP
  const connect = useCallback(async () => {
    if (!walletClient) {
      setError("Connect wallet first");
      return null;
    }

    try {
      setStatus("connecting");
      setError(null);

      await loadXmtp();

      const address = walletClient.account.address;

      // Create signer from wagmi wallet
      const signer = {
        type: "EOA" as const,
        getIdentifier: () => ({
          identifier: address,
          identifierKind: IdentifierKind.Ethereum,
        }),
        signMessage: async (message: string) => {
          const signature = await walletClient.signMessage({ message });
          return toBytes(signature);
        },
      };

      // Create XMTP client
      const client = await XmtpClient.create(signer, {
        env: "dev", // Use 'production' for mainnet
      });

      clientRef.current = client;
      setStatus("connected");
      console.log(`[XMTP] Connected: ${client.inboxId}`);
      return client;
    } catch (err: any) {
      console.error("[XMTP] Connection failed:", err);
      setError(err.message ?? "Failed to connect to XMTP");
      setStatus("error");
      return null;
    }
  }, [walletClient]);

  // Disconnect
  const disconnect = useCallback(() => {
    clientRef.current = null;
    setStatus("disconnected");
    setError(null);
  }, []);

  // Create a DM conversation with another address
  const createDm = useCallback(async (peerAddress: string) => {
    const client = clientRef.current;
    if (!client) return null;

    try {
      // Check if peer is on XMTP
      const canMessage = await client.canMessage([
        { identifier: peerAddress, identifierKind: IdentifierKind.Ethereum },
      ]);

      if (!canMessage.get(peerAddress.toLowerCase())) {
        console.warn(`[XMTP] ${peerAddress} is not on XMTP`);
        return null;
      }

      const peerInboxId = await client.findInboxIdByIdentifier({
        identifier: peerAddress,
        identifierKind: IdentifierKind.Ethereum,
      });

      if (!peerInboxId) return null;

      const dm = await client.conversations.createDm(peerInboxId);
      return dm;
    } catch (err) {
      console.error("[XMTP] Failed to create DM:", err);
      return null;
    }
  }, []);

  // Create a group conversation (for match arena)
  const createGroup = useCallback(async (peerAddresses: string[], name?: string) => {
    const client = clientRef.current;
    if (!client) return null;

    try {
      const inboxIds: string[] = [];
      for (const addr of peerAddresses) {
        const inboxId = await client.findInboxIdByIdentifier({
          identifier: addr,
          identifierKind: IdentifierKind.Ethereum,
        });
        if (inboxId) inboxIds.push(inboxId);
      }

      if (inboxIds.length === 0) return null;

      const group = await client.conversations.createGroup(inboxIds, {
        groupName: name ?? "⚔️ MsgDuel Match",
        groupDescription: "MsgDuel — 1v1 Strategy Battle",
      });

      return group;
    } catch (err) {
      console.error("[XMTP] Failed to create group:", err);
      return null;
    }
  }, []);

  // Send a text message to a conversation
  const sendMessage = useCallback(async (conversation: any, text: string) => {
    try {
      await conversation.sendText(text);
      return true;
    } catch (err) {
      console.error("[XMTP] Failed to send message:", err);
      return false;
    }
  }, []);

  // Send a JSON protocol message (for game protocol)
  const sendProtocol = useCallback(async (conversation: any, msg: Record<string, any>) => {
    try {
      await conversation.sendText(JSON.stringify(msg));
      return true;
    } catch (err) {
      console.error("[XMTP] Failed to send protocol message:", err);
      return false;
    }
  }, []);

  // Stream messages from a conversation
  const streamMessages = useCallback(async (
    conversation: any,
    onMessage: (msg: XmtpMessage) => void
  ) => {
    try {
      await conversation.sync();
      const stream = await conversation.streamMessages({
        onValue: (message: any) => {
          onMessage({
            id: message.id,
            senderAddress: message.senderInboxId ?? "",
            content: typeof message.content === "string" ? message.content : JSON.stringify(message.content),
            timestamp: Date.now(),
          });
        },
        onError: (err: any) => {
          console.error("[XMTP] Stream error:", err);
        },
      });
      return stream;
    } catch (err) {
      console.error("[XMTP] Failed to stream:", err);
      return null;
    }
  }, []);

  // Stream all messages across conversations
  const streamAllMessages = useCallback(async (onMessage: (msg: XmtpMessage) => void) => {
    const client = clientRef.current;
    if (!client) return null;

    try {
      const stream = await client.conversations.streamAllMessages({
        onValue: (message: any) => {
          onMessage({
            id: message.id,
            senderAddress: message.senderInboxId ?? "",
            content: typeof message.content === "string" ? message.content : JSON.stringify(message.content),
            timestamp: Date.now(),
          });
        },
        onError: (err: any) => {
          console.error("[XMTP] Stream error:", err);
        },
      });
      return stream;
    } catch (err) {
      console.error("[XMTP] Failed to stream all:", err);
      return null;
    }
  }, []);

  // Get client info
  const getInboxId = useCallback(() => {
    return clientRef.current?.inboxId ?? null;
  }, []);

  const getAddress = useCallback(() => {
    return walletClient?.account.address ?? null;
  }, [walletClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current = null;
    };
  }, []);

  return {
    status,
    error,
    connect,
    disconnect,
    createDm,
    createGroup,
    sendMessage,
    sendProtocol,
    streamMessages,
    streamAllMessages,
    getInboxId,
    getAddress,
    client: clientRef.current,
  };
}
