import { Plus } from 'lucide-react';
import { BlockType, IconMap, BlockPaletteItem } from '../types';
import { blockPalette as defaultBlockPalette } from '../blockPalette';

interface BlockPaletteProps {
  showPalette: boolean;
  iconMap: IconMap;
  onToggle: () => void;
  onAddBlock: (type: BlockType) => void;
  customPalette?: BlockPaletteItem[];
}

export const BlockPalette = ({
  showPalette,
  iconMap,
  onToggle,
  onAddBlock,
  customPalette,
}: BlockPaletteProps) => {
  const paletteItems = customPalette || defaultBlockPalette;

  return (
    <>
      {/* 블록 추가 버튼 */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center z-20 hover:bg-gray-800 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 블록 팔레트 */}
      {showPalette && (
        <div className="fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl p-4 z-20 max-h-96 overflow-y-auto border border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            {paletteItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <button
                  key={item.type}
                  onClick={() => onAddBlock(item.type)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Icon className="w-4 h-4 text-gray-700" />
                  <span className="text-sm text-gray-900">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
