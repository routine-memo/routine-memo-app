import { Plus } from 'lucide-react';
import { BlockType, IconMap } from '../types';
import { blockPalette } from '../blockPalette';

interface BlockPaletteProps {
  showPalette: boolean;
  iconMap: IconMap;
  onToggle: () => void;
  onAddBlock: (type: BlockType) => void;
}

export const BlockPalette = ({
  showPalette,
  iconMap,
  onToggle,
  onAddBlock,
}: BlockPaletteProps) => {
  return (
    <>
      {/* 블록 추가 버튼 */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg flex items-center justify-center z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 블록 팔레트 */}
      {showPalette && (
        <div className="fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl p-4 z-20 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {blockPalette.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <button
                  key={item.type}
                  onClick={() => onAddBlock(item.type)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <Icon className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
