'use client';

import { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';

interface TagFilterProps {
  tags: { tag: string; count: number }[];
  selectedTags: string[];
  onSelectionChange: (tags: string[]) => void;
}

export function TagFilter({
  tags,
  selectedTags,
  onSelectionChange,
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onSelectionChange(selectedTags.filter(t => t !== tag));
    } else {
      onSelectionChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  if (tags.length === 0) return null;

  return (
    <>
      {/* 필터 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
          selectedTags.length > 0
            ? 'bg-amber-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Tag className="w-3 h-3" />
        <span>
          {selectedTags.length > 0
            ? `${selectedTags.length}개 태그`
            : '태그 필터'}
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
                  태그 필터
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                선택한 태그가 있는 기록만 표시됩니다
              </p>
            </div>

            {/* 전체 해제 */}
            {selectedTags.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <button
                  onClick={clearAll}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  전체 해제
                </button>
              </div>
            )}

            {/* 태그 목록 */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
              <div className="flex flex-wrap gap-2">
                {tags.map(({ tag, count }) => {
                  const isSelected = selectedTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      #{tag}
                      <span className={`text-xs ${isSelected ? 'text-amber-100' : 'text-gray-400'}`}>
                        ({count})
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
