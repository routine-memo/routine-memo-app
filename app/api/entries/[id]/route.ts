import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, albums } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, and, sql } from "drizzle-orm";

// GET: 특정 기록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const entry = await db.query.entries.findFirst({
      where: and(eq(entries.id, id), eq(entries.userId, user.id)),
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to fetch entry:", error);
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

// PUT: 기록 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { blockValues, tags } = body;

    const [updated] = await db.update(entries)
      .set({
        ...(blockValues !== undefined && { blockValues }),
        ...(tags !== undefined && { tags }),
        updatedAt: new Date(),
      })
      .where(and(eq(entries.id, id), eq(entries.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update entry:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

// DELETE: 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 먼저 entry를 조회하여 albumId 획득
    const entry = await db.query.entries.findFirst({
      where: and(eq(entries.id, id), eq(entries.userId, user.id)),
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // 삭제
    await db.delete(entries)
      .where(and(eq(entries.id, id), eq(entries.userId, user.id)));

    // 앨범의 pageCount 감소
    await db.update(albums)
      .set({
        pageCount: sql`GREATEST(${albums.pageCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(albums.id, entry.albumId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete entry:", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
