"use client";

import { useXmtp } from "@/hooks/useXmtp";

export function XmtpStatus() {
  const { status, error, connect, disconnect, getInboxId } = useXmtp();

  return (
    <div className="card-arena p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            status === "connected" ? "bg-green-400 animate-pulse-neon" :
            status === "connecting" ? "bg-yellow-400 animate-pulse" :
            status === "error" ? "bg-red-400" :
            "bg-slate-600"
          }`} />
          <div>
            <p className="font-mono text-xs text-slate-400 tracking-wider">
              XMTP {status.toUpperCase()}
            </p>
            {status === "connected" && (
              <p className="font-mono text-[0.6rem] text-neon opacity-60">
                {getInboxId()?.slice(0, 16)}...
              </p>
            )}
            {error && (
              <p className="font-mono text-[0.6rem] text-neon2">{error}</p>
            )}
          </div>
        </div>

        {status === "disconnected" || status === "error" ? (
          <button onClick={connect} className="btn-neon text-xs px-4 py-1.5">
            Connect XMTP
          </button>
        ) : status === "connected" ? (
          <button onClick={disconnect} className="text-xs text-slate-500 hover:text-slate-300 font-mono tracking-wider">
            Disconnect
          </button>
        ) : (
          <span className="text-xs text-yellow-400 font-mono animate-pulse">Connecting...</span>
        )}
      </div>
    </div>
  );
}
