import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, and } from "drizzle-orm";

// POST: 업로드된 미디어 정보를 DB에 저장
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { blobUrl, fileName, fileType, fileSize, entryId, dailyEntryId } = body;

    if (!blobUrl) {
      return NextResponse.json({ error: "blobUrl is required" }, { status: 400 });
    }

    // 중복 체크 (같은 URL이 이미 있는지)
    const existing = await db.query.media.findFirst({
      where: and(eq(media.userId, user.id), eq(media.blobUrl, blobUrl)),
    });

    if (existing) {
      // 이미 존재하면 기존 데이터 반환
      return NextResponse.json(existing);
    }

    // DB에 저장
    const [newMedia] = await db.insert(media).values({
      userId: user.id,
      blobUrl,
      fileName: fileName || null,
      fileType: fileType || null,
      fileSize: fileSize || null,
      entryId: entryId || null,
      dailyEntryId: dailyEntryId || null,
    }).returning();

    return NextResponse.json(newMedia, { status: 201 });
  } catch (error) {
    console.error("Failed to save media:", error);
    return NextResponse.json({ error: "Failed to save media" }, { status: 500 });
  }
}
