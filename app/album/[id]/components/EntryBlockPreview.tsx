'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Download, ExternalLink, MapPin, Target, Calendar } from 'lucide-react';
import { BlockPosition, BlockDefaultValue, LinkItem, FileItem, MapMarker, TimelineItem } from '@/app/template/new/types';
import { blockPalette } from '@/app/template/new/blockPalette';
import { iconMap } from '@/app/template/new/iconMap';
import { getWeatherInfo } from '@/app/template/new/components/WeatherBlockEditor';
import { getEmotionInfo } from '@/app/template/new/components/EmotionBlockEditor';

interface EntryBlockPreviewProps {
  block: BlockPosition;
  value: BlockDefaultValue;
}

export function EntryBlockPreview({ block, value }: EntryBlockPreviewProps) {
  const paletteItem = blockPalette.find(p => p.type === block.type);
  const Icon = iconMap[paletteItem?.icon || 'Type'];
  const label = block.customLabel || paletteItem?.label || '';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-2.5 bg-gray-900 flex items-center gap-2">
        <Icon className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white">{label}</span>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        <BlockContent value={value} />
      </div>
    </div>
  );
}

// 블록 타입별 콘텐츠 렌더링
function BlockContent({ value }: { value: BlockDefaultValue }) {
  switch (value.type) {
    case 'text':
      return <TextContent value={value.value} />;
    case 'image':
      return <ImageContent images={value.value.images} />;
    case 'video':
      return <VideoContent videos={value.value.videos} />;
    case 'link':
      return <LinkContent links={value.value.links} />;
    case 'file':
      return <FileContent files={value.value.files} />;
    case 'weather':
      return <WeatherContent weather={value.value.weather} />;
    case 'emotion':
      return <EmotionContent emotion={value.value.emotion} />;
    case 'date':
      return <DateContent date={value.value.date} />;
    case 'checklist':
      return <ChecklistContent html={value.value.html} />;
    case 'timeline':
      return <TimelineContent items={value.value.items} />;
    case 'dataGraph':
      return <DataGraphContent fields={value.value.fields} values={value.value.values} />;
    case 'map':
      return <MapContent markers={value.value.markers} />;
    case 'progress':
      return <ProgressContent value={value.value} />;
    default:
      return null;
  }
}

// 텍스트 콘텐츠
function TextContent({ value }: { value: { richText: string; sketchData: string } }) {
  return (
    <div
      className="prose prose-sm max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: value.richText }}
    />
  );
}

// 이미지 캐러셀
function ImageContent({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
        <img src={images[0]} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
        <img
          src={images[currentIndex]}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* 좌우 화살표 */}
      {currentIndex > 0 && (
        <button
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => setCurrentIndex(prev => prev + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      )}

      {/* 인디케이터 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* 카운트 */}
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
        {currentIndex + 1}/{images.length}
      </div>
    </div>
  );
}

// 비디오 캐러셀
function VideoContent({ videos }: { videos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (videos.length === 0) return null;

  return (
    <div className="relative">
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
        <video
          src={videos[currentIndex]}
          controls
          className="w-full h-full object-contain"
        />
      </div>

      {videos.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
          {currentIndex < videos.length - 1 && (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          )}

          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
            {currentIndex + 1}/{videos.length}
          </div>
        </>
      )}
    </div>
  );
}

// 링크 캐러셀
function LinkContent({ links }: { links: LinkItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (links.length === 0) return null;

  const link = links[currentIndex];

  return (
    <div className="relative">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
      >
        {link.metadata?.image && (
          <div className="aspect-video bg-gray-100">
            <img
              src={link.metadata.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-3">
          <div className="flex items-start gap-2">
            {link.metadata?.favicon && (
              <img src={link.metadata.favicon} alt="" className="w-4 h-4 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm line-clamp-1">
                {link.metadata?.title || link.url}
              </p>
              {link.metadata?.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                  {link.metadata.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {new URL(link.url).hostname}
              </p>
            </div>
          </div>
        </div>
      </a>

      {links.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.preventDefault(); setCurrentIndex(prev => prev - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
          {currentIndex < links.length - 1 && (
            <button
              onClick={(e) => { e.preventDefault(); setCurrentIndex(prev => prev + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          )}

          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
            {currentIndex + 1}/{links.length}
          </div>
        </>
      )}
    </div>
  );
}

// 파일 캐러셀
function FileContent({ files }: { files: FileItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (files.length === 0) return null;

  const file = files[currentIndex];
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  return (
    <div className="relative">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {files.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-1 text-gray-400 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500">
            {currentIndex + 1}/{files.length}
          </span>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(files.length - 1, prev + 1))}
            disabled={currentIndex === files.length - 1}
            className="p-1 text-gray-400 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// 날씨
function WeatherContent({ weather }: { weather: string | null }) {
  if (!weather) return null;
  const info = getWeatherInfo(weather as any);
  if (!info) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-4xl">{info.emoji}</span>
      <span className="text-lg font-medium text-gray-700">{info.label}</span>
    </div>
  );
}

// 감정
function EmotionContent({ emotion }: { emotion: string | null }) {
  if (!emotion) return null;
  const info = getEmotionInfo(emotion as any);
  if (!info) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-4xl">{info.emoji}</span>
      <span className="text-lg font-medium text-gray-700">{info.label}</span>
    </div>
  );
}

// 날짜
function DateContent({ date }: { date: string | null }) {
  if (!date) return null;
  const d = new Date(date);

  return (
    <div className="flex items-center gap-3">
      <Calendar className="w-6 h-6 text-gray-400" />
      <span className="text-lg font-medium text-gray-700">
        {d.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })}
      </span>
    </div>
  );
}

// 체크리스트
function ChecklistContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none checklist-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// 타임라인
function TimelineContent({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) return null;

  // 시간순 정렬
  const sortedItems = [...items].sort((a, b) => {
    const aStart = a.rows[0]?.hour || 0;
    const bStart = b.rows[0]?.hour || 0;
    return aStart - bStart;
  });

  return (
    <div className="space-y-2">
      {sortedItems.map(item => {
        const startHour = Math.min(...item.rows.map(r => r.hour));
        const endHour = Math.max(...item.rows.map(r => r.hour)) + 1;

        return (
          <div key={item.id} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-none"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
              <p className="text-xs text-gray-500">
                {startHour}:00 - {endHour}:00
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 데이터 그래프
function DataGraphContent({ fields, values }: { fields: any[]; values?: any[] }) {
  if (!values || values.length === 0) return null;

  return (
    <div className="space-y-2">
      {values.map(v => {
        const field = fields.find(f => f.id === v.fieldId);
        if (!field) return null;

        return (
          <div key={v.fieldId} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{field.name}</span>
            <span className="font-medium text-gray-900">
              {field.format === 'percent' ? `${v.value}%` : v.value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 지도
function MapContent({ markers }: { markers: MapMarker[] }) {
  if (markers.length === 0) return null;

  return (
    <div className="space-y-2">
      {markers.map(marker => (
        <div key={marker.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-none"
            style={{ backgroundColor: marker.color }}
          >
            <MapPin className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm">{marker.name}</p>
            {marker.address && (
              <p className="text-xs text-gray-500 truncate">{marker.address}</p>
            )}
            {marker.memo && (
              <p className="text-xs text-gray-600 mt-1">{marker.memo}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// 달성도
function ProgressContent({ value }: { value: any }) {
  if (value.mode === 'dday' && value.targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(value.targetDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div className="text-center py-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Target className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-700">{value.title || '목표'}</span>
        </div>
        <span className={`text-3xl font-bold ${diff <= 0 ? 'text-green-600' : 'text-gray-900'}`}>
          {diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`}
        </span>
      </div>
    );
  }

  if (value.mode === 'percent' && value.currentValue !== undefined && value.targetValue) {
    const percent = Math.min(100, Math.round((value.currentValue / value.targetValue) * 100));

    return (
      <div className="py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">{value.title || '목표'}</span>
          <span className="text-sm text-gray-500">
            {value.currentValue.toLocaleString()} / {value.targetValue.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-center mt-2 font-bold text-lg text-gray-900">
          {percent}%
        </p>
      </div>
    );
  }

  return null;
}
