import { put, del, list } from "@vercel/blob";

// 이미지/영상 업로드
export async function uploadMedia(
  file: File,
  userId: string,
  folder: string = "media"
): Promise<{ url: string; pathname: string }> {
  const filename = `${folder}/${userId}/${Date.now()}-${file.name}`;

  const blob = await put(filename, file, {
    access: "public",
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

// 파일 삭제
export async function deleteMedia(url: string): Promise<void> {
  await del(url);
}

// 사용자의 모든 미디어 목록
export async function listUserMedia(userId: string) {
  const { blobs } = await list({
    prefix: `media/${userId}/`,
  });
  return blobs;
}

// 파일 타입 확인
export function getFileType(file: File): "image" | "video" | "unknown" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "unknown";
}

// 파일 크기 제한 확인 (기본 50MB)
export function isFileSizeValid(file: File, maxSizeMB: number = 50): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}
