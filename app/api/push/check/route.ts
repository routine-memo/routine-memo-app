import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ subscribed: false });
    }

    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ subscribed: false });
    }

    // DB에서 해당 endpoint가 있는지 확인
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      )
      .limit(1);

    return NextResponse.json({ subscribed: existing.length > 0 });
  } catch (error) {
    console.error("Push check error:", error);
    return NextResponse.json({ subscribed: false });
  }
}
