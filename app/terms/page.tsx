import { Metadata } from 'next';
import LegalLayout from '../_components/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms & Conditions — UrbanGist',
  description: 'UrbanGist Terms and Conditions — rules for uploading, sharing and using the platform.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" lastUpdated="January 2025">
      <p>
        These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of UrbanGist (urbangist.com.ng), operated by UrbanGist Media. By accessing or using UrbanGist, you agree to be bound by these Terms. If you do not agree, please do not use the platform.
      </p>

      <h2>1. Accounts and Registration</h2>
      <ul>
        <li>You must be at least 13 years old to create an account.</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You are responsible for all activity that occurs under your account.</li>
        <li>You must provide accurate information during registration.</li>
        <li>One person may not maintain more than one account for the purpose of circumventing platform rules.</li>
      </ul>

      <h2>2. Content Ownership</h2>
      <p>
        <strong>You retain full ownership of all music and content you upload to UrbanGist.</strong> By uploading content, you grant UrbanGist a non-exclusive, worldwide, royalty-free licence to host, display, stream, promote, and distribute your content on the platform and in connection with UrbanGist&apos;s services (e.g. social media posts, featured placements, QR code sharing).
      </p>
      <p>
        This licence ends when you delete your track or close your account, except where content has been cached, shared, or indexed externally.
      </p>

      <h2>3. Uploading Music — Your Responsibilities</h2>
      <ul>
        <li>You <strong>must own or have the rights</strong> to upload any music you submit. This includes clearances for any samples, features, or third-party elements.</li>
        <li>You represent and warrant that your content does not infringe any copyright, trademark, or other intellectual property rights.</li>
        <li>You are solely responsible for any copyright claims resulting from your uploads.</li>
        <li>You agree not to upload content recorded by or belonging to other artists without their explicit written permission.</li>
      </ul>

      <h2>4. Content Approval and Moderation</h2>
      <ul>
        <li>All uploaded tracks go through an admin review process before going live.</li>
        <li>UrbanGist reserves the right to approve, reject, or remove any content at any time, without prior notice, for any reason including (but not limited to) violation of these Terms or our Content Policy.</li>
        <li>Rejected tracks will be notified with a reason where possible. Artists may resubmit corrected tracks.</li>
        <li>UrbanGist is not obligated to explain every moderation decision.</li>
      </ul>

      <h2>5. Prohibited Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Upload content you do not own or have rights to.</li>
        <li>Use the platform to distribute malware, spam, or fraudulent content.</li>
        <li>Attempt to manipulate play counts, likes, or shares through artificial means.</li>
        <li>Impersonate another artist, person, or organisation.</li>
        <li>Scrape, crawl, or extract data from UrbanGist without permission.</li>
        <li>Attempt to access, modify, or disrupt the platform&apos;s infrastructure.</li>
        <li>Use UrbanGist for any illegal activity under Nigerian law.</li>
        <li>Harass, abuse, or threaten other users or the UrbanGist team.</li>
      </ul>

      <h2>6. Boost and Payment Services</h2>
      <ul>
        <li>Boost payments are processed through Paystack and are <strong>non-refundable</strong> once a boost has been activated.</li>
        <li>Boost duration begins at payment confirmation and runs for the specified number of hours/days.</li>
        <li>UrbanGist does not guarantee specific play counts or outcomes from a Boost purchase.</li>
        <li>If a boosted track is removed for policy violations, no refund will be issued.</li>
      </ul>

      <h2>7. Platform Availability</h2>
      <p>
        UrbanGist strives for high availability but does not guarantee uninterrupted access. We may perform maintenance, updates, or experience downtime. We are not liable for losses arising from platform unavailability.
      </p>

      <h2>8. Disclaimer of Warranties</h2>
      <p>
        UrbanGist is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not guarantee that the platform will meet your specific needs, that it will be error-free, or that any particular outcome will result from using the platform.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by Nigerian law, UrbanGist and its team shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including loss of revenue, loss of data, or reputational harm.
      </p>
      <p>
        UrbanGist is <strong>not liable for user-uploaded content</strong>. Artists bear full responsibility for the music and materials they upload.
      </p>

      <h2>10. Account Termination</h2>
      <p>
        We reserve the right to suspend or terminate any account that violates these Terms, engages in fraudulent behaviour, or harms the UrbanGist community — with or without prior notice.
      </p>
      <p>
        You may delete your account at any time by contacting us at <a href="mailto:support@urbangist.com.ng">support@urbangist.com.ng</a>.
      </p>

      <h2>11. Changes to Terms</h2>
      <p>
        We may update these Terms at any time. Continued use of the platform after changes are posted constitutes acceptance of the new Terms. We will notify registered users of significant changes by email.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of Nigerian courts.
      </p>

      <h2>13. Contact</h2>
      <p>
        For questions about these Terms:<br />
        Email: <a href="mailto:legal@urbangist.com.ng">legal@urbangist.com.ng</a><br />
        Website: <a href="/contact">urbangist.com.ng/contact</a>
      </p>
    </LegalLayout>
  );
}
