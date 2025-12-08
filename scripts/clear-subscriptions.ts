import { db } from "../lib/db";
import { pushSubscriptions } from "../lib/db/schema";

async function clearSubscriptions() {
  console.log("=== 모든 푸시 구독 삭제 ===\n");

  const deleted = await db.delete(pushSubscriptions).returning();

  console.log(`✅ ${deleted.length}개의 구독이 삭제되었습니다.`);
  console.log("\n이제 앱에서 알림을 다시 켜주세요.");

  process.exit(0);
}

clearSubscriptions().catch(console.error);
