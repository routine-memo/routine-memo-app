'use client';

import { FileText, FileAudio, File, Files } from 'lucide-react';
import { FileBlockDefault, FileItem } from '../types';

interface FileBlockPreviewProps {
  file: FileBlockDefault;
}

// 파일 크기 포맷팅
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 파일 타입에 따른 아이콘 반환 (이미지/영상 제외)
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return File;
};

// 파일 확장자 추출
const getFileExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toUpperCase() || '';
  return ext.length > 5 ? ext.substring(0, 5) : ext;
};

// 파일 타입 카테고리 반환 (이미지/영상 제외)
const getFileCategory = (mimeType: string): 'audio' | 'pdf' | 'other' => {
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
};

// 단일 파일 미리보기 컴포넌트
const SingleFilePreview = ({ fileItem }: { fileItem: FileItem }) => {
  const FileIcon = getFileIcon(fileItem.type);
  const extension = getFileExtension(fileItem.name);
  const category = getFileCategory(fileItem.type);

  // 오디오 파일
  if (category === 'audio') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 p-2">
        <FileAudio className="w-8 h-8 text-white mb-1" />
        <p className="text-[8px] text-white/90 line-clamp-2 w-full text-center px-1 break-all">
          {fileItem.name}
        </p>
      </div>
    );
  }

  // PDF 파일
  if (category === 'pdf') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-red-400 to-red-500 p-2">
        <FileText className="w-8 h-8 text-white mb-1" />
        <p className="text-[8px] text-white/90 line-clamp-2 w-full text-center px-1 break-all">
          {fileItem.name}
        </p>
      </div>
    );
  }

  // 기타 파일 - 기존 카드 스타일
  return (
    <div className="h-full w-full p-2 flex flex-col">
      {/* 아이콘 영역 */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 rounded mb-1.5">
        <FileIcon className="w-10 h-10 text-amber-500" />
      </div>

      {/* 파일 정보 */}
      <div className="flex-none">
        <p className="text-[10px] font-medium text-gray-800 line-clamp-2 leading-tight break-all">
          {fileItem.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="px-1 py-0.5 bg-gray-100 rounded text-[8px] text-gray-500 font-medium">
            {extension}
          </span>
          <span className="text-[8px] text-gray-400">
            {formatFileSize(fileItem.size)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const FileBlockPreview = ({ file }: FileBlockPreviewProps) => {
  const { files } = file;

  // 파일이 없는 경우
  if (!files || files.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
        <Files className="w-8 h-8 mb-1" />
        <span className="text-[10px]">파일 없음</span>
      </div>
    );
  }

  // 첫 번째 파일 표시
  const firstFile = files[0];

  return (
    <div className="h-full w-full relative">
      <SingleFilePreview fileItem={firstFile} />

      {/* 다중 파일인 경우 개수 표시 */}
      {files.length > 1 && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 rounded-full text-[10px] text-white font-medium flex items-center gap-0.5">
          <Files className="w-2.5 h-2.5" />
          {files.length}
        </div>
      )}
    </div>
  );
};
