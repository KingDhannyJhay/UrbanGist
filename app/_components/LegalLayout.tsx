import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#525252] hover:text-green-500 transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Home
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-10 pb-8 border-b border-[#2A2A2A]">
          <div className="w-12 h-12 rounded-2xl bg-[#052E16] border border-green-500/20 flex items-center justify-center text-green-500 flex-shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-black text-[#F8F8F8] mb-1"
              style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
            >
              {title}
            </h1>
            <p className="text-sm text-[#525252]">Last updated: {lastUpdated}</p>
          </div>
        </div>

        {/* Content — styled via .legal-content in globals.css */}
        <div className="legal-content">
          {children}
        </div>

        {/* Related links */}
        <div className="mt-12 pt-8 border-t border-[#2A2A2A]">
          <p className="text-sm text-[#525252] mb-4">Related legal documents:</p>
          <div className="flex flex-wrap gap-3">
            {[
              { href: '/privacy',        label: 'Privacy Policy' },
              { href: '/terms',          label: 'Terms & Conditions' },
              { href: '/content-policy', label: 'Content Policy' },
              { href: '/contact',        label: 'Contact Us' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] text-sm text-[#A3A3A3] hover:text-green-500 hover:border-green-500/30 transition-all"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
