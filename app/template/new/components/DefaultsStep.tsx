'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, X, Volume2, VolumeX } from 'lucide-react';
import { BlockPosition, BlockDefaultValue, TextBlockDefault, ChecklistBlockDefault, WeatherBlockDefault, EmotionBlockDefault, ImageBlockDefault, VideoBlockDefault, LinkBlockDefault, FileBlockDefault, DateBlockDefault, TimelineBlockDefault, IconMap } from '../types';
import { blockPalette } from '../blockPalette';
import { TextBlockEditor, TextBlockEditorHandle } from './TextBlockEditor';
import { ChecklistBlockEditor, ChecklistBlockEditorHandle } from './ChecklistBlockEditor';
import { WeatherBlockEditor, WeatherBlockEditorHandle, getWeatherInfo } from './WeatherBlockEditor';
import { EmotionBlockEditor, EmotionBlockEditorHandle, getEmotionInfo } from './EmotionBlockEditor';
import { ImageBlockEditor, ImageBlockEditorHandle } from './ImageBlockEditor';
import { VideoBlockEditor, VideoBlockEditorHandle } from './VideoBlockEditor';
import { LinkBlockEditor, LinkBlockEditorHandle } from './LinkBlockEditor';
import { FileBlockEditor, FileBlockEditorHandle } from './FileBlockEditor';
import { DateBlockEditor, DateBlockEditorHandle } from './DateBlockEditor';
import { TimelineBlockEditor, TimelineBlockEditorHandle } from './TimelineBlockEditor';
import { LinkBlockPreview } from './LinkBlockPreview';
import { FileBlockPreview } from './FileBlockPreview';
import { DateBlockPreview } from './DateBlockPreview';
import { TimelineBlockPreview } from './TimelineBlockPreview';
import { SwipeablePreview } from './SwipeablePreview';
import { calculateRows } from '../blockUtils';

interface DefaultsStepProps {
  templateName: string;
  blockPositions: BlockPosition[];
  iconMap: IconMap;
  onBack: () => void;
  onNext: (updatedBlocks: BlockPosition[]) => void;
}

const GRID_COLS = 6;
const MARGIN = 8;

// gridWidth 기준으로 행 높이 동적 계산
const getRowHeight = (gridWidth: number): number => {
  const colWidth = (gridWidth - MARGIN * (GRID_COLS - 1)) / GRID_COLS;
  return Math.min(120, Math.max(80, Math.round(colWidth * 1.5)));
};

export const DefaultsStep = ({
  templateName,
  blockPositions,
  iconMap,
  onBack,
  onNext,
}: DefaultsStepProps) => {
  const [blocks, setBlocks] = useState<BlockPosition[]>(blockPositions);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textEditorRef = useRef<TextBlockEditorHandle>(null);
  const checklistEditorRef = useRef<ChecklistBlockEditorHandle>(null);
  const weatherEditorRef = useRef<WeatherBlockEditorHandle>(null);
  const emotionEditorRef = useRef<EmotionBlockEditorHandle>(null);
  const imageEditorRef = useRef<ImageBlockEditorHandle>(null);
  const videoEditorRef = useRef<VideoBlockEditorHandle>(null);
  const linkEditorRef = useRef<LinkBlockEditorHandle>(null);
  const fileEditorRef = useRef<FileBlockEditorHandle>(null);
  const dateEditorRef = useRef<DateBlockEditorHandle>(null);
  const timelineEditorRef = useRef<TimelineBlockEditorHandle>(null);

  // 컨테이너 너비 감지
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      const width = containerRef.current?.clientWidth || 0;
      setGridWidth(width > 0 ? width : 300);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // 동적 행 높이 계산
  const rowHeight = useMemo(() => getRowHeight(gridWidth), [gridWidth]);

  // 블록 기본값 업데이트
  const updateBlockDefault = useCallback((blockId: string, defaultValue: BlockDefaultValue) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, defaultValue }
          : block
      )
    );
  }, []);

  // 텍스트 블록 기본값 변경 핸들러
  const handleTextBlockChange = useCallback((blockId: string, value: TextBlockDefault) => {
    updateBlockDefault(blockId, { type: 'text', value });
  }, [updateBlockDefault]);

  // 체크리스트 블록 기본값 변경 핸들러
  const handleChecklistBlockChange = useCallback((blockId: string, value: ChecklistBlockDefault) => {
    updateBlockDefault(blockId, { type: 'checklist', value });
  }, [updateBlockDefault]);

  // 날씨 블록 기본값 변경 핸들러
  const handleWeatherBlockChange = useCallback((blockId: string, value: WeatherBlockDefault) => {
    updateBlockDefault(blockId, { type: 'weather', value });
  }, [updateBlockDefault]);

  // 감정 블록 기본값 변경 핸들러
  const handleEmotionBlockChange = useCallback((blockId: string, value: EmotionBlockDefault) => {
    updateBlockDefault(blockId, { type: 'emotion', value });
  }, [updateBlockDefault]);

  // 이미지 블록 기본값 변경 핸들러
  const handleImageBlockChange = useCallback((blockId: string, value: ImageBlockDefault) => {
    updateBlockDefault(blockId, { type: 'image', value });
  }, [updateBlockDefault]);

  // 영상 블록 기본값 변경 핸들러
  const handleVideoBlockChange = useCallback((blockId: string, value: VideoBlockDefault) => {
    updateBlockDefault(blockId, { type: 'video', value });
  }, [updateBlockDefault]);

  // 링크 블록 기본값 변경 핸들러
  const handleLinkBlockChange = useCallback((blockId: string, value: LinkBlockDefault) => {
    updateBlockDefault(blockId, { type: 'link', value });
  }, [updateBlockDefault]);

  // 파일 블록 기본값 변경 핸들러
  const handleFileBlockChange = useCallback((blockId: string, value: FileBlockDefault) => {
    updateBlockDefault(blockId, { type: 'file', value });
  }, [updateBlockDefault]);

  // 날짜 블록 기본값 변경 핸들러
  const handleDateBlockChange = useCallback((blockId: string, value: DateBlockDefault) => {
    updateBlockDefault(blockId, { type: 'date', value });
  }, [updateBlockDefault]);

  // 타임라인 블록 기본값 변경 핸들러
  const handleTimelineBlockChange = useCallback((blockId: string, value: TimelineBlockDefault) => {
    updateBlockDefault(blockId, { type: 'timeline', value });
  }, [updateBlockDefault]);

  // 선택된 블록
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // 모달 닫기 (저장 후)
  const closeModal = useCallback(async () => {
    if (textEditorRef.current) {
      await textEditorRef.current.save();
    }
    if (checklistEditorRef.current) {
      await checklistEditorRef.current.save();
    }
    if (weatherEditorRef.current) {
      await weatherEditorRef.current.save();
    }
    if (emotionEditorRef.current) {
      await emotionEditorRef.current.save();
    }
    if (imageEditorRef.current) {
      await imageEditorRef.current.save();
    }
    if (videoEditorRef.current) {
      await videoEditorRef.current.save();
    }
    if (linkEditorRef.current) {
      await linkEditorRef.current.save();
    }
    if (fileEditorRef.current) {
      await fileEditorRef.current.save();
    }
    if (dateEditorRef.current) {
      await dateEditorRef.current.save();
    }
    if (timelineEditorRef.current) {
      await timelineEditorRef.current.save();
    }
    setSelectedBlockId(null);
  }, []);

  // 블록 에디터 렌더링
  const renderBlockEditor = (block: BlockPosition) => {
    switch (block.type) {
      case 'text':
        const textDefault = block.defaultValue?.type === 'text'
          ? block.defaultValue.value
          : { richText: '', sketchData: '' };
        return (
          <TextBlockEditor
            ref={textEditorRef}
            initialValue={textDefault}
            onChange={(value) => handleTextBlockChange(block.id, value)}
          />
        );
      case 'checklist':
        const checklistDefault = block.defaultValue?.type === 'checklist'
          ? block.defaultValue.value
          : { html: '' };
        return (
          <ChecklistBlockEditor
            ref={checklistEditorRef}
            initialValue={checklistDefault}
            onChange={(value) => handleChecklistBlockChange(block.id, value)}
          />
        );
      case 'weather':
        const weatherDefault = block.defaultValue?.type === 'weather'
          ? block.defaultValue.value
          : { weather: null };
        return (
          <WeatherBlockEditor
            ref={weatherEditorRef}
            initialValue={weatherDefault}
            onChange={(value) => handleWeatherBlockChange(block.id, value)}
            onClose={() => setSelectedBlockId(null)}
          />
        );
      case 'emotion':
        const emotionDefault = block.defaultValue?.type === 'emotion'
          ? block.defaultValue.value
          : { emotion: null };
        return (
          <EmotionBlockEditor
            ref={emotionEditorRef}
            initialValue={emotionDefault}
            onChange={(value) => handleEmotionBlockChange(block.id, value)}
            onClose={() => setSelectedBlockId(null)}
          />
        );
      case 'image':
        const imageDefault = block.defaultValue?.type === 'image'
          ? block.defaultValue.value
          : { images: [] };
        return (
          <ImageBlockEditor
            ref={imageEditorRef}
            initialValue={imageDefault}
            onChange={(value) => handleImageBlockChange(block.id, value)}
          />
        );
      case 'video':
        const videoDefault = block.defaultValue?.type === 'video'
          ? block.defaultValue.value
          : { videos: [] };
        return (
          <VideoBlockEditor
            ref={videoEditorRef}
            initialValue={videoDefault}
            onChange={(value) => handleVideoBlockChange(block.id, value)}
          />
        );
      case 'link':
        const linkDefault = block.defaultValue?.type === 'link'
          ? block.defaultValue.value
          : { links: [] };
        return (
          <LinkBlockEditor
            ref={linkEditorRef}
            initialValue={linkDefault}
            onChange={(value) => handleLinkBlockChange(block.id, value)}
          />
        );
      case 'file':
        const fileDefault = block.defaultValue?.type === 'file'
          ? block.defaultValue.value
          : { files: [] };
        return (
          <FileBlockEditor
            ref={fileEditorRef}
            initialValue={fileDefault}
            onChange={(value) => handleFileBlockChange(block.id, value)}
          />
        );
      case 'date':
        const dateDefault = block.defaultValue?.type === 'date'
          ? block.defaultValue.value
          : { date: null };
        return (
          <DateBlockEditor
            ref={dateEditorRef}
            initialValue={dateDefault}
            onChange={(value) => handleDateBlockChange(block.id, value)}
            onSelectComplete={() => setSelectedBlockId(null)}
          />
        );
      case 'timeline':
        const timelineDefault = block.defaultValue?.type === 'timeline'
          ? block.defaultValue.value
          : { items: [] };
        return (
          <TimelineBlockEditor
            ref={timelineEditorRef}
            initialValue={timelineDefault}
            onChange={(value) => handleTimelineBlockChange(block.id, value)}
          />
        );
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <p className="text-sm">이 블록 타입은 아직 기본값 설정을 지원하지 않습니다.</p>
              <p className="text-xs mt-1 text-gray-400">곧 추가될 예정입니다</p>
            </div>
          </div>
        );
    }
  };

  // 블록 위치/크기 계산
  const getBlockStyle = (block: BlockPosition) => {
    const colWidth = (gridWidth - MARGIN * (GRID_COLS - 1)) / GRID_COLS;
    const rows = calculateRows(block.height || rowHeight);

    return {
      left: block.colStart * (colWidth + MARGIN),
      top: block.row * (rowHeight + MARGIN),
      width: block.colSpan * colWidth + (block.colSpan - 1) * MARGIN,
      height: rows * rowHeight + (rows - 1) * MARGIN,
    };
  };

  // 그리드 전체 높이 계산
  const gridHeight = useMemo(() => {
    if (blocks.length === 0) return 200;
    const maxBottom = blocks.reduce((max, block) => {
      const rows = calculateRows(block.height || rowHeight);
      const bottom = (block.row + rows) * (rowHeight + MARGIN);
      return Math.max(max, bottom);
    }, 0);
    return maxBottom;
  }, [blocks, rowHeight]);

  return (
    <main className="fixed inset-0 flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="flex-none bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onBack} className="text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{templateName}</h1>
        <button
          onClick={() => onNext(blocks)}
          className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          다음
        </button>
      </div>

      {/* 안내 텍스트 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <p className="text-sm text-gray-500">
          블록을 탭하여 기본값을 설정하세요
        </p>
      </div>

      {/* 블록 레이아웃 */}
      <div className="flex-1 overflow-y-auto">
        <div ref={containerRef} className="mx-4 my-4 relative" style={{ height: gridHeight }}>
          {gridWidth > 0 && blocks.map((block) => {
            const paletteItem = blockPalette.find(p => p.type === block.type);
            const Icon = iconMap[paletteItem?.icon || 'Type'];
            const style = getBlockStyle(block);
            const hasDefault = !!block.defaultValue;

            return (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                className={`
                  absolute bg-white border-2 rounded-lg shadow-sm overflow-hidden
                  cursor-pointer transition-all duration-200
                  ${hasDefault ? 'border-green-500' : 'border-gray-300'}
                  hover:border-gray-900 hover:shadow-md
                `}
                style={{
                  left: style.left,
                  top: style.top,
                  width: style.width,
                  height: style.height,
                }}
              >
                {/* 헤더 영역 */}
                <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-2 bg-gray-50/90 z-10">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      {paletteItem?.label}
                    </span>
                  </div>
                  {hasDefault && (
                    <span className="ml-auto text-[10px] text-green-600 font-medium">설정됨</span>
                  )}
                </div>

                {/* 콘텐츠 미리보기 또는 안내 */}
                <div className="absolute inset-0 pt-8 overflow-y-auto">
                  {block.type === 'text' && block.defaultValue?.type === 'text' && block.defaultValue.value.richText && block.defaultValue.value.richText !== '<p></p>' ? (
                    <div
                      className="block-preview p-2 text-xs text-gray-600 leading-relaxed break-words whitespace-pre-wrap"
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                      dangerouslySetInnerHTML={{
                        __html: block.defaultValue.value.richText
                      }}
                    />
                  ) : block.type === 'checklist' && block.defaultValue?.type === 'checklist' && block.defaultValue.value.html ? (
                    <div
                      className="checklist-preview p-2 text-xs text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: block.defaultValue.value.html
                      }}
                    />
                  ) : block.type === 'weather' && block.defaultValue?.type === 'weather' && block.defaultValue.value.weather ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <span className="text-4xl">{getWeatherInfo(block.defaultValue.value.weather)?.emoji}</span>
                      <span className="text-xs text-gray-600 mt-1">{getWeatherInfo(block.defaultValue.value.weather)?.label}</span>
                    </div>
                  ) : block.type === 'emotion' && block.defaultValue?.type === 'emotion' && block.defaultValue.value.emotion ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <span className="text-4xl">{getEmotionInfo(block.defaultValue.value.emotion)?.emoji}</span>
                      <span className="text-xs text-gray-600 mt-1">{getEmotionInfo(block.defaultValue.value.emotion)?.label}</span>
                    </div>
                  ) : block.type === 'image' && block.defaultValue?.type === 'image' && block.defaultValue.value.images.filter(img => img).length > 0 ? (
                    <SwipeablePreview>
                      {block.defaultValue.value.images.filter(img => img).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`이미지 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </SwipeablePreview>
                  ) : block.type === 'video' && block.defaultValue?.type === 'video' && block.defaultValue.value.videos.filter(v => v).length > 0 ? (
                    <SwipeablePreview>
                      {block.defaultValue.value.videos.filter(v => v).map((video, idx) => (
                        <video
                          key={idx}
                          src={video}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                      ))}
                    </SwipeablePreview>
                  ) : block.type === 'link' && block.defaultValue?.type === 'link' && block.defaultValue.value.links?.length > 0 ? (
                    <SwipeablePreview>
                      {block.defaultValue.value.links.map((link, idx) => (
                        <LinkBlockPreview key={idx} link={{ links: [link] }} />
                      ))}
                    </SwipeablePreview>
                  ) : block.type === 'file' && block.defaultValue?.type === 'file' && block.defaultValue.value.files?.filter(f => f.data).length > 0 ? (
                    <SwipeablePreview>
                      {block.defaultValue.value.files.filter(f => f.data).map((file, idx) => (
                        <FileBlockPreview key={idx} file={{ files: [file] }} />
                      ))}
                    </SwipeablePreview>
                  ) : block.type === 'date' && block.defaultValue?.type === 'date' && block.defaultValue.value.date ? (
                    <DateBlockPreview date={block.defaultValue.value} />
                  ) : block.type === 'timeline' && block.defaultValue?.type === 'timeline' && block.defaultValue.value.items?.length > 0 ? (
                    <TimelineBlockPreview value={block.defaultValue.value} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">탭하여 설정</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {blocks.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>설정할 블록이 없습니다</p>
                <p className="text-sm mt-1">먼저 블록을 추가해주세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 블록 편집 모달 - 애니메이션으로 슬라이드 업 */}
      <div
        className={`
          fixed inset-0 z-50 transition-all duration-300 ease-out
          ${selectedBlockId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* 배경 오버레이 */}
        <div
          className={`
            absolute inset-0 bg-black/50 transition-opacity duration-300
            ${selectedBlockId ? 'opacity-100' : 'opacity-0'}
          `}
          onClick={closeModal}
        />

        {/* 편집 패널 - 전체 화면 */}
        <div
          className={`
            absolute inset-0 bg-white
            transition-transform duration-300 ease-out
            ${selectedBlockId ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          {selectedBlock && (
            <>
              {/* 패널 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  {(() => {
                    const paletteItem = blockPalette.find(p => p.type === selectedBlock.type);
                    const Icon = iconMap[paletteItem?.icon || 'Type'];
                    return (
                      <>
                        <Icon className="w-5 h-5 text-gray-700" />
                        <span className="font-semibold text-gray-900">
                          {paletteItem?.label} 기본값
                        </span>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 에디터 영역 */}
              <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
                {renderBlockEditor(selectedBlock)}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
