'use client';

import { useState, useRef } from 'react';
import { Plus, Settings, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { Album, updateAlbum } from '@/lib/storage/album';
import { BlockPosition } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';

interface AlbumCardProps {
  album: Album;
  onViewEntries?: () => void;   // 기록 목록 보기
  onAddEntry?: () => void;      // 새 기록 추가
  onEditAlbum?: () => void;     // 앨범 수정
  onNameChange?: (newName: string) => void;  // 이름 변경 콜백
}

export function AlbumCard({ album, onViewEntries, onAddEntry, onEditAlbum, onNameChange }: AlbumCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 이름 편집 시작
  const startEditingName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameValue(album.name);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  // 이름 편집 완료
  const finishEditingName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingNameValue.trim() && editingNameValue.trim() !== album.name) {
      updateAlbum(album.id, { name: editingNameValue.trim() });
      onNameChange?.(editingNameValue.trim());
    }
    setIsEditingName(false);
  };

  // 이름 편집 취소
  const cancelEditingName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(false);
  };

  return (
    <div className="rounded-2xl bg-gray-900 overflow-hidden">
      {/* 클릭 가능한 메인 영역 */}
      <div
        onClick={onViewEntries}
        className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
      >
        {/* 앨범 이름 */}
        {isEditingName ? (
          <div
            className="flex items-center gap-2 mb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={nameInputRef}
              type="text"
              value={editingNameValue}
              onChange={(e) => setEditingNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishEditingName(e as unknown as React.MouseEvent);
                if (e.key === 'Escape') cancelEditingName(e as unknown as React.MouseEvent);
              }}
              className="flex-1 min-w-0 px-3 py-1.5 text-lg font-bold bg-gray-800 text-white border-2 border-white rounded-lg focus:outline-none"
              placeholder="앨범 이름"
            />
            <button
              onClick={finishEditingName}
              className="flex-none p-1.5 bg-white text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={cancelEditingName}
              className="flex-none p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-white">
              {album.name}
            </h3>
            <button
              onClick={startEditingName}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 하단 영역: 기록 수 + 카드 미리보기 */}
        <div className="flex items-end gap-4">
          {/* 왼쪽: 기록 수 (클릭 안내 포함) */}
          <div className="flex flex-col">
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white leading-none">
                {album.pageCount}
              </span>
              <span className="text-xs text-gray-400 mb-1">장</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1.5">
              <span className="text-[10px] text-gray-500">기록 보기</span>
              <ChevronRight className="w-3 h-3 text-gray-500" />
            </div>
          </div>

          {/* 오른쪽: 카드 미리보기 (겹쳐진 카드들) */}
          <div className="flex-1 flex justify-center">
            {album.blocks.length > 0 ? (
              <StackedCardsPreview blocks={album.blocks} />
            ) : (
              <div className="flex items-center justify-center h-20">
                <p className="text-sm text-gray-500">블록이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 액션 버튼 영역 */}
      <div className="flex border-t border-gray-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddEntry?.();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-white hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">기록하기</span>
        </button>
        <div className="w-px bg-gray-800" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditAlbum?.();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">앨범 수정</span>
        </button>
      </div>
    </div>
  );
}

// 겹쳐진 카드 형태의 미리보기 - 각 카드에 앨범 전체 레이아웃 표시
function StackedCardsPreview({ blocks }: { blocks: BlockPosition[] }) {
  // 3장의 카드를 겹쳐서 표시 (각 카드에 전체 레이아웃)
  const cards = [0, 1, 2];

  return (
    <div className="relative h-24 w-full flex justify-center items-end">
      {cards.map((cardIndex) => {
        // 카드 위치/회전 계산 (겹쳐진 느낌)
        const rotation = (cardIndex - 1) * 8; // -8, 0, 8도
        const translateX = (cardIndex - 1) * 30; // 좌우 오프셋
        const translateY = Math.abs(cardIndex - 1) * 5; // 중앙이 가장 위로
        const zIndex = cardIndex === 1 ? 3 : cardIndex === 0 ? 2 : 1;

        return (
          <div
            key={cardIndex}
            className="absolute w-16 h-20 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            style={{
              transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
              zIndex,
            }}
          >
            {/* 미니어처 앨범 레이아웃 */}
            <MiniatureAlbumLayout blocks={blocks} />
          </div>
        );
      })}
    </div>
  );
}

// 앨범 전체 레이아웃을 미니어처로 표시
function MiniatureAlbumLayout({ blocks }: { blocks: BlockPosition[] }) {
  const COLS = 6;
  const CELL_SIZE = 10; // 미니어처용 작은 셀 크기
  const GAP = 1;

  // 최대 row 수 계산 (row는 0부터 시작)
  const maxRows = blocks.reduce((max, block) => {
    const blockBottom = block.row + block.height;
    return Math.max(max, blockBottom);
  }, 1);

  return (
    <div
      className="relative w-full h-full p-1"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${Math.max(maxRows, 4)}, 1fr)`,
        gap: `${GAP}px`,
      }}
    >
      {blocks.map((block) => {
        const paletteItem = blockPalette.find(p => p.type === block.type);
        const Icon = iconMap[paletteItem?.icon || 'Type'];

        return (
          <div
            key={block.id}
            className="bg-gray-100 rounded-sm flex items-center justify-center"
            style={{
              gridColumn: `${block.colStart + 1} / span ${block.colSpan}`,
              gridRow: `${block.row + 1} / span ${block.height}`,
            }}
          >
            <Icon className="w-2 h-2 text-gray-400" />
          </div>
        );
      })}
    </div>
  );
}

export default AlbumCard;
