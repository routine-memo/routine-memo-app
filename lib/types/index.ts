// 블록 타입 정의
export type BlockType =
  | 'text'
  | 'image'
  | 'number'
  | 'date'
  | 'graph'
  | 'map'
  | 'emotion';

// 블록 데이터 구조
export interface Block {
  id: string;
  type: BlockType;
  label: string;
  value?: any;
  order: number;
}

// 템플릿 구조
export interface Template {
  id: string;
  name: string;
  description?: string;
  blocks: Block[];
  previewBlockId?: string; // 카드 미리보기에 사용할 블록 ID
  createdAt: Date;
  updatedAt: Date;
}

// 기록 항목
export interface Record {
  id: string;
  templateId: string;
  date: Date;
  blocks: Block[];
  createdAt: Date;
  updatedAt: Date;
}

// 카테고리 카드 (템플릿 + 통계)
export interface CategoryCard {
  template: Template;
  recordCount: number;
  lastRecordDate?: Date;
  previewData?: any;
}
