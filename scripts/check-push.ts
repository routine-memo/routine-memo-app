import { db } from "../lib/db";
import { pushSubscriptions, albums, users } from "../lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";

async function checkPushSetup() {
  console.log("=== 푸시 알림 설정 확인 ===\n");

  // 1. 모든 푸시 구독 확인
  const allSubscriptions = await db.select().from(pushSubscriptions);
  console.log(`📱 총 푸시 구독 수: ${allSubscriptions.length}`);

  for (const sub of allSubscriptions) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, sub.userId),
    });
    console.log(`  - 사용자: ${user?.email || sub.userId}`);
    console.log(`    endpoint: ${sub.endpoint.slice(0, 50)}...`);
    console.log(`    등록일: ${sub.createdAt}`);
  }

  console.log("\n");

  // 2. 알림 설정된 앨범 확인
  const albumsWithNotification = await db
    .select()
    .from(albums)
    .where(isNotNull(albums.notification));

  console.log(`📅 알림 설정된 앨범 수: ${albumsWithNotification.length}`);

  for (const album of albumsWithNotification) {
    const notification = album.notification as any;
    const user = await db.query.users.findFirst({
      where: eq(users.id, album.userId),
    });

    // 해당 사용자의 푸시 구독 확인
    const userSubs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, album.userId));

    console.log(`\n  📁 앨범: ${album.name}`);
    console.log(`     사용자: ${user?.email}`);
    console.log(`     알림 활성화: ${notification?.enabled ? '✅' : '❌'}`);
    console.log(`     알림 시간: ${notification?.time || '미설정'}`);
    console.log(`     알림 요일: ${notification?.days?.length > 0 ? notification.days.join(', ') : '매일'}`);
    console.log(`     푸시 구독 여부: ${userSubs.length > 0 ? '✅ 있음' : '❌ 없음'}`);
  }

  // 3. 현재 시간 확인 (KST)
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
  const currentHour = kstNow.getUTCHours();
  const currentMinute = kstNow.getUTCMinutes();
  const currentDay = kstNow.getUTCDay();
  const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

  console.log(`\n\n🕐 현재 KST 시간: ${currentTime}`);
  console.log(`📆 현재 요일: ${currentDay} (0=일, 1=월, ..., 6=토)`);

  // 4. 지금 발송해야 할 알림 확인
  console.log("\n=== 현재 시간에 발송 대상인 알림 ===");
  let matchCount = 0;

  for (const album of albumsWithNotification) {
    const notification = album.notification as any;
    if (!notification?.enabled) continue;

    // 시간이 현재와 같은지 (10분 범위 허용으로 변경 테스트)
    const [setHour, setMin] = (notification.time || "09:00").split(":").map(Number);
    const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (setHour * 60 + setMin));

    if (notification.time === currentTime) {
      console.log(`  ✅ ${album.name} - 정확히 매칭됨 (${notification.time})`);
      matchCount++;
    } else if (timeDiff <= 5) {
      console.log(`  ⚠️ ${album.name} - 5분 이내 (설정: ${notification.time}, 현재: ${currentTime})`);
    }
  }

  if (matchCount === 0) {
    console.log("  현재 시간에 발송할 알림이 없습니다.");
  }

  console.log("\n=== 확인 완료 ===");
  process.exit(0);
}

checkPushSetup().catch(console.error);
