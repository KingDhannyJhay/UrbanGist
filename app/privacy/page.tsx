import { Metadata } from 'next';
import LegalLayout from '../_components/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — UrbanGist',
  description: 'UrbanGist Privacy Policy — how we collect, use and protect your personal data.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="January 2025">
      <p>
        UrbanGist (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the website urbangist.com.ng. This Privacy Policy explains how we collect, use, disclose and safeguard your information when you use our platform. Please read this carefully. By using UrbanGist, you consent to the practices described here.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>1.1 Information You Provide</h3>
      <ul>
        <li><strong>Account data:</strong> When you register, we collect your name, email address, and password.</li>
        <li><strong>Profile data:</strong> Artist name, bio, social media links, and profile photo (all optional).</li>
        <li><strong>Uploaded content:</strong> Audio files, cover artwork, track titles, genres, lyrics, and descriptions you upload.</li>
        <li><strong>Payment data:</strong> Payment is processed through Paystack. We do not store your card details on our servers. We retain a record of transactions (reference, amount, plan) for your account history.</li>
        <li><strong>Communications:</strong> Messages or feedback you send to us via email or contact forms.</li>
      </ul>

      <h3>1.2 Information Collected Automatically</h3>
      <ul>
        <li><strong>Usage data:</strong> Pages visited, tracks played, shares performed, likes given, and time spent on the platform.</li>
        <li><strong>Device data:</strong> IP address (hashed for privacy), browser type, operating system, and referring URL.</li>
        <li><strong>Analytics events:</strong> Play counts, completion rates, and traffic sources (WhatsApp, Instagram, TikTok, QR code, direct) for tracks you own.</li>
        <li><strong>Cookies:</strong> We use session cookies to keep you logged in. We do not use third-party advertising cookies.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account and profile.</li>
        <li>To display your tracks on the platform discovery feed.</li>
        <li>To provide you with analytics data about your uploaded tracks.</li>
        <li>To process Boost payments and activate your promotions.</li>
        <li>To send transactional emails (upload confirmations, approval notifications, payment receipts).</li>
        <li>To enforce our Terms of Service and Content Policy.</li>
        <li>To improve and optimise the platform based on usage patterns.</li>
        <li>To generate the sitemap and make your public track pages indexable by search engines.</li>
      </ul>

      <h2>3. Sharing Your Information</h2>
      <p>We do <strong>not</strong> sell your personal data. We share data only in these limited cases:</p>
      <ul>
        <li><strong>Supabase:</strong> Our database and storage infrastructure provider. Hosts user data and audio/image files on servers in accordance with their own privacy policy.</li>
        <li><strong>Paystack:</strong> Our payment processor. Handles all financial transactions. Governed by Paystack&apos;s Privacy Policy.</li>
        <li><strong>Vercel:</strong> Our hosting provider. Processes server-side requests and may log metadata.</li>
        <li><strong>Legal compliance:</strong> We may disclose data if required by Nigerian law or a valid court order.</li>
      </ul>

      <h2>4. Cookies and Tracking</h2>
      <p>
        UrbanGist uses essential cookies for authentication (keeping you logged in across sessions). We do not use advertising tracking pixels or share cookie data with marketing networks. You can clear cookies at any time in your browser settings — this will log you out of the platform.
      </p>

      <h2>5. Data Retention</h2>
      <ul>
        <li>Your account data and uploaded tracks are retained until you delete your account.</li>
        <li>Analytics event logs are retained for up to 24 months.</li>
        <li>Payment records are retained for 7 years for legal compliance.</li>
        <li>If you delete a track, associated audio and cover files are removed from our storage within 30 days.</li>
      </ul>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your account and associated data.</li>
        <li>Export your track upload history.</li>
        <li>Withdraw consent for marketing communications at any time.</li>
      </ul>
      <p>To exercise these rights, contact us at <a href="mailto:privacy@urbangist.com.ng">privacy@urbangist.com.ng</a>.</p>

      <h2>7. Children&rsquo;s Privacy</h2>
      <p>
        UrbanGist is not directed at children under the age of 13. We do not knowingly collect personal data from children. If we become aware of such collection, we will delete it immediately.
      </p>

      <h2>8. Security</h2>
      <p>
        We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords via Supabase Auth, and role-based access control. However, no internet transmission is 100% secure. Use a strong, unique password for your UrbanGist account.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last Updated&rdquo; date at the top of this page. Continued use of UrbanGist after changes constitutes acceptance of the updated policy.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about this Privacy Policy?<br />
        Email us at <a href="mailto:privacy@urbangist.com.ng">privacy@urbangist.com.ng</a><br />
        Or visit our <a href="/contact">Contact page</a>.
      </p>
    </LegalLayout>
  );
}
