import { LoadingLogo } from '@/components/ui/Logo';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
      <LoadingLogo message="Loading…" />
    </div>
  );
}
