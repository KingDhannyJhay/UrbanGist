export default function AdminLoading() {
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-8 border-b border-[#2A2A2A] mb-6">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="space-y-2">
            <div className="h-5 w-28 skeleton rounded-lg" />
            <div className="h-3 w-40 skeleton rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-20 skeleton" />
          ))}
        </div>
        <div className="h-12 w-96 skeleton rounded-2xl mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 h-16 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 skeleton rounded-lg" />
                <div className="h-3 w-1/3 skeleton rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
