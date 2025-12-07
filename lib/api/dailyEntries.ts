import { BlockPosition } from "@/app/template/new/types";
import { BlockValue } from "./entries";

// 즉석 앨범 기록 API 클라이언트
export interface DailyEntry {
  id: string;
  userId: string;
  blocks: BlockPosition[];
  blockValues: BlockValue[];
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyEntryData {
  blocks?: BlockPosition[];
  blockValues?: BlockValue[];
  tags?: string[];
}

export interface UpdateDailyEntryData {
  blocks?: BlockPosition[];
  blockValues?: BlockValue[];
  tags?: string[];
}

// 모든 즉석 앨범 기록 조회
export async function getDailyEntries(): Promise<DailyEntry[]> {
  const res = await fetch("/api/daily-entries");
  if (!res.ok) {
    throw new Error("Failed to fetch daily entries");
  }
  return res.json();
}

// 특정 즉석 앨범 기록 조회
export async function getDailyEntry(id: string): Promise<DailyEntry> {
  const res = await fetch(`/api/daily-entries/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch daily entry");
  }
  return res.json();
}

// 즉석 앨범 기록 생성
export async function createDailyEntry(data: CreateDailyEntryData): Promise<DailyEntry> {
  const res = await fetch("/api/daily-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to create daily entry");
  }
  return res.json();
}

// 즉석 앨범 기록 수정
export async function updateDailyEntry(id: string, data: UpdateDailyEntryData): Promise<DailyEntry> {
  const res = await fetch(`/api/daily-entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update daily entry");
  }
  return res.json();
}

// 즉석 앨범 기록 삭제
export async function deleteDailyEntry(id: string): Promise<void> {
  const res = await fetch(`/api/daily-entries/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete daily entry");
  }
}
