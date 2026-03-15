import { OnboardingStepContent } from "@/components/onboarding/OnboardingStepContent";
import {
  STEPS,
  createInitialOnboardingFormData,
  step1Schema,
  step2Schema,
  step3Schema,
  type OnboardingFormData,
} from "@/components/onboarding/config";
import {
  getCreatePropertyPayload,
  getUpdatePropertyPayload,
} from "@/components/onboarding/payloads";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useProperty } from "@/context/PropertyContext";
import { useAuth } from "@/context/AuthContext";
import { trpc } from "@/utils/api";
import { uploadImageToS3 } from "@/utils/s3-upload";
import { getTrpcErrorLogMessage } from "@/utils/trpc-error";
import { validateSchema } from "@/utils/validation";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ChevronLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import type { ZodSchema } from "zod";

const normalizeRoomsPerFloorForStepInput = ({
  roomsPerFloor,
  includeGroundFloor,
  floors,
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
  roomsPerFloor,
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

export default function OnboardingScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const { selectedPropertyId, setSelectedPropertyId } = useProperty();
  const { token } = useAuth();
  const utils = trpc.useUtils();
  const navigation = useNavigation();

  const [currentStep, setCurrentStep] = useState(1);
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const isEditMode = mode === "edit";

  const { data: propertyData } = trpc.property.getPropertyDetails.useQuery(
    undefined,
    {
      enabled: isEditMode,
    },
  );

  // Local state for list inputs
  const [currLandmark, setCurrLandmark] = useState("");
  const [currRule, setCurrRule] = useState("");

  const [formData, setFormData] = useState(createInitialOnboardingFormData());
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isConvertingPhotos, setIsConvertingPhotos] = useState(false);
  const [pendingPhotoUploads, setPendingPhotoUploads] = useState<
    { uri: string; fileName: string; contentType: string }[]
  >([]);
  const pendingPhotoUploadsRef = useRef<
    { uri: string; fileName: string; contentType: string }[]
  >([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(createInitialOnboardingFormData());
    setPendingPhotoUploads([]);
    setErrors({});
    setCurrLandmark("");
    setCurrRule("");
    setCurrentStep(1);
  }, []);

  useEffect(() => {
    if (isEditMode && propertyData) {
      const allowedPropertyTypes: OnboardingFormData["type"][] = [
        "Boys",
        "Girls",
        "coliving",
        "PG",
      ];
      const nextType = allowedPropertyTypes.includes(
        propertyData.type as OnboardingFormData["type"],
      )
        ? (propertyData.type as OnboardingFormData["type"])
        : "Boys";
      const includeGroundFloor = propertyData.includeGroundFloor || false;
      const resolvedFloors = deriveFloorsCount({
        floors: propertyData.floors,
        includeGroundFloor,
        roomsPerFloor: propertyData.roomsPerFloor as Record<string, string>,
      });
      const normalizedRoomsPerFloor = normalizeRoomsPerFloorForStepInput({
        roomsPerFloor: propertyData.roomsPerFloor as Record<string, string>,
        includeGroundFloor,
        floors: resolvedFloors,
      });

      setFormData((prev) => ({
        ...prev,
        propertyName: propertyData.name,
        inchargeName: propertyData.inchargeName || "",
        inchargePhone: propertyData.inchargePhone || "",
        type: nextType,
        address1: propertyData.addressLine1 || "",
        city: propertyData.city || "",
        state: propertyData.state || "",
        pincode: propertyData.pincode || "",
        area: propertyData.area || "",
        mapsLink: propertyData.mapsLink || "",
        landmarks: propertyData.landmarks || [],
        floors: resolvedFloors > 0 ? resolvedFloors.toString() : "",
        includeGroundFloor,
        roomsPerFloor: normalizedRoomsPerFloor,
        roomTypes: Array.from(new Set(propertyData.roomTypes as string[])),
        rents: propertyData.rents as Record<string, string>,
        // Facilities
        electricity: propertyData.facilities.electricity ?? false,
        hotWater: propertyData.facilities.hotWater ?? false,
        wifi: propertyData.facilities.wifi ?? false,
        ac: propertyData.facilities.ac ?? false,
        powerBackup: propertyData.facilities.powerBackup ?? false,
        lift: propertyData.facilities.lift ?? false,
        parking: propertyData.facilities.parking ?? false,
        food: propertyData.facilities.food ?? false,
        laundry: propertyData.facilities.laundry ?? false,
        housekeeping: propertyData.facilities.housekeeping ?? false,
        cctv: propertyData.facilities.cctv ?? false,
        // Others
        rules: propertyData.rules || [],
        photos: propertyData.photos || [],
      }));
    } else if (!isEditMode) {
      // Reset form when switching from edit mode to create mode
      resetForm();
    }
  }, [propertyData, isEditMode, resetForm]);

  useEffect(() => {
    pendingPhotoUploadsRef.current = pendingPhotoUploads;
  }, [pendingPhotoUploads]);

  useFocusEffect(
    useCallback(() => {
      // Return cleanup function to run when screen loses focus
      return () => {
        setErrors({});
      };
    }, []),
  );

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
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
        type: formData.type,
      };
    } else if (step === 2) {
      schema = step2Schema;
      data = {
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      };
    } else if (step === 3) {
      schema = step3Schema;
      data = { floors: formData.floors };

      // Custom validation for room types
      if (formData.roomTypes.length === 0) {
        Toast.show({
          type: "error",
          text1: "Selection Required",
          text2: "Please select at least one room type",
        });
        return false;
      }
    } else {
      setErrors({});
      return true;
    }

    const result = validateSchema(schema as ZodSchema, data);
    let customErrors: Record<string, string> = {};

    if (step === 3) {
      const numFloors = parseInt(formData.floors, 10) || 0;
      for (let i = 0; i < numFloors; i++) {
        const rooms = parseInt(formData.roomsPerFloor[i] || "0", 10);
        if (rooms > 50) {
          customErrors[`roomsPerFloor.${i}`] = "Max 50 rooms";
        }

        if (!formData.roomsPerFloor[i] || rooms < 1) {
          customErrors[`roomsPerFloor.${i}`] = "At least 1 room is required";
        }
      }

      formData.roomTypes.forEach((type) => {
        const rent = parseInt(formData.rents[type] || "0");
        if (rent > 200000) {
          customErrors[`rents.${type}`] = "Max rent ₹2,00,000";
        }

        if (!rent) {
          customErrors[`rents.${type}`] = "Rent is required";
        }
      });
    }

    if (
      (!result.success && result.errors) ||
      Object.keys(customErrors).length > 0
    ) {
      setErrors({ ...(result.errors || {}), ...customErrors });
      return false;
    }

    setErrors({});
    return true;
  };

  const updateRoomsPerFloor = (index: number, value: string) => {
    const errorKey = `roomsPerFloor.${index}`;

    setFormData((prev) => ({
      ...prev,
      roomsPerFloor: { ...prev.roomsPerFloor, [index]: value },
    }));

    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
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
      rents: { ...prev.rents, [type]: value },
    }));

    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const isMediaBusy = isUploadingPhotos || isConvertingPhotos;

  const convertIfHeic = async (asset: ImagePicker.ImagePickerAsset) => {
    const fileName = asset.fileName ?? "";
    const mimeType = asset.mimeType ?? "";
    const isHeic =
      mimeType === "image/heic" ||
      mimeType === "image/heif" ||
      fileName.toLowerCase().endsWith(".heic") ||
      fileName.toLowerCase().endsWith(".heif");

    if (!isHeic) return asset;

    const result = await ImageManipulator.manipulateAsync(asset.uri, [], {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const nextFileName = fileName
      ? fileName.replace(/\.(heic|heif)$/i, ".jpg")
      : `property-${Date.now()}.jpg`;

    return {
      ...asset,
      uri: result.uri,
      fileName: nextFileName,
      mimeType: "image/jpeg",
    };
  };

  const addListItem = (
    field: "landmarks" | "rules",
    value: string,
    setter: (v: string) => void,
  ) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()],
    }));
    setter("");
  };

  const removeListItem = (field: "landmarks" | "rules", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const pickImage = async () => {
    if (isMediaBusy) {
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: "Photos are being processed.",
      });
      return;
    }

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const remainingSlots = 5 - formData.photos.length;
      if (remainingSlots <= 0) {
        Toast.show({
          type: "error",
          text1: "Limit reached",
          text2: "You can upload up to 5 photos only.",
        });
        return;
      }

      if (result.assets.length > remainingSlots) {
        Toast.show({
          type: "error",
          text1: "Too many photos",
          text2:
            remainingSlots === 5
              ? "You can upload up to 5 photos only."
              : `You can upload only ${remainingSlots} more photo(s).`,
        });
        return;
      }

      let selectedAssets = result.assets.filter((asset) => asset.uri);
      try {
        setIsConvertingPhotos(true);
        selectedAssets = await Promise.all(selectedAssets.map(convertIfHeic));
      } catch (error) {
        console.error("Failed to convert HEIC images:", error);
        Toast.show({
          type: "error",
          text1: "Conversion failed",
          text2: "Unable to convert HEIC image. Please try a JPEG or PNG.",
        });
        return;
      } finally {
        setIsConvertingPhotos(false);
      }

      const newPendingPhotos = selectedAssets.map((asset, index) => ({
        uri: asset.uri!,
        fileName: asset.fileName ?? `property-${Date.now()}-${index}.jpg`,
        contentType: asset.mimeType ?? "image/jpeg",
      }));

      if (newPendingPhotos.length === 0) {
        return;
      }

      setPendingPhotoUploads((prev) => [...prev, ...newPendingPhotos]);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPendingPhotos.map((photo) => photo.uri)],
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => {
      const removedPhotoUrl = prev.photos[index];
      if (removedPhotoUrl) {
        setPendingPhotoUploads((pending) =>
          pending.filter((photo) => photo.uri !== removedPhotoUrl),
        );
      }
      return {
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
      };
    });
  };

  const router = useRouter();
  const createPropertyMutation = trpc.property.create.useMutation();
  const updatePropertyMutation = trpc.property.update.useMutation();
  const validateRoomStructureMutation =
    trpc.property.validateRoomStructure.useMutation();
  const updateRoomStructureMutation =
    trpc.property.updateRoomStructure.useMutation();
  const uploadPendingPhotosIfAny = async (): Promise<string[]> => {
    if (!pendingPhotoUploadsRef.current.length) {
      return formData.photos;
    }

    if (!token) {
      Toast.show({
        type: "error",
        text1: "Session expired",
        text2: "Please login again.",
      });
      throw new Error("Missing auth token for upload");
    }

    setIsUploadingPhotos(true);
    try {
      const uploadedPhotoUrlByPreview = new Map<string, string>();

      for (const pendingPhoto of pendingPhotoUploadsRef.current) {
        const uploaded = await uploadImageToS3({
          token,
          propertyId: selectedPropertyId ?? undefined,
          fileUri: pendingPhoto.uri,
          fileName: pendingPhoto.fileName,
          contentType: pendingPhoto.contentType,
          folder: "properties",
        });
        uploadedPhotoUrlByPreview.set(pendingPhoto.uri, uploaded.fileUrl);
      }

      const nextPhotos = formData.photos.map(
        (photo) => uploadedPhotoUrlByPreview.get(photo) ?? photo,
      );

      pendingPhotoUploadsRef.current = [];
      setPendingPhotoUploads([]);
      setFormData((prev) => ({ ...prev, photos: nextPhotos }));
      return nextPhotos;
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const submitEditPropertyUpdate = (photos: string[]) => {
    updatePropertyMutation.mutate(
      getUpdatePropertyPayload({ ...formData, photos }),
      {
        onSuccess: async () => {
          await Promise.all([
            utils.property.getPropertyDetails.invalidate(),
            utils.property.getDashboardStats.invalidate(),
            utils.property.getRooms.invalidate(),
            utils.property.getRoomTypes.invalidate(),
            utils.property.getAllProperties.invalidate(),
          ]);

          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Property updated successfully!",
          });
          resetForm();
          router.back();
        },
        onError: (error) => {
          console.error(
            "Failed to update property:",
            getTrpcErrorLogMessage(error),
          );
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to update property. Please try again.",
          });
        },
      },
    );
  };

  const nextStep = async () => {
    if (isMediaBusy) {
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: "Photos are being processed.",
      });
      return;
    }
    if (!validateStep(currentStep)) return;

    if (currentStep < STEPS.length) {
      if (isEditMode && currentStep === 3) {
        validateRoomStructureMutation.mutate(
          {
            floors: formData.floors,
            includeGroundFloor: formData.includeGroundFloor,
            roomsPerFloor: formData.roomsPerFloor,
          },
          {
            onSuccess: () => {
              setCurrentStep((prev) => prev + 1);
            },
            onError: (error) => {
              const errorMessage = getTrpcErrorLogMessage(error).toLowerCase();
              const isStructureOccupiedError =
                errorMessage.includes("higher room slots are occupied") ||
                errorMessage.includes(
                  "cannot remove floors with occupied rooms",
                ) ||
                errorMessage.includes("currently assigned to rooms");

              Toast.show({
                type: "error",
                text1: isStructureOccupiedError
                  ? "Cannot Update Rooms"
                  : "Error",
                text2: isStructureOccupiedError
                  ? "Rooms cannot be changed because residents exist in those rooms."
                  : "Failed to validate room changes. Please try again.",
              });
            },
          },
        );
        return;
      }
      setCurrentStep((prev) => prev + 1);
    } else {
      let photos: string[];
      try {
        photos = await uploadPendingPhotosIfAny();
      } catch (error) {
        console.error("Failed to upload photos:", error);
        return;
      }

      if (isEditMode && propertyData) {
        const hasValidStructure =
          formData.floors.trim().length > 0 &&
          parseInt(formData.floors, 10) > 0;

        if (!hasValidStructure) {
          submitEditPropertyUpdate(photos);
          return;
        }

        updateRoomStructureMutation.mutate(
          {
            floors: formData.floors,
            includeGroundFloor: formData.includeGroundFloor,
            roomsPerFloor: formData.roomsPerFloor,
          },
          {
            onSuccess: () => submitEditPropertyUpdate(photos),
            onError: (error) => {
              const errorMessage = getTrpcErrorLogMessage(error).toLowerCase();
              const isStructureOccupiedError =
                errorMessage.includes("higher room slots are occupied") ||
                errorMessage.includes(
                  "cannot remove floors with occupied rooms",
                ) ||
                errorMessage.includes("currently assigned to rooms");

              console.error(
                "Failed to update room structure:",
                getTrpcErrorLogMessage(error),
              );
              Toast.show({
                type: "error",
                text1: isStructureOccupiedError
                  ? "Cannot Update Rooms"
                  : "Error",
                text2: isStructureOccupiedError
                  ? "Rooms cannot be changed because residents exist in those rooms."
                  : "Failed to update property. Please try again.",
              });
            },
          },
        );
      } else {
        createPropertyMutation.mutate(
          getCreatePropertyPayload({ ...formData, photos }),
          {
            onSuccess: async (data) => {
              // Invalidate properties query to refetch the list
              await utils.property.getAllProperties.invalidate();

              // Set the newly created property as selected
              if (data?.propertyId) {
                setSelectedPropertyId(data.propertyId);
              }

              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Property created successfully!",
              });

              resetForm();
              router.replace("/manage-rooms" as any);
            },
            onError: (error) => {
              const errorMessage = getTrpcErrorLogMessage(error);
              const isPropertyLimitError = errorMessage
                .toLowerCase()
                .includes("up to 3 properties");
              console.error(
                "Failed to create property:",
                errorMessage,
              );
              Toast.show({
                type: "error",
                text1: isPropertyLimitError ? "Property Limit Reached" : "Error",
                text2: isPropertyLimitError
                  ? "You can only add up to 3 properties."
                  : "Failed to create property. Please try again.",
              });
            },
          },
        );
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStepContent = () => (
    <OnboardingStepContent
      currentStep={currentStep}
      formData={formData}
      errors={errors}
      isEditMode={isEditMode}
      currLandmark={currLandmark}
      setCurrLandmark={setCurrLandmark}
      currRule={currRule}
      setCurrRule={setCurrRule}
      styles={styles}
      updateField={updateField}
      addListItem={addListItem}
      removeListItem={removeListItem}
      updateRoomsPerFloor={updateRoomsPerFloor}
      toggleRoomType={toggleRoomType}
      updateRent={updateRent}
      pickImage={pickImage}
      removePhoto={removePhoto}
      isUploadingPhotos={isUploadingPhotos}
      isConvertingPhotos={isConvertingPhotos}
    />
  );

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        enableOnAndroid={true}
        extraScrollHeight={200}
      >
        {/* Steps Header inside ScrollView */}
        <View style={[{ paddingTop: headerHeight }]}>
          <Text style={styles.stepIndicatorText}>
            Step {currentStep} of {STEPS.length}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(currentStep / STEPS.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {renderStepContent()}

        {/* Footer Buttons inside ScrollView */}
        <View style={styles.footer}>
          {currentStep > 1 ? (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <ArrowLeft size={20} color={Colors.text} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} /> // Spacer if no back button
          )}

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextStep}
            disabled={isMediaBusy}
          >
            <Text style={styles.nextButtonText}>
              {isMediaBusy
                ? isConvertingPhotos
                  ? "Converting photos..."
                  : "Uploading photos..."
                : currentStep === STEPS.length
                  ? isEditMode
                    ? "Update Property"
                    : "Submit Registration"
                  : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top,
            height: headerHeight,
            backgroundColor: Colors.white,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={{
              width: 30,
              height: 30,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={Spacing["3xl"]} color={Colors.primary} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: Colors.primary }]}>
            Add Property
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.l,
    justifyContent: "center",
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: Spacing.xl,
    fontFamily: Typography.font.bold,
  },
  stepIndicatorText: {
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
    marginBottom: Spacing.s,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.accent,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.s,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scrollContent: {
    gap: Spacing.l,
    paddingHorizontal: Spacing.l,
    paddingBottom: 50,
  },
  formSection: {
    padding: Spacing.s,
    borderRadius: Spacing.l,
    gap: Spacing.l,
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: 12, // Larger touch area
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
    color: Colors.text,
  },
  helperText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  typeOption: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Spacing.l,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeOptionSelected: {
    backgroundColor: "#e0f2fe",
    borderColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: Typography.size.s,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  typeOptionTextSelected: {
    color: Colors.primary,
    fontFamily: Typography.font.semibold,
  },
  multiSelectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Spacing.l,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.size.s,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  switchContainer: {
    gap: Spacing.m,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  switchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  switchLabel: {
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  uploadBox: {
    height: 180,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: Spacing.m,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.s,
  },
  uploadText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  uploadSubText: {
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
  },
  mediaStatusText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
    marginTop: Spacing.s,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
    marginTop: Spacing.s,
  },
  photoContainer: {
    position: "relative",
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: Spacing.m,
    backgroundColor: "#e5e7eb",
  },
  mainPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: Spacing.m,
    resizeMode: "cover",
  },
  removePhotoButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.white,
  },
  miniUploadBox: {
    width: 80,
    height: 80,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.m,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewSection: {
    backgroundColor: "#f9fafb",
    padding: Spacing.m,
    borderRadius: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewSectionHeader: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.bold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: Spacing.m,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
  },
  reviewValue: {
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.semibold,
    flex: 1,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: Colors.white,
    padding: Spacing.m,
    borderRadius: Spacing.s,
    marginBottom: Spacing.m,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
  },
  reviewRowSm: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
  },
  reviewValueSm: {
    fontSize: Typography.size.s,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  addInputContainer: {
    flexDirection: "row",
    gap: Spacing.s,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44, // Match input height roughly
    borderRadius: Spacing.m,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    marginTop: Spacing.s,
    gap: Spacing.s,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: Spacing.m,
    borderRadius: Spacing.m,
    gap: Spacing.m,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
  },
  listItemText: {
    flex: 1,
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.regular,
  },
  reviewListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginTop: 4,
  },
  reviewBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.l,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  backButtonText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
  },
  nextButtonText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.white,
  },
});
