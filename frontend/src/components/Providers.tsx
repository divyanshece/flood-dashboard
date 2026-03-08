'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}
