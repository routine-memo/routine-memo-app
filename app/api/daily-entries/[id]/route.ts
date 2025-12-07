import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyEntries } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, and } from "drizzle-orm";

// GET: 특정 즉석 앨범 기록 조회
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

    const entry = await db.query.dailyEntries.findFirst({
      where: and(eq(dailyEntries.id, id), eq(dailyEntries.userId, user.id)),
    });

    if (!entry) {
      return NextResponse.json({ error: "Daily entry not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to fetch daily entry:", error);
    return NextResponse.json({ error: "Failed to fetch daily entry" }, { status: 500 });
  }
}

// PUT: 즉석 앨범 기록 수정
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
    const { blocks, blockValues, tags } = body;

    const [updated] = await db.update(dailyEntries)
      .set({
        ...(blocks !== undefined && { blocks }),
        ...(blockValues !== undefined && { blockValues }),
        ...(tags !== undefined && { tags }),
        updatedAt: new Date(),
      })
      .where(and(eq(dailyEntries.id, id), eq(dailyEntries.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Daily entry not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update daily entry:", error);
    return NextResponse.json({ error: "Failed to update daily entry" }, { status: 500 });
  }
}

// DELETE: 즉석 앨범 기록 삭제
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

    const [deleted] = await db.delete(dailyEntries)
      .where(and(eq(dailyEntries.id, id), eq(dailyEntries.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Daily entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete daily entry:", error);
    return NextResponse.json({ error: "Failed to delete daily entry" }, { status: 500 });
  }
}
