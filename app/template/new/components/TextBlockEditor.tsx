'use client';

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Type, Pencil, Eraser, Undo, Redo, Trash2, Bold, Italic, Strikethrough, List, ListOrdered } from 'lucide-react';
import { TextBlockDefault } from '../types';
import { SketchCanvasHandle } from './SketchCanvas';

// SketchCanvas는 SSR에서 동작하지 않으므로 동적 임포트
const SketchCanvas = dynamic(
  () => import('./SketchCanvas').then((mod) => mod.SketchCanvas),
  { ssr: false }
);

export interface TextBlockEditorHandle {
  save: () => Promise<void>;
}

interface TextBlockEditorProps {
  initialValue?: TextBlockDefault;
  onChange: (value: TextBlockDefault) => void;
}

type InputMode = 'text' | 'sketch';

const TextBlockEditorInner = forwardRef<TextBlockEditorHandle, TextBlockEditorProps>(
  ({ initialValue, onChange }, ref) => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const canvasRef = useRef<SketchCanvasHandle>(null);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  // 내부 데이터 ref (리렌더링 방지)
  const richTextRef = useRef<string>(initialValue?.richText || '<p></p>');

  // 에디터 ref (handleKeyDown에서 사용)
  const editorInstanceRef = useRef<ReturnType<typeof useEditor>>(null);

  // Tiptap 에디터 설정
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: initialValue?.richText || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      richTextRef.current = editor.getHTML();
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none h-full p-4 select-text',
        style: 'user-select: text; -webkit-user-select: text;',
      },
    },
  });

  // 에디터 인스턴스 ref 업데이트
  useEffect(() => {
    editorInstanceRef.current = editor;
  }, [editor]);

  // 백스페이스 키 이벤트 처리 (목록 해제 - 노션 스타일)
  // 엔터 두 번 누르는 것과 동일한 동작: liftListItem 사용
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' && editor) {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // 커서가 줄의 맨 앞에 있는지 확인
        const isAtStartOfLine = $from.parentOffset === 0;

        // 현재 listItem 안에 있는지 확인
        let isInListItem = false;
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'listItem') {
            isInListItem = true;
            break;
          }
        }

        // 목록 항목의 맨 앞에서 백스페이스 → liftListItem 실행
        if (isAtStartOfLine && isInListItem) {
          event.preventDefault();
          event.stopPropagation();

          // liftListItem은 현재 항목을 목록에서 빼내어 일반 paragraph로 만듦
          // 이것이 엔터 두 번과 동일한 동작
          editor.chain().focus().liftListItem('listItem').run();
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('keydown', handleKeyDown, true);

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editor]);

  // 저장 함수 (모달 닫을 때 호출)
  const save = useCallback(async () => {
    let sketchData = '';
    if (canvasRef.current) {
      try {
        const paths = await canvasRef.current.exportPaths();
        sketchData = JSON.stringify(paths);
      } catch (error) {
        console.error('Failed to export sketch:', error);
      }
    }
    onChange({
      richText: richTextRef.current,
      sketchData,
    });
  }, [onChange]);

  // 부모에게 save 메서드 노출
  useImperativeHandle(ref, () => ({ save }), [save]);

  // 지우개 토글
  const toggleEraser = () => {
    if (isEraser) {
      setIsEraser(false);
      canvasRef.current?.eraseMode(false);
      canvasRef.current?.setStrokeColor(strokeColor);
    } else {
      setIsEraser(true);
      canvasRef.current?.eraseMode(true);
    }
  };

  // 캔버스 지우기
  const clearCanvas = () => {
    canvasRef.current?.clearCanvas();
  };

  // 실행 취소
  const undoSketch = () => {
    canvasRef.current?.undo();
  };

  // 다시 실행
  const redoSketch = () => {
    canvasRef.current?.redo();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 툴바 */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50">
        {/* 모드 전환 버튼 */}
        <button
          onClick={() => setInputMode('text')}
          className={`p-2 rounded transition-colors ${
            inputMode === 'text'
              ? 'bg-gray-900 text-white'
              : 'hover:bg-gray-200 text-gray-600'
          }`}
          title="텍스트 입력"
        >
          <Type className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setInputMode('sketch');
            setIsEraser(false);
            canvasRef.current?.eraseMode(false);
          }}
          className={`p-2 rounded transition-colors ${
            inputMode === 'sketch'
              ? 'bg-gray-900 text-white'
              : 'hover:bg-gray-200 text-gray-600'
          }`}
          title="필기 입력"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* 텍스트 도구 (텍스트 모드일 때만 표시) */}
        {inputMode === 'text' && (
          <>
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive('bold') ? 'bg-gray-900 text-white' : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="굵게"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive('italic') ? 'bg-gray-900 text-white' : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="기울임"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive('strike') ? 'bg-gray-900 text-white' : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="취소선"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive('bulletList') ? 'bg-gray-900 text-white' : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="글머리 기호"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive('orderedList') ? 'bg-gray-900 text-white' : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="번호 매기기"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className={`p-2 rounded hover:bg-gray-200 ${
                !editor?.can().undo() ? 'opacity-30' : ''
              }`}
              title="실행 취소"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className={`p-2 rounded hover:bg-gray-200 ${
                !editor?.can().redo() ? 'opacity-30' : ''
              }`}
              title="다시 실행"
            >
              <Redo className="w-4 h-4" />
            </button>
          </>
        )}

        {/* 필기 도구 (필기 모드일 때만 표시) */}
        {inputMode === 'sketch' && (
          <>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setStrokeColor(newColor);
                setIsEraser(false);
                canvasRef.current?.eraseMode(false);
                canvasRef.current?.setStrokeColor(newColor);
              }}
              className="w-7 h-7 rounded cursor-pointer border border-gray-200"
            />
            <select
              value={strokeWidth}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                setStrokeWidth(newWidth);
                canvasRef.current?.setStrokeWidth(newWidth);
              }}
              className="h-7 px-1 rounded border border-gray-200 text-xs"
            >
              <option value={1}>얇게</option>
              <option value={3}>보통</option>
              <option value={5}>굵게</option>
            </select>
            <button
              onClick={toggleEraser}
              className={`p-2 rounded transition-colors ${
                isEraser ? 'bg-gray-900 text-white' : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="지우개"
            >
              <Eraser className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
              onClick={undoSketch}
              className="p-2 rounded hover:bg-gray-200"
              title="실행 취소"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redoSketch}
              className="p-2 rounded hover:bg-gray-200"
              title="다시 실행"
            >
              <Redo className="w-4 h-4" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 rounded hover:bg-gray-200 text-red-500"
              title="필기 전체 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 에디터 영역 - 텍스트와 필기가 겹쳐서 표시 */}
      <div className="flex-1 relative">
        {/* 텍스트 레이어 */}
        <div
          className="absolute inset-0 overflow-y-auto bg-white"
          style={{
            zIndex: inputMode === 'text' ? 2 : 1,
            pointerEvents: inputMode === 'text' ? 'auto' : 'none'
          }}
        >
          <EditorContent editor={editor} className="h-full" />
        </div>

        {/* 필기 레이어 */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: inputMode === 'sketch' ? 2 : 1,
            pointerEvents: inputMode === 'sketch' ? 'auto' : 'none'
          }}
        >
          <SketchCanvas
            ref={canvasRef}
            initialPaths={initialValue?.sketchData}
          />
        </div>
      </div>
    </div>
  );
});

TextBlockEditorInner.displayName = 'TextBlockEditorInner';

export const TextBlockEditor = TextBlockEditorInner;
