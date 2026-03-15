'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Loader2 } from 'lucide-react';

import { OtpAuthCard } from '~/components/auth/otp-auth-card';
import { useOtpAuthFlow } from '~/hooks/use-otp-auth-flow';
import { trpcClient } from '~/utils/trpc';

const OTP_LENGTH = 4;
const DEFAULT_REDIRECT = '/landlord/onboarding';

const sanitizeRedirect = (raw: string | null): string => {
  if (!raw) return DEFAULT_REDIRECT;
  const value = raw.trim();

  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  const allowedPrefixes = ['/landlord', '/admin'];
  if (allowedPrefixes.some((prefix) => value.startsWith(prefix))) {
    return value;
  }

  return DEFAULT_REDIRECT;
};

const isGenericRoleRootRedirect = (path: string) => path === '/landlord' || path === '/admin';

function UnifiedAuthPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedRedirect = searchParams.get('redirect');
  const redirect = sanitizeRedirect(requestedRedirect);
  const isOnboardingIntent = redirect.startsWith('/landlord/onboarding');

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
      const payload = await trpcClient.auth.verifyLandlordWebOTP.mutate({
        phoneNumber: verifyPhoneNumber,
        otp: verifyOtp,
        reqId
      });

      const isLandlord = Array.isArray(payload?.identity?.roles)
        ? payload.identity.roles.includes('LANDLORD')
        : false;
      const isSuperAdmin = Array.isArray(payload?.identity?.roles)
        ? payload.identity.roles.includes('SUPER_ADMIN')
        : false;
      let targetPath =
        requestedRedirect && !isGenericRoleRootRedirect(redirect)
          ? redirect
          : (payload?.nextPath ?? DEFAULT_REDIRECT);

      if (targetPath.startsWith('/landlord') && !isLandlord) {
        targetPath = payload?.nextPath ?? DEFAULT_REDIRECT;
      }

      if (targetPath.startsWith('/admin') && !isSuperAdmin) {
        targetPath = payload?.nextPath ?? DEFAULT_REDIRECT;
      }

      if (
        targetPath.startsWith('/landlord/onboarding') &&
        isLandlord &&
        payload?.nextPath === '/landlord/property'
      ) {
        targetPath = payload.nextPath;
      }

      router.replace(targetPath);
    }
  });

  useEffect(() => {
    if (hasCheckedSessionRef.current) return;
    hasCheckedSessionRef.current = true;

    const checkExistingSession = async () => {
      try {
        const payload = await trpcClient.auth.getLandlordWebSession.query();
        const isLandlord = Array.isArray(payload?.identity?.roles)
          ? payload.identity.roles.includes('LANDLORD')
          : false;
        const isSuperAdmin = Array.isArray(payload?.identity?.roles)
          ? payload.identity.roles.includes('SUPER_ADMIN')
          : false;
        let targetPath =
          requestedRedirect && !isGenericRoleRootRedirect(redirect)
            ? redirect
            : (payload?.nextPath ?? DEFAULT_REDIRECT);

        if (targetPath.startsWith('/landlord') && !isLandlord) {
          targetPath = payload?.nextPath ?? DEFAULT_REDIRECT;
        }

        if (targetPath.startsWith('/admin') && !isSuperAdmin) {
          targetPath = payload?.nextPath ?? DEFAULT_REDIRECT;
        }

        if (
          targetPath.startsWith('/landlord/onboarding') &&
          payload?.nextPath === '/landlord/property'
        ) {
          targetPath = payload.nextPath;
        }

        if (targetPath !== pathname) {
          router.replace(targetPath);
        } else {
          setIsSessionChecking(false);
        }
        return;
      } catch {
        // Fall through to regular auth flow when session check fails.
      }

      setIsSessionChecking(false);
    };

    void checkExistingSession();
  }, [pathname, requestedRedirect, redirect, router]);

  if (isSessionChecking) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center p-4 sm:p-5">
        <div className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
          <Loader2 className="size-4 animate-spin sm:size-5" /> Checking your session...
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-4 p-4 sm:p-5">
        {isOnboardingIntent ? (
          <h1 className="ml-2 text-2xl font-semibold">Let&apos;s get started!</h1>
        ) : null}

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
      </main>
    </>
  );
}

export default function UnifiedAuthPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <UnifiedAuthPageContent />
    </Suspense>
  );
}
