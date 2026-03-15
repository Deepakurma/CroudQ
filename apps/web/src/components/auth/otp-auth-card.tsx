'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/shared/shadcn/card';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';

import type { KeyboardEvent, MutableRefObject } from 'react';

type OtpAuthCardProps = {
  step: 'phone' | 'otp';
  phoneNumber: string;
  otp: string[];
  otpLength: number;
  timer: number;
  isLoading: boolean;
  isResending: boolean;
  inputRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  onPhoneInputChange: (value: string) => void;
  onOtpChange: (value: string, index: number) => void;
  onOtpKeyDown: (event: KeyboardEvent<HTMLInputElement>, index: number) => void;
  onSendOtp: () => void;
  onVerify: () => void;
  onResend: () => void;
  onChangeNumber: () => void;
};

export const OtpAuthCard = ({
  step,
  phoneNumber,
  otp,
  otpLength,
  timer,
  isLoading,
  isResending,
  inputRefs,
  onPhoneInputChange,
  onOtpChange,
  onOtpKeyDown,
  onSendOtp,
  onVerify,
  onResend,
  onChangeNumber
}: OtpAuthCardProps) => {
  const otpValue = otp.join('');

  return (
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
                  onChange={(event) => onPhoneInputChange(event.target.value)}
                  placeholder="Enter 10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  className="h-11"
                />
              </div>
            </div>
            <Button
              onClick={onSendOtp}
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
                  onChange={(event) => onOtpChange(event.target.value, index)}
                  onKeyDown={(event) => onOtpKeyDown(event, index)}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-12 text-center text-lg font-semibold"
                />
              ))}
            </div>

            <Button
              onClick={onVerify}
              disabled={isLoading || otpValue.length !== otpLength}
              className="h-11 w-full">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify'
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onResend}
              disabled={timer > 0 || isResending}
              className="w-full">
              {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive code? Resend"}
            </Button>

            <Button variant="outline" onClick={onChangeNumber} className="w-full">
              Change Number
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
