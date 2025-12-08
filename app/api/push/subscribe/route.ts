import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq } from "drizzle-orm";

// POST: 푸시 알림 구독
export async function POST(request: NextRequest) {
  try {
    console.log("[Push Subscribe] Starting subscription process...");

    const user = await getCurrentUser();
    console.log("[Push Subscribe] User:", user ? user.id : "null");

    if (!user) {
      console.log("[Push Subscribe] No user found - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;
    console.log("[Push Subscribe] Endpoint:", endpoint?.slice(0, 50) + "...");

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      console.log("[Push Subscribe] Invalid data - missing fields");
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // 기존 구독 모두 삭제 후 새로 생성 (VAPID 키 변경이나 재구독 시 endpoint가 바뀌므로)
    console.log("[Push Subscribe] Deleting old subscriptions for user:", user.id);
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, user.id));

    // 새 구독 생성
    console.log("[Push Subscribe] Creating new subscription...");
    await db.insert(pushSubscriptions).values({
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    console.log("[Push Subscribe] Subscription created successfully!");
    return NextResponse.json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error("[Push Subscribe] Error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
