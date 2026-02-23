// ⚔️ Leaderboard API

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const db = getServiceClient();

  const { data, error } = await db
    .from("fighters")
    .select("*")
    .order("wins", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fighters: data ?? [] });
}
