'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Bell, Pencil, Check, X } from 'lucide-react';
import { getAlbum, updateAlbum, Album, AlbumNotification } from '@/lib/api/albums';

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
  const [notification, setNotification] = useState<AlbumNotification>({
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
    const loadAlbum = async () => {
      try {
        const album = await getAlbum(albumId);
        setTemplateName(album.name);
        setBlockPositions(album.blocks);
        if (album.notification) {
          setNotification(album.notification as AlbumNotification);
        }
      } catch {
        router.push('/records');
      } finally {
        setIsLoading(false);
      }
    };
    loadAlbum();
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
    const confirmed = confirm(
      '이 블록을 삭제하면 기존 기록에 있는 해당 블록의 내용도 모두 삭제됩니다.\n정말 삭제하시겠습니까?'
    );

    if (confirmed) {
      const updatedBlocks = deleteBlock(id, blockPositions);
      setBlockPositions(updatedBlocks);
    }
  }, [blockPositions]);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((updatedBlocks: BlockPosition[]) => {
    setBlockPositions(updatedBlocks);
  }, []);

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
        </div>

        {/* 블록 영역 */}
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

        <div
          className={`rounded-2xl p-6 mb-6 border transition-all duration-300 ease-in-out ${
            notification.enabled
              ? 'bg-gray-900 border-gray-900'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          {/* 알림 받기 토글 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className={`w-5 h-5 transition-colors duration-300 ${notification.enabled ? 'text-white' : 'text-gray-700'}`} />
              <span className={`font-medium transition-colors duration-300 ${notification.enabled ? 'text-white' : 'text-gray-900'}`}>
                알림 받기
              </span>
            </div>
            <label className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={notification.enabled}
                onChange={(e) => setNotification({ ...notification, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className={`w-full h-full rounded-full peer peer-checked:bg-amber-500 transition-colors ${notification.enabled ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
            </label>
          </div>

          {/* 알림 상세 설정 (활성화 시 애니메이션으로 확장) */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              notification.enabled ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'
            }`}
          >
            {/* 알림 시간 */}
            <div className="mb-4">
              <label className="text-sm text-white block mb-2">알림 시간</label>
              <input
                type="time"
                value={notification.time || '09:00'}
                onChange={(e) => setNotification({ ...notification, time: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:border-gray-500 focus:outline-none"
              />
            </div>

            {/* 반복 요일 */}
            <div>
              <label className="text-sm text-white block mb-2">반복 요일</label>
              <div className="flex gap-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((dayLabel, dayIndex) => (
                  <button
                    key={dayIndex}
                    onClick={() => {
                      const currentDays = notification.days || [];
                      const newDays = currentDays.includes(dayIndex)
                        ? currentDays.filter(d => d !== dayIndex)
                        : [...currentDays, dayIndex];
                      setNotification({ ...notification, days: newDays });
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (notification.days || []).includes(dayIndex)
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {dayLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            // 앨범 업데이트
            try {
              await updateAlbum(albumId, {
                name: templateName,
                blocks: blockPositions,
                notification: notification,
              });
              router.push(`/album/${albumId}`);
            } catch (error) {
              console.error('Failed to update album:', error);
              alert('앨범 저장에 실패했습니다.');
            }
          }}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          저장
        </button>
      </div>
    </main>
  );
}
