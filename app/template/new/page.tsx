'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import { NotificationSettings } from '@/types/template';

// Import types and utilities
import { BlockPosition, BlockType, DropTarget, Step } from './types';
import { iconMap } from './iconMap';
import { blockPalette } from './blockPalette';
import { getAllRows, getRowBlocks } from './blockUtils';
import { handleDrop as processDrop } from './dragDropHandlers';
import { createBlock, deleteBlock } from './blockManagement';
import { calculateDropPosition } from './dragOverHandler';
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
  const { handleResizeStart } = useBlockResize(blockPositions, setBlockPositions);

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

  // 드래그 시작
  const handleDragStart = useCallback((block: BlockPosition) => {
    setDraggedBlock(block);
  }, []);

  // 터치 무브 (모바일 드래그)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggedBlock) return;

    const touch = e.touches[0];

    // 터치 위치에서 모든 블록 엘리먼트 찾기
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const blockElement = elements.find(el => el.getAttribute('data-block-id'));

    if (!blockElement) {
      setDropTarget(null);
      return;
    }

    const targetBlockId = blockElement.getAttribute('data-block-id');
    const targetBlock = blockPositions.find(b => b.id === targetBlockId);

    if (!targetBlock || targetBlock.id === draggedBlock.id) {
      return;
    }

    // 블록 내에서의 상대 위치 계산
    const rect = blockElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const threshold = 30;
    let position: DropTarget['position'];

    if (y < threshold) {
      position = 'above';
    } else if (y > rect.height - threshold) {
      position = 'below';
    } else if (x < rect.width / 2) {
      position = 'left';
    } else {
      position = 'right';
    }

    const newTarget = { blockId: targetBlock.id, position };
    setDropTarget(newTarget);
  }, [draggedBlock, blockPositions]);

  // 터치 엔드 (모바일 드롭)
  const handleTouchEnd = useCallback(() => {
    if (!draggedBlock || !dropTarget) {
      setDraggedBlock(null);
      setDropTarget(null);
      return;
    }

    // dropTarget에서 타겟 블록 찾기
    const targetBlock = blockPositions.find(b => b.id === dropTarget.blockId);
    if (!targetBlock) {
      setDraggedBlock(null);
      setDropTarget(null);
      return;
    }

    const result = processDrop(
      draggedBlock,
      dropTarget,
      targetBlock,
      blockPositions
    );

    if (result) {
      setBlockPositions(result);
    }

    setDraggedBlock(null);
    setDropTarget(null);
  }, [draggedBlock, dropTarget, blockPositions]);

  // 드롭 처리 (데스크톱)
  const handleDrop = useCallback((e: React.DragEvent, targetBlock: BlockPosition) => {
    e.preventDefault();

    const result = processDrop(
      draggedBlock,
      dropTarget,
      targetBlock,
      blockPositions
    );

    if (result) {
      setBlockPositions(result);
    }

    setDraggedBlock(null);
    setDropTarget(null);
  }, [draggedBlock, dropTarget, blockPositions]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedBlock(null);
    setDropTarget(null);
  }, []);

  // 드래그 오버 (데스크톱 드롭 위치 표시)
  const handleDragOver = useCallback((e: React.DragEvent, targetBlock: BlockPosition) => {
    e.preventDefault();
    const target = calculateDropPosition(e, targetBlock, draggedBlock);
    if (target) {
      setDropTarget(target);
    }
  }, [draggedBlock]);

  // 단계별 렌더링
  if (step === 'name') {
    return (
      <main className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="w-full max-w-md px-4">
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
      <main className="fixed inset-0 flex flex-col bg-gray-50">
        {/* 헤더 */}
        <div className="flex-none bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
          {blockPositions.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  블록을 추가하여<br />템플릿을 만들어보세요
                </p>
              </div>
            </div>
          ) : (
            <div id="blocks-container" className="flex flex-col gap-3">
              {getAllRows(blockPositions).map((row) => {
                const rowBlocks = getRowBlocks(blockPositions, row);
                // 각 행의 고정 높이는 120px (행이 늘어나지 않고 블록이 gridRow로 여러 행을 차지)
                const rowHeight = 120;

                return (
                  <div
                    key={row}
                    className="grid gap-3 relative"
                    style={{
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      height: `${rowHeight}px` // minHeight → height로 변경하여 고정 높이 유지
                    }}
                  >
                    {/* 디버깅용 그리드 선 */}
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100 }}>
                      {/* 세로 선 (열 구분) */}
                      {[0, 1, 2, 3, 4, 5].map((col) => (
                        <div
                          key={`col-${col}`}
                          className="absolute top-0 bottom-0 w-px bg-red-300"
                          style={{
                            left: `calc(${(col / 6) * 100}% ${col > 0 ? '+ 6px' : ''})`
                          }}
                        />
                      ))}
                      {/* 가로 선 (행 표시) */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-blue-300" />
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-blue-300" />
                      {/* 행 번호 표시 */}
                      <div className="absolute top-1 left-1 text-xs text-blue-600 font-bold bg-white px-1">
                        행 {row}
                      </div>
                    </div>

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
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
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
    <main className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="w-full max-w-md px-4">
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
