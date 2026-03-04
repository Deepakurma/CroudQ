import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 inline-flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14">
            <ShieldCheck className="text-primary h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Privacy Policy</h1>{' '}
            <p className="text-muted-foreground text-sm">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert text-muted-foreground max-w-none space-y-6">
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              1. Information We Collect
            </h2>
            <p className="leading-relaxed">
              When you use Bunkezy, we collect information that helps us provide and improve our
              services. This includes:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Contact information (name, email address, phone number)</li>
              <li>Identity verification documents (as required by local authorities)</li>
              <li>Payment and billing information</li>
              <li>Usage data and preferences when you interact with our platform</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              2. How We Use Your Information
            </h2>
            <p className="leading-relaxed">
              We primarily use your information to manage your accommodation bookings, process
              payments, and ensure a safe living environment. Specifically, we use it to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Communicate with you regarding bookings, updates, or support queries</li>
              <li>Verify your identity for security and compliance purposes</li>
              <li>Personalize your experience and improve our platform</li>
              <li>Send important notices regarding terms and policies</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              3. Data Sharing and Security
            </h2>
            <p className="leading-relaxed">
              We do not sell your personal data. We only share information with third parties when
              necessary to provide our services, such as payment processors or when required by law
              enforcement. We implement industry-standard security measures, including encryption
              and strict access controls, to protect your data from unauthorized access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              4. Your Rights
            </h2>
            <p className="leading-relaxed">
              You have the right to access, correct, or request deletion of your personal
              information. You can manage certain preferences through your account settings or by
              contacting our support team.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              5. Contact Us
            </h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or how we handle your data, please
              contact us at support@bunkezy.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
