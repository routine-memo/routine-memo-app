'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, X, Pencil, Check } from 'lucide-react';
import { BlockPosition, BlockDefaultValue, TextBlockDefault, ChecklistBlockDefault, WeatherBlockDefault, EmotionBlockDefault, ImageBlockDefault, VideoBlockDefault, LinkBlockDefault, FileBlockDefault, DateBlockDefault, TimelineBlockDefault, DataGraphBlockDefault, MapBlockDefault, ProgressBlockDefault } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';
import { getAlbum } from '@/lib/storage/album';
import { saveEntry, getEntry, updateEntry, loadEntryWithMedia, BlockValue } from '@/lib/storage/entry';

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
import { DataGraphEntryEditor, DataGraphEntryEditorHandle } from '@/app/template/new/components/DataGraphEntryEditor';
import { MapBlockEditor, MapBlockEditorHandle } from '@/app/template/new/components/MapBlockEditor';
import { ProgressBlockEditor, ProgressBlockEditorHandle } from '@/app/template/new/components/ProgressBlockEditor';

// 프리뷰 컴포넌트들
import { LinkBlockPreview } from '@/app/template/new/components/LinkBlockPreview';
import { FileBlockPreview } from '@/app/template/new/components/FileBlockPreview';
import { DateBlockPreview } from '@/app/template/new/components/DateBlockPreview';
import { TimelineBlockPreview } from '@/app/template/new/components/TimelineBlockPreview';
import { DataGraphBlockPreview } from '@/app/template/new/components/DataGraphBlockPreview';
import { MapBlockPreview } from '@/app/template/new/components/MapBlockPreview';
import { ProgressBlockPreview } from '@/app/template/new/components/ProgressBlockPreview';
import { SwipeablePreview } from '@/app/template/new/components/SwipeablePreview';
import { calculateRows } from '@/app/template/new/blockUtils';

const GRID_COLS = 6;
const MARGIN = 8;

// gridWidth 기준으로 행 높이 동적 계산
const getRowHeight = (gridWidth: number): number => {
  const colWidth = (gridWidth - MARGIN * (GRID_COLS - 1)) / GRID_COLS;
  return Math.min(120, Math.max(80, Math.round(colWidth * 1.5)));
};

export default function EntryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const albumId = params.id as string;
  const editEntryId = searchParams.get('edit');
  const isEditMode = !!editEntryId;

  const [album, setAlbum] = useState<{ name: string; blocks: BlockPosition[] } | null>(null);
  const [blockValues, setBlockValues] = useState<Map<string, BlockDefaultValue>>(new Map());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(null);

  const labelInputRef = useRef<HTMLInputElement>(null);
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
  const dataGraphEditorRef = useRef<DataGraphEntryEditorHandle>(null);
  const mapEditorRef = useRef<MapBlockEditorHandle>(null);
  const progressEditorRef = useRef<ProgressBlockEditorHandle>(null);

  // 앨범 데이터 및 기존 기록 로드
  useEffect(() => {
    const loadData = async () => {
      const loadedAlbum = getAlbum(albumId);
      if (loadedAlbum) {
        setAlbum({ name: loadedAlbum.name, blocks: loadedAlbum.blocks });

        // 수정 모드인 경우 기존 기록 로드
        if (editEntryId) {
          const existingEntry = getEntry(editEntryId);
          if (existingEntry) {
            // 미디어 데이터 로드
            const entryWithMedia = await loadEntryWithMedia(existingEntry);
            setOriginalCreatedAt(entryWithMedia.createdAt);

            // blockValues를 Map으로 변환
            const valuesMap = new Map<string, BlockDefaultValue>();
            entryWithMedia.blockValues.forEach(bv => {
              valuesMap.set(bv.blockId, bv.value);
            });
            setBlockValues(valuesMap);
          }
        } else {
          // 새 기록은 빈 상태로 시작 (기본값은 에디터에서 초기값으로만 사용)
          setBlockValues(new Map());
        }
      } else {
        router.push('/records');
      }
    };
    loadData();
  }, [albumId, editEntryId, router]);

  // 컨테이너 너비 감지 - 콜백 ref 사용
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    // 이전 observer 정리
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // ref 저장
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

    if (!node) return;

    const updateWidth = () => {
      const width = node.clientWidth;
      setGridWidth(width > 0 ? width : 300);
    };

    // 즉시 계산
    updateWidth();

    // ResizeObserver로 크기 변화 감지
    resizeObserverRef.current = new ResizeObserver(updateWidth);
    resizeObserverRef.current.observe(node);
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // 동적 행 높이 계산
  const rowHeight = useMemo(() => getRowHeight(gridWidth), [gridWidth]);

  // 블록 값 업데이트
  const updateBlockValue = useCallback((blockId: string, value: BlockDefaultValue) => {
    setBlockValues(prev => {
      const newMap = new Map(prev);
      newMap.set(blockId, value);
      return newMap;
    });
  }, []);

  // 텍스트 블록 변경 핸들러
  const handleTextBlockChange = useCallback((blockId: string, value: TextBlockDefault) => {
    updateBlockValue(blockId, { type: 'text', value });
  }, [updateBlockValue]);

  // 체크리스트 블록 변경 핸들러
  const handleChecklistBlockChange = useCallback((blockId: string, value: ChecklistBlockDefault) => {
    updateBlockValue(blockId, { type: 'checklist', value });
  }, [updateBlockValue]);

  // 날씨 블록 변경 핸들러
  const handleWeatherBlockChange = useCallback((blockId: string, value: WeatherBlockDefault) => {
    updateBlockValue(blockId, { type: 'weather', value });
  }, [updateBlockValue]);

  // 감정 블록 변경 핸들러
  const handleEmotionBlockChange = useCallback((blockId: string, value: EmotionBlockDefault) => {
    updateBlockValue(blockId, { type: 'emotion', value });
  }, [updateBlockValue]);

  // 이미지 블록 변경 핸들러
  const handleImageBlockChange = useCallback((blockId: string, value: ImageBlockDefault) => {
    updateBlockValue(blockId, { type: 'image', value });
  }, [updateBlockValue]);

  // 영상 블록 변경 핸들러
  const handleVideoBlockChange = useCallback((blockId: string, value: VideoBlockDefault) => {
    updateBlockValue(blockId, { type: 'video', value });
  }, [updateBlockValue]);

  // 링크 블록 변경 핸들러
  const handleLinkBlockChange = useCallback((blockId: string, value: LinkBlockDefault) => {
    updateBlockValue(blockId, { type: 'link', value });
  }, [updateBlockValue]);

  // 파일 블록 변경 핸들러
  const handleFileBlockChange = useCallback((blockId: string, value: FileBlockDefault) => {
    updateBlockValue(blockId, { type: 'file', value });
  }, [updateBlockValue]);

  // 날짜 블록 변경 핸들러
  const handleDateBlockChange = useCallback((blockId: string, value: DateBlockDefault) => {
    updateBlockValue(blockId, { type: 'date', value });
  }, [updateBlockValue]);

  // 타임라인 블록 변경 핸들러
  const handleTimelineBlockChange = useCallback((blockId: string, value: TimelineBlockDefault) => {
    updateBlockValue(blockId, { type: 'timeline', value });
  }, [updateBlockValue]);

  // 데이터 그래프 블록 변경 핸들러
  const handleDataGraphBlockChange = useCallback((blockId: string, value: DataGraphBlockDefault) => {
    updateBlockValue(blockId, { type: 'dataGraph', value });
  }, [updateBlockValue]);

  // 지도 블록 변경 핸들러
  const handleMapBlockChange = useCallback((blockId: string, value: MapBlockDefault) => {
    updateBlockValue(blockId, { type: 'map', value });
  }, [updateBlockValue]);

  // 달성도 블록 변경 핸들러
  const handleProgressBlockChange = useCallback((blockId: string, value: ProgressBlockDefault) => {
    updateBlockValue(blockId, { type: 'progress', value });
  }, [updateBlockValue]);

  // 선택된 블록
  const selectedBlock = album?.blocks.find(b => b.id === selectedBlockId);

  // 블록 값 가져오기 (사용자 입력값 또는 기본값 - 미리보기용)
  const getBlockValue = useCallback((block: BlockPosition): BlockDefaultValue | undefined => {
    return blockValues.get(block.id) || block.defaultValue;
  }, [blockValues]);

  // 사용자가 실제로 입력했는지 확인 (입력됨 표시용)
  const hasUserInput = useCallback((blockId: string): boolean => {
    return blockValues.has(blockId);
  }, [blockValues]);

  // 모달 닫기 (저장 후)
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
    if (dataGraphEditorRef.current) await dataGraphEditorRef.current.save();
    if (mapEditorRef.current) await mapEditorRef.current.save();
    if (progressEditorRef.current) await progressEditorRef.current.save();
    setIsEditingLabel(false);
    setSelectedBlockId(null);
  }, []);

  // 라벨 편집 시작
  const startEditingLabel = useCallback((block: BlockPosition) => {
    const paletteItem = blockPalette.find(p => p.type === block.type);
    setEditingLabelValue(block.customLabel || paletteItem?.label || '');
    setIsEditingLabel(true);
    setTimeout(() => labelInputRef.current?.focus(), 50);
  }, []);

  // 라벨 편집 완료
  const finishEditingLabel = useCallback(() => {
    setIsEditingLabel(false);
  }, []);

  // 기록 저장
  const handleSave = useCallback(async () => {
    if (!album || isSaving) return;

    setIsSaving(true);

    try {
      // blockValues를 BlockValue 배열로 변환
      const entryBlockValues: BlockValue[] = [];
      blockValues.forEach((value, blockId) => {
        entryBlockValues.push({ blockId, value });
      });

      if (isEditMode && editEntryId) {
        // 수정 모드: 기존 기록 업데이트
        updateEntry(editEntryId, {
          blockValues: entryBlockValues,
        });
      } else {
        // 새 기록 저장 (IndexedDB에 미디어 저장 포함)
        await saveEntry({
          albumId,
          blockValues: entryBlockValues,
        });
      }

      router.push(`/album/${albumId}`);
    } catch (error) {
      console.error('Failed to save entry:', error);
      setIsSaving(false);
    }
  }, [album, albumId, blockValues, isSaving, router, isEditMode, editEntryId]);

  // 블록 에디터 렌더링
  const renderBlockEditor = (block: BlockPosition) => {
    // 에디터는 사용자 입력값 또는 기본값을 초기값으로 사용
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
      case 'dataGraph':
        // 앨범에 정의된 fields를 가져오고, 사용자 입력값이 있으면 함께 사용
        const albumFields = block.defaultValue?.type === 'dataGraph'
          ? block.defaultValue.value.fields
          : [];
        const userValues = currentValue?.type === 'dataGraph'
          ? currentValue.value.values
          : [];
        return (
          <DataGraphEntryEditor
            ref={dataGraphEditorRef}
            initialValue={{ fields: albumFields, values: userValues }}
            onChange={(value) => handleDataGraphBlockChange(block.id, value)}
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
        // 앨범 기본값에서 모드 가져오기 (기록 시에는 모드 변경 불가)
        const albumProgressDefault = block.defaultValue?.type === 'progress' ? block.defaultValue.value : null;
        const progressDefault = currentValue?.type === 'progress'
          ? {
              ...currentValue.value,
              // 앨범에서 설정한 모드로 고정
              mode: albumProgressDefault?.mode || currentValue.value.mode,
            }
          : {
              mode: albumProgressDefault?.mode || ('dday' as const),
              title: albumProgressDefault?.title || '',
              targetDate: albumProgressDefault?.targetDate || '',
              currentValue: 0,
              targetValue: albumProgressDefault?.targetValue ?? 100,
            };
        return (
          <ProgressBlockEditor
            ref={progressEditorRef}
            initialValue={progressDefault}
            onChange={(value) => handleProgressBlockChange(block.id, value)}
            lockMode={true}
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
    if (!album || album.blocks.length === 0) return 200;
    const maxBottom = album.blocks.reduce((max, block) => {
      const rows = calculateRows(block.height || rowHeight);
      const bottom = (block.row + rows) * (rowHeight + MARGIN);
      return Math.max(max, bottom);
    }, 0);
    return Math.max(maxBottom, 200);
  }, [album, rowHeight]);

  if (!album) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-white">
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="flex-none bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button onClick={() => router.back()} className="text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">{album.name}</h1>
          {isEditMode && (
            <p className="text-xs text-blue-500">수정 중</p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : isEditMode ? '수정' : '저장'}
        </button>
      </div>

      {/* 안내 텍스트 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <p className="text-sm text-gray-500">
          {isEditMode ? '블록을 탭하여 기록을 수정하세요' : '블록을 탭하여 오늘의 기록을 입력하세요'}
        </p>
      </div>

      {/* 블록 레이아웃 */}
      <div className="flex-1 overflow-y-auto">
        <div ref={setContainerRef} className="mx-4 my-4 relative" style={{ height: gridHeight, minHeight: 200, paddingBottom: '50vh' }}>
          {gridWidth > 0 && album.blocks.map((block) => {
            const paletteItem = blockPalette.find(p => p.type === block.type);
            const Icon = iconMap[paletteItem?.icon || 'Type'];
            const style = getBlockStyle(block);
            const currentValue = getBlockValue(block);
            const isUserEntered = hasUserInput(block.id); // 사용자가 직접 입력했는지

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
                  ) : block.type === 'dataGraph' && block.defaultValue?.type === 'dataGraph' && block.defaultValue.value.fields?.length > 0 ? (
                    <DataGraphBlockPreview
                      value={{
                        fields: block.defaultValue.value.fields,
                        values: currentValue?.type === 'dataGraph' ? currentValue.value.values : undefined
                      }}
                      albumId={albumId}
                      blockId={block.id}
                    />
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

          {album.blocks.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>블록이 없습니다</p>
                <p className="text-sm mt-1">앨범 설정에서 블록을 추가해주세요</p>
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
