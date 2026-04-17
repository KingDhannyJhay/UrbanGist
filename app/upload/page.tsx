'use client';

import { useState, useRef, useCallback, useTransition, useEffect } from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { saveTrackMetadataAction } from '@/app/actions/upload';
import { GENRES } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Upload, Music, ImageIcon, CheckCircle2,
  ArrowRight, ArrowLeft, Loader2, X, AlertCircle,
} from 'lucide-react';

type Step = 1 | 2 | 3;

interface PresignResponse {
  uploadId: string;
  cover: { signedUrl: string; path: string };
  audio: { signedUrl: string; path: string };
}

export default function UploadPage() {
  const [step,         setStep]         = useState<Step>(1);
  const [form,         setForm]         = useState({ title: '', genre: '', subgenre: '', description: '', lyrics: '' });
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [audioFile,    setAudioFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [clientError,  setClientError]  = useState('');
  const [uploadPhase,  setUploadPhase]  = useState('');
  const [progress,     setProgress]     = useState(0);
  const [isPending,    startTransition] = useTransition();
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useFormState(saveTrackMetadataAction, { status: 'idle' as const });

  // React to server action result
  useEffect(() => {
    if (state.status === 'success') {
      setProgress(100);
      setStep(3);
    } else if (state.status === 'error') {
      setProgress(0);
      setUploadPhase('');
      toast.error(state.message);
    }
  }, [state]);

  const update = (k: keyof typeof form, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleCover = (file: File) => {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      setClientError('Cover must be JPG, PNG, or WebP.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setClientError('Cover image must be under 5 MB.'); return;
    }
    setClientError('');
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAudio = (file: File) => {
    if (!/\.(mp3|wav|flac|aac|ogg)$/i.test(file.name)) {
      setClientError('Audio must be MP3, WAV, FLAC, or AAC.'); return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setClientError('Audio file must be under 50 MB.'); return;
    }
    setClientError('');
    setAudioFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent, type: 'cover' | 'audio') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) (type === 'cover' ? handleCover : handleAudio)(file);
  }, []);

  const handleSubmit = async () => {
    if (!coverFile || !audioFile) {
      setClientError('Please upload both cover art and audio file.'); return;
    }
    setClientError('');

    try {
      // ── Step 1: Get signed upload URLs from server ──────────────────────
      setUploadPhase('Preparing upload…');
      setProgress(5);

      const presignRes = await fetch('/api/upload/presign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          coverType: coverFile.type,
          audioType: audioFile.type,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json() as { error: string };
        throw new Error(err.error ?? 'Failed to prepare upload.');
      }

      const presign = await presignRes.json() as PresignResponse;
      setProgress(15);

      // ── Step 2: Upload cover DIRECTLY to Supabase Storage ───────────────
      setUploadPhase('Uploading cover art…');

      const coverUpload = await fetch(presign.cover.signedUrl, {
        method:  'PUT',
        headers: { 'Content-Type': coverFile.type },
        body:    coverFile,
      });

      if (!coverUpload.ok) throw new Error('Cover upload failed. Please try again.');
      setProgress(50);

      // ── Step 3: Upload audio DIRECTLY to Supabase Storage ───────────────
      setUploadPhase('Uploading audio…');

      const audioUpload = await fetch(presign.audio.signedUrl, {
        method:  'PUT',
        headers: { 'Content-Type': audioFile.type },
        body:    audioFile,
      });

      if (!audioUpload.ok) throw new Error('Audio upload failed. Please try again.');
      setProgress(80);

      // ── Step 4: Save metadata via Server Action (tiny text payload) ─────
      setUploadPhase('Saving track…');

      const fd = new FormData();
      fd.set('title',       form.title);
      fd.set('genre',       form.genre);
      fd.set('subgenre',    form.subgenre);
      fd.set('description', form.description);
      fd.set('lyrics',      form.lyrics);
      fd.set('coverPath',   presign.cover.path);
      fd.set('audioPath',   presign.audio.path);

      setProgress(90);
      startTransition(() => { formAction(fd); });

    } catch (err: unknown) {
      setProgress(0);
      setUploadPhase('');
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setClientError(message);
      toast.error(message);
    }
  };

  const isUploading = isPending || (progress > 0 && progress < 100 && state.status !== 'error');
  const canStep1    = form.title.trim().length > 0 && form.genre.length > 0;
  const canStep2    = !!coverFile && !!audioFile;

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-black text-[#F8F8F8] mb-3"
            style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
          >
            Upload Your Track
          </h1>
          <p className="text-[#A3A3A3]">
            Submit your music for review. Approved tracks go live within 24 hours.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {([1, 2, 3] as Step[]).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                step > s  ? 'bg-green-500 text-[#0B0B0B]'
                : step === s ? 'bg-green-500 text-[#0B0B0B] ring-4 ring-green-500/20'
                : 'bg-[#1C1C1C] border border-[#2A2A2A] text-[#525252]',
              )}>
                {step > s ? <CheckCircle2 size={14} /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  'w-12 h-px transition-colors',
                  step > s ? 'bg-green-500' : 'bg-[#2A2A2A]',
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[#525252] mb-8 px-6">
          <span className={cn(step === 1 && 'text-green-500 font-semibold')}>Track Info</span>
          <span className={cn(step === 2 && 'text-green-500 font-semibold')}>Upload Files</span>
          <span className={cn(step === 3 && 'text-green-500 font-semibold')}>Done!</span>
        </div>

        {/* ── STEP 1: Track info ─────────────────────────── */}
        {step === 1 && (
          <div className="card p-8 space-y-5">
            <div>
              <label className="label">Track Title *</label>
              <input
                className="input"
                placeholder="e.g. Lambo, Soro Soke, Japa…"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Genre *</label>
                <select className="input" value={form.genre} onChange={e => update('genre', e.target.value)}>
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sub-genre <span className="text-[#525252]">(optional)</span></label>
                <input
                  className="input"
                  placeholder="Afro-fusion, Street-pop…"
                  value={form.subgenre}
                  onChange={e => update('subgenre', e.target.value)}
                  maxLength={60}
                />
              </div>
            </div>
            <div>
              <label className="label">Description <span className="text-[#525252]">(optional)</span></label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Tell listeners about this track…"
                value={form.description}
                onChange={e => update('description', e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-[#525252] mt-1">{form.description.length}/500</p>
            </div>
            <div>
              <label className="label">Lyrics <span className="text-[#525252]">(optional)</span></label>
              <textarea
                className="input resize-none"
                rows={5}
                placeholder="Paste your lyrics…"
                value={form.lyrics}
                onChange={e => update('lyrics', e.target.value)}
              />
            </div>
            <button onClick={() => setStep(2)} disabled={!canStep1} className="btn-primary w-full">
              Next: Upload Files <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Files ─────────────────────────────── */}
        {step === 2 && (
          <div className="card p-8 space-y-6">

            {/* Cover drop zone */}
            <div>
              <label className="label">
                Cover Art *{' '}
                <span className="text-[#525252] text-[11px]">JPG/PNG/WebP · max 5 MB · min 800×800</span>
              </label>
              <div
                onClick={() => coverRef.current?.click()}
                onDrop={e => onDrop(e, 'cover')}
                onDragOver={e => e.preventDefault()}
                className={cn(
                  'relative border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                  'hover:border-green-500 hover:bg-green-500/5',
                  coverFile ? 'border-green-500/40' : 'border-[#2A2A2A]',
                )}
              >
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleCover(e.target.files[0]); }}
                />
                {coverPreview ? (
                  <div className="relative w-40 h-40 mx-auto m-4 rounded-xl overflow-hidden">
                    <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setCoverFile(null);
                        setCoverPreview('');
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#0B0B0B]/80 flex items-center justify-center"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-9">
                    <div className="w-12 h-12 rounded-2xl bg-[#1C1C1C] flex items-center justify-center text-green-500">
                      <ImageIcon size={22} />
                    </div>
                    <p className="text-sm text-[#A3A3A3]">Click or drag cover art here</p>
                    <p className="text-xs text-[#525252]">800×800 px recommended</p>
                  </div>
                )}
              </div>
            </div>

            {/* Audio drop zone */}
            <div>
              <label className="label">
                Audio File *{' '}
                <span className="text-[#525252] text-[11px]">MP3/WAV/FLAC/AAC · max 50 MB</span>
              </label>
              <div
                onClick={() => audioRef.current?.click()}
                onDrop={e => onDrop(e, 'audio')}
                onDragOver={e => e.preventDefault()}
                className={cn(
                  'border-2 border-dashed rounded-2xl cursor-pointer transition-all p-8',
                  'hover:border-green-500 hover:bg-green-500/5',
                  audioFile ? 'border-green-500/40 bg-green-500/5' : 'border-[#2A2A2A]',
                )}
              >
                <input
                  ref={audioRef}
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/flac,audio/aac,audio/ogg"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleAudio(e.target.files[0]); }}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center',
                    audioFile ? 'bg-green-500/10 text-green-500' : 'bg-[#1C1C1C] text-[#525252]',
                  )}>
                    <Music size={22} />
                  </div>
                  {audioFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-green-500">{audioFile.name}</p>
                      <p className="text-xs text-[#525252]">
                        {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-[#A3A3A3]">Click or drag audio file here</p>
                      <p className="text-xs text-[#525252]">320kbps MP3 or WAV recommended</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Errors */}
            {(clientError || state.status === 'error') && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/50 border border-red-500/20 text-sm text-red-400">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {clientError || (state.status === 'error' && state.message)}
              </div>
            )}

            {/* Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#A3A3A3]">
                  <span>{uploadPhase}</span>
                  <span className="font-mono text-green-500">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#2A2A2A] overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} disabled={isUploading} className="btn-secondary flex-1">
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canStep2 || isUploading}
                className="btn-primary flex-1"
              >
                {isUploading
                  ? <><Loader2 size={15} className="animate-spin" /> {uploadPhase || 'Uploading…'}</>
                  : <><Upload size={15} /> Submit Track</>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Success ────────────────────────────── */}
        {step === 3 && (
          <div className="card p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 mx-auto flex items-center justify-center text-green-500">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h2
                className="text-2xl font-black text-[#F8F8F8] mb-2"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
              >
                Track Submitted! 🎉
              </h2>
              <p className="text-[#A3A3A3] max-w-sm mx-auto">
                <strong className="text-[#F8F8F8]">{form.title}</strong> is now in review.
                You&apos;ll be notified when it goes live — usually within 24 hours.
              </p>
            </div>

            <div className="text-left p-5 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] space-y-2.5">
              <p className="text-xs text-[#525252] uppercase tracking-wider font-semibold mb-3">What happens next</p>
              {[
                { e: '🔍', t: 'Our team reviews your track for quality and compliance' },
                { e: '✅', t: 'Once approved, it appears in the discovery feed' },
                { e: '📊', t: 'Analytics show in your dashboard from the first play' },
                { e: '⚡', t: 'Optionally boost visibility from ₦1,000' },
              ].map(({ e, t }) => (
                <div key={t} className="flex items-start gap-3 text-sm text-[#A3A3A3]">
                  <span>{e}</span><span>{t}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setForm({ title: '', genre: '', subgenre: '', description: '', lyrics: '' });
                  setCoverFile(null);
                  setAudioFile(null);
                  setCoverPreview('');
                  setProgress(0);
                  setUploadPhase('');
                }}
                className="btn-secondary flex-1"
              >
                Upload Another
              </button>
              <Link href="/dashboard" className="btn-primary flex-1 justify-center">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Guidelines */}
        {step < 3 && (
          <div className="mt-6 p-4 rounded-xl border border-[#2A2A2A] bg-[#111111] text-xs text-[#525252] space-y-1.5">
            <p className="font-semibold text-[#A3A3A3] text-[11px] uppercase tracking-widest mb-2">
              Upload Guidelines
            </p>
            {[
              '✓ Only upload music you own or have full rights to distribute',
              '✓ No copyrighted samples without clearance from rights holders',
              '✓ Cover art must not contain explicit or offensive content',
              '✓ Use high-quality audio — 320kbps MP3 or WAV preferred',
              '✓ Spam uploads and duplicates will be rejected',
            ].map(t => <p key={t}>{t}</p>)}
          </div>
        )}
      </div>
    </main>
  );
}
