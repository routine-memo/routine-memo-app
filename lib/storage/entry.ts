import { BlockPosition, BlockDefaultValue } from '@/app/template/new/types';

// 기록(Entry) 타입 정의 - 앨범 내 개별 기록
export interface Entry {
  id: string;
  albumId: string;           // 소속 앨범 ID
  createdAt: string;         // 생성 시간
  updatedAt: string;         // 수정 시간
  blockValues: BlockValue[]; // 각 블록의 입력값
}

// 블록별 입력값 - 블록 ID와 값을 매핑
export interface BlockValue {
  blockId: string;           // BlockPosition의 id와 매칭
  value: BlockDefaultValue;  // 해당 블록의 입력 데이터
}

const ENTRIES_STORAGE_KEY = 'routine-memo-entries';

// 모든 기록 가져오기
export function getEntries(): Entry[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(ENTRIES_STORAGE_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 특정 앨범의 기록들 가져오기
export function getEntriesByAlbum(albumId: string): Entry[] {
  const entries = getEntries();
  return entries
    .filter(e => e.albumId === albumId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 기록 저장하기
export function saveEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>): Entry {
  const entries = getEntries();

  const newEntry: Entry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  entries.push(newEntry);
  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));

  // 앨범의 pageCount 업데이트
  updateAlbumPageCount(entry.albumId);

  return newEntry;
}

// 기록 업데이트
export function updateEntry(id: string, updates: Partial<Entry>): Entry | null {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === id);

  if (index === -1) return null;

  entries[index] = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  return entries[index];
}

// 기록 삭제
export function deleteEntry(id: string): boolean {
  const entries = getEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return false;

  const filtered = entries.filter(e => e.id !== id);
  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(filtered));

  // 앨범의 pageCount 업데이트
  updateAlbumPageCount(entry.albumId);

  return true;
}

// 단일 기록 가져오기
export function getEntry(id: string): Entry | null {
  const entries = getEntries();
  return entries.find(e => e.id === id) || null;
}

// ID 생성
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 앨범의 pageCount 업데이트
function updateAlbumPageCount(albumId: string): void {
  // 순환 의존성 방지를 위해 직접 localStorage 접근
  const ALBUMS_STORAGE_KEY = 'routine-memo-albums';
  const albumsData = localStorage.getItem(ALBUMS_STORAGE_KEY);
  if (!albumsData) return;

  try {
    const albums = JSON.parse(albumsData);
    const index = albums.findIndex((a: { id: string }) => a.id === albumId);
    if (index === -1) return;

    const entriesData = localStorage.getItem(ENTRIES_STORAGE_KEY);
    const entries = entriesData ? JSON.parse(entriesData) : [];
    const count = entries.filter((e: Entry) => e.albumId === albumId).length;

    albums[index].pageCount = count;
    albums[index].updatedAt = new Date().toISOString();

    localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(albums));
  } catch {
    // 에러 무시
  }
}
