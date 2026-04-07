import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CroudQ',
  description: 'How CroudQ collects, uses, and protects your data.'
};

const lastUpdated = 'April 1, 2026';

export default function PrivacyPolicyPage() {
  return (
    <section className="bg-custom-background text-foreground px-4 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl leading-tight font-black tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm">Last updated: {lastUpdated}</p>
          <p className="text-foreground/80 max-w-3xl text-base leading-relaxed font-medium">
            This policy explains what data CroudQ collects, how we use it, and the choices you have.
            CroudQ is built to help creators review content performance, audience response, and
            AI-assisted recommendations.
          </p>
        </div>

        <div className="border-border bg-card space-y-6 rounded-2xl border p-6 sm:p-8">
          <PolicySection
            title="1. Data We Collect"
            body={[
              'Account details such as your name, email, and authentication identifiers.',
              'Connected channel data you authorize us to access (including YouTube channel and content performance metrics).',
              'Audience feedback signals, such as comment text and engagement-related metadata, when available through connected platforms.',
              'Limited technical and service data needed to operate the product, such as browser type, request timestamps, and basic usage events.',
              'Support and communication data when you contact us.'
            ]}
          />

          <PolicySection
            title="2. How We Use Data"
            body={[
              'To provide and maintain CroudQ features.',
              'To generate analytics views and AI-assisted suggestions inside the app.',
              'To improve product reliability, quality, and safety.',
              'To detect abuse, prevent fraud, and enforce our terms.',
              'To communicate important service updates and support responses.'
            ]}
          />

          <PolicySection
            title="3. AI-Assisted Features"
            body={[
              'CroudQ uses your connected content and performance context to generate suggestions and summaries.',
              'AI outputs are assistive and should be reviewed by you before publishing or business decisions.',
              'We do not claim AI outputs are always complete, accurate, or suitable for every use case.'
            ]}
          />

          <PolicySection
            title="4. Sharing of Data"
            body={[
              'We do not sell your personal data.',
              'We may share data with service providers who help us operate hosting, analytics, customer support, or infrastructure under contractual safeguards.',
              'If you connect third-party platforms, data handling is also subject to those platform terms and policies.',
              'We may disclose information when required by law or to protect legal rights and user safety.'
            ]}
          />

          <PolicySection
            title="5. Data Retention"
            body={[
              'We retain data while your account is active and as needed to provide the service.',
              'We may keep limited records for security, legal, or compliance reasons.',
              'When deletion is requested, or when access to a connected platform is revoked, we delete or anonymize data unless retention is legally required.'
            ]}
          />

          <PolicySection
            title="6. Your Choices"
            body={[
              'You can disconnect linked channels from your account settings.',
              'If you connected YouTube, you can also revoke CroudQ access at any time from Google security settings: https://security.google.com/settings/security/permissions',
              'If YouTube or Google access is revoked, CroudQ will stop accessing that connected data and will remove stored YouTube-authorized data in line with our operational and legal obligations.',
              'You can request access, correction, or deletion of your data by contacting us.',
              'You can manage or stop using connected services at any time from the product flows available to you.'
            ]}
          />

          <PolicySection
            title="7. Security"
            body={[
              'We use reasonable technical and organizational safeguards to protect data.',
              'No system is perfectly secure, but we continuously improve controls to reduce risk.'
            ]}
          />

          <PolicySection
            title="8. Children’s Privacy"
            body={[
              'CroudQ is not intended for individuals under 16. If we learn that data from a person under 16 was collected, we will take steps to delete it.'
            ]}
          />

          <PolicySection
            title="9. Policy Updates"
            body={[
              'We may update this policy as our product or legal obligations change.',
              'If changes are material, we will update the date above and provide notice where appropriate.'
            ]}
          />

          <PolicySection
            title="10. Contact"
            body={['For privacy questions or requests, contact us at support@croudq.com.']}
          />
        </div>
      </div>
    </section>
  );
}

function PolicySection({ title, body }: { title: string; body: string[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <ul className="text-foreground/85 space-y-2 text-sm leading-relaxed font-medium sm:text-base">
        {body.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}
