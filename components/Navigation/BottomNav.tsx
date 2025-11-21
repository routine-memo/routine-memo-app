'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './BottomNav.css';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '홈', icon: '🏠' },
    { href: '/explore', label: '탐색', icon: '🔍' },
    { href: '/profile', label: '프로필', icon: '👤' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item, index) => {
        const isActive = pathname === item.href;

        return (
          <div key={item.href} className="nav-item-wrapper">
            {index === 1 && <div className="fab-spacer" />}
            <Link
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </div>
        );
      })}

      {/* 중앙 FAB */}
      <Link href="/create" className="fab">
        <span className="fab-icon">+</span>
      </Link>
    </nav>
  );
}
