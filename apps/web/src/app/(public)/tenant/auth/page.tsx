'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getPublicOtpErrorMessage, isOtpVerifyAttemptsExceededError } from '~/lib/otp-error';
import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/shared/shadcn/card';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';

import { trpcClient } from '~/utils/trpc';

import type { KeyboardEvent } from 'react';

const OTP_LENGTH = 4;
const DEFAULT_REDIRECT = '/tenant/status';
const GENERIC_SEND_OTP_ERROR = 'Unable to send OTP right now. Please try again.';
const GENERIC_VERIFY_OTP_ERROR = 'Unable to verify OTP right now. Please try again.';
const GENERIC_RESEND_OTP_ERROR = 'Unable to resend OTP right now. Please try again.';

const sanitizeRedirect = (raw: string | null): string => {
  if (!raw) return DEFAULT_REDIRECT;
  const value = raw.trim();

  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  if (value.startsWith('/tenant')) {
    if (value.startsWith('/tenant/auth')) {
      return DEFAULT_REDIRECT;
    }
    return value;
  }

  return DEFAULT_REDIRECT;
};

function TenantAuthPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedRedirect = searchParams.get('redirect');
  const redirect = sanitizeRedirect(requestedRedirect);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ''));
  const [reqId, setReqId] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [shouldUseFreshOtpSession, setShouldUseFreshOtpSession] = useState(false);
  const [isSessionChecking, setIsSessionChecking] = useState(true);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const hasCheckedSessionRef = useRef(false);

  useEffect(() => {
    if (hasCheckedSessionRef.current) return;
    hasCheckedSessionRef.current = true;

    const checkExistingSession = async () => {
      try {
        const payload = await trpcClient.auth.getTenantWebSession.query();
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

  useEffect(() => {
    if (step !== 'otp') return;
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  const otpValue = otp.join('');

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phoneNumber)) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = await trpcClient.auth.sendOTP.mutate({ phoneNumber });
      setReqId(typeof payload?.reqId === 'string' ? payload.reqId : null);
      setStep('otp');
      setTimer(30);
      setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
      setShouldUseFreshOtpSession(false);
    } catch (error) {
      toast.error(getPublicOtpErrorMessage(error, GENERIC_SEND_OTP_ERROR));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otpValue.length !== OTP_LENGTH) {
      toast.error('Please enter complete OTP');
      return;
    }
    if (!reqId) {
      toast.error('OTP session expired. Please resend OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = await trpcClient.auth.verifyTenantWebOTP.mutate({
        phoneNumber,
        otp: otpValue,
        reqId
      });

      router.replace(requestedRedirect ? redirect : (payload?.nextPath ?? DEFAULT_REDIRECT));
    } catch (error) {
      setShouldUseFreshOtpSession(isOtpVerifyAttemptsExceededError(error));
      toast.error(getPublicOtpErrorMessage(error, GENERIC_VERIFY_OTP_ERROR));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    const shouldStartFreshSession = shouldUseFreshOtpSession;

    if (!shouldStartFreshSession && !reqId) {
      toast.error('OTP session expired. Please request OTP again.');
      return;
    }

    setIsResending(true);
    try {
      if (shouldStartFreshSession) {
        const payload = await trpcClient.auth.sendOTP.mutate({ phoneNumber });
        if (typeof payload?.reqId === 'string') {
          setReqId(payload.reqId);
        }
      } else {
        const payload = await trpcClient.auth.retryOTP.mutate({
          phoneNumber,
          reqId: reqId as string,
          retryChannel: 11
        });
        if (typeof payload?.reqId === 'string') {
          setReqId(payload.reqId);
        }
      }
      setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
      setShouldUseFreshOtpSession(false);
      setTimer(30);
    } catch (error) {
      toast.error(getPublicOtpErrorMessage(error, GENERIC_RESEND_OTP_ERROR));
    } finally {
      setIsResending(false);
    }
  };

  if (isSessionChecking) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 items-center justify-center p-4 sm:p-8">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" /> Checking your session...
        </div>
      </main>
    );
  }

  return (
    <main className="m-auto w-full max-w-xl">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <h1 className="ml-2 text-xl font-medium">Login to check your status</h1>

        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Login / Sign Up</CardTitle>
            <CardDescription>
              {step === 'phone'
                ? "Enter your phone number. We'll send an OTP for secure access."
                : `Enter the 4-digit OTP sent to +91 ${phoneNumber}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted text-muted-foreground flex h-11 items-center rounded-xl px-3 text-sm font-medium">
                      +91
                    </div>
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(event) =>
                        setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="Enter 10-digit number"
                      inputMode="numeric"
                      maxLength={10}
                      className="h-11"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={isLoading || phoneNumber.length !== 10}
                  className="h-11 w-full">
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Continue'}
                </Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChange={(event) => handleOtpChange(event.target.value, index)}
                      onKeyDown={(event) => handleKeyDown(event, index)}
                      inputMode="numeric"
                      maxLength={1}
                      className="h-12 text-center text-lg font-semibold"
                    />
                  ))}
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={isLoading || otpValue.length !== OTP_LENGTH}
                  className="h-11 w-full">
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Verify'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={timer > 0 || isResending}
                  className="w-full">
                  {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive code? Resend"}
                </Button>

                <Button variant="outline" onClick={() => setStep('phone')} className="w-full">
                  Change Number
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function TenantAuthPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <TenantAuthPageContent />
    </Suspense>
  );
}
