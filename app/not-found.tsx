import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="relative">
        <Logo variant="icon" size="lg" href={null} glowing className="mx-auto mb-8" />
        <div className="text-8xl sm:text-9xl font-black text-bg-elevated mb-4 select-none"
             style={{ fontFamily: "'Syne', sans-serif" }}>
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}>
          Page Not Found
        </h1>
        <p className="text-text-secondary max-w-md mx-auto mb-8">
          The track or page you&apos;re looking for doesn&apos;t exist or may have been removed. Maybe it was taken down by our content team.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"         className="btn-primary">Go to Home</Link>
          <Link href="/trending" className="btn-secondary">Browse Trending</Link>
        </div>
      </div>
    </main>
  );
}
