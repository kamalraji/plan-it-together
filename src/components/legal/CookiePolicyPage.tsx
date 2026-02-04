import { LegalPageLayout } from './LegalPageLayout';

const tableOfContents = [
  { id: 'what-are-cookies', label: 'What Are Cookies' },
  { id: 'types-we-use', label: 'Types of Cookies We Use' },
  { id: 'managing-cookies', label: 'Managing Cookie Preferences' },
  { id: 'third-party', label: 'Third-Party Cookies' },
  { id: 'updates', label: 'Updates to This Policy' },
];

export function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="Learn about how Thittam1Hub uses cookies and similar technologies to provide and improve our services. Manage your cookie preferences."
      lastUpdated="2026-01-15"
      canonicalPath="/cookies"
      tableOfContents={tableOfContents}
    >
      <section id="what-are-cookies">
        <h2>What Are Cookies</h2>
        <p>
          Cookies are small text files that are placed on your device when you visit a website.
          They are widely used to make websites work more efficiently, provide information to
          website owners, and improve the user experience.
        </p>
        <p>
          We use cookies and similar technologies (such as local storage and session storage)
          to operate and improve our Platform. This policy explains what these technologies
          are and how we use them.
        </p>

        <h3>How Cookies Work</h3>
        <p>
          When you visit our Platform, cookies are stored on your device. On subsequent visits,
          these cookies are sent back to our servers, allowing us to recognize you and remember
          your preferences.
        </p>
      </section>

      <section id="types-we-use">
        <h2>Types of Cookies We Use</h2>

        <h3>Essential Cookies (Always Active)</h3>
        <p>
          These cookies are necessary for the Platform to function properly. They enable core
          functionality such as:
        </p>
        <ul>
          <li>User authentication and session management</li>
          <li>Security features and fraud prevention</li>
          <li>Load balancing and server routing</li>
          <li>Cookie consent preferences</li>
        </ul>
        <p>
          <strong>You cannot opt out of essential cookies</strong> as they are required for
          the Platform to work.
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2">Cookie Name</th>
              <th className="text-left py-2">Purpose</th>
              <th className="text-left py-2">Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">supabase-auth-token</td>
              <td className="py-2">User authentication</td>
              <td className="py-2">Session</td>
            </tr>
            <tr>
              <td className="py-2">cookie-consent</td>
              <td className="py-2">Cookie preference storage</td>
              <td className="py-2">1 year</td>
            </tr>
          </tbody>
        </table>

        <h3>Analytics Cookies (Optional)</h3>
        <p>
          These cookies help us understand how visitors interact with our Platform by collecting
          and reporting information anonymously.
        </p>
        <ul>
          <li>Page views and navigation paths</li>
          <li>Time spent on pages</li>
          <li>Error messages encountered</li>
          <li>Device and browser information</li>
        </ul>
        <p>
          This data helps us improve the Platform and identify issues. Analytics cookies do
          not collect personally identifiable information.
        </p>

        <h3>Preference Cookies (Optional)</h3>
        <p>
          These cookies remember your settings and preferences to provide a more personalized
          experience:
        </p>
        <ul>
          <li>Theme preferences (light/dark mode)</li>
          <li>Language settings</li>
          <li>Dashboard layout preferences</li>
          <li>Recently viewed events</li>
        </ul>
      </section>

      <section id="managing-cookies">
        <h2>Managing Cookie Preferences</h2>
        <p>You have several options for managing cookies:</p>

        <h3>Cookie Consent Banner</h3>
        <p>
          When you first visit our Platform, you'll see a cookie consent banner that allows
          you to accept or customize which cookies we use (except essential cookies).
        </p>

        <h3>Browser Settings</h3>
        <p>
          Most web browsers allow you to control cookies through their settings. You can:
        </p>
        <ul>
          <li>Block all cookies</li>
          <li>Accept only first-party cookies</li>
          <li>Delete cookies when you close your browser</li>
          <li>Be notified before a cookie is stored</li>
        </ul>

        <p>Here are links to cookie management for major browsers:</p>
        <ul>
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
              Google Chrome
            </a>
          </li>
          <li>
            <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471" target="_blank" rel="noopener noreferrer">
              Safari
            </a>
          </li>
          <li>
            <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
              Microsoft Edge
            </a>
          </li>
        </ul>

        <p>
          <strong>Note:</strong> Blocking cookies may impact your experience and prevent some
          features from working properly.
        </p>
      </section>

      <section id="third-party">
        <h2>Third-Party Cookies</h2>
        <p>
          Some cookies on our Platform are set by third-party services we use. These include:
        </p>

        <h3>Authentication Providers</h3>
        <p>
          If you sign in using Google, GitHub, or other OAuth providers, those services may
          set their own cookies to facilitate authentication.
        </p>

        <h3>Embedded Content</h3>
        <p>
          Event pages may include embedded content (videos, maps, social media) from third
          parties. These services may set their own cookies. We do not control third-party
          cookies; please refer to their respective privacy policies.
        </p>

        <h3>Analytics Services</h3>
        <p>
          We may use analytics services that set cookies to track usage patterns. This data
          is aggregated and anonymized.
        </p>
      </section>

      <section id="updates">
        <h2>Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our
          practices or for other operational, legal, or regulatory reasons.
        </p>
        <p>
          When we make changes, we will update the "Last Updated" date at the top of this
          policy. For significant changes, we may provide additional notice through a banner
          or notification on the Platform.
        </p>
        <p>
          We encourage you to review this policy periodically to stay informed about how
          we use cookies.
        </p>

        <h3>Contact Us</h3>
        <p>
          If you have questions about our use of cookies, please contact us at{' '}
          <a href="mailto:privacy@thittam1hub.com">privacy@thittam1hub.com</a> or visit
          our <a href="/help">Help Center</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}

export default CookiePolicyPage;
