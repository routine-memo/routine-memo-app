import { BlockPaletteItem } from './types';

export const blockPalette: BlockPaletteItem[] = [
  { type: 'text', label: '텍스트', icon: 'Type' },
  { type: 'image', label: '이미지', icon: 'Image' },
  { type: 'number', label: '숫자', icon: 'Hash' },
  { type: 'date', label: '날짜', icon: 'Calendar' },
  { type: 'checkbox', label: '체크박스', icon: 'CheckSquare' },
  { type: 'select', label: '선택', icon: 'ListFilter' },
  { type: 'rating', label: '평점', icon: 'Star' },
  { type: 'time', label: '시간', icon: 'Clock' },
  { type: 'location', label: '위치', icon: 'MapPin' },
  { type: 'link', label: '링크', icon: 'Link' },
  { type: 'todo', label: '할 일', icon: 'ListTodo' },
  { type: 'map', label: '지도', icon: 'Map' },
];
