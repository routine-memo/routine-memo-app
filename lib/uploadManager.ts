/**
 * 전역 업로드 매니저
 * - 컴포넌트 생명주기와 무관하게 업로드 진행
 * - 업로드 완료 시 콜백 호출하여 상태 업데이트
 */

import { uploadMedia } from '@/lib/api/media';

export interface UploadTask {
  id: string;           // 고유 ID (placeholder로 사용)
  file: File;           // 업로드할 파일
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  url?: string;         // 업로드 완료 시 URL
  error?: string;       // 에러 메시지
  onComplete?: (url: string) => void;  // 완료 콜백
  onError?: (error: string) => void;   // 에러 콜백
}

type UploadListener = (tasks: Map<string, UploadTask>) => void;

class UploadManager {
  private tasks: Map<string, UploadTask> = new Map();
  private listeners: Set<UploadListener> = new Set();
  private isProcessing = false;

  // 업로드 작업 추가
  addTask(
    file: File,
    options?: {
      onComplete?: (url: string) => void;
      onError?: (error: string) => void;
    }
  ): string {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const task: UploadTask = {
      id,
      file,
      status: 'pending',
      onComplete: options?.onComplete,
      onError: options?.onError,
    };

    this.tasks.set(id, task);
    this.notifyListeners();
    this.processQueue();

    return id;
  }

  // 여러 파일 한번에 추가
  addTasks(
    files: File[],
    options?: {
      onComplete?: (id: string, url: string) => void;
      onError?: (id: string, error: string) => void;
    }
  ): string[] {
    const ids: string[] = [];

    for (const file of files) {
      const id = this.addTask(file, {
        onComplete: (url) => options?.onComplete?.(id, url),
        onError: (error) => options?.onError?.(id, error),
      });
      ids.push(id);
    }

    return ids;
  }

  // 업로드 큐 처리 (동시 3개까지)
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const MAX_CONCURRENT = 3;

    while (true) {
      const pendingTasks = Array.from(this.tasks.values())
        .filter(t => t.status === 'pending');

      const uploadingCount = Array.from(this.tasks.values())
        .filter(t => t.status === 'uploading').length;

      const availableSlots = MAX_CONCURRENT - uploadingCount;

      if (pendingTasks.length === 0 || availableSlots <= 0) {
        break;
      }

      const tasksToStart = pendingTasks.slice(0, availableSlots);

      for (const task of tasksToStart) {
        this.startUpload(task);
      }

      // 잠시 대기 후 다시 체크
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  // 단일 업로드 시작
  private async startUpload(task: UploadTask) {
    task.status = 'uploading';
    this.tasks.set(task.id, task);
    this.notifyListeners();

    try {
      const result = await uploadMedia(task.file);

      task.status = 'completed';
      task.url = result.url;
      this.tasks.set(task.id, task);
      this.notifyListeners();

      // 완료 콜백 호출
      task.onComplete?.(result.url);

      // 완료된 작업은 일정 시간 후 제거
      setTimeout(() => {
        this.tasks.delete(task.id);
        this.notifyListeners();
      }, 5000);

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Upload failed';
      this.tasks.set(task.id, task);
      this.notifyListeners();

      // 에러 콜백 호출
      task.onError?.(task.error);
    }

    // 다음 큐 처리
    this.processQueue();
  }

  // 작업 상태 조회
  getTask(id: string): UploadTask | undefined {
    return this.tasks.get(id);
  }

  // 모든 작업 조회
  getAllTasks(): UploadTask[] {
    return Array.from(this.tasks.values());
  }

  // 진행 중인 업로드 수
  getActiveCount(): number {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'pending' || t.status === 'uploading')
      .length;
  }

  // 리스너 등록
  subscribe(listener: UploadListener): () => void {
    this.listeners.add(listener);
    // 초기 상태 전달
    listener(this.tasks);
    // 구독 해제 함수 반환
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 모든 리스너에게 알림
  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.tasks);
    }
  }

  // 작업 취소 (아직 시작 안된 경우만)
  cancelTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (task && task.status === 'pending') {
      this.tasks.delete(id);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // 실패한 작업 재시도
  retryTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (task && task.status === 'failed') {
      task.status = 'pending';
      task.error = undefined;
      this.tasks.set(id, task);
      this.notifyListeners();
      this.processQueue();
      return true;
    }
    return false;
  }
}

// 싱글톤 인스턴스
export const uploadManager = new UploadManager();
