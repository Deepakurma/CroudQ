'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Loader2 } from 'lucide-react';

import { OtpAuthCard } from '~/components/auth/otp-auth-card';
import { useOtpAuthFlow } from '~/hooks/use-otp-auth-flow';
import { trpcClient } from '~/utils/trpc';

const OTP_LENGTH = 4;
const DEFAULT_REDIRECT = '/resident/status';

const sanitizeRedirect = (raw: string | null): string => {
  if (!raw) return DEFAULT_REDIRECT;
  const value = raw.trim();

  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  if (value.startsWith('/resident')) {
    if (value.startsWith('/resident/auth')) {
      return DEFAULT_REDIRECT;
    }
    return value;
  }

  return DEFAULT_REDIRECT;
};

function ResidentAuthPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedRedirect = searchParams.get('redirect');
  const redirect = sanitizeRedirect(requestedRedirect);

  const [isSessionChecking, setIsSessionChecking] = useState(true);

  const hasCheckedSessionRef = useRef(false);
  const {
    step,
    setStep,
    phoneNumber,
    otp,
    timer,
    isLoading,
    isResending,
    inputRefs,
    handlePhoneInputChange,
    handleSendOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleVerify,
    handleResend
  } = useOtpAuthFlow({
    otpLength: OTP_LENGTH,
    onVerifyOtp: async ({ phoneNumber: verifyPhoneNumber, otp: verifyOtp, reqId }) => {
      const payload = await trpcClient.auth.verifyResidentWebOTP.mutate({
        phoneNumber: verifyPhoneNumber,
        otp: verifyOtp,
        reqId
      });

      router.replace(requestedRedirect ? redirect : (payload?.nextPath ?? DEFAULT_REDIRECT));
    }
  });

  useEffect(() => {
    if (hasCheckedSessionRef.current) return;
    hasCheckedSessionRef.current = true;

    const checkExistingSession = async () => {
      try {
        const payload = await trpcClient.auth.getResidentWebSession.query();
        const targetPath = requestedRedirect ? redirect : (payload?.nextPath ?? DEFAULT_REDIRECT);
        if (targetPath !== pathname) {
          router.replace(targetPath);
        } else {
          setIsSessionChecking(false);
        }
        return;
      } catch {
        // Ignore session check failures and continue auth flow.
      }

      setIsSessionChecking(false);
    };

    void checkExistingSession();
  }, [pathname, requestedRedirect, redirect, router]);

  if (isSessionChecking) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 items-center justify-center p-4 sm:p-8">
        <div className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
          <Loader2 className="size-4 animate-spin sm:size-5" /> Checking your session...
        </div>
      </main>
    );
  }

  return (
    <main className="m-auto w-full max-w-xl">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <h1 className="ml-2 text-xl font-medium">Login to check your status</h1>

        <OtpAuthCard
          step={step}
          phoneNumber={phoneNumber}
          otp={otp}
          otpLength={OTP_LENGTH}
          timer={timer}
          isLoading={isLoading}
          isResending={isResending}
          inputRefs={inputRefs}
          onPhoneInputChange={handlePhoneInputChange}
          onOtpChange={handleOtpChange}
          onOtpKeyDown={handleOtpKeyDown}
          onSendOtp={handleSendOtp}
          onVerify={handleVerify}
          onResend={handleResend}
          onChangeNumber={() => setStep('phone')}
        />
      </div>
    </main>
  );
}

export default function ResidentAuthPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <ResidentAuthPageContent />
    </Suspense>
  );
}
