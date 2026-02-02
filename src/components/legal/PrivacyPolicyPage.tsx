import { LegalPageLayout } from './LegalPageLayout';

const tableOfContents = [
  { id: 'information-collect', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Information' },
  { id: 'data-sharing', label: 'Data Sharing and Disclosure' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'cookies', label: 'Cookies and Tracking' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Information' },
];

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="Learn how Thittam1Hub collects, uses, and protects your personal information. We are committed to transparency and your privacy rights."
      lastUpdated="2026-01-15"
      canonicalPath="/privacy"
      tableOfContents={tableOfContents}
    >
      <section id="information-collect">
        <h2>Information We Collect</h2>
        <p>
          We collect information you provide directly to us when you create an account,
          register for events, or communicate with us. This includes:
        </p>
        <ul>
          <li>
            <strong>Account Information:</strong> Name, email address, password, and profile details
          </li>
          <li>
            <strong>Event Data:</strong> Registration information, attendance records, and preferences
          </li>
          <li>
            <strong>Organization Data:</strong> Organization name, description, and team member information
          </li>
          <li>
            <strong>Usage Data:</strong> How you interact with our platform, features used, and preferences
          </li>
          <li>
            <strong>Device Information:</strong> Browser type, operating system, and device identifiers
          </li>
        </ul>
      </section>

      <section id="how-we-use">
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Process event registrations and manage attendance</li>
          <li>Send transactional emails and important notifications</li>
          <li>Generate certificates and verification documents</li>
          <li>Analyze usage patterns to enhance user experience</li>
          <li>Detect and prevent fraud or abuse</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section id="data-sharing">
        <h2>Data Sharing and Disclosure</h2>
        <p>
          We do not sell your personal information. We may share your data in the following circumstances:
        </p>
        <ul>
          <li>
            <strong>With Event Organizers:</strong> When you register for an event, organizers receive
            necessary registration details
          </li>
          <li>
            <strong>Service Providers:</strong> Third-party vendors who help us operate our platform
            (hosting, email, analytics)
          </li>
          <li>
            <strong>Legal Requirements:</strong> When required by law or to protect our rights
          </li>
          <li>
            <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales
          </li>
        </ul>
      </section>

      <section id="data-retention">
        <h2>Data Retention</h2>
        <p>
          We retain your personal information for as long as your account is active or as needed
          to provide services. Specific retention periods:
        </p>
        <ul>
          <li>Account data: Until account deletion plus 30 days</li>
          <li>Event records: 7 years for compliance purposes</li>
          <li>Certificates: Indefinitely for verification purposes</li>
          <li>Usage logs: 90 days</li>
        </ul>
        <p>
          You may request deletion of your data at any time, subject to legal retention requirements.
        </p>
      </section>

      <section id="your-rights">
        <h2>Your Rights</h2>
        <p>
          Depending on your location, you may have the following rights regarding your personal data:
        </p>

        <h3>GDPR Rights (EU/EEA Residents)</h3>
        <ul>
          <li>Right to access your personal data</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure ("right to be forgotten")</li>
          <li>Right to restrict processing</li>
          <li>Right to data portability</li>
          <li>Right to object to processing</li>
        </ul>

        <h3>CCPA Rights (California Residents)</h3>
        <ul>
          <li>Right to know what personal information is collected</li>
          <li>Right to delete personal information</li>
          <li>Right to opt-out of sale (we do not sell data)</li>
          <li>Right to non-discrimination</li>
        </ul>

        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:privacy@thittam1hub.com">privacy@thittam1hub.com</a>.
        </p>
      </section>

      <section id="cookies">
        <h2>Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to collect and track information
          about your activity on our platform. For detailed information about our cookie
          practices, please see our <a href="/cookies">Cookie Policy</a>.
        </p>
        <p>Types of cookies we use:</p>
        <ul>
          <li>
            <strong>Essential Cookies:</strong> Required for platform functionality
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Help us understand how users interact with our platform
          </li>
          <li>
            <strong>Preference Cookies:</strong> Remember your settings and preferences
          </li>
        </ul>
      </section>

      <section id="children">
        <h2>Children's Privacy</h2>
        <p>
          Our services are not directed to children under 13. We do not knowingly collect
          personal information from children under 13. If you believe we have collected
          information from a child under 13, please contact us immediately.
        </p>
        <p>
          For users between 13-18, parental consent may be required depending on local laws.
          Event organizers are responsible for ensuring appropriate consent for minor attendees.
        </p>
      </section>

      <section id="changes">
        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any
          material changes by:
        </p>
        <ul>
          <li>Posting the new policy on this page with an updated date</li>
          <li>Sending an email notification for significant changes</li>
          <li>Displaying a prominent notice on our platform</li>
        </ul>
        <p>
          We encourage you to review this policy periodically for any changes.
        </p>
      </section>

      <section id="contact">
        <h2>Contact Information</h2>
        <p>
          If you have questions about this Privacy Policy or our data practices, please contact us:
        </p>
        <ul>
          <li>
            <strong>Email:</strong>{' '}
            <a href="mailto:privacy@thittam1hub.com">privacy@thittam1hub.com</a>
          </li>
          <li>
            <strong>Support:</strong>{' '}
            <a href="/help">Help Center</a>
          </li>
        </ul>
        <p>
          For GDPR-related inquiries, our Data Protection Officer can be reached at{' '}
          <a href="mailto:dpo@thittam1hub.com">dpo@thittam1hub.com</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}

export default PrivacyPolicyPage;
