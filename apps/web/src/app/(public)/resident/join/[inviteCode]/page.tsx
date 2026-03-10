'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import heic2any from 'heic2any';
import { AlertTriangle, ImagePlus, Loader2, ShieldCheck, Trash2 } from 'lucide-react';

import { getPublicOtpErrorMessage } from '~/lib/otp-error';
import { getPublicErrorMessage } from '~/lib/trpc-error';
import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/shadcn/card';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';

import { trpcClient } from '~/utils/trpc';

import type { ChangeEvent } from 'react';

const ALLOWED_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
] as const;
type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

const toAllowedImageContentType = (value: string): AllowedImageContentType => {
  if ((ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(value)) {
    return value as AllowedImageContentType;
  }
  throw new Error('Unsupported image format. Use JPEG, PNG, WEBP, HEIC, or HEIF.');
};

const convertIfHeic = async (file: File): Promise<File> => {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');

  if (!isHeic) return file;

  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9
  });

  return new File([blob as Blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
    type: 'image/jpeg'
  });
};

interface InvitePayload {
  inviteState: 'active' | 'expired' | 'closed';
  allowSubmission: boolean;
  property: {
    name: string;
  };
  room: {
    roomNumber: string;
    roomType: string;
    isAc: boolean;
    rentAmount: number | null;
  } | null;
}

const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(-10);
const JOIN_ALLOWED_MESSAGES = [
  'Invite link not found.',
  'OTP verification is required before submitting the request.',
  'Verification token does not match invite.',
  'Verification token does not match phone number.',
  'Unable to verify this OTP session. Please verify again.',
  'Verified phone number does not match the submitted phone number.',
  'This room is currently full. Please contact the property manager.',
  'Room not found for this invite.'
];

export default function JoinInvitePage() {
  const params = useParams<{ inviteCode: string }>();
  const inviteCode = params.inviteCode;
  const router = useRouter();

  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string>('');
  const [selectedProfileImageFile, setSelectedProfileImageFile] = useState<File | null>(null);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpReqId, setOtpReqId] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      setIsLoadingInvite(true);
      setErrorMessage('');

      try {
        const payload = await trpcClient.publicResident.getInviteByCode.query({
          inviteCode
        });

        if (payload?.inviteState === 'expired') {
          router.replace('/resident/auth?reason=expired&redirect=%2F');
          return;
        }

        if (!payload?.allowSubmission) {
          router.replace('/resident/status');
          return;
        }

        setInvite(payload);
      } catch (error: unknown) {
        setErrorMessage(
          getPublicErrorMessage(error, 'Unable to load invite details.', JOIN_ALLOWED_MESSAGES)
        );
      } finally {
        setIsLoadingInvite(false);
      }
    };

    if (inviteCode) {
      void fetchInvite();
    }
  }, [inviteCode, router]);

  const statusMessage = useMemo(() => {
    if (!invite) return '';
    return 'This invite is not currently open for new submissions.';
  }, [invite]);

  const handleSendOtp = async () => {
    setErrorMessage('');

    const normalizedPhone = normalizePhone(phoneNumber);
    if (normalizedPhone.length !== 10) {
      setErrorMessage('Enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const payload = await trpcClient.auth.sendOTP.mutate({ phoneNumber: normalizedPhone });

      setOtpSent(true);
      setOtpReqId(typeof payload?.reqId === 'string' ? payload.reqId : null);
      setVerificationToken(null);
    } catch (error: unknown) {
      setErrorMessage(getPublicOtpErrorMessage(error, 'Failed to send OTP.'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');

    const normalizedPhone = normalizePhone(phoneNumber);
    if (normalizedPhone.length !== 10) {
      setErrorMessage('Enter a valid 10-digit mobile number.');
      return;
    }

    if (!/^\d{4}$/.test(otp)) {
      setErrorMessage('Enter the 4-digit OTP.');
      return;
    }
    if (!otpReqId) {
      setErrorMessage('OTP session expired. Please send OTP again.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const payload = await trpcClient.publicResident.verifyInviteOtp.mutate({
        phoneNumber: normalizedPhone,
        otp,
        inviteCode,
        reqId: otpReqId
      });

      setVerificationToken(payload.verificationToken);
    } catch (error: unknown) {
      setVerificationToken(null);
      setErrorMessage(getPublicOtpErrorMessage(error, 'Failed to verify OTP.'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async () => {
    if (!invite) return;

    setErrorMessage('');

    const normalizedPhone = normalizePhone(phoneNumber);
    if (name.trim().length < 3) {
      setErrorMessage('Name must be at least 3 characters.');
      return;
    }

    if (normalizedPhone.length !== 10) {
      setErrorMessage('Enter a valid 10-digit mobile number.');
      return;
    }

    if (!verificationToken) {
      setErrorMessage('Please verify OTP before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      let profileImageUrl = profileImage || undefined;
      if (selectedProfileImageFile) {
        setIsUploadingPhoto(true);
        try {
          const contentType = toAllowedImageContentType(selectedProfileImageFile.type);
          const { uploadUrl, fileUrl } = await trpcClient.publicResident.generateUploadUrl.mutate({
            inviteCode,
            fileName: selectedProfileImageFile.name,
            contentType,
            fileSizeBytes: selectedProfileImageFile.size
          });

          const uploadResult = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': contentType
            },
            body: selectedProfileImageFile
          });

          if (!uploadResult.ok) {
            throw new Error('Upload failed');
          }

          profileImageUrl = fileUrl;
          setProfileImage(fileUrl);
          setSelectedProfileImageFile(null);
          if (profileImagePreviewUrl) {
            URL.revokeObjectURL(profileImagePreviewUrl);
            setProfileImagePreviewUrl('');
          }
        } catch {
          setErrorMessage('Could not upload selected image.');
          return;
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      await trpcClient.publicResident.submitRequest.mutate({
        inviteCode,
        name: name.trim(),
        phoneNumber: normalizedPhone,
        verificationToken,
        durationMonths: durationMonths ? Number(durationMonths) : undefined,
        profileImage: profileImageUrl
      });

      router.replace('/resident/status');
    } catch (error: unknown) {
      setErrorMessage(
        getPublicErrorMessage(error, 'Failed to submit request.', JOIN_ALLOWED_MESSAGES)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!verificationToken) {
      setErrorMessage('Please verify OTP first, then upload photo.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Photo size should be under 10MB.');
      return;
    }

    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl);
    }
    let processedFile = file;
    try {
      processedFile = await convertIfHeic(file);
    } catch {
      setErrorMessage('Unable to convert HEIC image. Please try a JPEG or PNG.');
      return;
    }

    setSelectedProfileImageFile(processedFile);
    setProfileImagePreviewUrl(URL.createObjectURL(processedFile));
    setErrorMessage('');
  };

  const clearProfileImageSelection = () => {
    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl);
    }
    setProfileImagePreviewUrl('');
    setSelectedProfileImageFile(null);
    setProfileImage('');
  };

  useEffect(() => {
    return () => {
      if (profileImagePreviewUrl) {
        URL.revokeObjectURL(profileImagePreviewUrl);
      }
    };
  }, [profileImagePreviewUrl]);

  if (isLoadingInvite) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-4 p-4 sm:p-8">
        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="text-muted-foreground flex items-center justify-center py-16 text-xs sm:text-sm">
            <Loader2 className="mr-2 size-4 animate-spin sm:size-5" /> Loading invite details...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (errorMessage && !invite) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-4 p-4 sm:p-8">
        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="space-y-4 py-12 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="text-destructive size-8" />
            </div>
            <p className="text-muted-foreground text-sm">{errorMessage}</p>
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!invite) return null;

  return (
    <main className="m-auto w-full max-w-2xl">
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Join - {invite.property.name}</CardTitle>
          <p className="text-muted-foreground text-sm">
            Room {invite.room?.roomNumber || 'N/A'} • {invite.room?.roomType || 'Room'}
            {invite.room?.isAc ? ' • AC' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!invite.allowSubmission ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {statusMessage}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    placeholder="10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(normalizePhone(e.target.value))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}>
                    {isSendingOtp ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : otpSent ? (
                      'Resend OTP'
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">OTP Verification</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    placeholder="Enter 4-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || !otpSent}
                    className="min-w-28">
                    {isVerifyingOtp ? <Loader2 className="size-4 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
                {verificationToken ? (
                  <p className="flex items-center gap-1 text-xs text-green-700">
                    <ShieldCheck className="size-3.5" /> Mobile number verified
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Verify your OTP before submitting.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="profileImage">Photo</Label>
                  <div className="space-y-3 rounded-xl border p-3">
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isUploadingPhoto}
                      className="sr-only"
                    />
                    <label
                      htmlFor="profileImage"
                      className="bg-muted/40 hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <ImagePlus className="size-4" />
                        Upload photo
                      </span>
                      <span className="text-xs font-semibold">Select</span>
                    </label>

                    {(profileImagePreviewUrl || profileImage) && (
                      <div className="relative inline-flex">
                        <Image
                          src={profileImagePreviewUrl || profileImage}
                          alt="Profile preview"
                          width={96}
                          height={96}
                          className="h-24 w-24 rounded-lg border object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={clearProfileImageSelection}
                          className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                          aria-label="Remove photo">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    )}

                    <p className="text-muted-foreground text-xs">Max size: 10MB</p>
                    {isUploadingPhoto ? (
                      <p className="text-muted-foreground text-xs">Uploading photo...</p>
                    ) : selectedProfileImageFile ? (
                      <p className="text-muted-foreground text-xs">
                        Photo will upload when you submit.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Check-In Date</Label>
                  <div className="bg-muted/30 text-muted-foreground rounded-xl border px-3 py-2 text-sm">
                    Defaults to today's date.
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rent Amount ₹</Label>
                  {typeof invite.room?.rentAmount === 'number' ? (
                    <div className="rounded-xl border bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                      ₹{invite.room.rentAmount.toLocaleString('en-IN')}
                    </div>
                  ) : (
                    <div className="bg-muted/30 text-muted-foreground rounded-xl border px-3 py-2 text-sm">
                      Amount would be set my incharge.
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Stay Duration (Months)</Label>
                  <Input
                    id="duration"
                    inputMode="numeric"
                    placeholder="Optional"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {errorMessage ? (
                <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-3 py-2 text-sm">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploadingPhoto}
                className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit For Approval'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
