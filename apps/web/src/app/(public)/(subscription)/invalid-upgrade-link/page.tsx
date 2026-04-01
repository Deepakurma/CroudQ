import Link from 'next/link';

export default function InvalidUpgradeLinkPage() {
  return (
    <main className="bg-background text-foreground flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10 sm:px-6">
      <section className="bg-card border-border w-full max-w-2xl rounded-[2rem] border px-6 py-10 text-center shadow-sm sm:px-10">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <span className="text-2xl font-black">!</span>
        </div>

        <p className="text-primary mb-3 text-xs font-black tracking-[0.18em] uppercase">
          Page Unavailable
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          This page is no longer available
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-sm leading-7 sm:text-base">
          Please go back to the app and open this page again from there.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition hover:opacity-95">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
