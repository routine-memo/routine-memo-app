'use client';

import { SessionProvider } from 'next-auth/react';
import { DarkModeProvider } from './DarkModeProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <DarkModeProvider>
        {children}
      </DarkModeProvider>
    </SessionProvider>
  );
}
