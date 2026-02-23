// ⚔️ x402 Payment — USDC on Base

import { parseUnits, encodeFunctionData, type Address } from "viem";

const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_CONTRACT ?? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address;
const ARENA_WALLET = (process.env.NEXT_PUBLIC_ARENA_WALLET ?? "0x0000000000000000000000000000000000000000") as Address;

/** Pay entry fee — transfer USDC from player to arena wallet */
export async function payEntryFee(walletClient: any, amount: number): Promise<string | null> {
  try {
    const usdcAmount = parseUnits(amount.toString(), 6); // USDC = 6 decimals

    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "transfer",
      args: [ARENA_WALLET, usdcAmount],
    });

    console.log(`[Payment] Entry fee $${amount} USDC sent: ${hash}`);
    return hash;
  } catch (err: any) {
    console.error("[Payment] Entry fee failed:", err);
    return null;
  }
}

/** Pay prize to winner — called from server/admin */
export async function payPrize(walletClient: any, winnerAddress: Address, amount: number): Promise<string | null> {
  try {
    const usdcAmount = parseUnits(amount.toString(), 6);

    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "transfer",
      args: [winnerAddress, usdcAmount],
    });

    console.log(`[Payment] Prize $${amount} USDC → ${winnerAddress}: ${hash}`);
    return hash;
  } catch (err: any) {
    console.error("[Payment] Prize payout failed:", err);
    return null;
  }
}

/** Check USDC balance */
export async function getUsdcBalance(publicClient: any, address: Address): Promise<number> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [address],
    });
    return Number(balance) / 1e6;
  } catch {
    return 0;
  }
}

export { USDC_ADDRESS, ARENA_WALLET, USDC_ABI };
