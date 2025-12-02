'use client';

import { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { BlockPosition } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';

interface BlockFilterProps {
  blocks: BlockPosition[];
  selectedBlockIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function BlockFilter({
  blocks,
  selectedBlockIds,
  onSelectionChange,
}: BlockFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleBlock = (blockId: string) => {
    if (selectedBlockIds.includes(blockId)) {
      onSelectionChange(selectedBlockIds.filter(id => id !== blockId));
    } else {
      onSelectionChange([...selectedBlockIds, blockId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(blocks.map(b => b.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <>
      {/* 필터 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
          selectedBlockIds.length > 0
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Filter className="w-3 h-3" />
        <span>
          {selectedBlockIds.length > 0
            ? `${selectedBlockIds.length}개 선택`
            : '블록 필터'}
        </span>
      </button>

      {/* 필터 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* 백드롭 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* 모달 콘텐츠 */}
          <div className="relative w-full max-w-md bg-white rounded-t-2xl max-h-[70vh] overflow-hidden">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  표시할 블록 선택
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                선택한 블록의 내용만 캐러셀에 표시됩니다
              </p>
            </div>

            {/* 전체 선택/해제 */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                전체 선택
              </button>
              <button
                onClick={clearAll}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                전체 해제
              </button>
            </div>

            {/* 블록 목록 */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
              <div className="space-y-2">
                {blocks.map(block => {
                  const paletteItem = blockPalette.find(p => p.type === block.type);
                  const Icon = iconMap[paletteItem?.icon || 'Type'];
                  const label = block.customLabel || paletteItem?.label || '';
                  const isSelected = selectedBlockIds.includes(block.id);

                  return (
                    <button
                      key={block.id}
                      onClick={() => toggleBlock(block.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* 체크박스 */}
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center flex-none ${
                          isSelected
                            ? 'bg-gray-900'
                            : 'border-2 border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* 아이콘 */}
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-none">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>

                      {/* 블록 이름 */}
                      <span className="flex-1 text-left font-medium text-gray-900">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 적용 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
