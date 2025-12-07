'use client';

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import History from '@tiptap/extension-history';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Undo, Redo } from 'lucide-react';
import { ChecklistBlockDefault } from '../types';

export interface ChecklistBlockEditorHandle {
  save: () => Promise<void>;
}

interface ChecklistBlockEditorProps {
  initialValue?: ChecklistBlockDefault;
  onChange: (value: ChecklistBlockDefault) => void;
}

// 기본 체크리스트 HTML (빈 항목 하나)
const DEFAULT_CHECKLIST = '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>';

const ChecklistBlockEditorInner = forwardRef<ChecklistBlockEditorHandle, ChecklistBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
    // Undo/Redo 버튼 상태
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // 내부 데이터 ref
    const htmlRef = useRef<string>(initialValue?.html || DEFAULT_CHECKLIST);

    // 에디터 ref (handleKeyDown에서 사용)
    const editorInstanceRef = useRef<ReturnType<typeof useEditor>>(null);

    // Tiptap 에디터 설정 (TaskList만 사용)
    const editor = useEditor({
      extensions: [
        Document,
        Paragraph,
        Text,
        History,
        TaskList,
        TaskItem.configure({
          nested: false, // 중첩 체크리스트 비활성화
        }),
      ],
      content: initialValue?.html || DEFAULT_CHECKLIST,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        htmlRef.current = editor.getHTML();
        setCanUndo(editor.can().undo());
        setCanRedo(editor.can().redo());
      },
      onTransaction: ({ editor }) => {
        setCanUndo(editor.can().undo());
        setCanRedo(editor.can().redo());
      },
      editorProps: {
        attributes: {
          class: 'checklist-editor focus:outline-none h-full p-4 select-text',
          style: 'user-select: text; -webkit-user-select: text;',
        },
        // 엔터 키 처리: 새 체크리스트 항목 추가
        handleKeyDown: (view, event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            // 기본 동작 사용 (TaskItem이 자동으로 새 항목 추가)
            return false;
          }
          return false;
        },
      },
    });

    // 저장 함수
    const save = useCallback(async () => {
      // 에디터에서 현재 HTML 직접 가져오기 (마지막 입력 누락 방지)
      const currentHtml = editor?.getHTML() || htmlRef.current;
      onChange({ html: currentHtml });
    }, [onChange, editor]);

    // 부모에게 save 메서드 노출
    useImperativeHandle(ref, () => ({ save }), [save]);

    // 에디터 인스턴스 ref 업데이트
    useEffect(() => {
      editorInstanceRef.current = editor;
    }, [editor]);

    // 백스페이스 키 이벤트 처리 (체크리스트 항목 삭제 및 이전 항목으로 이동)
    useEffect(() => {
      if (!editor) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Backspace' && editor) {
          const { state } = editor;
          const { selection } = state;
          const { $from } = selection;

          // 커서가 줄의 맨 앞에 있는지 확인
          const isAtStartOfLine = $from.parentOffset === 0;

          // 현재 taskItem 안에 있는지 확인
          let isInTaskItem = false;
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'taskItem') {
              isInTaskItem = true;
              break;
            }
          }

          // 체크리스트 항목의 맨 앞에서 백스페이스
          if (isAtStartOfLine && isInTaskItem) {
            // taskItem 개수 확인 - 최소 1개는 유지
            let taskItemCount = 0;
            state.doc.descendants((node) => {
              if (node.type.name === 'taskItem') {
                taskItemCount++;
              }
            });

            // 항목이 1개뿐이면 백스페이스 무시 (삭제 방지)
            if (taskItemCount <= 1) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }

            event.preventDefault();
            event.stopPropagation();

            // joinBackward는 현재 노드를 이전 노드와 합침
            // 빈 항목이면 삭제되고, 내용이 있으면 이전 항목에 붙음
            editor.chain().focus().joinBackward().run();
          }
        }
      };

      const editorElement = editor.view.dom;
      editorElement.addEventListener('keydown', handleKeyDown, true);

      return () => {
        editorElement.removeEventListener('keydown', handleKeyDown, true);
      };
    }, [editor]);

    return (
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* 툴바 */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-600 px-2">체크리스트</span>

          <div className="flex-1" />

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!canUndo}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              !canUndo ? 'opacity-30' : ''
            }`}
            title="실행 취소"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!canRedo}
            className={`p-1.5 rounded hover:bg-gray-200 ${
              !canRedo ? 'opacity-30' : ''
            }`}
            title="다시 실행"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* 에디터 영역 */}
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    );
  }
);

ChecklistBlockEditorInner.displayName = 'ChecklistBlockEditorInner';

export const ChecklistBlockEditor = ChecklistBlockEditorInner;
