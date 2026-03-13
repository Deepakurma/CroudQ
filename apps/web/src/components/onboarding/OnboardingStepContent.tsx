import Image from 'next/image';

import {
  AirVent,
  Brush as BrushCleaning,
  Camera,
  Check,
  Loader2,
  Plus,
  Trash2,
  Utensils,
  Wifi,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import { Input } from '~/shared/shadcn/input';
import { Label } from '~/shared/shadcn/label';
import { Switch } from '~/shared/shadcn/switch';
import { Textarea } from '~/shared/shadcn/textarea';

import {
  isSafeLandlordImageSrc,
  LandlordImageFallback
} from '~/components/shared/landlord-image-fallback';

import { ROOM_TYPES } from './config';

import type { OnboardingFormData } from './config';

type OnboardingStepContentProps = {
  currentStep: number;
  formData: OnboardingFormData;
  errors: Record<string, string>;
  isEditMode: boolean;
  currLandmark: string;
  setCurrLandmark: (value: string) => void;
  currRule: string;
  setCurrRule: (value: string) => void;
  updateField: (key: string, value: unknown) => void;
  addListItem: (
    field: 'landmarks' | 'rules',
    value: string,
    setter: (value: string) => void
  ) => void;
  removeListItem: (field: 'landmarks' | 'rules', index: number) => void;
  updateRoomsPerFloor: (index: number, value: string) => void;
  toggleRoomType: (type: string) => void;
  updateRent: (type: string, value: string) => void;
  handlePhotoSelection: (files: FileList | null) => void;
  removePhoto: (index: number) => void;
  isUploadingPhotos: boolean;
  isConvertingPhotos?: boolean;
};

export function OnboardingStepContent({
  currentStep,
  formData,
  errors,
  isEditMode,
  currLandmark,
  setCurrLandmark,
  currRule,
  setCurrRule,
  updateField,
  addListItem,
  removeListItem,
  updateRoomsPerFloor,
  toggleRoomType,
  updateRent,
  handlePhotoSelection,
  removePhoto,
  isUploadingPhotos,
  isConvertingPhotos
}: OnboardingStepContentProps) {
  switch (currentStep) {
    case 1:
      return (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold">Basic Property Information</h2>

          <div className="space-y-2">
            <Label>Property / Property Name *</Label>
            <Input
              placeholder="e.g. Sunshine Boys Hostel"
              value={formData.propertyName}
              onChange={(e) => updateField('propertyName', e.target.value)}
              className={errors.propertyName ? 'border-red-500' : ''}
            />
            {errors.propertyName && <p className="text-sm text-red-500">{errors.propertyName}</p>}
          </div>

          <div className="space-y-2">
            <Label>In-charge Name *</Label>
            <Input
              placeholder="Full Name"
              value={formData.inchargeName}
              onChange={(e) => updateField('inchargeName', e.target.value)}
              className={errors.inchargeName ? 'border-red-500' : ''}
            />
            {errors.inchargeName && <p className="text-sm text-red-500">{errors.inchargeName}</p>}
          </div>

          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <Input
              placeholder="+91"
              type="tel"
              value={formData.inchargePhone}
              onChange={(e) => updateField('inchargePhone', e.target.value)}
              className={errors.inchargePhone ? 'border-red-500' : ''}
            />
            {errors.inchargePhone && <p className="text-sm text-red-500">{errors.inchargePhone}</p>}
          </div>

          <div className="space-y-2">
            <Label>Property Type</Label>
            <div className="flex flex-wrap gap-2 text-sm">
              {['Boys', 'Girls', 'Co-living', 'PG'].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={formData.type === type ? 'default' : 'secondary'}
                  onClick={() => updateField('type', type)}
                  className="rounded-full">
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold">Location Details</h2>

          <div className="space-y-2">
            <Label>Address Line *</Label>
            <Textarea
              placeholder="Flat / House No. / Building"
              rows={3}
              value={formData.address1}
              onChange={(e) => updateField('address1', e.target.value)}
              className={errors.address1 ? 'border-red-500' : ''}
            />
            {errors.address1 && <p className="text-sm text-red-500">{errors.address1}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Input
                placeholder="State"
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                className={errors.state ? 'border-red-500' : ''}
              />
              {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pincode *</Label>
              <Input
                placeholder="000000"
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => updateField('pincode', e.target.value)}
                className={errors.pincode ? 'border-red-500' : ''}
              />
              {errors.pincode && <p className="text-sm text-red-500">{errors.pincode}</p>}
            </div>
            <div className="space-y-2">
              <Label>Area / Locality</Label>
              <Input
                placeholder="e.g. Indiranagar"
                value={formData.area}
                onChange={(e) => updateField('area', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Google Maps Link</Label>
            <Input
              placeholder="Paste link here"
              value={formData.mapsLink}
              onChange={(e) => updateField('mapsLink', e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Optional. Helps residents find you easily.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nearby Landmarks (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Near Metro Station"
                value={currLandmark}
                onChange={(e) => setCurrLandmark(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addListItem('landmarks', currLandmark, setCurrLandmark);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addListItem('landmarks', currLandmark, setCurrLandmark)}
                size="icon">
                <Plus className="size-4" />
              </Button>
            </div>
            {formData.landmarks.length > 0 && (
              <ul className="mt-2 space-y-2">
                {formData.landmarks.map((item, index) => (
                  <li
                    key={index}
                    className="bg-muted flex items-center justify-between rounded-md p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted-foreground size-1.5 rounded-full" />
                      <span>{item}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem('landmarks', index)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    case 3: {
      const numFloors = parseInt(formData.floors, 10) || 0;
      return (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold">Property Details</h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Number of Floors</Label>
              <Button
                variant="ghost"
                type="button"
                className="flex h-auto items-center gap-2 p-1 hover:bg-transparent"
                onClick={() => {
                  if (isEditMode) {
                    toast.error('You cannot change property structure in edit mode');
                    return;
                  }
                  updateField('includeGroundFloor', !formData.includeGroundFloor);
                }}>
                <div
                  className={`flex size-5 items-center justify-center rounded border ${
                    formData.includeGroundFloor ? 'bg-primary border-primary' : 'border-input'
                  }`}>
                  {formData.includeGroundFloor && (
                    <Check className="text-primary-foreground size-3.5" />
                  )}
                </div>
                <span className="text-muted-foreground text-xs font-normal">
                  Ground Floor Included
                </span>
              </Button>
            </div>
            <Input
              placeholder="e.g 4"
              type="number"
              value={formData.floors}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || parseInt(val, 10) <= 50) updateField('floors', val);
                else toast.error('Maximum 50 floors allowed');
              }}
              className={errors.floors ? 'border-red-500' : ''}
              disabled={isEditMode}
            />
            {errors.floors && <p className="text-sm text-red-500">{errors.floors}</p>}
          </div>

          {numFloors > 0 && (
            <div className="space-y-2">
              <Label>Rooms per Floor</Label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: numFloors }).map((_, index) => {
                  let floorLabel = '';
                  if (formData.includeGroundFloor) {
                    floorLabel =
                      index === 0
                        ? 'Ground Floor'
                        : index === 1
                          ? '1st Floor'
                          : index === 2
                            ? '2nd Floor'
                            : index === 3
                              ? '3rd Floor'
                              : `${index}th Floor`;
                  } else {
                    const floorNum = index + 1;
                    floorLabel =
                      floorNum === 1
                        ? '1st Floor'
                        : floorNum === 2
                          ? '2nd Floor'
                          : floorNum === 3
                            ? '3rd Floor'
                            : `${floorNum}th Floor`;
                  }

                  return (
                    <div key={index} className="space-y-1">
                      <Label className="text-muted-foreground text-xs font-normal">
                        {floorLabel}
                      </Label>
                      <Input
                        placeholder="Rooms"
                        type="number"
                        value={formData.roomsPerFloor[index] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseInt(val, 10);
                          if (!val || (Number.isFinite(parsed) && parsed >= 1 && parsed <= 50)) {
                            updateRoomsPerFloor(index, val);
                          } else if (Number.isFinite(parsed) && parsed === 0) {
                            toast.error('At least 1 room is required per floor');
                          } else {
                            toast.error('Maximum 50 rooms per floor allowed');
                          }
                        }}
                        className={errors[`roomsPerFloor.${index}`] ? 'border-red-500' : ''}
                      />
                      {errors[`roomsPerFloor.${index}`] && (
                        <p className="text-xs text-red-500">{errors[`roomsPerFloor.${index}`]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Room Types Available</Label>
            <div className="flex flex-wrap gap-2 text-sm">
              {ROOM_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={formData.roomTypes.includes(type) ? 'default' : 'outline'}
                  onClick={() => toggleRoomType(type)}
                  className="flex items-center gap-1.5 rounded-full">
                  {type}
                  {formData.roomTypes.includes(type) && <Check className="size-3.5" />}
                </Button>
              ))}
            </div>
          </div>

          {formData.roomTypes.length > 0 && (
            <div className="space-y-3">
              <Label>Rent Details (Per Bed / Month)</Label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {formData.roomTypes.map((type) => (
                  <div key={type} className="space-y-1">
                    <Label className="text-muted-foreground text-xs font-normal">{type}</Label>
                    <div className="relative">
                      <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                        ₹
                      </span>
                      <Input
                        placeholder="Amount"
                        type="number"
                        className={`pl-7 ${errors[`rents.${type}`] ? 'border-red-500' : ''}`}
                        value={formData.rents[type] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || parseInt(val, 10) <= 200000) updateRent(type, val);
                          else toast.error('Maximum rent ₹2,00,000 allowed');
                        }}
                      />
                    </div>
                    {errors[`rents.${type}`] && (
                      <p className="text-xs text-red-500">{errors[`rents.${type}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    case 4: {
      const facilities = [
        {
          key: 'electricity',
          label: '24x7 Electricity',
          icon: <Zap className="text-primary size-5" />
        },
        {
          key: 'hotWater',
          label: 'Hot / Heated Water',
          icon: <Utensils className="text-primary size-5" />
        },
        { key: 'wifi', label: 'Wi-Fi Internet', icon: <Wifi className="text-primary size-5" /> },
        {
          key: 'ac',
          label: 'AC Rooms Available',
          icon: <AirVent className="text-primary size-5" />
        },
        {
          key: 'powerBackup',
          label: 'Power Backup',
          icon: <Zap className="text-primary size-5" />
        },
        {
          key: 'food',
          label: 'Food / Mess Facility',
          icon: <Utensils className="text-primary size-5" />
        },
        {
          key: 'housekeeping',
          label: 'Daily Housekeeping',
          icon: <BrushCleaning className="text-primary size-5" />
        },
        { key: 'cctv', label: 'CCTV Security', icon: <Camera className="text-primary size-5" /> }
      ];

      return (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Facilities</h2>
          <div className="divide-y rounded-lg">
            {facilities.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 px-0">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                <Switch
                  checked={Boolean(formData[item.key as keyof OnboardingFormData])}
                  onCheckedChange={(val) => updateField(item.key, val)}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 5:
      return (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold">Rules & Policies (Optional)</h2>
            <p className="text-muted-foreground text-sm">
              Set clear expectations for your residents.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Additional Rules / Notes</Label>
            <div className="flex gap-2">
              <Textarea
                placeholder="e.g. Gates close at 10 PM"
                value={currRule}
                rows={1}
                onChange={(e) => setCurrRule(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addListItem('rules', currRule, setCurrRule);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addListItem('rules', currRule, setCurrRule)}
                size="icon">
                <Plus className="size-5" />
              </Button>
            </div>
            {formData.rules.length > 0 && (
              <ul className="mt-4 space-y-2">
                {formData.rules.map((item, index) => (
                  <li
                    key={index}
                    className="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted-foreground size-1.5 rounded-full" />
                      <span>{item}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem('rules', index)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    case 6:
      return (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold">Photos & Media</h2>
            <p className="text-muted-foreground text-sm">
              Upload good quality photos to attract more residents.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="property-photos">Property Photos</Label>
            <input
              id="property-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handlePhotoSelection(event.target.files)}
              disabled={isUploadingPhotos}
              className="sr-only"
            />
            <label
              htmlFor="property-photos"
              className="group bg-muted/30 hover:border-foreground/30 flex cursor-pointer items-center justify-between rounded-xl border border-dashed px-4 py-4 transition">
              <div className="flex items-center gap-3">
                <span className="bg-foreground text-background flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                  <Camera className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Upload property photos</p>
                  <p className="text-muted-foreground text-xs">Max 5 photos • 10MB each</p>
                </div>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                {isUploadingPhotos ? 'Uploading...' : 'Select'}
              </span>
            </label>
            <p className="text-muted-foreground text-xs">
              {formData.photos.length}/5 photos selected
            </p>
            <div className="flex flex-wrap gap-3">
              {formData.photos.map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative">
                  {photo.startsWith('blob:') || isSafeLandlordImageSrc(photo) ? (
                    <Image
                      src={photo}
                      alt={`Property photo ${index + 1}`}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-lg border object-cover"
                      unoptimized={photo.startsWith('blob:')}
                    />
                  ) : (
                    <LandlordImageFallback
                      className="h-20 w-20 rounded-lg"
                      logoClassName="size-8"
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removePhoto(index)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
              {formData.photos.length === 0 && (
                <LandlordImageFallback className="h-20 w-20 rounded-lg" logoClassName="size-8" />
              )}
              {isConvertingPhotos && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading image...
                </div>
              )}
            </div>
          </div>
        </div>
      );
    case 7:
      return (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold">Review Information</h2>
            <p className="text-muted-foreground text-sm">
              Please review all details before submitting.
            </p>
          </div>

          <div className="rounded-lg border bg-slate-50 p-4">
            <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-wide uppercase">
              Basic Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-muted-foreground">Property Name</span>
                <span className="font-medium">{formData.propertyName || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{formData.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-muted-foreground">Incharge</span>
                <span className="font-medium">{formData.inchargeName || 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{formData.inchargePhone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-slate-50 p-4">
            <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-wide uppercase">
              Location
            </h3>
            <p className="font-medium">
              {[formData.address1, formData.area, formData.city, formData.state, formData.pincode]
                .filter(Boolean)
                .join(', ') || 'N/A'}
            </p>
            {formData.landmarks.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Landmarks
                </p>
                <ul className="space-y-1 text-sm">
                  {formData.landmarks.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border bg-slate-50 p-4">
            <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-wide uppercase">
              Property Stats
            </h3>
            {(() => {
              const floorsCount = parseInt(formData.floors || '0', 10) || 0;
              const roomsTotal = Object.values(formData.roomsPerFloor || {}).reduce(
                (sum, value) => sum + (parseInt(value || '0', 10) || 0),
                0
              );
              const bedCounts = (formData.roomTypes || [])
                .map((type) => {
                  if (type === 'Single') return 1;
                  const parsed = parseInt(type, 10);
                  return Number.isFinite(parsed) ? parsed : null;
                })
                .filter((value): value is number => value !== null);
              const bedsTotal = bedCounts.reduce((sum, value) => sum + value, 0);

              return (
                <div className="flex items-center justify-evenly py-2">
                  <div className="text-center">
                    <p className="text-primary text-2xl font-bold">{bedsTotal || 0}</p>
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Beds
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-primary text-2xl font-bold">{roomsTotal}</p>
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Rooms
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-primary text-2xl font-bold">{floorsCount || 0}</p>
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Floors
                    </p>
                  </div>
                </div>
              );
            })()}

            {formData.floors && parseInt(formData.floors, 10) > 0 ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Rooms Layout
                </p>
                {Array.from({ length: parseInt(formData.floors, 10) }).map((_, index) => {
                  let floorLabel = '';
                  if (formData.includeGroundFloor) {
                    floorLabel =
                      index === 0
                        ? 'Ground Floor'
                        : index === 1
                          ? '1st Floor'
                          : index === 2
                            ? '2nd Floor'
                            : index === 3
                              ? '3rd Floor'
                              : `${index}th Floor`;
                  } else {
                    const floorNum = index + 1;
                    floorLabel =
                      floorNum === 1
                        ? '1st Floor'
                        : floorNum === 2
                          ? '2nd Floor'
                          : floorNum === 3
                            ? '3rd Floor'
                            : `${floorNum}th Floor`;
                  }
                  const roomCount = formData.roomsPerFloor[index] || '0';

                  return (
                    <div key={floorLabel} className="flex justify-between">
                      <span className="font-medium">{floorLabel}</span>
                      <span className="text-muted-foreground">{roomCount} Rooms</span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {formData.roomTypes.length > 0 ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Rent Config
                </p>
                {formData.roomTypes.map((type) => (
                  <div key={type} className="flex justify-between">
                    <span className="font-medium">{type}</span>
                    <span className="text-muted-foreground">₹{formData.rents[type] || '0'}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border bg-slate-50 p-4">
            <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-wide uppercase">
              Facilities
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'electricity', label: 'Electricity' },
                { key: 'powerBackup', label: 'Power Backup' },
                { key: 'hotWater', label: 'Hot Water' },
                { key: 'wifi', label: 'WiFi' },
                { key: 'ac', label: 'AC' },
                { key: 'food', label: 'Food' },
                { key: 'housekeeping', label: 'Housekeeping' },
                { key: 'cctv', label: 'CCTV' },
                { key: 'laundry', label: 'Laundry' },
                { key: 'parking', label: 'Parking' },
                { key: 'lift', label: 'Lift' }
              ]
                .filter((facility) => Boolean(formData[facility.key as keyof OnboardingFormData]))
                .map((facility) => (
                  <span
                    key={facility.key}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {facility.label}
                  </span>
                ))}
            </div>
          </div>

          {formData.rules.length > 0 ? (
            <div className="rounded-lg border bg-slate-50 p-4">
              <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-wide uppercase">
                Rules
              </h3>
              <ul className="space-y-2 text-sm">
                {formData.rules.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {formData.photos.length > 0 ? (
            <div className="rounded-lg border bg-slate-50 p-4">
              <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-wide uppercase">
                Photos ({formData.photos.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {formData.photos.map((photo, index) => (
                  <div
                    key={`${photo}-${index}`}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border bg-slate-50">
                    {isSafeLandlordImageSrc(photo) ? (
                      <Image
                        src={photo}
                        alt={`Property ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <LandlordImageFallback className="h-full w-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      );
    default:
      return null;
  }
}
