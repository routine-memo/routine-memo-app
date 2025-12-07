'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import { NotificationSettings } from '@/types/template';
import { createAlbum, AlbumNotification } from '@/lib/api/albums';

// Import types and utilities
import { BlockPosition, BlockType, Step } from './types';
import { iconMap } from './iconMap';
import { createBlock, deleteBlock } from './blockManagement';
import { GridLayoutBlocks } from './components/GridLayoutBlocks';
import { BlockPalette } from './components/BlockPalette';
import { DefaultsStep } from './components/DefaultsStep';

export default function NewTemplatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [templateName, setTemplateName] = useState('');
  const [blockPositions, setBlockPositions] = useState<BlockPosition[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [notification, setNotification] = useState<AlbumNotification>({
    enabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 컨테이너 너비 감지 - ref 콜백 + useEffect 조합
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    // 이전 observer 정리
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // ref를 저장
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

    if (!node) return;

    const updateWidth = () => {
      const width = node.clientWidth;
      console.log('Grid width updated:', width);
      setGridWidth(width > 0 ? width : 300);
    };

    // 즉시 계산
    updateWidth();

    // ResizeObserver로 크기 변화 감지
    resizeObserverRef.current = new ResizeObserver(updateWidth);
    resizeObserverRef.current.observe(node);
  }, []);

  // cleanup effect
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // 블록 추가
  const addBlock = useCallback((type: BlockType) => {
    const newBlock = createBlock(type, blockPositions);
    setBlockPositions([...blockPositions, newBlock]);
    setShowPalette(false);
  }, [blockPositions]);

  // 블록 삭제
  const removeBlock = useCallback((id: string) => {
    const updatedBlocks = deleteBlock(id, blockPositions);
    setBlockPositions(updatedBlocks);
  }, [blockPositions]);

  // 레이아웃 변경 핸들러 (react-grid-layout에서 호출)
  const handleLayoutChange = useCallback((updatedBlocks: BlockPosition[]) => {
    setBlockPositions(updatedBlocks);
  }, []);

  // 단계별 렌더링
  if (step === 'name') {
    return (
      <main className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <button onClick={() => router.back()} className="mb-6 text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">앨범 이름</h1>
          <p className="text-sm text-gray-600 mb-6">
            어떤 앨범을 만들까요?
          </p>

          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="예: 턱걸이 앨범, 여행 일지, 공부 노트"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
          />

          <button
            onClick={() => setStep('blocks')}
            disabled={!templateName.trim()}
            className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            다음
          </button>
        </div>
      </main>
    );
  }

  if (step === 'blocks') {
    return (
      <main className="fixed inset-0 flex flex-col bg-gray-50">
        {/* 헤더 */}
        <div className="flex-none bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setStep('name')} className="text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{templateName}</h1>
          <button
            onClick={() => setStep('defaults')}
            className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            다음
          </button>
        </div>

        {/* 블록 영역 - react-grid-layout 사용 */}
        <div
          className="flex-1 overflow-y-auto py-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div ref={setContainerRef} className="mx-4 pb-[50vh]">
            <GridLayoutBlocks
              blockPositions={blockPositions}
              iconMap={iconMap}
              gridWidth={gridWidth}
              onLayoutChange={handleLayoutChange}
              onRemove={removeBlock}
            />
          </div>
        </div>

        {/* 블록 팔레트 */}
        <BlockPalette
          showPalette={showPalette}
          iconMap={iconMap}
          onToggle={() => setShowPalette(!showPalette)}
          onAddBlock={addBlock}
        />
      </main>
    );
  }

  // defaults step
  if (step === 'defaults') {
    return (
      <DefaultsStep
        templateName={templateName}
        blockPositions={blockPositions}
        iconMap={iconMap}
        onBack={() => setStep('blocks')}
        onNext={(updatedBlocks) => {
          setBlockPositions(updatedBlocks);
          setStep('notification');
        }}
      />
    );
  }

  // notification step
  return (
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <button onClick={() => setStep('defaults')} className="mb-6 text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">알림 설정</h1>
        <p className="text-sm text-gray-600 mb-6">
          앨범 알림을 받고 싶으신가요?
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="font-medium text-gray-900">알림 받기</span>
            </div>
            <label className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={notification.enabled}
                onChange={(e) => setNotification({ ...notification, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-full h-full bg-gray-200 rounded-full peer peer-checked:bg-gray-900 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
            </label>
          </div>
        </div>

        <button
          onClick={async () => {
            if (isSaving) return;
            setIsSaving(true);
            try {
              // 앨범 저장 (API 호출)
              await createAlbum({
                name: templateName,
                blocks: blockPositions,
                notification: notification.enabled ? notification : undefined,
              });
              router.push('/records');
            } catch (error) {
              console.error('Failed to create album:', error);
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '완료'}
        </button>
      </div>
    </main>
  );
}
