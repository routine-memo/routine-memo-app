import { BlockPosition, BlockDefaultValue } from '@/app/template/new/types';
import {
  saveMediaBatch,
  deleteMediaByEntry,
  createMediaReference,
  isMediaReference,
  loadMediaData,
} from './mediaStorage';

// 즉석 앨범 기록 타입 정의
export interface DailyEntry {
  id: string;
  createdAt: string;         // 생성 시간
  updatedAt: string;         // 수정 시간
  blocks: BlockPosition[];   // 블록 구조 (일회성, 기록에 포함)
  blockValues: BlockValue[]; // 각 블록의 입력값
  tags?: string[];           // 태그 목록
}

// 블록별 입력값
export interface BlockValue {
  blockId: string;
  value: BlockDefaultValue;
}

const DAILY_ENTRIES_STORAGE_KEY = 'routine-memo-daily-entries';

// base64 데이터인지 확인
function isBase64Data(value: string): boolean {
  return value.startsWith('data:');
}

// 모든 즉석 앨범 기록 가져오기
export function getDailyEntries(): DailyEntry[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(DAILY_ENTRIES_STORAGE_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 단일 기록 가져오기
export function getDailyEntry(id: string): DailyEntry | null {
  const entries = getDailyEntries();
  return entries.find(e => e.id === id) || null;
}

// 모든 기록 조회 (최신순)
export function getDailyEntriesSorted(): DailyEntry[] {
  const entries = getDailyEntries();
  return entries.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// 즉석 앨범 전체 태그 목록 (빈도순)
export function getDailyTags(): { tag: string; count: number }[] {
  const entries = getDailyEntries();
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

// 기록 저장
export async function saveDailyEntry(
  entry: Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DailyEntry> {
  const entries = getDailyEntries();
  const entryId = generateId();

  // 미디어 데이터를 IndexedDB로 분리 저장
  const processedBlockValues = await extractAndSaveMedia(entryId, entry.blockValues);

  const newEntry: DailyEntry = {
    ...entry,
    id: entryId,
    blockValues: processedBlockValues,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  entries.push(newEntry);
  localStorage.setItem(DAILY_ENTRIES_STORAGE_KEY, JSON.stringify(entries));

  return newEntry;
}

// 기록 업데이트
export function updateDailyEntry(id: string, updates: Partial<DailyEntry>): DailyEntry | null {
  const entries = getDailyEntries();
  const index = entries.findIndex(e => e.id === id);

  if (index === -1) return null;

  entries[index] = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(DAILY_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  return entries[index];
}

// 기록 삭제
export async function deleteDailyEntry(id: string): Promise<boolean> {
  const entries = getDailyEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return false;

  // IndexedDB에서 미디어 삭제
  try {
    await deleteMediaByEntry(id);
  } catch (e) {
    console.warn('미디어 삭제 실패:', e);
  }

  const filtered = entries.filter(e => e.id !== id);
  localStorage.setItem(DAILY_ENTRIES_STORAGE_KEY, JSON.stringify(filtered));

  return true;
}

// 미디어 참조를 실제 데이터로 변환 (블록 값 하나)
async function loadBlockMediaData(value: BlockDefaultValue): Promise<BlockDefaultValue> {
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
export async function loadDailyEntryWithMedia(entry: DailyEntry): Promise<DailyEntry> {
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
  return 'daily_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}
