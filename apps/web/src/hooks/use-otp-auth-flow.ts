'use client';

import { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import { getPublicOtpErrorMessage, isOtpVerifyAttemptsExceededError } from '~/lib/otp-error';

import { trpcClient } from '~/utils/trpc';

import type { KeyboardEvent } from 'react';

type UseOtpAuthFlowOptions = {
  onVerifyOtp: (input: { phoneNumber: string; otp: string; reqId: string }) => Promise<void>;
  otpLength?: number;
  genericSendOtpError?: string;
  genericVerifyOtpError?: string;
  genericResendOtpError?: string;
};

const DEFAULT_OTP_LENGTH = 4;
const DEFAULT_SEND_OTP_ERROR = 'Unable to send OTP right now. Please try again.';
const DEFAULT_VERIFY_OTP_ERROR = 'Unable to verify OTP right now. Please try again.';
const DEFAULT_RESEND_OTP_ERROR = 'Unable to resend OTP right now. Please try again.';

export const useOtpAuthFlow = ({
  onVerifyOtp,
  otpLength = DEFAULT_OTP_LENGTH,
  genericSendOtpError = DEFAULT_SEND_OTP_ERROR,
  genericVerifyOtpError = DEFAULT_VERIFY_OTP_ERROR,
  genericResendOtpError = DEFAULT_RESEND_OTP_ERROR
}: UseOtpAuthFlowOptions) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState<string[]>(Array.from({ length: otpLength }, () => ''));
  const [reqId, setReqId] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [shouldUseFreshOtpSession, setShouldUseFreshOtpSession] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step !== 'otp') return;
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  const handlePhoneInputChange = (value: string) => {
    setPhoneNumber(value.replace(/\D/g, '').slice(0, 10));
  };

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
      setOtp(Array.from({ length: otpLength }, () => ''));
      setShouldUseFreshOtpSession(false);
    } catch (error) {
      toast.error(getPublicOtpErrorMessage(error, genericSendOtpError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== otpLength) {
      toast.error('Please enter complete OTP');
      return;
    }
    if (!reqId) {
      toast.error('OTP session expired. Please resend OTP.');
      return;
    }

    setIsLoading(true);
    try {
      await onVerifyOtp({ phoneNumber, otp: otpValue, reqId });
    } catch (error) {
      setShouldUseFreshOtpSession(isOtpVerifyAttemptsExceededError(error));
      toast.error(getPublicOtpErrorMessage(error, genericVerifyOtpError));
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
      setOtp(Array.from({ length: otpLength }, () => ''));
      setShouldUseFreshOtpSession(false);
      setTimer(30);
    } catch (error) {
      toast.error(getPublicOtpErrorMessage(error, genericResendOtpError));
    } finally {
      setIsResending(false);
    }
  };

  return {
    step,
    setStep,
    phoneNumber,
    handlePhoneInputChange,
    otp,
    timer,
    isLoading,
    isResending,
    inputRefs,
    handleSendOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleVerify,
    handleResend
  };
};
