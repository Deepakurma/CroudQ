import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | CroudQ',
  description: 'Terms that govern use of CroudQ, including accounts and connected platforms.'
};

const lastUpdated = 'March 27, 2026';

export default function TermsOfServicePage() {
  return (
    <section className="bg-custom-background text-foreground px-4 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl leading-tight font-black tracking-tight sm:text-5xl">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-sm">Last updated: {lastUpdated}</p>
          <p className="text-foreground/80 max-w-3xl text-base leading-relaxed font-medium">
            These terms govern your use of CroudQ. By using the product, you agree to these terms.
            CroudQ is built to help creators review channel performance, audience response, and
            AI-assisted suggestions in one place.
          </p>
        </div>

        <div className="border-border bg-card space-y-6 rounded-2xl border p-6 sm:p-8">
          <PolicySection
            title="1. Use of the Service"
            body={[
              'You may use CroudQ only in compliance with applicable law and these terms.',
              'You are responsible for your account activity and for keeping your login credentials secure.',
              'You may not misuse the service, interfere with its operation, or attempt to access systems or data you are not authorized to access.'
            ]}
          />

          <PolicySection
            title="2. Accounts"
            body={[
              'You must provide accurate account information and keep it up to date.',
              'You are responsible for all activity that occurs through your account.',
              'We may suspend or terminate accounts that violate these terms, create risk for the service, or are used for abuse, fraud, or unauthorized access.'
            ]}
          />

          <PolicySection
            title="3. Connected Platforms"
            body={[
              'CroudQ may allow you to connect third-party platforms such as YouTube.',
              'You are responsible for ensuring you have the right to connect and use those accounts with CroudQ.',
              'Your use of connected platform data remains subject to the terms, policies, and technical limits of those third-party platforms.'
            ]}
          />

          <PolicySection
            title="4. AI-Assisted Features"
            body={[
              'CroudQ may generate summaries, suggestions, or other AI-assisted outputs based on your connected data.',
              'These outputs are provided as assistive tools only and should be reviewed by you before publication or business use.',
              'We do not guarantee that AI-assisted outputs will always be accurate, complete, or suitable for your specific goals.'
            ]}
          />

          <PolicySection
            title="5. Intellectual Property"
            body={[
              'CroudQ and its software, branding, interface, and service materials are owned by us or our licensors.',
              'You retain rights to the content and account data you provide or connect, subject to the permissions needed for us to operate the service.'
            ]}
          />

          <PolicySection
            title="6. Availability and Changes"
            body={[
              'We may update, improve, limit, or discontinue parts of the service at any time.',
              'We do not guarantee uninterrupted availability, and temporary downtime or feature changes may occur.'
            ]}
          />

          <PolicySection
            title="7. Disclaimers and Liability"
            body={[
              'The service is provided on an as-is and as-available basis to the extent permitted by law.',
              'To the extent permitted by law, we disclaim warranties not expressly stated in these terms.',
              'To the extent permitted by law, we are not liable for indirect, incidental, special, consequential, or lost-profit damages arising from your use of the service.'
            ]}
          />

          <PolicySection
            title="8. Termination"
            body={[
              'You may stop using CroudQ at any time.',
              'We may suspend or terminate access if necessary to protect the service, comply with law, or address violations of these terms.'
            ]}
          />

          <PolicySection
            title="9. Updates to These Terms"
            body={[
              'We may update these terms as the product or legal requirements change.',
              'If changes are material, we will update the date above and provide notice where appropriate.'
            ]}
          />

          <PolicySection
            title="10. Contact"
            body={['For terms questions, contact us at support@croudq.com.']}
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
