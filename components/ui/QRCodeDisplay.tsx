'use client';

import { useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { Download, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRCodeDisplayProps {
  value: string;
  trackTitle?: string;
  artistName?: string;
  size?: number;
  showDownload?: boolean;
  showLabel?: boolean;
  className?: string;
}

export default function QRCodeDisplay({
  value,
  trackTitle,
  artistName,
  size = 160,
  showDownload = true,
  showLabel = true,
  className,
}: QRCodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const downloadQR = useCallback(async () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;

    // Create canvas from SVG
    const canvas = document.createElement('canvas');
    const padding = 32;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + (trackTitle ? 60 : 0);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0B0B0B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White QR area
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(padding - 8, padding - 8, size + 16, size + 16, 12);
    ctx.fill();

    // Render SVG
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);

      // Track info
      if (trackTitle) {
        ctx.fillStyle = '#F8F8F8';
        ctx.font = `bold 14px "Syne", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(trackTitle.slice(0, 30), canvas.width / 2, size + padding * 2 + 10);

        if (artistName) {
          ctx.fillStyle = '#A3A3A3';
          ctx.font = '12px "DM Sans", sans-serif';
          ctx.fillText(artistName, canvas.width / 2, size + padding * 2 + 28);
        }

        // UrbanGist brand
        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 11px "Syne", sans-serif';
        ctx.fillText('urbangist.com.ng', canvas.width / 2, size + padding * 2 + 48);
      }

      URL.revokeObjectURL(url);

      // Download
      const link = document.createElement('a');
      link.download = `urbangist-qr-${(trackTitle || 'track').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    };
    img.src = url;
  }, [size, trackTitle, artistName]);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {showLabel && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <QrCode size={14} className="text-green" />
          <span>Scan to listen</span>
        </div>
      )}

      {/* QR Container */}
      <div
        ref={containerRef}
        className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)]"
      >
        <QRCode
          value={value}
          size={size}
          style={{ display: 'block' }}
          fgColor="#0B0B0B"
          bgColor="#FFFFFF"
          level="H"
        />
      </div>

      {/* URL label */}
      <p className="text-xs text-text-muted text-center break-all max-w-[200px] font-mono">
        {value.replace('https://', '')}
      </p>

      {/* Download button */}
      {showDownload && (
        <button
          onClick={downloadQR}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-bg-border bg-bg-elevated text-sm text-text-secondary hover:text-green hover:border-green transition-all duration-200"
        >
          <Download size={13} />
          Download QR
        </button>
      )}
    </div>
  );
}
