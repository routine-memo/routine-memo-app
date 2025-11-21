'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, User } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '홈', Icon: Home },
    { href: '/records', label: '기록', Icon: FileText },
    { href: '/profile', label: '프로필', Icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const { Icon } = item;

        return (
          <div key={item.href} className="nav-item-wrapper">
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
    </nav>
  );
}
