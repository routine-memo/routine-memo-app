/**
 * IndexedDB 기반 미디어 스토리지
 * 이미지, 동영상, 파일 등 큰 바이너리 데이터를 저장
 */

const DB_NAME = 'routine-memo-media';
const DB_VERSION = 1;
const STORE_NAME = 'media';

interface MediaItem {
  id: string;        // 고유 ID (entryId_blockId_index 형태)
  entryId: string;   // 소속 엔트리 ID
  blockId: string;   // 소속 블록 ID
  type: 'image' | 'video' | 'file';
  data: string;      // base64 데이터
  fileName?: string; // 파일명 (파일 타입인 경우)
  mimeType?: string; // MIME 타입
  createdAt: string;
}

let dbInstance: IDBDatabase | null = null;

// DB 초기화
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB 열기 실패'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('entryId', 'entryId', { unique: false });
        store.createIndex('blockId', 'blockId', { unique: false });
        store.createIndex('entryBlockId', ['entryId', 'blockId'], { unique: false });
      }
    };
  });
}

// 미디어 ID 생성
export function generateMediaId(entryId: string, blockId: string, index: number): string {
  return `${entryId}_${blockId}_${index}`;
}

// 미디어 저장
export async function saveMedia(
  entryId: string,
  blockId: string,
  index: number,
  type: 'image' | 'video' | 'file',
  data: string,
  options?: { fileName?: string; mimeType?: string }
): Promise<string> {
  const db = await openDB();
  const id = generateMediaId(entryId, blockId, index);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const item: MediaItem = {
      id,
      entryId,
      blockId,
      type,
      data,
      fileName: options?.fileName,
      mimeType: options?.mimeType,
      createdAt: new Date().toISOString(),
    };

    const request = store.put(item);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(new Error('미디어 저장 실패'));
  });
}

// 단일 미디어 가져오기
export async function getMedia(mediaId: string): Promise<string | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(mediaId);

    request.onsuccess = () => {
      const item = request.result as MediaItem | undefined;
      resolve(item?.data || null);
    };
    request.onerror = () => reject(new Error('미디어 조회 실패'));
  });
}

// 블록의 모든 미디어 가져오기
export async function getMediaByBlock(entryId: string, blockId: string): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('entryBlockId');
    const request = index.getAll([entryId, blockId]);

    request.onsuccess = () => {
      const items = (request.result as MediaItem[]).sort((a, b) => {
        // ID에서 인덱스 추출하여 정렬
        const aIdx = parseInt(a.id.split('_').pop() || '0');
        const bIdx = parseInt(b.id.split('_').pop() || '0');
        return aIdx - bIdx;
      });
      resolve(items.map(item => item.data));
    };
    request.onerror = () => reject(new Error('미디어 조회 실패'));
  });
}

// 엔트리의 모든 미디어 삭제
export async function deleteMediaByEntry(entryId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('entryId');
    const request = index.getAllKeys(entryId);

    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach(key => store.delete(key));
      resolve();
    };
    request.onerror = () => reject(new Error('미디어 삭제 실패'));
  });
}

// 블록의 모든 미디어 삭제
export async function deleteMediaByBlock(entryId: string, blockId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('entryBlockId');
    const request = index.getAllKeys([entryId, blockId]);

    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach(key => store.delete(key));
      resolve();
    };
    request.onerror = () => reject(new Error('미디어 삭제 실패'));
  });
}

// 단일 미디어 삭제
export async function deleteMedia(mediaId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(mediaId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('미디어 삭제 실패'));
  });
}

// 여러 미디어 저장 (블록 단위)
export async function saveMediaBatch(
  entryId: string,
  blockId: string,
  type: 'image' | 'video' | 'file',
  dataArray: string[],
  options?: { fileNames?: string[]; mimeTypes?: string[] }
): Promise<string[]> {
  const ids: string[] = [];

  // 먼저 기존 미디어 삭제
  await deleteMediaByBlock(entryId, blockId);

  // 새 미디어 저장
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i]) {
      const id = await saveMedia(
        entryId,
        blockId,
        i,
        type,
        dataArray[i],
        {
          fileName: options?.fileNames?.[i],
          mimeType: options?.mimeTypes?.[i],
        }
      );
      ids.push(id);
    }
  }

  return ids;
}

// 미디어 참조 ID인지 확인 (base64가 아닌 ID 형태)
export function isMediaReference(value: string): boolean {
  // media:로 시작하는 참조 형태
  return value.startsWith('media:');
}

// 미디어 참조 ID 생성
export function createMediaReference(mediaId: string): string {
  return `media:${mediaId}`;
}

// 미디어 참조에서 ID 추출
export function extractMediaId(reference: string): string | null {
  if (reference.startsWith('media:')) {
    return reference.slice(6);
  }
  return null;
}

// 미디어 데이터 로드 (참조 또는 base64 모두 처리)
export async function loadMediaData(value: string): Promise<string> {
  if (isMediaReference(value)) {
    const mediaId = extractMediaId(value);
    if (mediaId) {
      const data = await getMedia(mediaId);
      return data || '';
    }
    return '';
  }
  // base64 데이터인 경우 그대로 반환
  return value;
}

// 전체 스토리지 사용량 확인 (대략적)
export async function getStorageUsage(): Promise<{ count: number; estimatedSize: string }> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;

      // 대략적인 크기 계산을 위해 모든 데이터 가져오기
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result as MediaItem[];
        let totalBytes = 0;
        items.forEach(item => {
          totalBytes += item.data.length;
        });

        const sizeInMB = (totalBytes / (1024 * 1024)).toFixed(2);
        resolve({ count, estimatedSize: `${sizeInMB} MB` });
      };
      getAllRequest.onerror = () => resolve({ count, estimatedSize: 'Unknown' });
    };
    countRequest.onerror = () => reject(new Error('스토리지 사용량 조회 실패'));
  });
}
