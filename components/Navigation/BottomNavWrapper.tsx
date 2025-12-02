'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function BottomNavWrapper() {
  const pathname = usePathname();

  // 하단 네비게이션 숨길 페이지들
  const hideNav =
    pathname?.startsWith('/template/') ||  // 템플릿 생성/편집
    pathname?.startsWith('/create') ||     // 앨범 생성
    pathname?.startsWith('/album/') ||     // 앨범 상세 (기록 보기, 수정, 입력 모두 포함)
    pathname?.endsWith('/edit') ||         // 앨범 수정 (/album/[id]/edit)
    pathname?.endsWith('/entry');          // 기록 입력 (/album/[id]/entry)

  if (hideNav) {
    return null;
  }

  return <BottomNav />;
}
