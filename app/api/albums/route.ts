import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { albums } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, desc } from "drizzle-orm";

// GET: 사용자의 모든 앨범 조회
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAlbums = await db.query.albums.findMany({
      where: eq(albums.userId, user.id),
      orderBy: [desc(albums.updatedAt)],
    });

    return NextResponse.json(userAlbums);
  } catch (error) {
    console.error("Failed to fetch albums:", error);
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}

// POST: 새 앨범 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, blocks, notification } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [newAlbum] = await db.insert(albums).values({
      userId: user.id,
      name,
      blocks: blocks || [],
      pageCount: 0,
      notification: notification || null,
    }).returning();

    return NextResponse.json(newAlbum, { status: 201 });
  } catch (error) {
    console.error("Failed to create album:", error);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}
