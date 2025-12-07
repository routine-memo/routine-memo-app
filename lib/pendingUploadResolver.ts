/**
 * Pending Upload Resolver
 * - 저장된 데이터에서 __uploading__ placeholder를 감지하고
 * - 업로드 완료 시 실제 URL로 업데이트하는 로직
 */

import { uploadManager, UploadTask } from './uploadManager';

export interface PendingUploadInfo {
  blockId: string;
  blockType: 'image' | 'video';
  uploadId: string;
  arrayIndex: number;
}

// placeholder 형식: __uploading__upload_123456_abc123
const UPLOAD_PLACEHOLDER_PREFIX = '__uploading__';

/**
 * 블록 데이터에서 pending 업로드를 찾아서 반환
 */
export function findPendingUploads(blocks: any[]): PendingUploadInfo[] {
  const pending: PendingUploadInfo[] = [];

  blocks.forEach((block, blockIndex) => {
    if (block.type === 'image' && block.value?.images) {
      block.value.images.forEach((img: string, imgIndex: number) => {
        if (img && img.startsWith(UPLOAD_PLACEHOLDER_PREFIX)) {
          const uploadId = img.replace(UPLOAD_PLACEHOLDER_PREFIX, '');
          pending.push({
            blockId: block.id || `block_${blockIndex}`,
            blockType: 'image',
            uploadId,
            arrayIndex: imgIndex,
          });
        }
      });
    }

    if (block.type === 'video' && block.value?.videos) {
      block.value.videos.forEach((video: string, videoIndex: number) => {
        if (video && video.startsWith(UPLOAD_PLACEHOLDER_PREFIX)) {
          const uploadId = video.replace(UPLOAD_PLACEHOLDER_PREFIX, '');
          pending.push({
            blockId: block.id || `block_${blockIndex}`,
            blockType: 'video',
            uploadId,
            arrayIndex: videoIndex,
          });
        }
      });
    }
  });

  return pending;
}

/**
 * 블록 데이터에서 pending placeholder를 실제 URL로 교체
 * @returns 업데이트된 블록 배열 (placeholder가 URL로 교체됨)
 */
export function resolvePendingUploads(blocks: any[]): any[] {
  return blocks.map(block => {
    if (block.type === 'image' && block.value?.images) {
      const resolvedImages = block.value.images.map((img: string) => {
        if (img && img.startsWith(UPLOAD_PLACEHOLDER_PREFIX)) {
          const uploadId = img.replace(UPLOAD_PLACEHOLDER_PREFIX, '');
          const task = uploadManager.getTask(uploadId);
          if (task?.status === 'completed' && task.url) {
            return task.url;
          }
        }
        return img;
      });

      return {
        ...block,
        value: {
          ...block.value,
          images: resolvedImages,
        },
      };
    }

    if (block.type === 'video' && block.value?.videos) {
      const resolvedVideos = block.value.videos.map((video: string) => {
        if (video && video.startsWith(UPLOAD_PLACEHOLDER_PREFIX)) {
          const uploadId = video.replace(UPLOAD_PLACEHOLDER_PREFIX, '');
          const task = uploadManager.getTask(uploadId);
          if (task?.status === 'completed' && task.url) {
            return task.url;
          }
        }
        return video;
      });

      return {
        ...block,
        value: {
          ...block.value,
          videos: resolvedVideos,
        },
      };
    }

    return block;
  });
}

/**
 * 모든 pending 업로드가 완료될 때까지 기다림
 * @param timeoutMs 최대 대기 시간 (기본 5분)
 * @returns 모든 업로드가 완료되면 true, 타임아웃 시 false
 */
export async function waitForPendingUploads(timeoutMs: number = 5 * 60 * 1000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const activeCount = uploadManager.getActiveCount();
    if (activeCount === 0) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return false;
}

/**
 * 특정 업로드 ID들이 완료될 때까지 기다림
 */
export async function waitForUploads(
  uploadIds: string[],
  timeoutMs: number = 5 * 60 * 1000
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    let allDone = true;

    for (const uploadId of uploadIds) {
      if (results.has(uploadId)) continue;

      const task = uploadManager.getTask(uploadId);
      if (!task) {
        // 작업이 이미 정리됨 - 실패로 처리
        results.set(uploadId, null);
        continue;
      }

      if (task.status === 'completed') {
        results.set(uploadId, task.url || null);
      } else if (task.status === 'failed') {
        results.set(uploadId, null);
      } else {
        allDone = false;
      }
    }

    if (allDone) {
      return results;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 타임아웃 - 아직 완료되지 않은 것들은 null로 설정
  for (const uploadId of uploadIds) {
    if (!results.has(uploadId)) {
      results.set(uploadId, null);
    }
  }

  return results;
}

/**
 * placeholder를 포함하는지 확인
 */
export function hasPendingUploads(blocks: any[]): boolean {
  return findPendingUploads(blocks).length > 0;
}

/**
 * 완료되지 않은 업로드 placeholder를 필터링 (저장하기 전에 사용)
 * 빈 값이나 아직 업로드 중인 placeholder는 제거
 */
export function filterIncompletePlaceholders(blocks: any[]): any[] {
  return blocks.map(block => {
    if (block.type === 'image' && block.value?.images) {
      const filteredImages = block.value.images.filter((img: string) => {
        if (!img) return false;
        if (img.startsWith(UPLOAD_PLACEHOLDER_PREFIX)) {
          const uploadId = img.replace(UPLOAD_PLACEHOLDER_PREFIX, '');
          const task = uploadManager.getTask(uploadId);
          // 완료된 것만 유지 (실제로는 resolvePendingUploads에서 URL로 교체됨)
          return task?.status === 'completed';
        }
        return true;
      });

      return {
        ...block,
        value: {
          ...block.value,
          images: filteredImages,
        },
      };
    }

    if (block.type === 'video' && block.value?.videos) {
      const filteredVideos = block.value.videos.filter((video: string) => {
        if (!video) return false;
        if (video.startsWith(UPLOAD_PLACEHOLDER_PREFIX)) {
          const uploadId = video.replace(UPLOAD_PLACEHOLDER_PREFIX, '');
          const task = uploadManager.getTask(uploadId);
          return task?.status === 'completed';
        }
        return true;
      });

      return {
        ...block,
        value: {
          ...block.value,
          videos: filteredVideos,
        },
      };
    }

    return block;
  });
}
