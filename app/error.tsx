'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production you'd send to Sentry/Axiom etc.
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-bg-primary">
      <div className="text-5xl mb-6">⚠️</div>
      <h1 className="text-2xl font-black text-text-primary mb-3"
          style={{ fontFamily: "'Syne', sans-serif" }}>
        Something went wrong
      </h1>
      <p className="text-text-secondary max-w-md mx-auto mb-8">
        An unexpected error occurred. Our team has been notified. Please try again — if the problem persists, contact support.
      </p>
      {error.digest && (
        <p className="text-xs text-text-muted mb-6 font-mono bg-bg-elevated px-3 py-1.5 rounded-lg">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={reset} className="btn-primary">Try Again</button>
        <Link href="/"          className="btn-secondary">Go Home</Link>
        <Link href="/contact"   className="btn-secondary">Contact Support</Link>
      </div>
    </main>
  );
}
