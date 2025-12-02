'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Bell, Trash2, Pencil, Check, X } from 'lucide-react';
import { NotificationSettings } from '@/types/template';
import { getAlbum, updateAlbum, deleteAlbum } from '@/lib/storage/album';

// Import types and utilities
import { BlockPosition, BlockType, Step } from '@/app/template/new/types';
import { iconMap } from '@/app/template/new/iconMap';
import { createBlock, deleteBlock } from '@/app/template/new/blockManagement';
import { GridLayoutBlocks } from '@/app/template/new/components/GridLayoutBlocks';
import { BlockPalette } from '@/app/template/new/components/BlockPalette';
import { DefaultsStep } from '@/app/template/new/components/DefaultsStep';

type EditStep = 'blocks' | 'defaults' | 'notification';

export default function EditAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<EditStep>('blocks');
  const [templateName, setTemplateName] = useState('');
  const [blockPositions, setBlockPositions] = useState<BlockPosition[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [notification, setNotification] = useState<NotificationSettings>({
    enabled: false,
  });
  const [gridWidth, setGridWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 이름 편집 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 앨범 데이터 로드
  useEffect(() => {
    const album = getAlbum(albumId);
    if (album) {
      setTemplateName(album.name);
      setBlockPositions(album.blocks);
    } else {
      router.push('/records');
    }
    setIsLoading(false);
  }, [albumId, router]);

  // 이름 편집 시작
  const startEditingName = () => {
    setEditingNameValue(templateName);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  // 이름 편집 완료
  const finishEditingName = () => {
    if (editingNameValue.trim()) {
      setTemplateName(editingNameValue.trim());
    }
    setIsEditingName(false);
  };

  // 이름 편집 취소
  const cancelEditingName = () => {
    setIsEditingName(false);
  };

  // 컨테이너 너비 감지
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

    if (!node) return;

    const updateWidth = () => {
      const width = node.clientWidth;
      setGridWidth(width > 0 ? width : 300);
    };

    updateWidth();

    resizeObserverRef.current = new ResizeObserver(updateWidth);
    resizeObserverRef.current.observe(node);
  }, []);

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

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((updatedBlocks: BlockPosition[]) => {
    setBlockPositions(updatedBlocks);
  }, []);

  // 앨범 삭제
  const handleDeleteAlbum = () => {
    if (confirm('이 앨범을 삭제하시겠습니까? 모든 기록도 함께 삭제됩니다.')) {
      deleteAlbum(albumId);
      router.push('/records');
    }
  };

  if (isLoading) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-white">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  // 블록 편집 단계
  if (step === 'blocks') {
    return (
      <main className="fixed inset-0 flex flex-col bg-gray-50">
        {/* 헤더 */}
        <div className="flex-none bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* 앨범 이름 (편집 가능) */}
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1 mx-3">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditingName();
                    if (e.key === 'Escape') cancelEditingName();
                  }}
                  className="flex-1 px-3 py-1.5 text-lg font-semibold border-2 border-gray-900 rounded-lg focus:outline-none"
                  placeholder="앨범 이름"
                />
                <button
                  onClick={finishEditingName}
                  className="p-1.5 bg-gray-900 text-white rounded-lg"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEditingName}
                  className="p-1.5 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditingName}
                className="flex items-center gap-1.5 group mx-3"
              >
                <span className="text-lg font-semibold text-gray-900">{templateName}</span>
                <Pencil className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            )}

            <button
              onClick={() => setStep('defaults')}
              className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              다음
            </button>
          </div>

          {/* 삭제 버튼 */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleDeleteAlbum}
              className="flex items-center gap-1 text-red-500 text-xs hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              앨범 삭제
            </button>
          </div>
        </div>

        {/* 블록 영역 */}
        <div
          className="flex-1 overflow-y-auto py-6 pb-24"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div ref={setContainerRef} className="mx-4">
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

  // 기본값 설정 단계
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

  // 알림 설정 단계 (저장)
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
          onClick={() => {
            // 앨범 업데이트
            updateAlbum(albumId, {
              name: templateName,
              blocks: blockPositions,
            });
            router.push(`/album/${albumId}`);
          }}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          저장
        </button>
      </div>
    </main>
  );
}
