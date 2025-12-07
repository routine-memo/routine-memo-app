'use client';

import { SessionProvider } from 'next-auth/react';
import { DarkModeProvider } from './DarkModeProvider';
import { PushProvider } from './PushProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <DarkModeProvider>
        <PushProvider>
          {children}
        </PushProvider>
      </DarkModeProvider>
    </SessionProvider>
  );
}
