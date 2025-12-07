import { NextRequest, NextResponse } from "next/server";
import { put, del, list } from "@vercel/blob";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, and } from "drizzle-orm";

// GET: 사용자의 미디어 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");
    const dailyEntryId = searchParams.get("dailyEntryId");

    let userMedia;
    if (entryId) {
      userMedia = await db.query.media.findMany({
        where: and(eq(media.userId, user.id), eq(media.entryId, entryId)),
      });
    } else if (dailyEntryId) {
      userMedia = await db.query.media.findMany({
        where: and(eq(media.userId, user.id), eq(media.dailyEntryId, dailyEntryId)),
      });
    } else {
      userMedia = await db.query.media.findMany({
        where: eq(media.userId, user.id),
      });
    }

    return NextResponse.json(userMedia);
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

// POST: 미디어 업로드
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entryId = formData.get("entryId") as string | null;
    const dailyEntryId = formData.get("dailyEntryId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // 파일 타입 검증
    const fileType = file.type.startsWith("image/") ? "image" :
                     file.type.startsWith("video/") ? "video" : null;

    if (!fileType) {
      return NextResponse.json({ error: "Only images and videos are allowed" }, { status: 400 });
    }

    // 파일 크기 검증 (50MB 제한)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    // Vercel Blob에 업로드
    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}_${file.name}`;

    const blob = await put(fileName, file, {
      access: "public",
    });

    // DB에 메타데이터 저장
    const [newMedia] = await db.insert(media).values({
      userId: user.id,
      entryId: entryId || null,
      dailyEntryId: dailyEntryId || null,
      blobUrl: blob.url,
      fileName: file.name,
      fileType,
      fileSize: file.size,
    }).returning();

    return NextResponse.json({
      ...newMedia,
      url: blob.url,
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload media:", error);
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}

// DELETE: 미디어 삭제
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("id");

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
    }

    // DB에서 미디어 정보 조회
    const mediaItem = await db.query.media.findFirst({
      where: and(eq(media.id, mediaId), eq(media.userId, user.id)),
    });

    if (!mediaItem) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Vercel Blob에서 삭제
    await del(mediaItem.blobUrl);

    // DB에서 삭제
    await db.delete(media)
      .where(and(eq(media.id, mediaId), eq(media.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete media:", error);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
