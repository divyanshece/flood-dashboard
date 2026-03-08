'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InsightsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/explorer');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Redirecting to Explorer...</p>
      </div>
    </div>
  );
}
