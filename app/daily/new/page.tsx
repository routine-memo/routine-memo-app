'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Pencil, Check, Tag, Plus } from 'lucide-react';
import { BlockPosition, BlockType, BlockDefaultValue, TextBlockDefault, ChecklistBlockDefault, WeatherBlockDefault, EmotionBlockDefault, ImageBlockDefault, VideoBlockDefault, LinkBlockDefault, FileBlockDefault, DateBlockDefault, TimelineBlockDefault, MapBlockDefault, ProgressBlockDefault } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';
import { createBlock, deleteBlock } from '@/app/template/new/blockManagement';

// 즉석 앨범에서 제외할 블록 타입 (데이터 그래프는 앨범 템플릿 기반이라 제외)
const dailyBlockPalette = blockPalette.filter(b => b.type !== 'dataGraph');
import { GridLayoutBlocks } from '@/app/template/new/components/GridLayoutBlocks';
import { BlockPalette } from '@/app/template/new/components/BlockPalette';
import { saveDailyEntry, getDailyTags, BlockValue } from '@/lib/storage/dailyEntry';

// 에디터 컴포넌트들
import { TextBlockEditor, TextBlockEditorHandle } from '@/app/template/new/components/TextBlockEditor';
import { ChecklistBlockEditor, ChecklistBlockEditorHandle } from '@/app/template/new/components/ChecklistBlockEditor';
import { WeatherBlockEditor, WeatherBlockEditorHandle, getWeatherInfo } from '@/app/template/new/components/WeatherBlockEditor';
import { EmotionBlockEditor, EmotionBlockEditorHandle, getEmotionInfo } from '@/app/template/new/components/EmotionBlockEditor';
import { ImageBlockEditor, ImageBlockEditorHandle } from '@/app/template/new/components/ImageBlockEditor';
import { VideoBlockEditor, VideoBlockEditorHandle } from '@/app/template/new/components/VideoBlockEditor';
import { LinkBlockEditor, LinkBlockEditorHandle } from '@/app/template/new/components/LinkBlockEditor';
import { FileBlockEditor, FileBlockEditorHandle } from '@/app/template/new/components/FileBlockEditor';
import { DateBlockEditor, DateBlockEditorHandle } from '@/app/template/new/components/DateBlockEditor';
import { TimelineBlockEditor, TimelineBlockEditorHandle } from '@/app/template/new/components/TimelineBlockEditor';
import { MapBlockEditor, MapBlockEditorHandle } from '@/app/template/new/components/MapBlockEditor';
import { ProgressBlockEditor, ProgressBlockEditorHandle } from '@/app/template/new/components/ProgressBlockEditor';

// 프리뷰 컴포넌트들
import { LinkBlockPreview } from '@/app/template/new/components/LinkBlockPreview';
import { FileBlockPreview } from '@/app/template/new/components/FileBlockPreview';
import { DateBlockPreview } from '@/app/template/new/components/DateBlockPreview';
import { TimelineBlockPreview } from '@/app/template/new/components/TimelineBlockPreview';
import { MapBlockPreview } from '@/app/template/new/components/MapBlockPreview';
import { ProgressBlockPreview } from '@/app/template/new/components/ProgressBlockPreview';
import { SwipeablePreview } from '@/app/template/new/components/SwipeablePreview';
import { calculateRows } from '@/app/template/new/blockUtils';

type DailyStep = 'blocks' | 'entry' | 'tags';

const GRID_COLS = 6;
const MARGIN = 8;

const getRowHeight = (gridWidth: number): number => {
  const colWidth = (gridWidth - MARGIN * (GRID_COLS - 1)) / GRID_COLS;
  return Math.min(120, Math.max(80, Math.round(colWidth * 1.5)));
};

export default function DailyNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<DailyStep>('blocks');

  // 블록 배치 단계 상태
  const [blockPositions, setBlockPositions] = useState<BlockPosition[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);

  // 기록 입력 단계 상태
  const [blockValues, setBlockValues] = useState<Map<string, BlockDefaultValue>>(new Map());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editingLabelValue, setEditingLabelValue] = useState('');

  // 태그 단계 상태
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [existingTags, setExistingTags] = useState<{ tag: string; count: number }[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
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
  const mapEditorRef = useRef<MapBlockEditorHandle>(null);
  const progressEditorRef = useRef<ProgressBlockEditorHandle>(null);

  // 기존 태그 로드
  useEffect(() => {
    const dailyTags = getDailyTags();
    setExistingTags(dailyTags);
  }, []);

  // 컨테이너 너비 감지
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

    if (!node) return;

    const updateWidth = () => {
      const width = node.clientWidth;
      setGridWidth(width > 0 ? width : 300);
    };

    updateWidth();

    resizeObserverRef.current = new ResizeObserver(updateWidth);
    resizeObserverRef.current.observe(node);
  }, []);

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  const rowHeight = useMemo(() => getRowHeight(gridWidth), [gridWidth]);

  // 블록 추가
  const addBlock = useCallback((type: BlockType) => {
    const newBlock = createBlock(type, blockPositions);
    setBlockPositions([...blockPositions, newBlock]);
    setShowPalette(false);
  }, [blockPositions]);

  // 블록 삭제
  const removeBlock = useCallback((id: string) => {
    const updatedBlocks = deleteBlock(id, blockPositions);
    setBlockPositions(updatedBlocks);
  }, [blockPositions]);

  // 레이아웃 변경
  const handleLayoutChange = useCallback((updatedBlocks: BlockPosition[]) => {
    setBlockPositions(updatedBlocks);
  }, []);

  // 블록 값 업데이트
  const updateBlockValue = useCallback((blockId: string, value: BlockDefaultValue) => {
    setBlockValues(prev => {
      const newMap = new Map(prev);
      newMap.set(blockId, value);
      return newMap;
    });
  }, []);

  // 블록 변경 핸들러들
  const handleTextBlockChange = useCallback((blockId: string, value: TextBlockDefault) => {
    updateBlockValue(blockId, { type: 'text', value });
  }, [updateBlockValue]);

  const handleChecklistBlockChange = useCallback((blockId: string, value: ChecklistBlockDefault) => {
    updateBlockValue(blockId, { type: 'checklist', value });
  }, [updateBlockValue]);

  const handleWeatherBlockChange = useCallback((blockId: string, value: WeatherBlockDefault) => {
    updateBlockValue(blockId, { type: 'weather', value });
  }, [updateBlockValue]);

  const handleEmotionBlockChange = useCallback((blockId: string, value: EmotionBlockDefault) => {
    updateBlockValue(blockId, { type: 'emotion', value });
  }, [updateBlockValue]);

  const handleImageBlockChange = useCallback((blockId: string, value: ImageBlockDefault) => {
    updateBlockValue(blockId, { type: 'image', value });
  }, [updateBlockValue]);

  const handleVideoBlockChange = useCallback((blockId: string, value: VideoBlockDefault) => {
    updateBlockValue(blockId, { type: 'video', value });
  }, [updateBlockValue]);

  const handleLinkBlockChange = useCallback((blockId: string, value: LinkBlockDefault) => {
    updateBlockValue(blockId, { type: 'link', value });
  }, [updateBlockValue]);

  const handleFileBlockChange = useCallback((blockId: string, value: FileBlockDefault) => {
    updateBlockValue(blockId, { type: 'file', value });
  }, [updateBlockValue]);

  const handleDateBlockChange = useCallback((blockId: string, value: DateBlockDefault) => {
    updateBlockValue(blockId, { type: 'date', value });
  }, [updateBlockValue]);

  const handleTimelineBlockChange = useCallback((blockId: string, value: TimelineBlockDefault) => {
    updateBlockValue(blockId, { type: 'timeline', value });
  }, [updateBlockValue]);

  const handleMapBlockChange = useCallback((blockId: string, value: MapBlockDefault) => {
    updateBlockValue(blockId, { type: 'map', value });
  }, [updateBlockValue]);

  const handleProgressBlockChange = useCallback((blockId: string, value: ProgressBlockDefault) => {
    updateBlockValue(blockId, { type: 'progress', value });
  }, [updateBlockValue]);

  // 선택된 블록
  const selectedBlock = blockPositions.find(b => b.id === selectedBlockId);

  // 블록 값 가져오기
  const getBlockValue = useCallback((block: BlockPosition): BlockDefaultValue | undefined => {
    return blockValues.get(block.id) || block.defaultValue;
  }, [blockValues]);

  // 사용자 입력 확인
  const hasUserInput = useCallback((blockId: string): boolean => {
    return blockValues.has(blockId);
  }, [blockValues]);

  // 모달 닫기
  const closeModal = useCallback(async () => {
    if (textEditorRef.current) await textEditorRef.current.save();
    if (checklistEditorRef.current) await checklistEditorRef.current.save();
    if (weatherEditorRef.current) await weatherEditorRef.current.save();
    if (emotionEditorRef.current) await emotionEditorRef.current.save();
    if (imageEditorRef.current) await imageEditorRef.current.save();
    if (videoEditorRef.current) await videoEditorRef.current.save();
    if (linkEditorRef.current) await linkEditorRef.current.save();
    if (fileEditorRef.current) await fileEditorRef.current.save();
    if (dateEditorRef.current) await dateEditorRef.current.save();
    if (timelineEditorRef.current) await timelineEditorRef.current.save();
    if (mapEditorRef.current) await mapEditorRef.current.save();
    if (progressEditorRef.current) await progressEditorRef.current.save();
    setIsEditingLabel(false);
    setSelectedBlockId(null);
  }, []);

  // 라벨 편집
  const startEditingLabel = useCallback((block: BlockPosition) => {
    const paletteItem = blockPalette.find(p => p.type === block.type);
    setEditingLabelValue(block.customLabel || paletteItem?.label || '');
    setIsEditingLabel(true);
    setTimeout(() => labelInputRef.current?.focus(), 50);
  }, []);

  const finishEditingLabel = useCallback(() => {
    setIsEditingLabel(false);
  }, []);

  // 저장
  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const entryBlockValues: BlockValue[] = [];
      blockValues.forEach((value, blockId) => {
        entryBlockValues.push({ blockId, value });
      });

      await saveDailyEntry({
        blocks: blockPositions,
        blockValues: entryBlockValues,
        tags: tags.length > 0 ? tags : undefined,
      });

      router.push('/records');
    } catch (error) {
      console.error('Failed to save daily entry:', error);
      setIsSaving(false);
    }
  }, [blockPositions, blockValues, isSaving, router, tags]);

  // 취소/뒤로가기
  const handleCancel = useCallback(() => {
    if (step === 'tags') {
      setStep('entry');
      return;
    }
    if (step === 'entry') {
      setStep('blocks');
      return;
    }

    const hasAnyContent = blockPositions.length > 0 || blockValues.size > 0;

    if (hasAnyContent) {
      if (confirm('입력한 내용이 저장되지 않습니다. 정말 취소하시겠습니까?')) {
        router.back();
      }
    } else {
      router.back();
    }
  }, [blockPositions, blockValues, router, step]);

  // 다음 단계
  const handleNext = useCallback(() => {
    if (step === 'blocks') {
      setStep('entry');
    } else if (step === 'entry') {
      setStep('tags');
    }
  }, [step]);

  // 태그 추가/제거
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
    }
    setTagInput('');
  }, [tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  }, []);

  // 블록 에디터 렌더링
  const renderBlockEditor = (block: BlockPosition) => {
    const currentValue = getBlockValue(block);

    switch (block.type) {
      case 'text':
        const textDefault = currentValue?.type === 'text'
          ? currentValue.value
          : { richText: '', sketchData: '' };
        return (
          <TextBlockEditor
            ref={textEditorRef}
            initialValue={textDefault}
            onChange={(value) => handleTextBlockChange(block.id, value)}
          />
        );
      case 'checklist':
        const checklistDefault = currentValue?.type === 'checklist'
          ? currentValue.value
          : { html: '' };
        return (
          <ChecklistBlockEditor
            ref={checklistEditorRef}
            initialValue={checklistDefault}
            onChange={(value) => handleChecklistBlockChange(block.id, value)}
          />
        );
      case 'weather':
        const weatherDefault = currentValue?.type === 'weather'
          ? currentValue.value
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
        const emotionDefault = currentValue?.type === 'emotion'
          ? currentValue.value
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
        const imageDefault = currentValue?.type === 'image'
          ? currentValue.value
          : { images: [] };
        return (
          <ImageBlockEditor
            ref={imageEditorRef}
            initialValue={imageDefault}
            onChange={(value) => handleImageBlockChange(block.id, value)}
          />
        );
      case 'video':
        const videoDefault = currentValue?.type === 'video'
          ? currentValue.value
          : { videos: [] };
        return (
          <VideoBlockEditor
            ref={videoEditorRef}
            initialValue={videoDefault}
            onChange={(value) => handleVideoBlockChange(block.id, value)}
          />
        );
      case 'link':
        const linkDefault = currentValue?.type === 'link'
          ? currentValue.value
          : { links: [] };
        return (
          <LinkBlockEditor
            ref={linkEditorRef}
            initialValue={linkDefault}
            onChange={(value) => handleLinkBlockChange(block.id, value)}
          />
        );
      case 'file':
        const fileDefault = currentValue?.type === 'file'
          ? currentValue.value
          : { files: [] };
        return (
          <FileBlockEditor
            ref={fileEditorRef}
            initialValue={fileDefault}
            onChange={(value) => handleFileBlockChange(block.id, value)}
          />
        );
      case 'date':
        const dateDefault = currentValue?.type === 'date'
          ? currentValue.value
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
        const timelineDefault = currentValue?.type === 'timeline'
          ? currentValue.value
          : { items: [] };
        return (
          <TimelineBlockEditor
            ref={timelineEditorRef}
            initialValue={timelineDefault}
            onChange={(value) => handleTimelineBlockChange(block.id, value)}
          />
        );
      case 'map':
        const mapDefault = currentValue?.type === 'map'
          ? currentValue.value
          : { markers: [], center: { lat: 37.5665, lng: 126.9780 }, level: 5 };
        return (
          <MapBlockEditor
            ref={mapEditorRef}
            initialValue={mapDefault}
            onChange={(value) => handleMapBlockChange(block.id, value)}
          />
        );
      case 'progress':
        const progressDefault = currentValue?.type === 'progress'
          ? currentValue.value
          : {
              mode: 'dday' as const,
              title: '',
              targetDate: '',
              currentValue: 0,
              targetValue: 100,
            };
        return (
          <ProgressBlockEditor
            ref={progressEditorRef}
            initialValue={progressDefault}
            onChange={(value) => handleProgressBlockChange(block.id, value)}
            lockMode={false}
          />
        );
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <p className="text-sm">이 블록 타입은 아직 지원하지 않습니다.</p>
            </div>
          </div>
        );
    }
  };

  // 블록 스타일 계산
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

  // 그리드 높이 계산
  const gridHeight = useMemo(() => {
    if (blockPositions.length === 0) return 200;
    const maxBottom = blockPositions.reduce((max, block) => {
      const rows = calculateRows(block.height || rowHeight);
      const bottom = (block.row + rows) * (rowHeight + MARGIN);
      return Math.max(max, bottom);
    }, 0);
    return Math.max(maxBottom, 200);
  }, [blockPositions, rowHeight]);

  // Step 1: 블록 배치
  if (step === 'blocks') {
    return (
      <main className="fixed inset-0 flex flex-col bg-gray-50">
        <div className="flex-none bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={handleCancel} className="text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">즉석 앨범</h1>
          <button
            onClick={handleNext}
            disabled={blockPositions.length === 0}
            className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>

        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <p className="text-sm text-gray-500">
            블록을 추가하여 기록 템플릿을 만드세요
          </p>
        </div>

        <div
          className="flex-1 overflow-y-auto py-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div ref={setContainerRef} className="mx-4 pb-[50vh]">
            <GridLayoutBlocks
              blockPositions={blockPositions}
              iconMap={iconMap}
              gridWidth={gridWidth}
              onLayoutChange={handleLayoutChange}
              onRemove={removeBlock}
            />
          </div>
        </div>

        <BlockPalette
          showPalette={showPalette}
          iconMap={iconMap}
          onToggle={() => setShowPalette(!showPalette)}
          onAddBlock={addBlock}
          customPalette={dailyBlockPalette}
        />
      </main>
    );
  }

  // Step 2: 기록 입력
  if (step === 'entry') {
    return (
      <main className="fixed inset-0 flex flex-col bg-gray-50">
        {/* 헤더 */}
        <div className="flex-none bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <button onClick={handleCancel} className="text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">즉석 앨범</h1>
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            다음
          </button>
        </div>

        {/* 안내 텍스트 */}
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <p className="text-sm text-gray-500">
            블록을 탭하여 기록을 입력하세요
          </p>
        </div>

        {/* 블록 레이아웃 */}
        <div className="flex-1 overflow-y-auto">
          <div ref={setContainerRef} className="mx-4 my-4 relative" style={{ height: gridHeight, minHeight: 200, paddingBottom: '50vh' }}>
            {gridWidth > 0 && blockPositions.map((block) => {
              const paletteItem = blockPalette.find(p => p.type === block.type);
              const Icon = iconMap[paletteItem?.icon || 'Type'];
              const style = getBlockStyle(block);
              const currentValue = getBlockValue(block);
              const isUserEntered = hasUserInput(block.id);

              return (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`
                    absolute bg-white border-2 rounded-lg shadow-sm overflow-hidden
                    cursor-pointer transition-all duration-200
                    ${isUserEntered ? 'border-green-500' : 'border-gray-900'}
                    hover:shadow-md
                  `}
                  style={{
                    left: style.left,
                    top: style.top,
                    width: style.width,
                    height: style.height,
                  }}
                >
                  {/* 헤더 영역 */}
                  <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-2 bg-gray-900 rounded-t-[4px] z-10">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-medium text-white truncate">
                        {block.customLabel || paletteItem?.label}
                      </span>
                    </div>
                    {isUserEntered && (
                      <span className="ml-auto text-[10px] text-green-400 font-medium flex-none">입력됨</span>
                    )}
                  </div>

                  {/* 콘텐츠 미리보기 또는 안내 */}
                  <div className="absolute inset-0 pt-8 overflow-y-auto">
                    {block.type === 'text' && currentValue?.type === 'text' && currentValue.value.richText && currentValue.value.richText !== '<p></p>' ? (
                      <div
                        className="block-preview p-2 text-xs text-gray-600 leading-relaxed break-words whitespace-pre-wrap"
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        dangerouslySetInnerHTML={{
                          __html: currentValue.value.richText
                        }}
                      />
                    ) : block.type === 'checklist' && currentValue?.type === 'checklist' && currentValue.value.html ? (
                      <div
                        className="checklist-preview p-2 text-xs text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: currentValue.value.html
                        }}
                      />
                    ) : block.type === 'weather' && currentValue?.type === 'weather' && currentValue.value.weather ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <span className="text-4xl">{getWeatherInfo(currentValue.value.weather)?.emoji}</span>
                        <span className="text-xs text-gray-600 mt-1">{getWeatherInfo(currentValue.value.weather)?.label}</span>
                      </div>
                    ) : block.type === 'emotion' && currentValue?.type === 'emotion' && currentValue.value.emotion ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <span className="text-4xl">{getEmotionInfo(currentValue.value.emotion)?.emoji}</span>
                        <span className="text-xs text-gray-600 mt-1">{getEmotionInfo(currentValue.value.emotion)?.label}</span>
                      </div>
                    ) : block.type === 'image' && currentValue?.type === 'image' && currentValue.value.images.filter(img => img).length > 0 ? (
                      <SwipeablePreview>
                        {currentValue.value.images.filter(img => img).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`이미지 ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ))}
                      </SwipeablePreview>
                    ) : block.type === 'video' && currentValue?.type === 'video' && currentValue.value.videos.filter(v => v).length > 0 ? (
                      <SwipeablePreview>
                        {currentValue.value.videos.filter(v => v).map((video, idx) => (
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
                    ) : block.type === 'link' && currentValue?.type === 'link' && currentValue.value.links?.length > 0 ? (
                      <SwipeablePreview>
                        {currentValue.value.links.map((link, idx) => (
                          <LinkBlockPreview key={idx} link={{ links: [link] }} />
                        ))}
                      </SwipeablePreview>
                    ) : block.type === 'file' && currentValue?.type === 'file' && currentValue.value.files?.filter(f => f.data).length > 0 ? (
                      <SwipeablePreview>
                        {currentValue.value.files.filter(f => f.data).map((file, idx) => (
                          <FileBlockPreview key={idx} file={{ files: [file] }} />
                        ))}
                      </SwipeablePreview>
                    ) : block.type === 'date' && currentValue?.type === 'date' && currentValue.value.date ? (
                      <DateBlockPreview date={currentValue.value} />
                    ) : block.type === 'timeline' && currentValue?.type === 'timeline' && currentValue.value.items?.length > 0 ? (
                      <TimelineBlockPreview value={currentValue.value} />
                    ) : block.type === 'map' && currentValue?.type === 'map' && currentValue.value.markers?.length > 0 ? (
                      <MapBlockPreview value={currentValue.value} />
                    ) : block.type === 'progress' && currentValue?.type === 'progress' && (currentValue.value.title || currentValue.value.targetDate || (currentValue.value.currentValue !== undefined && currentValue.value.currentValue > 0)) ? (
                      <ProgressBlockPreview value={currentValue.value} />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-gray-400">탭하여 입력</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {blockPositions.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p>블록이 없습니다</p>
                  <p className="text-sm mt-1">이전 단계에서 블록을 추가해주세요</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 블록 편집 모달 */}
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

          {/* 편집 패널 */}
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
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {(() => {
                      const paletteItem = blockPalette.find(p => p.type === selectedBlock.type);
                      const Icon = iconMap[paletteItem?.icon || 'Type'];
                      const displayLabel = selectedBlock.customLabel || paletteItem?.label || '';
                      return (
                        <>
                          <Icon className="w-5 h-5 text-gray-700 flex-none" />
                          {isEditingLabel ? (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <input
                                ref={labelInputRef}
                                type="text"
                                value={editingLabelValue}
                                onChange={(e) => setEditingLabelValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') finishEditingLabel();
                                  if (e.key === 'Escape') setIsEditingLabel(false);
                                }}
                                className="flex-1 min-w-0 px-2 py-1 text-sm font-semibold border border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                                placeholder="블록 이름"
                              />
                              <button
                                onClick={finishEditingLabel}
                                className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex-none"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditingLabel(selectedBlock)}
                              className="flex items-center gap-1.5 group"
                            >
                              <span className="font-semibold text-gray-900 truncate">
                                {displayLabel}
                              </span>
                              <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors flex-none" />
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-none ml-2"
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
  }

  // Step 3: 태그 입력
  const filteredExistingTags = existingTags.filter(
    et => !tags.includes(et.tag) && et.tag.toLowerCase().includes(tagInput.toLowerCase())
  );

  return (
    <main className="fixed inset-0 flex flex-col bg-white">
      <div className="flex-none bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={handleCancel} className="text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">태그 추가</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">오늘의 태그</h2>
          </div>
          <p className="text-sm text-gray-500">
            이 기록에 태그를 추가하세요 (선택사항)
          </p>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="태그 입력 후 Enter"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
            />
            <button
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim()}
              className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">선택된 태그</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="p-0.5 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {filteredExistingTags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              이전에 사용한 태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {filteredExistingTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                >
                  #{tag}
                  <span className="text-xs text-gray-400">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
