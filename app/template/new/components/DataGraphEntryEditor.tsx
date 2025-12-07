'use client';

import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { DataGraphBlockDefault, DataGraphField, DataGraphValue } from '../types';

interface DataGraphEntryEditorProps {
  initialValue?: DataGraphBlockDefault;
  onChange: (value: DataGraphBlockDefault) => void;
}

export interface DataGraphEntryEditorHandle {
  save: () => Promise<void>;
}

const DataGraphEntryEditorInner = forwardRef<DataGraphEntryEditorHandle, DataGraphEntryEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const fields = initialValue?.fields || [];

    // 각 필드의 값을 관리
    const [values, setValues] = useState<Map<string, number>>(() => {
      const map = new Map<string, number>();
      initialValue?.values?.forEach(v => {
        map.set(v.fieldId, v.value);
      });
      return map;
    });

    // 값 변경 핸들러
    const handleValueChange = useCallback((fieldId: string, value: string) => {
      const numValue = parseFloat(value);
      setValues(prev => {
        const newMap = new Map(prev);
        if (isNaN(numValue) || value === '') {
          newMap.delete(fieldId);
        } else {
          newMap.set(fieldId, numValue);
        }
        return newMap;
      });
    }, []);

    // 저장 함수
    const save = useCallback(async () => {
      const valueArray: DataGraphValue[] = [];
      values.forEach((value, fieldId) => {
        valueArray.push({ fieldId, value });
      });
      onChange({ fields, values: valueArray });
    }, [fields, values, onChange]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    if (fields.length === 0) {
      return (
        <div className="flex flex-col h-full bg-white">
          <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
            <div className="text-center">
              <p className="text-sm mb-2">추적 항목이 정의되지 않았습니다</p>
              <p className="text-xs">앨범 설정에서 추적할 항목을 먼저 정의해주세요</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-white">
        {/* 안내 문구 */}
        <div className="flex-none px-4 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            오늘의 데이터를 입력하세요
          </p>
        </div>

        {/* 입력 필드 목록 */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              {/* 라벨 */}
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-none"
                  style={{ backgroundColor: field.color }}
                />
                <label className="text-sm font-medium text-gray-700">
                  {field.name}
                </label>
                <span className="text-xs text-gray-400">
                  ({field.format === 'percent' ? '%' : '숫자'})
                </span>
              </div>

              {/* 입력 */}
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={values.get(field.id) ?? ''}
                  onChange={(e) => handleValueChange(field.id, e.target.value)}
                  placeholder="값 입력"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg"
                  style={{ borderLeftColor: field.color, borderLeftWidth: 4 }}
                />
                {field.format === 'percent' && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    %
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

DataGraphEntryEditorInner.displayName = 'DataGraphEntryEditorInner';

export const DataGraphEntryEditor = DataGraphEntryEditorInner;
