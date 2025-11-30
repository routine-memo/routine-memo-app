'use client';

import { Globe, ExternalLink, Play, Link2 } from 'lucide-react';
import { LinkBlockDefault, LinkItem } from '../types';

interface LinkBlockPreviewProps {
  link: LinkBlockDefault;
}

// URL에서 도메인 추출
const getDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
};

// YouTube 썸네일 URL 추출
const getYoutubeThumbnail = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
  }
  return null;
};

// YouTube 비디오인지 확인
const isYoutubeUrl = (url: string): boolean => {
  const domain = getDomain(url).toLowerCase();
  return domain.includes('youtube.com') || domain.includes('youtu.be');
};

// 단일 링크 미리보기 컴포넌트
const SingleLinkPreview = ({ linkItem }: { linkItem: LinkItem }) => {
  const { url, displayMode, metadata } = linkItem;
  const youtubeThumbnail = getYoutubeThumbnail(url);
  const isYoutube = isYoutubeUrl(url);

  // 임베드 모드이고 YouTube인 경우 썸네일 표시
  if (displayMode === 'embed' && isYoutube && youtubeThumbnail) {
    return (
      <div className="h-full w-full relative bg-black">
        <img
          src={youtubeThumbnail}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* 재생 버튼 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
        {/* 사이트 표시 */}
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white flex items-center gap-1">
          <Play className="w-3 h-3" />
          YouTube
        </div>
      </div>
    );
  }

  // 미리보기 카드 모드
  return (
    <div className="h-full w-full p-2 flex flex-col">
      {/* 메타 이미지가 있는 경우 */}
      {metadata?.image ? (
        <div className="flex-1 min-h-0 rounded overflow-hidden bg-gray-100 mb-1.5">
          <img
            src={metadata.image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        // 이미지가 없는 경우 파비콘과 도메인 표시
        <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-50 rounded mb-1.5">
          {metadata?.favicon ? (
            <img
              src={metadata.favicon}
              alt=""
              className="w-8 h-8"
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-8 h-8 text-gray-300"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>';
                }
              }}
            />
          ) : (
            <Globe className="w-8 h-8 text-gray-300" />
          )}
        </div>
      )}

      {/* 타이틀 및 도메인 */}
      <div className="flex-none">
        <p className="text-[10px] font-medium text-gray-800 truncate leading-tight">
          {metadata?.title || getDomain(url)}
        </p>
        <p className="text-[8px] text-gray-400 truncate flex items-center gap-0.5 mt-0.5">
          <ExternalLink className="w-2 h-2 flex-none" />
          {getDomain(url)}
        </p>
      </div>
    </div>
  );
};

export const LinkBlockPreview = ({ link }: LinkBlockPreviewProps) => {
  const { links } = link;

  // 링크가 없는 경우
  if (!links || links.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
        <Link2 className="w-8 h-8 mb-1" />
        <span className="text-[10px]">링크 없음</span>
      </div>
    );
  }

  // 첫 번째 링크 표시
  const firstLink = links[0];

  return (
    <div className="h-full w-full relative">
      <SingleLinkPreview linkItem={firstLink} />

      {/* 다중 링크인 경우 개수 표시 */}
      {links.length > 1 && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 rounded-full text-[10px] text-white font-medium flex items-center gap-0.5">
          <Link2 className="w-2.5 h-2.5" />
          {links.length}
        </div>
      )}
    </div>
  );
};
