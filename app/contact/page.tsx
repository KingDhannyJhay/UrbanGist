'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { contactFormAction } from '@/app/actions/content';
import { Logo } from '@/components/ui/Logo';
import { Mail, MessageSquare, Clock, Send, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

const TOPICS = [
  'General enquiry', 'Upload issue', 'Boost / payment issue',
  'Copyright complaint', 'Account problem', 'Partnership / press',
  'Bug report', 'Other',
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={15} /> Send Message</>}
    </button>
  );
}

export default function ContactPage() {
  const [state, formAction] = useFormState(contactFormAction, { status: 'idle' as const });

  if (state.status === 'success') {
    return (
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center">
          <CheckCircle2 size={56} className="text-green mx-auto mb-4" />
          <h2 className="text-2xl font-black text-text-primary mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Message Sent!
          </h2>
          <p className="text-text-secondary mb-6">
            Thanks <strong className="text-text-primary">{state.name}</strong>. We&apos;ll get back to you within 24–48 hours.
          </p>
          <Link href="/" className="btn-primary w-full">Back to UrbanGist</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-14">
          <Logo variant="icon" size="md" href={null} className="mx-auto mb-5" />
          <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}>
            Get in Touch
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Have a question, issue, or idea? Our team usually responds within 24–48 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Info cards */}
          <div className="space-y-4">
            {[
              { icon: Mail, title: 'Email Us', lines: [
                { label: 'General',   value: 'hello@urbangist.com.ng',   href: 'mailto:hello@urbangist.com.ng' },
                { label: 'Support',   value: 'support@urbangist.com.ng', href: 'mailto:support@urbangist.com.ng' },
                { label: 'Copyright', value: 'content@urbangist.com.ng', href: 'mailto:content@urbangist.com.ng' },
              ]},
              { icon: Clock, title: 'Response Time', lines: [
                { label: 'General',   value: '24–48 hours' },
                { label: 'Urgent',    value: '12–24 hours' },
              ]},
            ].map(({ icon: Icon, title, lines }) => (
              <div key={title} className="card p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-subtle border border-green/20 flex items-center justify-center text-green">
                    <Icon size={14} />
                  </div>
                  <h3 className="font-bold text-text-primary text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h3>
                </div>
                <div className="space-y-1.5">
                  {lines.map(({ label, value, href }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">{label}</span>
                      {href
                        ? <a href={href} className="text-green hover:underline font-medium">{value}</a>
                        : <span className="text-text-secondary font-medium">{value}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="card p-5 border-green/10 bg-green-subtle/10">
              <p className="text-sm font-semibold text-text-primary mb-2">Need support?</p>
              <p className="text-xs text-text-muted mb-3">Browse our support centre for guides and FAQs.</p>
              <Link href="/support" className="flex items-center gap-1.5 text-sm text-green font-semibold hover:underline">
                Support Centre <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form action={formAction} className="card p-8 space-y-5">
              <h2 className="font-black text-text-primary text-xl mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                Send a Message
              </h2>

              {state.status === 'error' && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/20 text-sm text-red-400">
                  {state.message}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Your Name *</label>
                  <input name="name" className="input" placeholder="Artist name or full name" required />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input name="email" type="email" className="input" placeholder="your@email.com" required />
                </div>
              </div>
              <div>
                <label className="label">Topic</label>
                <select name="topic" className="input">
                  <option value="">Select a topic</option>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea name="message" className="input resize-none" rows={6}
                  placeholder="Describe your question or issue in detail…" required />
              </div>

              <SubmitButton />

              <p className="text-xs text-text-muted text-center">
                For urgent copyright concerns, email{' '}
                <a href="mailto:content@urbangist.com.ng" className="text-green">content@urbangist.com.ng</a> directly.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
