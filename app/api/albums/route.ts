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
      console.error("POST /api/albums: Unauthorized - no user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, blocks, notification } = body;

    if (!name) {
      console.error("POST /api/albums: Name is required");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    console.log("POST /api/albums: Creating album for user", user.id, "with name", name);

    const [newAlbum] = await db.insert(albums).values({
      userId: user.id,
      name,
      blocks: blocks || [],
      pageCount: 0,
      notification: notification || null,
    }).returning();

    console.log("POST /api/albums: Album created successfully", newAlbum.id);
    return NextResponse.json(newAlbum, { status: 201 });
  } catch (error) {
    console.error("POST /api/albums: Failed to create album:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create album", details: errorMessage }, { status: 500 });
  }
}
