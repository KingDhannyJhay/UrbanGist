import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Instagram, Twitter, Youtube } from 'lucide-react';

const FOOTER_LINKS = {
  Platform: [
    { href: '/',          label: 'Discover Music' },
    { href: '/trending',  label: 'Trending Now' },
    { href: '/upload',    label: 'Upload Track' },
    { href: '/boost',     label: 'Boost Visibility' },
    { href: '/dashboard', label: 'Artist Dashboard' },
    { href: '/search',    label: 'Search' },
  ],
  Learn: [
    { href: '/learn',               label: 'All Guides' },
    { href: '/learn?cat=guide',     label: 'Artist Guides' },
    { href: '/learn?cat=industry',  label: 'Industry Insights' },
    { href: '/learn?cat=platform',  label: 'Platform Tutorials' },
  ],
  Company: [
    { href: '/about',   label: 'About UrbanGist' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/support', label: 'Support Us' },
  ],
  Legal: [
    { href: '/privacy',        label: 'Privacy Policy' },
    { href: '/terms',          label: 'Terms & Conditions' },
    { href: '/content-policy', label: 'Content Policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-bg-border bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Logo variant="full" size="md" href="/" className="mb-4" />
            <p className="text-sm text-text-muted leading-relaxed mb-5">
              Nigeria&apos;s music discovery platform for Afrobeats, Amapiano, Afrorap &amp; Gospel artists.
            </p>
            <div className="flex items-center gap-2.5">
              {[
                { href: 'https://instagram.com/urbangist', Icon: Instagram, label: 'Instagram' },
                { href: 'https://twitter.com/urbangist',   Icon: Twitter,   label: 'Twitter' },
                { href: 'https://youtube.com/@urbangist',  Icon: Youtube,   label: 'YouTube' },
              ].map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 rounded-lg bg-bg-elevated border border-bg-border flex items-center justify-center text-text-muted hover:text-green hover:border-green/50 transition-all duration-200">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-text-muted hover:text-green transition-colors duration-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Upload CTA */}
        <div className="rounded-2xl p-6 border border-green/10 bg-green-subtle/10 flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <p className="font-bold text-text-primary mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Ready to be discovered? 🎵
            </p>
            <p className="text-sm text-text-muted">
              Upload your music free. Get discovered by thousands of listeners across Nigeria.
            </p>
          </div>
          <Link href="/upload" className="btn-primary flex-shrink-0 shadow-green-glow">
            Upload Your Track →
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-bg-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} UrbanGist Media. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
            <Link href="/privacy"        className="hover:text-green transition-colors">Privacy</Link>
            <Link href="/terms"          className="hover:text-green transition-colors">Terms</Link>
            <Link href="/content-policy" className="hover:text-green transition-colors">Content Policy</Link>
            <Link href="/about"          className="hover:text-green transition-colors">About</Link>
            <Link href="/contact"        className="hover:text-green transition-colors">Contact</Link>
            <Link href="/support"        className="hover:text-green transition-colors text-green font-semibold">Support Us ♥</Link>
          </div>
          <p className="text-xs text-text-muted">
            Built with <span className="text-green">♥</span> for African music
          </p>
        </div>
      </div>
    </footer>
  );
}
