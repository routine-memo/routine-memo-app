import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { albums } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, and } from "drizzle-orm";

// GET: 특정 앨범 조회
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

    const album = await db.query.albums.findFirst({
      where: and(eq(albums.id, id), eq(albums.userId, user.id)),
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error("Failed to fetch album:", error);
    return NextResponse.json({ error: "Failed to fetch album" }, { status: 500 });
  }
}

// PUT: 앨범 수정
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
    const { name, blocks, pageCount, notification } = body;

    const [updated] = await db.update(albums)
      .set({
        ...(name !== undefined && { name }),
        ...(blocks !== undefined && { blocks }),
        ...(pageCount !== undefined && { pageCount }),
        ...(notification !== undefined && { notification }),
        updatedAt: new Date(),
      })
      .where(and(eq(albums.id, id), eq(albums.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update album:", error);
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
  }
}

// DELETE: 앨범 삭제
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

    const [deleted] = await db.delete(albums)
      .where(and(eq(albums.id, id), eq(albums.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete album:", error);
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
