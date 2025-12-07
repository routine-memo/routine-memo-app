import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";

// POST: 클라이언트 업로드를 위한 토큰 생성
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // 인증 확인
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/heic",
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-msvideo",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB (Vercel Blob 제한)
          tokenPayload: JSON.stringify({
            userId: user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // 업로드 완료 콜백 - media 테이블에 인덱스 저장
        try {
          const payload = JSON.parse(tokenPayload || "{}");
          const userId = payload.userId;

          if (userId) {
            // 파일 타입 판별
            const contentType = blob.contentType || "";
            const fileType = contentType.startsWith("image/") ? "image" :
                            contentType.startsWith("video/") ? "video" : null;

            // media 테이블에 저장 (인덱싱용)
            await db.insert(media).values({
              userId,
              blobUrl: blob.url,
              fileName: blob.pathname,
              fileType,
            });

            console.log("Media saved to DB:", blob.url, "type:", fileType);
          }
        } catch (e) {
          // 콜백 에러 무시 (업로드 자체는 성공으로 처리)
          console.error("onUploadCompleted error:", e);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
