import { upload } from "@vercel/blob/client";

// 미디어 API 클라이언트
export interface Media {
  id: string;
  userId: string;
  entryId: string | null;
  dailyEntryId: string | null;
  blobUrl: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
}

// 미디어 조회 (entry ID 또는 daily entry ID로 필터링)
export async function getMedia(options?: {
  entryId?: string;
  dailyEntryId?: string;
}): Promise<Media[]> {
  let url = "/api/media";
  const params = new URLSearchParams();

  if (options?.entryId) {
    params.set("entryId", options.entryId);
  }
  if (options?.dailyEntryId) {
    params.set("dailyEntryId", options.dailyEntryId);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch media");
  }
  return res.json();
}

// 파일명을 안전한 형태로 변환 (한글, 특수문자 제거)
function sanitizeFileName(fileName: string): string {
  const ext = fileName.split('.').pop() || '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}.${ext}`;
}

// 미디어 업로드 (클라이언트에서 직접 Vercel Blob에 업로드)
export async function uploadMedia(
  file: File,
  options?: {
    entryId?: string;
    dailyEntryId?: string;
  }
): Promise<{ url: string }> {
  // 파일명을 안전한 형태로 변환 (한글, 특수문자로 인한 503 에러 방지)
  const safeFileName = sanitizeFileName(file.name);

  // 클라이언트에서 직접 Vercel Blob에 업로드
  const blob = await upload(safeFileName, file, {
    access: "public",
    handleUploadUrl: "/api/media/upload",
  });

  return { url: blob.url };
}

// 미디어 삭제
export async function deleteMedia(id: string): Promise<void> {
  const res = await fetch(`/api/media?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete media");
  }
}

// base64 문자열을 File로 변환 (마이그레이션용)
export function base64ToFile(base64: string, fileName: string): File {
  // data:image/png;base64, 형식에서 실제 데이터 추출
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime });
}
