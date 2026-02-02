import { LegalPageLayout } from './LegalPageLayout';

const tableOfContents = [
  { id: 'commitment', label: 'Our Security Commitment' },
  { id: 'encryption', label: 'Data Encryption' },
  { id: 'infrastructure', label: 'Infrastructure Security' },
  { id: 'access-controls', label: 'Access Controls' },
  { id: 'incident-response', label: 'Incident Response' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'responsible-disclosure', label: 'Responsible Disclosure' },
  { id: 'contact', label: 'Security Contact' },
];

export function SecurityPage() {
  return (
    <LegalPageLayout
      title="Security"
      description="Learn about Thittam1Hub's security practices, data protection measures, and how we keep your information safe. Trust and security are our top priorities."
      lastUpdated="2026-01-15"
      canonicalPath="/security"
      tableOfContents={tableOfContents}
    >
      <section id="commitment">
        <h2>Our Security Commitment</h2>
        <p>
          At Thittam1Hub, security is fundamental to everything we do. We understand that
          event organizers and participants trust us with sensitive information, and we
          take that responsibility seriously.
        </p>
        <p>Our security program is built on three core principles:</p>
        <ul>
          <li>
            <strong>Defense in Depth:</strong> Multiple layers of security controls to
            protect your data
          </li>
          <li>
            <strong>Least Privilege:</strong> Users and systems only have access to what
            they need
          </li>
          <li>
            <strong>Continuous Improvement:</strong> Regular security assessments and
            updates to address emerging threats
          </li>
        </ul>
      </section>

      <section id="encryption">
        <h2>Data Encryption</h2>

        <h3>Data in Transit</h3>
        <p>
          All data transmitted between your browser and our servers is encrypted using
          TLS 1.3, the latest and most secure version of the Transport Layer Security
          protocol. We enforce HTTPS on all connections.
        </p>

        <h3>Data at Rest</h3>
        <p>
          Your data is encrypted at rest using AES-256 encryption. This includes:
        </p>
        <ul>
          <li>Database records</li>
          <li>Uploaded files and documents</li>
          <li>Backups</li>
          <li>Logs containing sensitive information</li>
        </ul>

        <h3>Encryption Keys</h3>
        <p>
          Encryption keys are managed using industry-standard key management practices.
          Keys are rotated regularly and stored separately from the encrypted data.
        </p>
      </section>

      <section id="infrastructure">
        <h2>Infrastructure Security</h2>

        <h3>Cloud Infrastructure</h3>
        <p>
          Our infrastructure is hosted on enterprise-grade cloud platforms with robust
          security certifications. We leverage:
        </p>
        <ul>
          <li>Isolated virtual networks</li>
          <li>Web Application Firewalls (WAF)</li>
          <li>DDoS protection</li>
          <li>Automatic security patching</li>
        </ul>

        <h3>Network Security</h3>
        <p>
          Our network architecture includes multiple security zones with strict access
          controls between them. All network traffic is monitored for suspicious activity.
        </p>

        <h3>Physical Security</h3>
        <p>
          Our cloud providers maintain SOC 2 Type II certified data centers with:
        </p>
        <ul>
          <li>24/7 security personnel</li>
          <li>Biometric access controls</li>
          <li>Video surveillance</li>
          <li>Environmental controls</li>
        </ul>
      </section>

      <section id="access-controls">
        <h2>Access Controls</h2>

        <h3>Authentication</h3>
        <p>We support secure authentication methods including:</p>
        <ul>
          <li>Strong password requirements</li>
          <li>Multi-factor authentication (MFA)</li>
          <li>OAuth with trusted providers (Google, GitHub)</li>
          <li>Session management with automatic timeouts</li>
        </ul>

        <h3>Authorization</h3>
        <p>
          Our role-based access control (RBAC) system ensures users only have access to
          the resources they need. We implement:
        </p>
        <ul>
          <li>Row-Level Security (RLS) on all database tables</li>
          <li>Granular permission controls for organizations</li>
          <li>Audit logging for sensitive operations</li>
        </ul>

        <h3>Employee Access</h3>
        <p>
          Internal access to production systems is strictly controlled:
        </p>
        <ul>
          <li>Access requires business justification</li>
          <li>All access is logged and audited</li>
          <li>Regular access reviews</li>
          <li>Background checks for employees with data access</li>
        </ul>
      </section>

      <section id="incident-response">
        <h2>Incident Response</h2>
        <p>
          We maintain a comprehensive incident response plan to quickly identify, contain,
          and remediate security incidents.
        </p>

        <h3>Our Process</h3>
        <ol>
          <li>
            <strong>Detection:</strong> Continuous monitoring and alerting for security events
          </li>
          <li>
            <strong>Assessment:</strong> Rapid evaluation of incident scope and impact
          </li>
          <li>
            <strong>Containment:</strong> Immediate actions to limit damage
          </li>
          <li>
            <strong>Remediation:</strong> Addressing root causes and restoring services
          </li>
          <li>
            <strong>Communication:</strong> Timely notification to affected parties
          </li>
          <li>
            <strong>Review:</strong> Post-incident analysis to prevent recurrence
          </li>
        </ol>

        <h3>Breach Notification</h3>
        <p>
          In the event of a data breach that affects your personal information, we will:
        </p>
        <ul>
          <li>Notify affected users within 72 hours (as required by GDPR)</li>
          <li>Provide details about what information was affected</li>
          <li>Explain steps we're taking to address the incident</li>
          <li>Offer guidance on protective measures you can take</li>
        </ul>
      </section>

      <section id="compliance">
        <h2>Compliance</h2>
        <p>
          We maintain compliance with relevant security standards and regulations:
        </p>

        <h3>Standards and Certifications</h3>
        <ul>
          <li>SOC 2 Type II (in progress)</li>
          <li>ISO 27001 aligned practices</li>
          <li>OWASP Top 10 vulnerability prevention</li>
        </ul>

        <h3>Regulatory Compliance</h3>
        <ul>
          <li>
            <strong>GDPR:</strong> Data protection for EU residents
          </li>
          <li>
            <strong>CCPA:</strong> Privacy rights for California residents
          </li>
          <li>
            <strong>FERPA:</strong> Educational records privacy (for applicable use cases)
          </li>
        </ul>

        <h3>Regular Assessments</h3>
        <p>We conduct regular security assessments including:</p>
        <ul>
          <li>Quarterly vulnerability scans</li>
          <li>Annual penetration testing by third parties</li>
          <li>Continuous security monitoring</li>
          <li>Code security reviews</li>
        </ul>
      </section>

      <section id="responsible-disclosure">
        <h2>Responsible Disclosure</h2>
        <p>
          We believe in the power of the security community to help us protect our users.
          If you discover a security vulnerability, we encourage you to report it responsibly.
        </p>

        <h3>Reporting Guidelines</h3>
        <ul>
          <li>Email your findings to <a href="mailto:security@thittam1hub.com">security@thittam1hub.com</a></li>
          <li>Provide sufficient detail to reproduce the vulnerability</li>
          <li>Allow reasonable time for us to address the issue before disclosure</li>
          <li>Avoid accessing or modifying other users' data</li>
          <li>Do not perform attacks that could degrade service for others</li>
        </ul>

        <h3>What to Include</h3>
        <ul>
          <li>Description of the vulnerability</li>
          <li>Steps to reproduce</li>
          <li>Potential impact</li>
          <li>Suggested remediation (if any)</li>
        </ul>

        <h3>Our Commitment</h3>
        <p>We commit to:</p>
        <ul>
          <li>Acknowledge reports within 48 hours</li>
          <li>Keep you informed of our progress</li>
          <li>Not pursue legal action against good-faith researchers</li>
          <li>Credit researchers who help us improve (with permission)</li>
        </ul>
      </section>

      <section id="contact">
        <h2>Security Contact</h2>
        <p>
          For security-related inquiries or to report a vulnerability:
        </p>
        <ul>
          <li>
            <strong>Security Team:</strong>{' '}
            <a href="mailto:security@thittam1hub.com">security@thittam1hub.com</a>
          </li>
          <li>
            <strong>General Support:</strong>{' '}
            <a href="/help">Help Center</a>
          </li>
        </ul>
        <p>
          For urgent security matters, please include "URGENT" in your email subject line
          to ensure priority handling.
        </p>
      </section>
    </LegalPageLayout>
  );
}

export default SecurityPage;
