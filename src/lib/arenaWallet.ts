import { createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.ARENA_PRIVATE_KEY!);

export const arenaWalletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});
