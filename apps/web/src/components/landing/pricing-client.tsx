'use client';

import { useEffect, useMemo, useState } from 'react';

import { Check, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/shared/shadcn/card';

import { trpcClient } from '~/utils/trpc';

type AuthUser = Awaited<ReturnType<typeof trpcClient.auth.me.query>>;
type BillingOverview = Awaited<ReturnType<typeof trpcClient.billing.overview.query>>;
type CheckoutSession = Awaited<ReturnType<typeof trpcClient.billing.createCheckoutSession.mutate>>;

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id: string;
};

type RazorpayInstance = {
  on: (event: string, callback: (response: unknown) => void) => void;
  open: () => void;
};

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const MOBILE_SUBSCRIPTION_SUCCESS_URL = 'croudq://?subscription=success';
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'authenticated']);
const RECOVERY_SUBSCRIPTION_STATUSES = new Set(['pending']);

const loadRazorpayCheckout = async () => {
  if (window.Razorpay) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-razorpay-checkout="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Razorpay checkout')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
};

const formatDateTime = (value: string | null) => {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

export default function PricingClient({ user }: { user: AuthUser }) {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlanCode, setActivePlanCode] = useState<string | null>(null);

  const refreshOverview = async () => {
    const nextOverview = await trpcClient.billing.overview.query();
    setOverview(nextOverview);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const nextOverview = await trpcClient.billing.overview.query();
        if (mounted) {
          setOverview(nextOverview);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load billing plans';
        toast.error(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const currentPlanLabel = useMemo(() => {
    if (!overview?.currentSubscription?.planName) return null;

    const endsAt = formatDateTime(overview.currentSubscription.currentPeriodEndsAt);
    return endsAt
      ? `${overview.currentSubscription.planName} · renews until ${endsAt}`
      : overview.currentSubscription.planName;
  }, [overview]);

  const hasActiveSubscription = Boolean(
    overview?.currentSubscription?.status &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(overview.currentSubscription.status)
  );
  const currentSubscriptionStatus = overview?.currentSubscription?.status ?? null;

  const handleUpgrade = async (planCode: string) => {
    setActivePlanCode(planCode);

    try {
      const checkoutSession: CheckoutSession =
        await trpcClient.billing.createCheckoutSession.mutate({ planCode });

      if (checkoutSession.recoveryUrl) {
        setActivePlanCode(null);
        window.location.assign(checkoutSession.recoveryUrl);
        return;
      }

      await loadRazorpayCheckout();

      const razorpay = new window.Razorpay!({
        key: checkoutSession.keyId,
        subscription_id: checkoutSession.subscriptionId,
        name: 'CroudQ',
        description: checkoutSession.plan.name,
        prefill: checkoutSession.prefill,
        theme: {
          color: '#ef4444'
        },
        modal: {
          ondismiss: () => {
            setActivePlanCode(null);
          }
        },
        handler: async (response) => {
          await trpcClient.billing.verifyCheckout.mutate({
            planCode,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            razorpaySubscriptionId: response.razorpay_subscription_id
          });

          await refreshOverview();
          setActivePlanCode(null);
          window.location.assign(MOBILE_SUBSCRIPTION_SUCCESS_URL);
        }
      });

      razorpay.on('payment.failed', (response) => {
        const errorMessage =
          typeof response === 'object' &&
          response !== null &&
          'error' in response &&
          typeof (response as { error?: { description?: string } }).error?.description === 'string'
            ? (response as { error: { description: string } }).error.description
            : 'Payment failed. Try again.';

        toast.error(errorMessage);
        setActivePlanCode(null);
      });

      razorpay.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open checkout';
      toast.error(message);
      setActivePlanCode(null);
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-dvh w-full items-center justify-center gap-2 px-4 text-center text-sm font-medium">
        <Loader2 className="size-4 animate-spin" /> Loading pricing...
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col px-4 py-10 lg:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
            Croud<span className="text-primary">Q</span>
          </p>

          {hasActiveSubscription ? (
            <>
              <h1 className="text-foreground text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                You are subscribed.
              </h1>
              <p className="text-muted-foreground text-base leading-7 sm:text-lg">
                <span className="text-foreground font-semibold">{user.email}</span>. Your
                subscription is active! Head over to the app to start using it.{' '}
              </p>
            </>
          ) : overview?.currentSubscription ? (
            <>
              <h1 className="text-foreground text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                {overview.currentSubscription.status === 'created'
                  ? 'Complete your subscription.'
                  : 'Your subscription is not active.'}
              </h1>
              <p className="text-muted-foreground text-base leading-7 sm:text-lg">
                <span className="text-foreground font-semibold">{user.email}</span>.{' '}
                {overview.currentSubscription.status === 'created'
                  ? 'Finish your subscription and start using it.'
                  : `Your plan is currently ${overview.currentSubscription.status}. Complete payment or restart your subscription to continue using.`}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-foreground text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                Let’s get you started.
              </h1>
              <p className="text-muted-foreground text-base leading-7 sm:text-lg">
                Signed in as <span className="text-foreground font-semibold">{user.email}</span>.
                Unlock the creator workspace inside CroudQ that helps you spot what is working,
                understand audience response, and make sharper content decisions faster.
              </p>
            </>
          )}
        </div>
      </div>

      {overview?.currentSubscription ? (
        <Card
          className={`mb-8 rounded-3xl ${
            hasActiveSubscription
              ? 'border border-emerald-200 bg-emerald-50/80'
              : 'border border-amber-200 bg-amber-50/80'
          }`}>
          <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={`flex items-center gap-2 text-sm font-semibold ${
                hasActiveSubscription ? 'text-emerald-700' : 'text-amber-700'
              }`}>
              <CheckCircle2 className="size-4" />
              {hasActiveSubscription ? 'Current subscription' : 'Subscription needs attention'}
            </div>
            <p className="text-foreground text-lg font-bold">
              {hasActiveSubscription
                ? (currentPlanLabel ?? 'Subscription active')
                : (overview.currentSubscription.planName ?? 'Subscription inactive')}
            </p>
            <p className="text-muted-foreground text-sm">
              Status: {overview.currentSubscription.status}
            </p>
            <p className="text-sm text-[#49A8FF]">
              Tier: {overview.currentSubscription.tier ?? 'CroudQ Free'}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {overview?.plans.map((plan) => {
          const isCurrentPlan =
            hasActiveSubscription && overview.currentSubscription?.planCode === plan.code;
          const isBusy = activePlanCode === plan.code;
          const isRecoverableCurrentPlan =
            !hasActiveSubscription &&
            overview.currentSubscription?.planCode === plan.code &&
            currentSubscriptionStatus !== null &&
            RECOVERY_SUBSCRIPTION_STATUSES.has(currentSubscriptionStatus);
          const buttonLabel = isCurrentPlan
            ? 'Current plan'
            : isRecoverableCurrentPlan
              ? 'Resume Subscription'
              : 'Start Subscription';

          return (
            <Card
              key={plan.code}
              className="border-border/70 bg-card/95 relative overflow-hidden rounded-[2rem] border shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
              <div className="from-primary/14 via-primary/7 pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_36%)]" />
              <CardHeader className="relative space-y-4">
                <div className="border-border/60 bg-background/80 inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#49A8FF] uppercase backdrop-blur-sm">
                  CroudQ Pro
                </div>
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground max-w-sm text-base leading-7">
                    {plan.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="flex items-end gap-2">
                  <span className="text-foreground text-4xl font-black">{plan.amountLabel}</span>
                  <span className="text-muted-foreground pb-1 text-sm font-semibold">
                    /{plan.period === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <ul className="space-y-3 text-sm leading-6">
                  <li className="flex items-start gap-3">
                    <span className="bg-foreground/5 text-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="text-primary size-3.5" />
                    </span>
                    <span className="text-muted-foreground">
                      See what is working in your content at a glance.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-foreground/5 text-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="text-primary size-3.5" />
                    </span>
                    <span className="text-muted-foreground">
                      Understand how viewers feel through comment insights.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-foreground/5 text-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="text-primary size-3.5" />
                    </span>
                    <span className="text-muted-foreground">
                      Find patterns in your videos without manual digging.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-foreground/5 text-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="text-primary size-3.5" />
                    </span>
                    <span className="text-muted-foreground">
                      Know what to repeat and what to improve next.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-foreground/5 text-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="text-primary size-3.5" />
                    </span>
                    <span className="text-muted-foreground">
                      Make content decisions with more clarity and confidence.
                    </span>
                  </li>
                </ul>

                <Button
                  className="h-12 w-full rounded-3xl text-sm font-semibold shadow-[0_10px_30px_hsl(var(--primary)/0.24)]"
                  disabled={isBusy || isCurrentPlan}
                  onClick={() => void handleUpgrade(plan.code)}>
                  {isBusy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Opening checkout...
                    </>
                  ) : (
                    buttonLabel
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
