'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import { NotificationSettings } from '@/types/template';

// Import types and utilities
import { BlockPosition, BlockType, DropTarget, Step } from './types';
import { iconMap } from './iconMap';
import { blockPalette } from './blockPalette';
import { getAllRows, getBlocksByRow } from './blockUtils';
import { handleDrop as processDrop } from './dragDropHandlers';
import { createBlock, deleteBlock } from './blockManagement';
import { calculateDropPosition } from './dragOverHandler';
import { useContainerWidth } from './hooks/useContainerWidth';
import { useBlockResize } from './hooks/useBlockResize';
import { BlockRenderer } from './components/BlockRenderer';
import { BlockPalette } from './components/BlockPalette';

export default function NewTemplatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [templateName, setTemplateName] = useState('');
  const [blockPositions, setBlockPositions] = useState<BlockPosition[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<BlockPosition | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [notification, setNotification] = useState<NotificationSettings>({
    enabled: false,
  });

  // Custom hooks
  const containerWidth = useContainerWidth(blockPositions.length);
  const { handleResizeStart } = useBlockResize(blockPositions, setBlockPositions, containerWidth);

  // 블록 추가
  const addBlock = (type: BlockType) => {
    const newBlock = createBlock(type, blockPositions, containerWidth);
    setBlockPositions([...blockPositions, newBlock]);
    setShowPalette(false);
  };

  // 블록 삭제
  const removeBlock = (id: string) => {
    const updatedBlocks = deleteBlock(id, blockPositions);
    setBlockPositions(updatedBlocks);
  };

  // 드래그 시작
  const handleDragStart = (block: BlockPosition) => {
    setDraggedBlock(block);
  };

  // 드롭 처리
  const handleDrop = (e: React.DragEvent, targetBlock: BlockPosition) => {
    e.preventDefault();

    const result = processDrop(
      draggedBlock,
      dropTarget,
      targetBlock,
      blockPositions,
      containerWidth
    );

    if (result) {
      setBlockPositions(result);
    }

    setDraggedBlock(null);
    setDropTarget(null);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDropTarget(null);
  };

  // 드래그 오버 (드롭 위치 표시)
  const handleDragOver = (e: React.DragEvent, targetBlock: BlockPosition) => {
    e.preventDefault();
    const target = calculateDropPosition(e, targetBlock, draggedBlock);
    if (target) {
      setDropTarget(target);
    }
  };

  // 단계별 렌더링
  if (step === 'name') {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <div className="max-w-md mx-auto">
          <button onClick={() => router.back()} className="mb-6 text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">템플릿 이름</h1>
          <p className="text-sm text-gray-600 mb-6">
            어떤 기록을 만들까요?
          </p>

          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="예: 턱걸이 기록, 여행 일지, 공부 노트"
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
      <main className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <button onClick={() => setStep('name')} className="text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{templateName}</h1>
          <button
            onClick={() => setStep('notification')}
            className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            다음
          </button>
        </div>

        {/* 블록 영역 */}
        <div className="px-4 py-6">
          {blockPositions.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  블록을 추가하여<br />템플릿을 만들어보세요
                </p>
              </div>
            </div>
          ) : (
            <div id="blocks-container" className="space-y-3">
              {getAllRows(blockPositions).map((row) => {
                const rowBlocks = getBlocksByRow(blockPositions, row);
                const maxHeight = Math.max(...rowBlocks.map(b => b.y + b.height));

                return (
                  <div key={row} className="relative" style={{ height: `${maxHeight}px`, minHeight: '120px' }}>
                    {rowBlocks.map((block) => {
                      const isDragging = draggedBlock?.id === block.id;
                      const isDropTarget = dropTarget?.blockId === block.id;

                      return (
                        <BlockRenderer
                          key={block.id}
                          block={block}
                          isDragging={isDragging}
                          isDropTarget={isDropTarget}
                          dropTarget={dropTarget}
                          iconMap={iconMap}
                          paletteItems={blockPalette}
                          onDragStart={() => handleDragStart(block)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, block)}
                          onDrop={(e) => handleDrop(e, block)}
                          onRemove={() => removeBlock(block.id)}
                          onResizeStart={(e, direction) => handleResizeStart(e, block, direction)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
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

  // notification step
  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-md mx-auto">
        <button onClick={() => setStep('blocks')} className="mb-6 text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">알림 설정</h1>
        <p className="text-sm text-gray-600 mb-6">
          기록 알림을 받고 싶으신가요?
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
            // TODO: 템플릿 저장 로직
            router.push('/');
          }}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          완료
        </button>
      </div>
    </main>
  );
}
