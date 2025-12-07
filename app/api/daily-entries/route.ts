import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyEntries } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/users";
import { eq, desc } from "drizzle-orm";

// GET: 사용자의 모든 즉석 앨범 기록 조회
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDailyEntries = await db.query.dailyEntries.findMany({
      where: eq(dailyEntries.userId, user.id),
      orderBy: [desc(dailyEntries.createdAt)],
    });

    return NextResponse.json(userDailyEntries);
  } catch (error) {
    console.error("Failed to fetch daily entries:", error);
    return NextResponse.json({ error: "Failed to fetch daily entries" }, { status: 500 });
  }
}

// POST: 새 즉석 앨범 기록 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { blocks, blockValues, tags } = body;

    const [newEntry] = await db.insert(dailyEntries).values({
      userId: user.id,
      blocks: blocks || [],
      blockValues: blockValues || [],
      tags: tags || [],
    }).returning();

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Failed to create daily entry:", error);
    return NextResponse.json({ error: "Failed to create daily entry" }, { status: 500 });
  }
}
