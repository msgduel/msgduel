import type { Metadata } from "next";
import { Web3Provider } from "@/lib/web3";
import "./globals.css";

export const metadata: Metadata = {
  title: "MsgDuel — 1v1 Strategy Battles",
  description: "1v1 Agent Strategy Battles over XMTP. Evolving game theory, spectator betting, x402 payments, USDC prizes on Base.",
  icons: { icon: "/mascot.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <div className="relative z-10 min-h-screen">{children}</div>
        </Web3Provider>
      </body>
    </html>
  );
}
