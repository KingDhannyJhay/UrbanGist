'use client';

import { useState } from 'react';
import type { LiveTrack } from '@/types';
import QRCodeDisplay from './QRCodeDisplay';
import { buildShareUrl, whatsappShareLink, twitterShareLink, trackUrl } from '@/lib/utils';
import { X, Copy, CheckCheck, MessageCircle, Twitter, Link } from 'lucide-react';

interface ShareModalProps {
  track: LiveTrack;
  onClose: () => void;
}

export default function ShareModal({ track, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const url    = trackUrl(track.slug);
  const title  = `🎵 Listen to "${track.title}" by ${track.artist_name} on UrbanGist`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLinks = [
    {
      label:   'WhatsApp',
      href:    whatsappShareLink(title, buildShareUrl(track.slug, 'whatsapp')),
      icon:    MessageCircle,
      color:   'bg-[#25D366] hover:bg-[#20b954]',
      textCol: 'text-white',
    },
    {
      label:   'Twitter / X',
      href:    twitterShareLink(title, buildShareUrl(track.slug, 'twitter')),
      icon:    Twitter,
      color:   'bg-[#1d9bf0] hover:bg-[#0c86d8]',
      textCol: 'text-white',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-sm p-6 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <X size={16} />
        </button>

        <h3 className="font-bold text-text-primary mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Share this track
        </h3>
        <p className="text-sm text-text-muted mb-6 truncate">
          {track.title} — {track.artist_name}
        </p>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <QRCodeDisplay
            value={buildShareUrl(track.slug, 'qr')}
            trackTitle={track.title}
            artistName={track.artist_name}
            size={140}
            showLabel={false}
          />
        </div>

        {/* Social share buttons */}
        <div className="space-y-2 mb-4">
          {shareLinks.map(({ label, href, icon: Icon, color, textCol }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl ${color} ${textCol} text-sm font-semibold transition-all`}
            >
              <Icon size={16} />
              Share on {label}
            </a>
          ))}
        </div>

        {/* Copy link */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 bg-bg-elevated border border-bg-border rounded-xl px-3 py-2.5 text-xs text-text-muted truncate font-mono">
            {url}
          </div>
          <button
            onClick={copyLink}
            className="px-3 py-2.5 rounded-xl bg-bg-elevated border border-bg-border text-xs text-text-secondary hover:border-green hover:text-green transition-all flex items-center gap-1.5"
          >
            {copied ? <CheckCheck size={13} className="text-green" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
