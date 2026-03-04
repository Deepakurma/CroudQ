import { FileText } from 'lucide-react';

export default function TermsAndConditionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 inline-flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14">
            <FileText className="text-primary h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Terms & Conditions</h1>
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
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By accessing, browsing, or utilizing the Bunkezy platform (website or mobile apps) to
              search for or book accommodations, you agree to comply with and be bound by these
              Terms and Conditions. If you do not agree with any part of these terms, please do not
              use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              2. Booking and Payments
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>All bookings are subject to availability and confirmation.</li>
              <li>
                A security deposit may be required during check-in, as specified by the respective
                property.
              </li>
              <li>
                Rent and other charges must be paid on or before the due date. Late payments may
                attract penalties.
              </li>
              <li>
                Payment processes are handled securely; however, Bunkezy is not liable for errors
                caused by third-party payment gateways.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              3. Resident Rules and Conduct
            </h2>
            <p className="leading-relaxed">
              Residents are expected to maintain decorum and respect the property and fellow
              residents. General rules include, but are not limited to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Strictly adhering to timings and visitor policies.</li>
              <li>Prohibition of illegal substances, smoking, or alcohol in unauthorized areas.</li>
              <li>Maintaining cleanliness in common areas and respecting quiet hours.</li>
            </ul>
            <p className="mt-2 text-sm font-medium">
              Violation of these rules may lead to immediate eviction without refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              4. Cancellation and Refunds
            </h2>
            <p className="leading-relaxed">
              Cancellation policies vary by property. Generally, security deposits are refundable
              subject to a notice period (usually 30 days) and clearance of pending dues or damages.
              Platform fees are non-refundable. Please refer to your specific booking agreement for
              detailed terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              5. Limitation of Liability
            </h2>
            <p className="leading-relaxed">
              Bunkezy acts as a facilitator for accommodations. We strive to ensure properties meet
              our standards, but we are not liable for direct, indirect, incidental, or
              consequential damages arising from the use of our platform or your stay at a property.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              6. Modifications to Terms
            </h2>
            <p className="leading-relaxed">
              We reserve the right to update these terms at any time. Continued use of the platform
              after modifications constitutes acceptance of the revised terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
