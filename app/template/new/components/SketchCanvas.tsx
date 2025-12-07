'use client';

import { useRef, useState, useEffect, useImperativeHandle, forwardRef, memo } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';

export interface SketchCanvasHandle {
  exportPaths: () => Promise<unknown[]>;
  loadPaths: (paths: unknown[]) => Promise<void>;
  eraseMode: (isEraser: boolean) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
}

interface SketchCanvasProps {
  initialPaths?: string;
}

const SketchCanvasInner = forwardRef<SketchCanvasHandle, SketchCanvasProps>(
  ({ initialPaths }, ref) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(3);

    // 초기 경로 로드
    useEffect(() => {
      if (initialPaths && canvasRef.current) {
        try {
          const paths = JSON.parse(initialPaths);
          if (Array.isArray(paths) && paths.length > 0) {
            canvasRef.current.loadPaths(paths);
          }
        } catch (error) {
          console.error('Failed to load paths:', error);
        }
      }
    }, [initialPaths]);

    // 부모 컴포넌트에서 사용할 메서드 노출
    useImperativeHandle(ref, () => ({
      exportPaths: async () => {
        if (!canvasRef.current) return [];
        return canvasRef.current.exportPaths();
      },
      loadPaths: async (paths: unknown[]) => {
        if (!canvasRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await canvasRef.current.loadPaths(paths as any);
      },
      eraseMode: (isEraser: boolean) => {
        canvasRef.current?.eraseMode(isEraser);
      },
      clearCanvas: () => {
        canvasRef.current?.clearCanvas();
      },
      undo: () => {
        canvasRef.current?.undo();
      },
      redo: () => {
        canvasRef.current?.redo();
      },
      setStrokeColor: (color: string) => {
        setStrokeColor(color);
      },
      setStrokeWidth: (width: number) => {
        setStrokeWidth(width);
      },
    }));

    return (
      <div className="w-full h-full">
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          canvasColor="#f9fafb"
          style={{ border: 'none' }}
        />
      </div>
    );
  }
);

SketchCanvasInner.displayName = 'SketchCanvasInner';

// memo로 감싸서 불필요한 리렌더링 방지
export const SketchCanvas = memo(SketchCanvasInner);
