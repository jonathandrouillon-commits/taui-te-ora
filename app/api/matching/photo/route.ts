import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Le matching photo est temporairement désactivé.",
    },
    {
      status: 503,
    }
  );
}
