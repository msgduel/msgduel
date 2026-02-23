"use client";

import { useState } from "react";
import type { XmtpMessage } from "@/hooks/useXmtp";

interface MatchChatProps {
  messages: XmtpMessage[];
  onSend: (text: string) => void;
  myAddress: string | null;
}

export function MatchChat({ messages, onSend, myAddress }: MatchChatProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  // Filter out protocol messages (JSON), show only chat
  const chatMessages = messages.filter((m) => {
    try { JSON.parse(m.content); return false; } catch { return true; }
  });

  return (
    <div className="card-arena p-4">
      <p className="font-mono text-xs text-slate-500 tracking-wider mb-3">
        💬 MATCH CHAT (XMTP ENCRYPTED)
      </p>

      <div className="h-32 overflow-y-auto space-y-1.5 mb-3 scrollbar-thin">
        {chatMessages.length === 0 && (
          <p className="text-xs text-slate-600 italic">No messages yet...</p>
        )}
        {chatMessages.map((msg) => {
          const isMe = msg.senderAddress === myAddress;
          return (
            <div key={msg.id} className={`text-xs ${isMe ? "text-neon" : "text-slate-400"}`}>
              <span className="font-mono text-slate-600">
                {isMe ? "You" : msg.senderAddress.slice(0, 8)}:
              </span>{" "}
              {msg.content}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-arena-bg border border-arena-border px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-neon/30"
        />
        <button onClick={handleSend} className="btn-neon text-xs px-3 py-1.5">
          Send
        </button>
      </div>
    </div>
  );
}
