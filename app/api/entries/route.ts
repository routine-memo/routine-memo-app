import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, albums } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, and, desc, sql } from "drizzle-orm";

// GET: 기록 조회 (앨범 ID로 필터링 가능)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");

    let userEntries;
    if (albumId) {
      userEntries = await db.query.entries.findMany({
        where: and(eq(entries.userId, user.id), eq(entries.albumId, albumId)),
        orderBy: [desc(entries.createdAt)],
      });
    } else {
      userEntries = await db.query.entries.findMany({
        where: eq(entries.userId, user.id),
        orderBy: [desc(entries.createdAt)],
      });
    }

    return NextResponse.json(userEntries);
  } catch (error) {
    console.error("Failed to fetch entries:", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

// POST: 새 기록 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { albumId, blockValues, tags } = body;

    if (!albumId) {
      return NextResponse.json({ error: "albumId is required" }, { status: 400 });
    }

    const [newEntry] = await db.insert(entries).values({
      userId: user.id,
      albumId,
      blockValues: blockValues || [],
      tags: tags || [],
    }).returning();

    // 앨범의 pageCount 증가
    await db.update(albums)
      .set({
        pageCount: sql`${albums.pageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(albums.id, albumId));

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Failed to create entry:", error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
