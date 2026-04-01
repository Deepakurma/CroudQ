'use client';

import { useEffect, useMemo, useState } from 'react';

import { CheckCircle2, Loader2 } from 'lucide-react';
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

  const handleUpgrade = async (planCode: string) => {
    setActivePlanCode(planCode);

    try {
      await loadRazorpayCheckout();

      const checkoutSession: CheckoutSession =
        await trpcClient.billing.createCheckoutSession.mutate({ planCode });

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
          toast.success('Subscription authenticated. Your access is updating now.');
          setActivePlanCode(null);
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
      const message = error instanceof Error ? error.message : 'Unable to start checkout';
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

          {overview?.currentSubscription ? (
            <>
              <h1 className="text-foreground text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                You are subscribed already.
              </h1>
              <p className="text-muted-foreground text-base leading-7 sm:text-lg">
                <span className="text-foreground font-semibold">{user.email}</span>. Your
                subscription is active! Head over to the app to start using it.{' '}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-foreground text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                Upgrade on web with Razorpay
              </h1>
              <p className="text-muted-foreground text-base leading-7 sm:text-lg">
                Signed in as <span className="text-foreground font-semibold">{user.email}</span>.
                Checkout stays on web, and your app will reflect Pro as soon as the subscription
                state syncs back.
              </p>
            </>
          )}
        </div>
      </div>

      {overview?.currentSubscription ? (
        <Card className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50/80">
          <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="size-4" />
              Current subscription
            </div>
            <p className="text-foreground text-lg font-bold">
              {currentPlanLabel ?? 'Subscription active'}
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
          const isCurrentPlan = overview.currentSubscription?.planCode === plan.code;
          const isBusy = activePlanCode === plan.code;

          return (
            <Card key={plan.code} className="border-border bg-card rounded-3xl border">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground text-base leading-7">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-end gap-2">
                  <span className="text-foreground text-4xl font-black">{plan.amountLabel}</span>
                  <span className="text-muted-foreground pb-1 text-sm font-semibold">
                    /{plan.period === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <ul className="text-muted-foreground space-y-2 text-sm leading-6">
                  <li>Priority creator insights</li>
                  <li>Advanced comment analysis</li>
                  <li>Secure Razorpay subscription checkout</li>
                </ul>

                <Button
                  className="w-full"
                  disabled={isBusy || isCurrentPlan}
                  onClick={() => void handleUpgrade(plan.code)}>
                  {isBusy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Opening checkout...
                    </>
                  ) : isCurrentPlan ? (
                    'Current plan'
                  ) : (
                    'Start Subscription'
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
