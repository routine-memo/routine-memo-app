'use client';

import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Plus, Trash2, Hash, Percent } from 'lucide-react';
import { DataGraphBlockDefault, DataGraphField, DataGraphFormat } from '../types';

interface DataGraphBlockEditorProps {
  initialValue?: DataGraphBlockDefault;
  onChange: (value: DataGraphBlockDefault) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export interface DataGraphBlockEditorHandle {
  save: () => Promise<void>;
  validate: () => boolean;
}

// 기본 색상 팔레트
const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

const DataGraphBlockEditorInner = forwardRef<DataGraphBlockEditorHandle, DataGraphBlockEditorProps>(
  ({ initialValue, onChange, onValidationChange }, ref) => {
    const [fields, setFields] = useState<DataGraphField[]>(
      initialValue?.fields || []
    );
    const [editingField, setEditingField] = useState<DataGraphField | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);
    const [showError, setShowError] = useState(false);

    // 유효성 검사: 최소 1개 이상의 필드 필요
    const isValid = fields.length > 0;

    // 새 필드 기본값
    const createNewField = (): DataGraphField => ({
      id: `field-${Date.now()}`,
      name: '',
      format: 'number',
      color: COLOR_PALETTE[fields.length % COLOR_PALETTE.length],
    });

    // 필드 추가/수정 완료
    const handleSaveField = useCallback((field: DataGraphField) => {
      if (!field.name.trim()) return;

      setFields(prev => {
        const existingIndex = prev.findIndex(f => f.id === field.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = field;
          return updated;
        }
        return [...prev, field];
      });
      setEditingField(null);
      setIsAddMode(false);
    }, []);

    // 필드 삭제
    const handleDeleteField = useCallback((fieldId: string) => {
      setFields(prev => prev.filter(f => f.id !== fieldId));
    }, []);

    // 저장 함수
    const save = useCallback(async () => {
      onChange({ fields });
    }, [fields, onChange]);

    // 유효성 검증
    const validate = useCallback(() => {
      if (!isValid) {
        setShowError(true);
      }
      return isValid;
    }, [isValid]);

    // 부모에게 save, validate 메서드 노출
    useImperativeHandle(ref, () => ({ save, validate }), [save, validate]);

    // 필드 수정 모달
    const renderFieldEditor = () => {
      if (!editingField) return null;

      return (
        <div className="absolute inset-0 bg-white z-10 flex flex-col">
          {/* 헤더 */}
          <div className="flex-none px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => {
                setEditingField(null);
                setIsAddMode(false);
              }}
              className="text-gray-500 text-sm"
            >
              취소
            </button>
            <h3 className="font-semibold text-gray-900">
              {isAddMode ? '항목 추가' : '항목 수정'}
            </h3>
            <button
              onClick={() => handleSaveField(editingField)}
              className="text-gray-900 font-semibold text-sm"
              disabled={!editingField.name.trim()}
            >
              완료
            </button>
          </div>

          {/* 폼 */}
          <div className="flex-1 overflow-auto p-4 space-y-5">
            {/* 항목 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                항목 이름
              </label>
              <input
                type="text"
                value={editingField.name}
                onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                placeholder="예: 턱걸이 갯수, 체중, 공부시간"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* 표시 서식 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                표시 서식
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingField({ ...editingField, format: 'number' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    editingField.format === 'number'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Hash className="w-5 h-5" />
                  <span className="font-medium">숫자</span>
                </button>
                <button
                  onClick={() => setEditingField({ ...editingField, format: 'percent' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    editingField.format === 'percent'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Percent className="w-5 h-5" />
                  <span className="font-medium">퍼센트</span>
                </button>
              </div>
            </div>

            {/* 그래프 색상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                그래프 색상
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditingField({ ...editingField, color })}
                    className={`w-9 h-9 rounded-full transition-transform ${
                      editingField.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full bg-white relative">
        {/* 안내 문구 */}
        <div className="flex-none px-4 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            추적할 데이터 항목을 정의하세요. 기록 시 이 항목들의 값을 입력합니다.
          </p>
        </div>

        {/* 항목 목록 */}
        <div className="flex-1 overflow-auto">
          {fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <p className="text-sm mb-2">추적할 항목이 없습니다</p>
              <p className="text-xs">아래 버튼을 눌러 항목을 추가하세요</p>
              {showError && (
                <p className="text-sm text-red-500 mt-4">
                  최소 1개 이상의 항목을 추가해주세요.
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  {/* 색상 인디케이터 */}
                  <div
                    className="w-4 h-4 rounded-full flex-none"
                    style={{ backgroundColor: field.color }}
                  />

                  {/* 항목 정보 */}
                  <button
                    onClick={() => {
                      setEditingField(field);
                      setIsAddMode(false);
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-gray-900">{field.name}</p>
                    <p className="text-xs text-gray-500">
                      {field.format === 'percent' ? '퍼센트' : '숫자'}
                    </p>
                  </button>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 항목 추가 버튼 */}
        <div className="flex-none p-4 border-t border-gray-100">
          <button
            onClick={() => {
              setEditingField(createNewField());
              setIsAddMode(true);
            }}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            항목 추가
          </button>
        </div>

        {/* 필드 편집 모달 */}
        {editingField && renderFieldEditor()}
      </div>
    );
  }
);

DataGraphBlockEditorInner.displayName = 'DataGraphBlockEditorInner';

export const DataGraphBlockEditor = DataGraphBlockEditorInner;
