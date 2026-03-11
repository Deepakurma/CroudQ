'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import heic2any from 'heic2any';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';

import { createPropertyScopedTrpcClient, queryClient, trpcClient } from '~/utils/trpc';

import {
  createInitialOnboardingFormData,
  step1Schema,
  step2Schema,
  step3Schema,
  STEPS
} from '../../../../components/onboarding/config';
import { OnboardingStepContent } from '../../../../components/onboarding/OnboardingStepContent';
import {
  getCreatePropertyPayload,
  getUpdatePropertyPayload
} from '../../../../components/onboarding/payloads';

import type { OnboardingFormData } from '../../../../components/onboarding/config';
import type { ZodIssue } from 'zod';

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

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return 'Something went wrong';
};

const isStructureOccupiedError = (error: unknown) => {
  const errorMessage = getErrorMessage(error).toLowerCase();
  return (
    errorMessage.includes('higher room slots are occupied') ||
    errorMessage.includes('cannot remove floors with occupied rooms') ||
    errorMessage.includes('currently assigned to rooms')
  );
};

const normalizeRoomsPerFloorForStepInput = ({
  roomsPerFloor,
  includeGroundFloor,
  floors
}: {
  roomsPerFloor: Record<string, string> | null | undefined;
  includeGroundFloor: boolean;
  floors: number;
}): Record<string, string> => {
  const normalized: Record<string, string> = {};
  const source = roomsPerFloor || {};

  for (let i = 0; i < floors; i++) {
    const floorNumber = includeGroundFloor ? (i === 0 ? 0 : i) : i + 1;
    const value = source[floorNumber.toString()] ?? source[i.toString()];
    if (value !== undefined) {
      normalized[i.toString()] = value;
    }
  }

  return normalized;
};

const deriveFloorsCount = ({
  floors,
  includeGroundFloor,
  roomsPerFloor
}: {
  floors: number | null | undefined;
  includeGroundFloor: boolean;
  roomsPerFloor: Record<string, string> | null | undefined;
}): number => {
  if (floors && floors > 0) return floors;

  const keys = Object.keys(roomsPerFloor || {})
    .map((key) => parseInt(key, 10))
    .filter((value) => Number.isFinite(value));

  if (keys.length === 0) return 0;

  const maxFloorNumber = Math.max(...keys);
  return includeGroundFloor ? maxFloorNumber + 1 : maxFloorNumber;
};

function OnboardingScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isConvertingPhotos, setIsConvertingPhotos] = useState(false);
  const isMediaBusy = isUploadingPhotos || isConvertingPhotos;
  const [pendingPhotoUploads, setPendingPhotoUploads] = useState<
    Array<{ file: File; previewUrl: string }>
  >([]);
  const pendingPhotoUploadsRef = useRef<Array<{ file: File; previewUrl: string }>>([]);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const [currLandmark, setCurrLandmark] = useState('');
  const [currRule, setCurrRule] = useState('');

  const [formData, setFormData] = useState(createInitialOnboardingFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const propertyClient = useMemo(
    () => (selectedPropertyId ? createPropertyScopedTrpcClient(selectedPropertyId) : null),
    [selectedPropertyId]
  );

  const resetForm = () => {
    for (const pendingPhoto of pendingPhotoUploadsRef.current) {
      URL.revokeObjectURL(pendingPhoto.previewUrl);
    }
    pendingPhotoUploadsRef.current = [];
    setPendingPhotoUploads([]);
    setFormData(createInitialOnboardingFormData());
    setErrors({});
    setCurrLandmark('');
    setCurrRule('');
    setCurrentStep(1);
  };

  useEffect(() => {
    pendingPhotoUploadsRef.current = pendingPhotoUploads;
  }, [pendingPhotoUploads]);

  useEffect(() => {
    return () => {
      for (const pendingPhoto of pendingPhotoUploadsRef.current) {
        URL.revokeObjectURL(pendingPhoto.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadEditData = async () => {
      if (!isEditMode) {
        resetForm();
        return;
      }

      setIsBootstrapping(true);
      try {
        const properties = await trpcClient.property.getAllProperties.query();
        if (!properties.length) {
          toast.error('No property found to edit');
          router.replace('/landlord/property');
          return;
        }

        const propertyId = properties[0].id;
        if (isCancelled) return;
        setSelectedPropertyId(propertyId);

        const scopedClient = createPropertyScopedTrpcClient(propertyId);
        const details = await scopedClient.property.getPropertyDetails.query();
        if (!details) {
          toast.error('Unable to load property details');
          router.replace('/landlord/property');
          return;
        }

        const allowedPropertyTypes: OnboardingFormData['type'][] = [
          'Boys',
          'Girls',
          'Co-living',
          'PG'
        ];
        const nextType = allowedPropertyTypes.includes(details.type as OnboardingFormData['type'])
          ? (details.type as OnboardingFormData['type'])
          : 'Boys';

        const includeGroundFloor = details.includeGroundFloor || false;
        const resolvedFloors = deriveFloorsCount({
          floors: details.floors,
          includeGroundFloor,
          roomsPerFloor: details.roomsPerFloor as Record<string, string>
        });

        const normalizedRoomsPerFloor = normalizeRoomsPerFloorForStepInput({
          roomsPerFloor: details.roomsPerFloor as Record<string, string>,
          includeGroundFloor,
          floors: resolvedFloors
        });

        if (isCancelled) return;
        setFormData((prev) => ({
          ...prev,
          propertyName: details.name,
          inchargeName: details.inchargeName || '',
          inchargePhone: details.inchargePhone || '',
          type: nextType,
          address1: details.addressLine1 || '',
          city: details.city || '',
          state: details.state || '',
          pincode: details.pincode || '',
          area: details.area || '',
          mapsLink: details.mapsLink || '',
          landmarks: details.landmarks || [],
          floors: resolvedFloors > 0 ? resolvedFloors.toString() : '',
          includeGroundFloor,
          roomsPerFloor: normalizedRoomsPerFloor,
          roomTypes: Array.from(new Set(details.roomTypes as string[])),
          rents: details.rents as Record<string, string>,
          electricity: details.facilities.electricity ?? false,
          hotWater: details.facilities.hotWater ?? false,
          wifi: details.facilities.wifi ?? false,
          ac: details.facilities.ac ?? false,
          powerBackup: details.facilities.powerBackup ?? false,
          lift: details.facilities.lift ?? false,
          parking: details.facilities.parking ?? false,
          food: details.facilities.food ?? false,
          laundry: details.facilities.laundry ?? false,
          housekeeping: details.facilities.housekeeping ?? false,
          cctv: details.facilities.cctv ?? false,
          rules: details.rules || [],
          photos: details.photos || []
        }));
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void loadEditData();

    return () => {
      isCancelled = true;
    };
  }, [isEditMode, router]);

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[key];
        return nextErrors;
      });
    }
  };

  const validateStep = (step: number) => {
    let schema;
    let data;

    if (step === 1) {
      schema = step1Schema;
      data = {
        propertyName: formData.propertyName,
        inchargeName: formData.inchargeName,
        inchargePhone: formData.inchargePhone,
        type: formData.type
      };
    } else if (step === 2) {
      schema = step2Schema;
      data = {
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      };
    } else if (step === 3) {
      schema = step3Schema;
      data = { floors: formData.floors };

      if (formData.roomTypes.length === 0) {
        toast.error('Please select at least one room type');
        return false;
      }
    } else {
      setErrors({});
      return true;
    }

    const result = schema.safeParse(data);
    const customErrors: Record<string, string> = {};

    if (step === 3) {
      const numFloors = parseInt(formData.floors, 10) || 0;
      for (let i = 0; i < numFloors; i++) {
        const rooms = parseInt(formData.roomsPerFloor[i] || '0', 10);
        if (rooms > 50) {
          customErrors[`roomsPerFloor.${i}`] = 'Max 50 rooms';
        }
        if (!formData.roomsPerFloor[i] || rooms < 1) {
          customErrors[`roomsPerFloor.${i}`] = 'At least 1 room is required';
        }
      }

      formData.roomTypes.forEach((type) => {
        const rent = parseInt(formData.rents[type] || '0', 10);
        if (rent > 200000) {
          customErrors[`rents.${type}`] = 'Max rent ₹2,00,000';
        }
        if (!rent) {
          customErrors[`rents.${type}`] = 'Rent is required';
        }
      });
    }

    if (!result.success || Object.keys(customErrors).length > 0) {
      const fieldErrors: Record<string, string> = {};
      if (!result.success && 'error' in result) {
        result.error.issues.forEach((err: ZodIssue) => {
          if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
        });
      }
      setErrors({ ...fieldErrors, ...customErrors });
      return false;
    }

    setErrors({});
    return true;
  };

  const updateRoomsPerFloor = (index: number, value: string) => {
    const errorKey = `roomsPerFloor.${index}`;
    setFormData((prev) => ({
      ...prev,
      roomsPerFloor: { ...prev.roomsPerFloor, [index]: value }
    }));

    if (errors[errorKey]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[errorKey];
        return nextErrors;
      });
    }
  };

  const toggleRoomType = (type: string) => {
    setFormData((prev) => {
      const types = prev.roomTypes.includes(type)
        ? prev.roomTypes.filter((t) => t !== type)
        : [...prev.roomTypes, type];
      return { ...prev, roomTypes: types };
    });
  };

  const updateRent = (type: string, value: string) => {
    const errorKey = `rents.${type}`;
    setFormData((prev) => ({
      ...prev,
      rents: { ...prev.rents, [type]: value }
    }));

    if (errors[errorKey]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[errorKey];
        return nextErrors;
      });
    }
  };

  const addListItem = (
    field: 'landmarks' | 'rules',
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }));
    setter('');
  };

  const removeListItem = (field: 'landmarks' | 'rules', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
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

  const handlePhotoSelection = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    let selectedFiles = Array.from(files);
    const remainingSlots = 5 - formData.photos.length;
    if (remainingSlots <= 0) {
      toast.error('You can upload up to 5 photos only.');
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      toast.error(
        remainingSlots === 5
          ? 'You can upload up to 5 photos only.'
          : `You can upload only ${remainingSlots} more photo(s).`
      );
      return;
    }
    const maxSizeBytes = 10 * 1024 * 1024;

    try {
      setIsConvertingPhotos(true);
      selectedFiles = await Promise.all(selectedFiles.map(convertIfHeic));
    } catch {
      toast.error('Unable to convert HEIC image. Please try a JPEG or PNG.');
      return;
    } finally {
      setIsConvertingPhotos(false);
    }

    for (const file of selectedFiles) {
      if (!(ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(file.type)) {
        toast.error(`Unsupported file type: ${file.name}`);
        return;
      }
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name} is larger than 10MB`);
        return;
      }
    }

    const newPendingPhotos = selectedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setPendingPhotoUploads((prev) => [...prev, ...newPendingPhotos]);
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPendingPhotos.map((photo) => photo.previewUrl)]
    }));
    toast.success(`${newPendingPhotos.length} photo(s) selected`);
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => {
      const removedPhotoUrl = prev.photos[index];
      if (removedPhotoUrl?.startsWith('blob:')) {
        setPendingPhotoUploads((pendingPhotos) => {
          const matchingPendingPhoto = pendingPhotos.find(
            (pendingPhoto) => pendingPhoto.previewUrl === removedPhotoUrl
          );
          if (matchingPendingPhoto) {
            URL.revokeObjectURL(matchingPendingPhoto.previewUrl);
          }

          return pendingPhotos.filter(
            (pendingPhoto) => pendingPhoto.previewUrl !== removedPhotoUrl
          );
        });
      }

      return {
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      };
    });
  };

  const uploadPendingPhotosIfAny = async (): Promise<string[]> => {
    if (!pendingPhotoUploadsRef.current.length) {
      return formData.photos;
    }

    setIsUploadingPhotos(true);
    try {
      const uploadedPhotoUrlByPreview = new Map<string, string>();

      for (const pendingPhoto of pendingPhotoUploadsRef.current) {
        const contentType = toAllowedImageContentType(pendingPhoto.file.type);
        const { uploadUrl, fileUrl } = propertyClient
          ? await propertyClient.media.generateUploadUrl.mutate({
              folder: 'properties',
              fileName: pendingPhoto.file.name,
              contentType,
              fileSizeBytes: pendingPhoto.file.size
            })
          : await trpcClient.media.generateUploadUrlForUser.mutate({
              contentType,
              fileSizeBytes: pendingPhoto.file.size
            });

        const uploadResult = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType
          },
          body: pendingPhoto.file
        });

        if (!uploadResult.ok) {
          throw new Error(`Failed to upload ${pendingPhoto.file.name}`);
        }

        uploadedPhotoUrlByPreview.set(pendingPhoto.previewUrl, fileUrl);
      }

      const nextPhotos = formData.photos.map(
        (photo) => uploadedPhotoUrlByPreview.get(photo) ?? photo
      );

      for (const pendingPhoto of pendingPhotoUploadsRef.current) {
        URL.revokeObjectURL(pendingPhoto.previewUrl);
      }

      pendingPhotoUploadsRef.current = [];
      setPendingPhotoUploads([]);
      setFormData((prev) => ({ ...prev, photos: nextPhotos }));
      return nextPhotos;
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const submitEditPropertyUpdate = async (photos: string[]) => {
    if (!propertyClient) {
      throw new Error('Property context missing for edit flow');
    }

    await propertyClient.property.update.mutate(getUpdatePropertyPayload({ ...formData, photos }));
    await queryClient.invalidateQueries({ queryKey: ['landlord-property-summary'] });

    toast.success('Property updated successfully');
    resetForm();
    router.replace('/landlord/property');
    router.refresh();
  };

  const submitCreateProperty = async (photos: string[]) => {
    await trpcClient.property.create.mutate(getCreatePropertyPayload({ ...formData, photos }));
    await queryClient.invalidateQueries({ queryKey: ['landlord-property-summary'] });

    toast.success('Property created successfully');
    resetForm();

    router.replace('/landlord/property');
    router.refresh();
  };

  const nextStep = async () => {
    if (isMediaBusy) {
      toast.error('Please wait, images are being uploaded.');
      return;
    }
    if (!validateStep(currentStep)) return;

    if (currentStep < STEPS.length) {
      if (isEditMode && currentStep === 3) {
        if (!propertyClient) {
          toast.error('Unable to validate room changes right now.');
          return;
        }

        try {
          await propertyClient.property.validateRoomStructure.mutate({
            floors: formData.floors,
            includeGroundFloor: formData.includeGroundFloor,
            roomsPerFloor: formData.roomsPerFloor
          });
          setCurrentStep((prev) => prev + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
          toast.error(
            isStructureOccupiedError(error)
              ? 'Rooms cannot be changed because residents exist in those rooms.'
              : 'Failed to validate room changes. Please try again.'
          );
        }
        return;
      }

      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const photos = await uploadPendingPhotosIfAny();

      if (isEditMode) {
        if (!propertyClient) {
          throw new Error('Property context missing for edit flow');
        }

        const hasValidStructure =
          formData.floors.trim().length > 0 && parseInt(formData.floors, 10) > 0;

        if (hasValidStructure) {
          await propertyClient.property.updateRoomStructure.mutate({
            floors: formData.floors,
            includeGroundFloor: formData.includeGroundFloor,
            roomsPerFloor: formData.roomsPerFloor
          });
        }

        await submitEditPropertyUpdate(photos);
      } else {
        await submitCreateProperty(photos);
      }
    } catch (error) {
      toast.error(
        isStructureOccupiedError(error)
          ? 'Rooms cannot be changed because residents exist in those rooms.'
          : isEditMode
            ? 'Failed to update property. Please try again.'
            : 'Unable to complete onboarding right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isBootstrapping) {
    return (
      <div className="text-muted-foreground mx-auto flex min-h-[420px] w-full max-w-3xl items-center justify-center gap-2 p-6 text-sm">
        <Loader2 className="size-4 animate-spin sm:size-5" />
        Loading property details...
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground mx-auto flex min-h-screen max-w-3xl flex-col gap-5">
      <div>
        <p className="text-muted-foreground mb-2 text-sm font-medium">
          Step {currentStep} of {STEPS.length}
        </p>
        <div className="bg-card h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-card min-h-[400px] rounded-2xl border p-5 shadow-sm sm:p-8">
        <OnboardingStepContent
          currentStep={currentStep}
          formData={formData}
          errors={errors}
          isEditMode={isEditMode}
          currLandmark={currLandmark}
          setCurrLandmark={setCurrLandmark}
          currRule={currRule}
          setCurrRule={setCurrRule}
          updateField={updateField}
          addListItem={addListItem}
          removeListItem={removeListItem}
          updateRoomsPerFloor={updateRoomsPerFloor}
          toggleRoomType={toggleRoomType}
          updateRent={updateRent}
          handlePhotoSelection={handlePhotoSelection}
          removePhoto={removePhoto}
          isUploadingPhotos={isUploadingPhotos}
          isConvertingPhotos={isConvertingPhotos}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {currentStep > 1 ? (
          <Button variant="outline" onClick={prevStep} className="max-w-[150px] flex-1 gap-2">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        ) : (
          <div className="max-w-[150px] flex-1" />
        )}

        <Button
          onClick={() => {
            if (isMediaBusy) {
              toast.error('Please wait, images are being uploaded.');
              return;
            }
            void nextStep();
          }}
          disabled={isSubmitting}
          aria-disabled={isMediaBusy || isSubmitting}
          className={`flex-[2] ${isMediaBusy ? 'cursor-not-allowed opacity-50' : ''}`}>
          {currentStep === STEPS.length
            ? isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Submitting...'
              : isEditMode
                ? 'Update Property'
                : 'Submit Registration'
            : 'Next'}
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingScreen() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <OnboardingScreenContent />
    </Suspense>
  );
}
