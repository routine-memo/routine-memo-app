import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { albums, pushSubscriptions } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import webpush from "web-push";
import type { AlbumNotification } from "@/lib/api/albums";

// VAPID 설정 (런타임에 초기화)
function initializeWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      "mailto:support@routine-memo.app",
      publicKey,
      privateKey
    );
    return true;
  }
  return false;
}

// Vercel Cron 인증 헤더 확인
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }
  // 개발 환경에서는 항상 허용
  return process.env.NODE_ENV === "development";
}

// GET: 알림 발송 (Vercel Cron에서 호출)
export async function GET(request: NextRequest) {
  // Cron 인증 확인
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // VAPID 초기화
  if (!initializeWebPush()) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 }
    );
  }

  try {
    // 현재 시간 (KST 기준)
    const now = new Date();
    const kstOffset = 9 * 60; // 한국 시간대 (UTC+9)
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const currentHour = kstNow.getUTCHours();
    const currentMinute = kstNow.getUTCMinutes();
    const currentDay = kstNow.getUTCDay(); // 0-6 (일-토)
    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    console.log(`Cron job running at KST: ${currentTime}, day: ${currentDay}`);

    // 알림이 설정된 모든 앨범 조회
    const albumsWithNotification = await db
      .select()
      .from(albums)
      .where(isNotNull(albums.notification));

    let sentCount = 0;
    const errors: string[] = [];

    for (const album of albumsWithNotification) {
      const notification = album.notification as AlbumNotification | null;

      if (!notification?.enabled) continue;

      // 시간 확인 (분 단위까지 정확히)
      if (notification.time !== currentTime) continue;

      // 요일 확인 (days가 설정된 경우)
      if (notification.days && notification.days.length > 0) {
        if (!notification.days.includes(currentDay)) {
          continue;
        }
      }
      // days가 빈 배열이거나 undefined면 매일

      // 해당 사용자의 푸시 구독 조회
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, album.userId));

      if (subscriptions.length === 0) continue;

      // 알림 메시지 구성
      const payload = JSON.stringify({
        title: album.name,
        body: `${album.name}에 새 기록을 작성할 시간이에요!`,
        url: `/album/${album.id}/entry`,
        albumId: album.id,
        tag: `album-${album.id}`,
      });

      // 각 구독에 알림 발송
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          sentCount++;
        } catch (error: any) {
          console.error(`Failed to send to ${sub.endpoint}:`, error.message);
          errors.push(`${album.name}: ${error.message}`);

          // 410 Gone 또는 404 Not Found: 구독이 더 이상 유효하지 않음
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
            console.log(`Removed invalid subscription: ${sub.id}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      time: currentTime,
      day: currentDay,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
