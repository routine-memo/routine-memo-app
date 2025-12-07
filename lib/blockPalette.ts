import { BlockPaletteItem } from '@/types/template';

export const blockPalette: BlockPaletteItem[] = [
  {
    type: 'timeline',
    label: '타임라인',
    icon: 'Clock',
    description: '시간순 기록',
  },
  {
    type: 'text',
    label: '텍스트',
    icon: 'Type',
    description: '텍스트 입력 (펜 입력 가능)',
  },
  {
    type: 'image',
    label: '이미지',
    icon: 'Image',
    description: '이미지 업로드 (설명 추가 가능)',
  },
  {
    type: 'checklist',
    label: '체크리스트',
    icon: 'CheckSquare',
    description: '체크 가능한 리스트',
  },
  {
    type: 'emotion',
    label: '감정 기록',
    icon: 'Smile',
    description: '감정 상태 기록',
  },
  {
    type: 'date',
    label: '날짜 기록',
    icon: 'Calendar',
    description: '날짜 선택',
  },
  {
    type: 'weather',
    label: '날씨/기온',
    icon: 'Cloud',
    description: '날씨와 기온 기록',
  },
  {
    type: 'toggle',
    label: '토글',
    icon: 'ChevronDown',
    description: '접고 펼 수 있는 콘텐츠',
  },
  {
    type: 'data',
    label: '데이터',
    icon: 'TrendingUp',
    description: '수치 데이터 (그래프 연계)',
  },
  {
    type: 'graph',
    label: '그래프',
    icon: 'BarChart',
    description: '데이터 시각화',
  },
  {
    type: 'relation',
    label: '관계도',
    icon: 'GitBranch',
    description: '관계 시각화',
  },
  {
    type: 'callout',
    label: '강조/콜아웃',
    icon: 'AlertCircle',
    description: '중요 내용 강조',
  },
  {
    type: 'embed',
    label: '링크/영상',
    icon: 'Link',
    description: '링크, 영상 임베드',
  },
  {
    type: 'todo',
    label: '투두리스트',
    icon: 'ListTodo',
    description: '할 일 목록',
  },
  {
    type: 'map',
    label: '지도',
    icon: 'Map',
    description: '위치 기록',
  },
];
