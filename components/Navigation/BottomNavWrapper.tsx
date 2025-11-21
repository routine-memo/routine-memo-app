'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function BottomNavWrapper() {
  const pathname = usePathname();

  // 템플릿 생성/편집 페이지에서는 하단 네비게이션 숨김
  const hideNav = pathname?.startsWith('/template/');

  if (hideNav) {
    return null;
  }

  return <BottomNav />;
}
