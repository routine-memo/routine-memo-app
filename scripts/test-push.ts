import { db } from "../lib/db";
import { pushSubscriptions } from "../lib/db/schema";
import webpush from "web-push";

// VAPID 설정
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:support@routine-memo.app",
  publicKey,
  privateKey
);

async function testPush() {
  console.log("=== 테스트 푸시 알림 발송 ===\n");

  // 모든 구독 가져오기
  const subscriptions = await db.select().from(pushSubscriptions);

  if (subscriptions.length === 0) {
    console.log("❌ 등록된 푸시 구독이 없습니다.");
    process.exit(1);
  }

  console.log(`📱 ${subscriptions.length}개의 구독에 테스트 알림 발송 중...\n`);

  const payload = JSON.stringify({
    title: "테스트 알림",
    body: "푸시 알림이 정상적으로 작동합니다! 🎉",
    url: "/",
    tag: "test-notification",
  });

  let successCount = 0;
  let failCount = 0;

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
      console.log(`✅ 발송 성공: ${sub.endpoint.slice(0, 50)}...`);
      successCount++;
    } catch (error: any) {
      console.log(`❌ 발송 실패: ${error.message}`);
      console.log(`   상태코드: ${error.statusCode}`);
      console.log(`   body: ${error.body}`);
      failCount++;
    }
  }

  console.log(`\n=== 결과 ===`);
  console.log(`성공: ${successCount}, 실패: ${failCount}`);

  process.exit(0);
}

testPush().catch(console.error);
