'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, User, Plus } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '홈', Icon: Home },
    { href: '/explore', label: '탐색', Icon: Search },
    { href: '/profile', label: '프로필', Icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item, index) => {
        const isActive = pathname === item.href;
        const { Icon } = item;

        return (
          <div key={item.href} className="nav-item-wrapper">
            {index === 1 && <div className="fab-spacer" />}
            <Link
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" size={24} strokeWidth={2} />
              <span className="nav-label">{item.label}</span>
            </Link>
          </div>
        );
      })}

      {/* 중앙 FAB */}
      <Link href="/create" className="fab">
        <Plus className="fab-icon" size={32} strokeWidth={2.5} />
      </Link>
    </nav>
  );
}
