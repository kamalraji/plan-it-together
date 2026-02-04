import { LegalPageLayout } from './LegalPageLayout';

const tableOfContents = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'account', label: 'Account Registration' },
  { id: 'user-responsibilities', label: 'User Responsibilities' },
  { id: 'organizer-terms', label: 'Event Organizer Terms' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'limitation', label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'contact', label: 'Contact Information' },
];

export function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="Read the terms and conditions governing your use of Thittam1Hub's event management platform. By using our services, you agree to these terms."
      lastUpdated="2026-01-15"
      canonicalPath="/terms"
      tableOfContents={tableOfContents}
    >
      <section id="acceptance">
        <h2>Acceptance of Terms</h2>
        <p>
          By accessing or using Thittam1Hub ("the Platform"), you agree to be bound by these
          Terms of Service ("Terms"). If you do not agree to these Terms, you may not access
          or use the Platform.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you and Thittam1Hub.
          We may modify these Terms at any time, and such modifications will be effective
          upon posting. Your continued use of the Platform after any modifications indicates
          your acceptance of the modified Terms.
        </p>
      </section>

      <section id="account">
        <h2>Account Registration</h2>
        <p>To use certain features of the Platform, you must create an account. You agree to:</p>
        <ul>
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Maintain and promptly update your account information</li>
          <li>Maintain the security of your password and account</li>
          <li>Accept responsibility for all activities under your account</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms
          or for any other reason at our discretion.
        </p>
      </section>

      <section id="user-responsibilities">
        <h2>User Responsibilities</h2>
        <p>You agree not to use the Platform to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on intellectual property rights of others</li>
          <li>Upload malicious code or attempt to compromise platform security</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Impersonate any person or entity</li>
          <li>Collect user information without consent</li>
          <li>Interfere with the proper functioning of the Platform</li>
          <li>Use automated systems to access the Platform without permission</li>
        </ul>
        <p>
          Violation of these responsibilities may result in immediate account termination
          and potential legal action.
        </p>
      </section>

      <section id="organizer-terms">
        <h2>Event Organizer Terms</h2>
        <p>
          If you use the Platform as an event organizer, the following additional terms apply:
        </p>

        <h3>Event Creation and Management</h3>
        <ul>
          <li>You are solely responsible for the content and conduct of your events</li>
          <li>You must provide accurate event information to participants</li>
          <li>You must comply with all applicable laws regarding your events</li>
          <li>You are responsible for obtaining necessary permits and permissions</li>
        </ul>

        <h3>Participant Data</h3>
        <ul>
          <li>You must handle participant data in accordance with our Privacy Policy</li>
          <li>You may only use participant data for event-related purposes</li>
          <li>You must obtain appropriate consent for data collection and use</li>
        </ul>

        <h3>Certificates and Verification</h3>
        <ul>
          <li>Certificates issued through the Platform are your responsibility</li>
          <li>You must ensure certificate information is accurate</li>
          <li>Fraudulent certificate issuance may result in legal action</li>
        </ul>
      </section>

      <section id="intellectual-property">
        <h2>Intellectual Property</h2>
        <p>
          <strong>Platform Content:</strong> The Platform, including its design, features,
          and content created by Thittam1Hub, is protected by copyright, trademark, and
          other intellectual property laws. You may not copy, modify, or distribute our
          content without permission.
        </p>
        <p>
          <strong>User Content:</strong> You retain ownership of content you create on the
          Platform. By posting content, you grant us a non-exclusive, worldwide, royalty-free
          license to use, display, and distribute your content in connection with the Platform.
        </p>
        <p>
          <strong>Feedback:</strong> Any feedback, suggestions, or improvements you provide
          about the Platform may be used by us without compensation or attribution.
        </p>
      </section>

      <section id="limitation">
        <h2>Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, THITTAM1HUB SHALL NOT BE LIABLE FOR:
        </p>
        <ul>
          <li>Indirect, incidental, special, or consequential damages</li>
          <li>Loss of profits, data, or business opportunities</li>
          <li>Damages arising from third-party services or content</li>
          <li>Damages from events organized through the Platform</li>
        </ul>
        <p>
          Our total liability for any claims arising from use of the Platform shall not
          exceed the amount you paid us in the twelve (12) months preceding the claim.
        </p>
        <p>
          THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
        </p>
      </section>

      <section id="indemnification">
        <h2>Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless Thittam1Hub, its officers,
          directors, employees, and agents from any claims, damages, losses, or expenses
          (including legal fees) arising from:
        </p>
        <ul>
          <li>Your use of the Platform</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any third-party rights</li>
          <li>Events you organize or participate in through the Platform</li>
          <li>Content you create or upload</li>
        </ul>
      </section>

      <section id="termination">
        <h2>Termination</h2>
        <p>
          <strong>By You:</strong> You may terminate your account at any time by contacting
          us or using the account deletion feature in your settings.
        </p>
        <p>
          <strong>By Us:</strong> We may suspend or terminate your account at any time for:
        </p>
        <ul>
          <li>Violation of these Terms</li>
          <li>Fraudulent or illegal activity</li>
          <li>Extended periods of inactivity</li>
          <li>Any other reason at our discretion</li>
        </ul>
        <p>
          Upon termination, your right to use the Platform ceases immediately. Provisions
          that should survive termination (intellectual property, limitation of liability,
          indemnification) will remain in effect.
        </p>
      </section>

      <section id="governing-law">
        <h2>Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of
          the jurisdiction in which Thittam1Hub operates, without regard to conflict of
          law principles.
        </p>
        <p>
          Any disputes arising from these Terms or use of the Platform shall be resolved
          through binding arbitration, except where prohibited by law. You agree to waive
          any right to a jury trial or participation in a class action.
        </p>
      </section>

      <section id="contact">
        <h2>Contact Information</h2>
        <p>For questions about these Terms of Service, please contact us:</p>
        <ul>
          <li>
            <strong>Email:</strong>{' '}
            <a href="mailto:legal@thittam1hub.com">legal@thittam1hub.com</a>
          </li>
          <li>
            <strong>Support:</strong>{' '}
            <a href="/help">Help Center</a>
          </li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}

export default TermsOfServicePage;
