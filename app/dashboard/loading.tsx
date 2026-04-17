export default function DashboardLoading() {
  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header skeleton */}
        <div className="flex items-center gap-4 py-8 border-b border-[#2A2A2A] mb-6">
          <div className="w-14 h-14 rounded-2xl skeleton" />
          <div className="space-y-2">
            <div className="h-5 w-32 skeleton rounded-lg" />
            <div className="h-3 w-24 skeleton rounded-lg" />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-2">
              <div className="h-3 w-16 skeleton rounded-lg" />
              <div className="h-8 w-20 skeleton rounded-lg" />
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="h-12 w-80 skeleton rounded-2xl mb-8" />

        {/* Content rows */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 skeleton rounded-lg" />
                <div className="h-3 w-1/2 skeleton rounded-lg" />
              </div>
              <div className="h-6 w-16 skeleton rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
