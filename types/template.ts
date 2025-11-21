// 템플릿 블록 타입 정의
export type BlockType =
  | 'timeline'
  | 'text'
  | 'image'
  | 'checklist'
  | 'emotion'
  | 'date'
  | 'weather'
  | 'toggle'
  | 'data'
  | 'graph'
  | 'relation'
  | 'callout'
  | 'embed'
  | 'todo'
  | 'map';

// 기본 블록 인터페이스
export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

// 타임라인 블록
export interface TimelineBlock extends BaseBlock {
  type: 'timeline';
  label?: string;
}

// 텍스트 블록
export interface TextBlock extends BaseBlock {
  type: 'text';
  label?: string;
  placeholder?: string;
  allowHandwriting?: boolean;
}

// 이미지 블록
export interface ImageBlock extends BaseBlock {
  type: 'image';
  label?: string;
  allowMultiple?: boolean;
  allowCaption?: boolean;
}

// 체크리스트 블록
export interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  label?: string;
  items?: string[];
}

// 감정 기록 블록
export interface EmotionBlock extends BaseBlock {
  type: 'emotion';
  label?: string;
}

// 날짜 기록 블록
export interface DateBlock extends BaseBlock {
  type: 'date';
  label?: string;
}

// 날씨 블록
export interface WeatherBlock extends BaseBlock {
  type: 'weather';
  label?: string;
  includeTemperature?: boolean;
}

// 토글 블록
export interface ToggleBlock extends BaseBlock {
  type: 'toggle';
  label?: string;
  content?: string;
}

// 데이터 블록
export interface DataBlock extends BaseBlock {
  type: 'data';
  label?: string;
  unit?: string;
  showTrend?: boolean;
}

// 그래프 블록
export interface GraphBlock extends BaseBlock {
  type: 'graph';
  label?: string;
  dataBlockId?: string;
}

// 관계도 블록
export interface RelationBlock extends BaseBlock {
  type: 'relation';
  label?: string;
}

// 강조/콜아웃 블록
export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  label?: string;
  style?: 'info' | 'warning' | 'success' | 'error';
}

// 링크/영상 임베드 블록
export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  label?: string;
}

// 투두리스트 블록
export interface TodoBlock extends BaseBlock {
  type: 'todo';
  label?: string;
  items?: string[];
}

// 지도 블록
export interface MapBlock extends BaseBlock {
  type: 'map';
  label?: string;
}

// 모든 블록 타입 유니온
export type Block =
  | TimelineBlock
  | TextBlock
  | ImageBlock
  | ChecklistBlock
  | EmotionBlock
  | DateBlock
  | WeatherBlock
  | ToggleBlock
  | DataBlock
  | GraphBlock
  | RelationBlock
  | CalloutBlock
  | EmbedBlock
  | TodoBlock
  | MapBlock;

// 알림 설정
export interface NotificationSettings {
  enabled: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string;
  customDays?: number[];
}

// 템플릿 인터페이스
export interface Template {
  id: string;
  name: string;
  blocks: Block[];
  notification: NotificationSettings;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

// 블록 팔레트 아이템
export interface BlockPaletteItem {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}
