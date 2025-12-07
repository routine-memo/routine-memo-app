import { BlockPosition } from '@/app/template/new/types';

// 알림 설정 타입
export interface AlbumNotification {
  enabled: boolean;
  time?: string;        // HH:mm 형식 (예: "09:00")
  days?: number[];      // 0=일, 1=월, ..., 6=토
}

// 앨범 타입 정의
export interface Album {
  id: string;
  name: string;
  blocks: BlockPosition[];
  createdAt: string;
  updatedAt: string;
  pageCount: number; // 앨범 내 페이지(기록) 수
  notification?: AlbumNotification;
}

const ALBUMS_STORAGE_KEY = 'routine-memo-albums';

// 모든 앨범 가져오기
export function getAlbums(): Album[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(ALBUMS_STORAGE_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 앨범 저장하기
export function saveAlbum(album: Omit<Album, 'id' | 'createdAt' | 'updatedAt' | 'pageCount'>): Album {
  const albums = getAlbums();

  const newAlbum: Album = {
    ...album,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pageCount: 0,
  };

  albums.push(newAlbum);
  localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(albums));

  return newAlbum;
}

// 앨범 업데이트
export function updateAlbum(id: string, updates: Partial<Album>): Album | null {
  const albums = getAlbums();
  const index = albums.findIndex(a => a.id === id);

  if (index === -1) return null;

  albums[index] = {
    ...albums[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(albums));
  return albums[index];
}

// 앨범 삭제
export function deleteAlbum(id: string): boolean {
  const albums = getAlbums();
  const filtered = albums.filter(a => a.id !== id);

  if (filtered.length === albums.length) return false;

  localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 단일 앨범 가져오기
export function getAlbum(id: string): Album | null {
  const albums = getAlbums();
  return albums.find(a => a.id === id) || null;
}

// ID 생성
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
