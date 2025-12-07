import { BlockDefaultValue } from '@/app/template/new/types';
import {
  saveMediaBatch,
  deleteMediaByEntry,
  createMediaReference,
  isMediaReference,
  loadMediaData,
} from './mediaStorage';

// 기록(Entry) 타입 정의 - 앨범 내 개별 기록
export interface Entry {
  id: string;
  albumId: string;           // 소속 앨범 ID
  createdAt: string;         // 생성 시간
  updatedAt: string;         // 수정 시간
  blockValues: BlockValue[]; // 각 블록의 입력값
  tags?: string[];           // 태그 목록
}

// 블록별 입력값 - 블록 ID와 값을 매핑
export interface BlockValue {
  blockId: string;           // BlockPosition의 id와 매칭
  value: BlockDefaultValue;  // 해당 블록의 입력 데이터
}

const ENTRIES_STORAGE_KEY = 'routine-memo-entries';

// base64 데이터인지 확인 (data:로 시작)
function isBase64Data(value: string): boolean {
  return value.startsWith('data:');
}

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

// 특정 앨범에서 사용된 모든 태그 가져오기 (빈도순 정렬)
export function getTagsByAlbum(albumId: string): { tag: string; count: number }[] {
  const entries = getEntriesByAlbum(albumId);
  const tagCount = new Map<string, number>();

  entries.forEach(entry => {
    if (entry.tags) {
      entry.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    }
  });

  return Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// 미디어 데이터를 IndexedDB로 분리하고 참조로 대체
async function extractAndSaveMedia(
  entryId: string,
  blockValues: BlockValue[]
): Promise<BlockValue[]> {
  const processedValues: BlockValue[] = [];

  for (const bv of blockValues) {
    const { blockId, value } = bv;
    let processedValue = { ...value };

    // 이미지 블록 처리
    if (value.type === 'image' && value.value.images) {
      const images = value.value.images.filter(img => img && isBase64Data(img));
      if (images.length > 0) {
        await saveMediaBatch(entryId, blockId, 'image', images);
        // base64 데이터를 참조로 대체
        processedValue = {
          ...value,
          value: {
            ...value.value,
            images: value.value.images.map((img, idx) =>
              img && isBase64Data(img)
                ? createMediaReference(`${entryId}_${blockId}_${idx}`)
                : img
            ),
          },
        };
      }
    }

    // 비디오 블록 처리
    if (value.type === 'video' && value.value.videos) {
      const videos = value.value.videos.filter(vid => vid && isBase64Data(vid));
      if (videos.length > 0) {
        await saveMediaBatch(entryId, blockId, 'video', videos);
        processedValue = {
          ...value,
          value: {
            ...value.value,
            videos: value.value.videos.map((vid, idx) =>
              vid && isBase64Data(vid)
                ? createMediaReference(`${entryId}_${blockId}_${idx}`)
                : vid
            ),
          },
        };
      }
    }

    // 파일 블록 처리
    if (value.type === 'file' && value.value.files) {
      const files = value.value.files.filter(f => f.data && isBase64Data(f.data));
      if (files.length > 0) {
        await saveMediaBatch(
          entryId,
          blockId,
          'file',
          value.value.files.map(f => f.data || ''),
          { fileNames: value.value.files.map(f => f.name) }
        );
        processedValue = {
          ...value,
          value: {
            ...value.value,
            files: value.value.files.map((file, idx) =>
              file.data && isBase64Data(file.data)
                ? { ...file, data: createMediaReference(`${entryId}_${blockId}_${idx}`) }
                : file
            ),
          },
        };
      }
    }

    processedValues.push({ blockId, value: processedValue });
  }

  return processedValues;
}

// 기록 저장하기 (비동기)
export async function saveEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entry> {
  const entries = getEntries();
  const entryId = generateId();

  // 미디어 데이터를 IndexedDB로 분리 저장
  const processedBlockValues = await extractAndSaveMedia(entryId, entry.blockValues);

  const newEntry: Entry = {
    ...entry,
    id: entryId,
    blockValues: processedBlockValues,
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

// 기록 삭제 (비동기 - IndexedDB 미디어도 삭제)
export async function deleteEntry(id: string): Promise<boolean> {
  const entries = getEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return false;

  // IndexedDB에서 미디어 삭제
  try {
    await deleteMediaByEntry(id);
  } catch (e) {
    console.warn('미디어 삭제 실패:', e);
  }

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

// 미디어 참조를 실제 데이터로 변환 (블록 값 하나)
export async function loadBlockMediaData(value: BlockDefaultValue): Promise<BlockDefaultValue> {
  if (value.type === 'image' && value.value.images) {
    const loadedImages = await Promise.all(
      value.value.images.map(img =>
        img && isMediaReference(img) ? loadMediaData(img) : Promise.resolve(img)
      )
    );
    return {
      ...value,
      value: { ...value.value, images: loadedImages },
    };
  }

  if (value.type === 'video' && value.value.videos) {
    const loadedVideos = await Promise.all(
      value.value.videos.map(vid =>
        vid && isMediaReference(vid) ? loadMediaData(vid) : Promise.resolve(vid)
      )
    );
    return {
      ...value,
      value: { ...value.value, videos: loadedVideos },
    };
  }

  if (value.type === 'file' && value.value.files) {
    const loadedFiles = await Promise.all(
      value.value.files.map(async file => {
        if (file.data && isMediaReference(file.data)) {
          const data = await loadMediaData(file.data);
          return { ...file, data };
        }
        return file;
      })
    );
    return {
      ...value,
      value: { ...value.value, files: loadedFiles },
    };
  }

  return value;
}

// 엔트리의 모든 미디어 참조를 실제 데이터로 변환
export async function loadEntryWithMedia(entry: Entry): Promise<Entry> {
  const loadedBlockValues = await Promise.all(
    entry.blockValues.map(async bv => ({
      blockId: bv.blockId,
      value: await loadBlockMediaData(bv.value),
    }))
  );

  return {
    ...entry,
    blockValues: loadedBlockValues,
  };
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

const MIGRATION_KEY = 'routine-memo-media-migrated';

// 기존 localStorage의 base64 데이터를 IndexedDB로 마이그레이션
export async function migrateMediaToIndexedDB(): Promise<{ migrated: number; failed: number }> {
  // 이미 마이그레이션 완료했는지 확인
  if (localStorage.getItem(MIGRATION_KEY) === 'true') {
    return { migrated: 0, failed: 0 };
  }

  const entries = getEntries();
  let migrated = 0;
  let failed = 0;

  for (const entry of entries) {
    let hasChanges = false;
    const updatedBlockValues: BlockValue[] = [];

    for (const bv of entry.blockValues) {
      const { blockId, value } = bv;
      let processedValue = { ...value };

      try {
        // 이미지 블록 마이그레이션
        if (value.type === 'image' && value.value.images) {
          const hasBase64 = value.value.images.some(img => img && isBase64Data(img));
          if (hasBase64) {
            const images = value.value.images.filter(img => img && isBase64Data(img));
            await saveMediaBatch(entry.id, blockId, 'image', images);

            processedValue = {
              ...value,
              value: {
                ...value.value,
                images: value.value.images.map((img, idx) =>
                  img && isBase64Data(img)
                    ? createMediaReference(`${entry.id}_${blockId}_${idx}`)
                    : img
                ),
              },
            };
            hasChanges = true;
            migrated++;
          }
        }

        // 비디오 블록 마이그레이션
        if (value.type === 'video' && value.value.videos) {
          const hasBase64 = value.value.videos.some(vid => vid && isBase64Data(vid));
          if (hasBase64) {
            const videos = value.value.videos.filter(vid => vid && isBase64Data(vid));
            await saveMediaBatch(entry.id, blockId, 'video', videos);

            processedValue = {
              ...value,
              value: {
                ...value.value,
                videos: value.value.videos.map((vid, idx) =>
                  vid && isBase64Data(vid)
                    ? createMediaReference(`${entry.id}_${blockId}_${idx}`)
                    : vid
                ),
              },
            };
            hasChanges = true;
            migrated++;
          }
        }

        // 파일 블록 마이그레이션
        if (value.type === 'file' && value.value.files) {
          const hasBase64 = value.value.files.some(f => f.data && isBase64Data(f.data));
          if (hasBase64) {
            await saveMediaBatch(
              entry.id,
              blockId,
              'file',
              value.value.files.map(f => f.data || ''),
              { fileNames: value.value.files.map(f => f.name) }
            );

            processedValue = {
              ...value,
              value: {
                ...value.value,
                files: value.value.files.map((file, idx) =>
                  file.data && isBase64Data(file.data)
                    ? { ...file, data: createMediaReference(`${entry.id}_${blockId}_${idx}`) }
                    : file
                ),
              },
            };
            hasChanges = true;
            migrated++;
          }
        }
      } catch (e) {
        console.error('마이그레이션 실패:', e);
        failed++;
      }

      updatedBlockValues.push({ blockId, value: processedValue });
    }

    // 변경된 엔트리 저장
    if (hasChanges) {
      const allEntries = getEntries();
      const idx = allEntries.findIndex(e => e.id === entry.id);
      if (idx !== -1) {
        allEntries[idx] = {
          ...entry,
          blockValues: updatedBlockValues,
        };
        localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(allEntries));
      }
    }
  }

  // 마이그레이션 완료 표시
  localStorage.setItem(MIGRATION_KEY, 'true');

  return { migrated, failed };
}
