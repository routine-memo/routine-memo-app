import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { auth } from "../auth";

// 세션에서 현재 사용자 DB 정보 가져오기 (없으면 생성)
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const googleId = session.user.id;
  const email = session.user.email;
  const name = session.user.name || null;
  const image = session.user.image || null;

  // 기존 사용자 찾기
  let user = await db.query.users.findFirst({
    where: eq(users.googleId, googleId),
  });

  // 없으면 새로 생성
  if (!user) {
    const [newUser] = await db.insert(users).values({
      googleId,
      email,
      name,
      image,
    }).returning();
    user = newUser;
  }

  return user;
}

// 사용자 정보 업데이트
export async function updateUser(userId: string, data: { name?: string; image?: string }) {
  const [updated] = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}
