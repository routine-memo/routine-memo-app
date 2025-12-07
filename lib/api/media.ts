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

// 미디어 업로드
export async function uploadMedia(
  file: File,
  options?: {
    entryId?: string;
    dailyEntryId?: string;
  }
): Promise<Media & { url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  if (options?.entryId) {
    formData.append("entryId", options.entryId);
  }
  if (options?.dailyEntryId) {
    formData.append("dailyEntryId", options.dailyEntryId);
  }

  const res = await fetch("/api/media", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to upload media");
  }

  return res.json();
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
