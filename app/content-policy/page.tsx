import { Metadata } from 'next';
import LegalLayout from '../_components/LegalLayout';

export const metadata: Metadata = {
  title: 'Content Policy — UrbanGist',
  description: 'UrbanGist Content Policy — rules for acceptable music uploads and community standards.',
};

export default function ContentPolicyPage() {
  return (
    <LegalLayout title="Content Policy" lastUpdated="January 2025">
      <p>
        UrbanGist is a curated music discovery platform. Every track goes through a human moderation review before appearing publicly on the platform. This Content Policy defines what is and is not acceptable. Violating this policy may result in content removal, account suspension, or permanent banning.
      </p>

      <h2>1. Copyright and Ownership</h2>
      <ul>
        <li>You <strong>must own the rights</strong> to every piece of music you upload — composition, master recording, and any samples or featured artists.</li>
        <li>Uploading someone else&apos;s music without their explicit written permission is strictly prohibited.</li>
        <li>Using uncleared samples from commercially released tracks is not permitted.</li>
        <li>Cover songs require a mechanical licence or must be original recordings where no distribution claim is expected.</li>
        <li>If we receive a valid copyright complaint, the relevant content will be removed immediately, and the uploader&apos;s account may be suspended.</li>
      </ul>

      <h2>2. The Approval Workflow</h2>
      <p>All submitted tracks follow a <strong>three-stage workflow</strong>:</p>
      <ol>
        <li><strong>Pending:</strong> Your track has been uploaded and is in our review queue. It is not publicly visible.</li>
        <li><strong>Live:</strong> Our moderation team has reviewed and approved your track. It is now publicly discoverable, indexed by search engines, and eligible for Boost promotions.</li>
        <li><strong>Rejected:</strong> Your submission did not meet our quality or policy standards. You will receive a reason. You are welcome to fix the issue and resubmit.</li>
      </ol>
      <p>Typical review time is within <strong>24 hours</strong> of submission. During high-volume periods, this may extend to 48 hours.</p>

      <h2>3. Prohibited Content</h2>
      <p>The following content will be immediately rejected and may result in account suspension:</p>
      <ul>
        <li><strong>Copyrighted content</strong> uploaded without permission (songs you did not create).</li>
        <li><strong>Hate speech or discrimination</strong> targeting any group based on race, ethnicity, gender, religion, or sexual orientation.</li>
        <li><strong>Explicit threats or incitement</strong> to violence against individuals or groups.</li>
        <li><strong>Child sexual abuse material (CSAM)</strong> — zero tolerance; immediately reported to authorities.</li>
        <li><strong>Non-consensual intimate content</strong> — including lyrics or cover art.</li>
        <li><strong>Defamatory content</strong> that makes false factual claims about identifiable real people.</li>
        <li><strong>Fraudulent content</strong> — tracks designed to mislead listeners about artist identity.</li>
        <li><strong>Excessively low-quality recordings</strong> that do not meet a minimum audio standard (e.g. phone mic demos).</li>
        <li><strong>Spam</strong> — multiple near-identical uploads, keyword-stuffed titles, or tracks clearly designed to game rankings.</li>
      </ul>

      <h2>4. Cover Art Standards</h2>
      <ul>
        <li>Cover art must be at least 800×800 pixels.</li>
        <li>No explicit sexual imagery or nudity.</li>
        <li>No graphic violence or gore.</li>
        <li>No impersonation of other artists&apos; established brand imagery.</li>
        <li>Ownership: you must have rights to use the image.</li>
      </ul>

      <h2>5. Audio Quality Standards</h2>
      <ul>
        <li>Minimum audio quality: 128kbps MP3 or equivalent. We strongly recommend 320kbps MP3 or WAV.</li>
        <li>No excessive distortion, clipping, or clearly unfinished demo-quality recordings.</li>
        <li>Audio must match the title and genre declared.</li>
      </ul>

      <h2>6. Our Right to Remove Content</h2>
      <p>
        UrbanGist reserves the right to remove any content at any time — including previously approved live tracks — if:
      </p>
      <ul>
        <li>A valid copyright complaint is received from a rights holder.</li>
        <li>The content is found to violate this Content Policy upon further review.</li>
        <li>The content causes harm to the platform or its community.</li>
        <li>Nigerian or international law requires its removal.</li>
      </ul>
      <p>
        Removed content will trigger a notification to the artist&apos;s registered email. Disputes can be raised at <a href="mailto:content@urbangist.com.ng">content@urbangist.com.ng</a>.
      </p>

      <h2>7. Reporting Violations</h2>
      <p>
        If you believe a track on UrbanGist infringes your copyright or violates this Content Policy, please contact us at <a href="mailto:content@urbangist.com.ng">content@urbangist.com.ng</a> with:
      </p>
      <ul>
        <li>The URL of the track in question.</li>
        <li>A description of the violation.</li>
        <li>Your contact information and, for copyright claims, proof of ownership.</li>
      </ul>
      <p>We aim to respond to all valid reports within 48 hours.</p>

      <h2>8. Repeat Offenders</h2>
      <p>
        Accounts that repeatedly violate this Content Policy will be permanently banned without appeal. We take the integrity of the UrbanGist community seriously and will not tolerate systematic abuse.
      </p>
    </LegalLayout>
  );
}
