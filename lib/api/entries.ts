import { BlockDefaultValue } from "@/app/template/new/types";

// 블록별 입력값 타입
export interface BlockValue {
  blockId: string;
  value: BlockDefaultValue;
}

// 기록 API 클라이언트
export interface Entry {
  id: string;
  userId: string;
  albumId: string;
  blockValues: BlockValue[];
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryData {
  albumId: string;
  blockValues?: BlockValue[];
  tags?: string[];
}

export interface UpdateEntryData {
  blockValues?: BlockValue[];
  tags?: string[];
}

// 기록 조회 (앨범 ID로 필터링 가능)
export async function getEntries(albumId?: string): Promise<Entry[]> {
  const url = albumId ? `/api/entries?albumId=${albumId}` : "/api/entries";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch entries");
  }
  return res.json();
}

// 특정 기록 조회
export async function getEntry(id: string): Promise<Entry> {
  const res = await fetch(`/api/entries/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch entry");
  }
  return res.json();
}

// 기록 생성
export async function createEntry(data: CreateEntryData): Promise<Entry> {
  const res = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to create entry");
  }
  return res.json();
}

// 기록 수정
export async function updateEntry(id: string, data: UpdateEntryData): Promise<Entry> {
  const res = await fetch(`/api/entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update entry");
  }
  return res.json();
}

// 기록 삭제
export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/entries/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete entry");
  }
}
