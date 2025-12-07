import { BlockPosition } from "@/app/template/new/types";

// 알림 설정 타입
export interface AlbumNotification {
  enabled: boolean;
  time?: string;
  days?: number[];
}

// 앨범 API 클라이언트
export interface Album {
  id: string;
  userId: string;
  name: string;
  blocks: BlockPosition[];
  pageCount: number;
  notification: AlbumNotification | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlbumData {
  name: string;
  blocks?: BlockPosition[];
  notification?: AlbumNotification;
}

export interface UpdateAlbumData {
  name?: string;
  blocks?: BlockPosition[];
  pageCount?: number;
  notification?: AlbumNotification;
}

// 모든 앨범 조회
export async function getAlbums(): Promise<Album[]> {
  const res = await fetch("/api/albums");
  if (!res.ok) {
    throw new Error("Failed to fetch albums");
  }
  return res.json();
}

// 특정 앨범 조회
export async function getAlbum(id: string): Promise<Album> {
  const res = await fetch(`/api/albums/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch album");
  }
  return res.json();
}

// 앨범 생성
export async function createAlbum(data: CreateAlbumData): Promise<Album> {
  const res = await fetch("/api/albums", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to create album");
  }
  return res.json();
}

// 앨범 수정
export async function updateAlbum(id: string, data: UpdateAlbumData): Promise<Album> {
  const res = await fetch(`/api/albums/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update album");
  }
  return res.json();
}

// 앨범 삭제
export async function deleteAlbum(id: string): Promise<void> {
  const res = await fetch(`/api/albums/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete album");
  }
}
