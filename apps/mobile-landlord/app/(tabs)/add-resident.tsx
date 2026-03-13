import { SelectRoomModal } from "@/components/SelectRoomModal";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Switch } from "@/components/ui/Switch";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useProperty } from "@/context/PropertyContext";
import { trpc } from "@/utils/api";
import { formatIndianCurrency } from "@/utils/common";
import { calculateRentTrackingStartDate } from "@/utils/rentTracking";
import { uploadImageToS3 } from "@/utils/s3-upload";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronLeft,
  CircleAlert,
  DoorOpen,
  QrCode,
  UserRoundPlus,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { z } from "zod";
import { CardShadow } from "@/constants/Shadows";

const residentSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    primaryPhone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    roomNo: z.string().min(1, "Please select a room"),
    checkInDate: z.string().min(1, "Please select check-in date"),
    rentAmount: z
      .string()
      .min(1, "Rent amount is required")
      .regex(/^[0-9]+$/, "Rent amount must be a valid number")
      .refine((v) => Number(v) > 0, "Rent amount must be greater than 0")
      .refine((v) => Number(v) <= 200000, "Rent amount cannot exceed 2,00,000"),
    isAdvancePaid: z.boolean().optional(),
    advanceMonths: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isAdvancePaid) {
      if (
        !data.advanceMonths ||
        isNaN(Number(data.advanceMonths)) ||
        Number(data.advanceMonths) <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Advance months is required",
          path: ["advanceMonths"],
        });
      }
    }
  });

export default function AddResidentScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const navigation = useNavigation();
  const router = useRouter();

  const [entryMode, setEntryMode] = useState<"manual" | "qr" | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRoomSelectVisible, setRoomSelectVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    primaryPhone: "",
    roomNo: "",
    checkInDate: "",
    rentAmount: "",
    durationValue: "",
    checkOutDate: "",
    isAdvancePaid: false,
    advanceMonths: "",
  });

  const [qrInvite, setQrInvite] = useState<{
    inviteCode: string;
    inviteUrl: string;
    inviteExpiresAt: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const { token } = useAuth();
  const { selectedPropertyId } = useProperty();

  const resetForm = () => {
    setFormData({
      name: "",
      primaryPhone: "",
      roomNo: "",
      checkInDate: "",
      rentAmount: "",
      durationValue: "",
      checkOutDate: "",
      isAdvancePaid: false,
      advanceMonths: "",
    });
    setPhotos([]);
    setSelectedRoom(null);
    setErrors({});
  };

  const createResidentMutation = trpc.resident.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.resident.list.invalidate(),
        utils.resident.getResidentsByRoom.invalidate(),
        utils.property.getDashboardStats.invalidate(),
        utils.property.getRooms.invalidate(),
      ]);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Resident added successfully",
      });
      resetForm();
      router.push("/rooms" as any);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not add resident. Please try again.",
      });
    },
  });

  const createInviteMutation = trpc.resident.createInvite.useMutation({
    onSuccess: async (payload) => {
      setQrInvite(payload);
      await utils.resident.listPendingApprovals.invalidate();
      Toast.show({
        type: "success",
        text1: "Invite created",
        text2: "Share this QR with resident.",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not create invite. Please try again.",
      });
    },
  });

  const isSubmitting = createResidentMutation.isPending;

  const validate = () => {
    try {
      residentSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0].toString()] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (isUploadingPhoto) {
      Toast.show({
        type: "info",
        text1: "Upload in progress",
        text2: "Please wait for the photo upload to complete.",
      });
      return;
    }

    createResidentMutation.mutate({
      roomId: selectedRoom?.id || "",
      roomNumber: formData.roomNo,
      name: formData.name,
      phoneNumber: formData.primaryPhone,
      profileImage: photos[0],
      checkInDate: formData.checkInDate,
      rentAmount: parseInt(formData.rentAmount) || 0,
      advanceMonths: parseInt(formData.advanceMonths) || 0,
      durationMonths: parseInt(formData.durationValue) || undefined,
    });
  };

  const handleGenerateInvite = () => {
    if (!selectedRoom?.id) {
      Toast.show({
        type: "error",
        text1: "Select room",
        text2: "Choose a room before generating QR invite.",
      });
      return;
    }

    createInviteMutation.mutate({ roomId: selectedRoom.id });
  };

  const handleShareInvite = async () => {
    if (!qrInvite?.inviteUrl) return;
    await Share.share({
      message: `Complete resident onboarding here: ${qrInvite.inviteUrl}`,
    });
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        setErrors({});
      };
    }, []),
  );

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const calculateCheckoutDate = (checkIn: string, months: number) => {
    const [day, month, year] = checkIn.split("/").map(Number);
    if (!day || !month || !year || !months) return "";
    const date = new Date(year, month - 1, day);
    date.setMonth(date.getMonth() + months);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    if (formData.checkInDate && formData.durationValue) {
      const calculatedDate = calculateCheckoutDate(
        formData.checkInDate,
        Number(formData.durationValue),
      );
      setFormData((prev) => ({ ...prev, checkOutDate: calculatedDate }));
    } else {
      setFormData((prev) => ({ ...prev, checkOutDate: "" }));
    }
  }, [formData.checkInDate, formData.durationValue]);

  const parseDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const [day, month, year] = dateStr.split("/").map(Number);
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
    return undefined;
  };

  const formatDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Media permission is required");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Session expired",
          text2: "Please login again.",
        });
        return;
      }

      const asset = result.assets[0];
      setIsUploadingPhoto(true);
      try {
        if (!selectedPropertyId) {
          throw new Error("Property context is missing.");
        }

        const uploaded = await uploadImageToS3({
          token,
          propertyId: selectedPropertyId,
          fileUri: asset.uri,
          fileName: asset.fileName ?? `resident-${Date.now()}.jpg`,
          contentType: asset.mimeType ?? "image/jpeg",
          folder: "resident",
        });
        setPhotos([uploaded.fileUrl]);
      } catch {
        Toast.show({
          type: "error",
          text1: "Upload failed",
          text2: "Could not upload selected image.",
        });
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        enableOnAndroid={true}
        extraScrollHeight={200}
      >
        {!entryMode ? (
          <View style={styles.modeSection}>
            <Text style={styles.modeTitle}>
              How do you want to add resident?
            </Text>
            <Text style={styles.modeSubtitle}>
              Choose one method to continue onboarding.
            </Text>

            <TouchableOpacity
              style={[styles.modeCard, styles.manualModeCard]}
              onPress={() => setEntryMode("manual")}
            >
              <View style={styles.modeCardHeader}>
                <View style={styles.modeIconWrapper}>
                  <UserRoundPlus size={20} color={Colors.primary} />
                </View>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeBadgeText}>Quick</Text>
                </View>
              </View>
              <Text style={styles.modeCardTitle}>Manual Entry</Text>
              <Text style={styles.modeCardDescription}>
                Fill details now and add resident directly.
              </Text>
              <View style={styles.modeCtaRow}>
                <Text style={styles.modeCtaText}>Continue Manual</Text>
                <ArrowRight size={18} color={Colors.primary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, styles.qrModeCard]}
              onPress={() => setEntryMode("qr")}
            >
              <View style={styles.modeCardHeader}>
                <View style={styles.modeIconWrapper}>
                  <QrCode size={20} color={Colors.primary} />
                </View>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeBadgeText}>Self-Serve</Text>
                </View>
              </View>
              <Text style={styles.modeCardTitle}>QR Based Self-Entry</Text>
              <Text style={styles.modeCardDescription}>
                Generate QR and resident will submit details through web form.
              </Text>
              <View style={styles.modeCtaRow}>
                <Text style={styles.modeCtaText}>Continue QR Flow</Text>
                <ArrowRight size={18} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {entryMode === "manual" ? (
          <>
            <TouchableOpacity
              style={styles.modeSwitchChip}
              onPress={() => setEntryMode(null)}
            >
              <ArrowLeft size={16} color={Colors.primary} />
              <Text style={styles.modeSwitchChipText}>Switch flow</Text>
            </TouchableOpacity>

            <View style={styles.photoSection}>
              <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
                {photos.length > 0 ? (
                  <Image source={{ uri: photos[0] }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Camera size={32} color={Colors.textSecondary} />
                    <Text style={styles.photoText}>Add Photo</Text>
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Camera size={16} color={Colors.white} />
                </View>
              </TouchableOpacity>
            </View>

            <AppTextInput
              label="Full Name *"
              placeholder="Ex. Rahul Kumar"
              value={formData.name}
              onChangeText={(t) => updateField("name", t)}
              error={errors.name}
            />

            <AppTextInput
              label="Primary Phone *"
              placeholder="+91"
              keyboardType="phone-pad"
              value={formData.primaryPhone}
              onChangeText={(t) => updateField("primaryPhone", t)}
              error={errors.primaryPhone}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Room No *</Text>
                <TouchableOpacity
                  onPress={() => setRoomSelectVisible(true)}
                  style={[
                    styles.selector,
                    errors.roomNo ? styles.selectorError : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      !formData.roomNo && { color: Colors.textSecondary },
                    ]}
                  >
                    {formData.roomNo || "Select Room"}
                  </Text>
                </TouchableOpacity>
                {errors.roomNo && (
                  <View style={styles.errorContainer}>
                    <CircleAlert size={14} color={Colors.error} />
                    <Text style={styles.errorText}>{errors.roomNo}</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <DatePicker
                  label="Check-In Date *"
                  value={parseDate(formData.checkInDate)}
                  onChange={(date) =>
                    updateField("checkInDate", formatDate(date))
                  }
                  error={errors.checkInDate}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppTextInput
                  label="Stay Duration (Months)"
                  placeholder="Duration"
                  keyboardType="numeric"
                  value={formData.durationValue}
                  onChangeText={(t) => updateField("durationValue", t)}
                />
              </View>

              <View style={{ flex: 1 }}>
                <DatePicker
                  label="Check-Out Date"
                  value={parseDate(formData.checkOutDate)}
                  onChange={(date) =>
                    updateField("checkOutDate", formatDate(date))
                  }
                  minimumDate={parseDate(formData.checkInDate)}
                />
              </View>
            </View>

            <AppTextInput
              label="Rent Amount *"
              placeholder="₹ Amount"
              keyboardType="numeric"
              value={
                formData.rentAmount
                  ? formatIndianCurrency(formData.rentAmount)
                  : ""
              }
              onChangeText={(t) =>
                updateField("rentAmount", t.replace(/[^0-9]/g, ""))
              }
              error={errors.rentAmount}
            />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Advance Paid?</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>
                  {formData.isAdvancePaid ? "Yes" : "No"}
                </Text>
                <Switch
                  value={formData.isAdvancePaid}
                  onValueChange={(v) => {
                    updateField("isAdvancePaid", v);
                    if (!v && errors.advanceMonths) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.advanceMonths;
                        return newErrors;
                      });
                    }
                  }}
                />
              </View>
            </View>

            {formData.isAdvancePaid ? (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <AppTextInput
                    label="Advance Months"
                    placeholder="Months"
                    keyboardType="numeric"
                    value={formData.advanceMonths}
                    onChangeText={(t) => updateField("advanceMonths", t)}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Rent tracking starts from</Text>
                  <View
                    style={[
                      styles.infoBox,
                      { backgroundColor: "#f0f9ff", borderColor: "#e0f2fe" },
                    ]}
                  >
                    <Text style={styles.infoBoxText}>
                      {calculateRentTrackingStartDate(
                        formData.checkInDate,
                        formData.advanceMonths,
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.infoBox, styles.infoBoxRow]}>
                <Text style={styles.infoBoxLabel}>
                  Rent Tracking Starts From
                </Text>
                <Text style={styles.infoBoxText}>
                  {calculateRentTrackingStartDate(formData.checkInDate, "0")}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, { marginBottom: 30 }]}
              onPress={handleSubmit}
              disabled={isSubmitting || isUploadingPhoto}
            >
              <Text style={styles.submitBtnText}>
                {isUploadingPhoto
                  ? "Uploading photo..."
                  : isSubmitting
                    ? "Adding..."
                    : "Add Resident"}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        {entryMode === "qr" ? (
          <>
            <TouchableOpacity
              style={styles.modeSwitchChip}
              onPress={() => setEntryMode(null)}
            >
              <ArrowLeft size={16} color={Colors.primary} />
              <Text style={styles.modeSwitchChipText}>Switch flow</Text>
            </TouchableOpacity>

            <View style={styles.qrInfoCard}>
              <View style={styles.qrTitleRow}>
                <DoorOpen size={18} color={Colors.primary} />
                <Text style={styles.modeCardTitle}>
                  Select a Room To Assign
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRoomSelectVisible(true)}
                style={styles.selector}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !selectedRoom?.roomNumber && {
                      color: Colors.textSecondary,
                    },
                  ]}
                >
                  {selectedRoom?.roomNumber
                    ? `Room ${selectedRoom.roomNumber} • ${selectedRoom.type}${selectedRoom.isAc ? " • AC" : ""}`
                    : "Select Room"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleGenerateInvite}
                disabled={createInviteMutation.isPending}
              >
                <Text style={styles.submitBtnText}>
                  {createInviteMutation.isPending
                    ? "Generating..."
                    : "Generate QR Invite"}
                </Text>
              </TouchableOpacity>

              {!!qrInvite && (
                <View style={styles.qrReadyBox}>
                  <Text style={styles.qrReadyTitle}>Invite Ready</Text>
                  <Text style={styles.qrReadyText}>
                    Share link or open QR preview below.
                  </Text>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleShareInvite}
                  >
                    <Text style={styles.secondaryBtnText}>Share Invite</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : null}
      </KeyboardAwareScrollView>

      <SelectRoomModal
        visible={isRoomSelectVisible}
        onClose={() => setRoomSelectVisible(false)}
        onSelect={(room) => {
          setSelectedRoom(room);
          if (entryMode === "manual") {
            updateField("roomNo", room.roomNumber);
            if (room.price) {
              updateField("rentAmount", String(room.price));
            }
          }
        }}
        selectedRoomNo={formData.roomNo}
      />

      <Modal
        visible={!!qrInvite}
        transparent
        animationType="slide"
        onRequestClose={() => setQrInvite(null)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalCard}>
            <Text style={styles.qrModalTitle}>Show This to Resident</Text>
            {!!qrInvite && (
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrInvite.inviteUrl)}`,
                }}
                style={styles.qrImage}
              />
            )}
            <Text style={styles.qrExpiryText}>Expires in 24 hours</Text>
            <View style={styles.qrActionsRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleShareInvite}
              >
                <Text style={styles.secondaryBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => setQrInvite(null)}
              >
                <Text style={styles.submitBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            style={styles.backButton}
          >
            <ChevronLeft size={Spacing["3xl"]} color={Colors.primary} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: Colors.primary }]}>
            Add Resident
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
  backButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.l,
    paddingBottom: 20,
  },
  modeSection: {
    gap: Spacing.m,
  },
  modeTitle: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  modeSubtitle: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
    marginTop: -Spacing.xs,
  },
  modeCard: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Spacing.l,
    padding: Spacing.l,
    gap: Spacing.s,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    ...CardShadow,
    elevation: 1,
  },
  manualModeCard: {
    backgroundColor: "#f8fbff",
  },
  qrModeCard: {
    backgroundColor: "#f8fffb",
  },
  modeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  modeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  modeBadgeText: {
    color: Colors.primary,
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.semibold,
  },
  modeCardTitle: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  modeCardDescription: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  modeCtaText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.primary,
  },
  modeCtaRow: {
    marginTop: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeSwitchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  modeSwitchChipText: {
    color: Colors.primary,
    fontFamily: Typography.font.medium,
    fontSize: Typography.size.s,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  photoUpload: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    alignItems: "center",
    gap: 4,
  },
  photoText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  label: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.s,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  selector: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.m,
    paddingVertical: 12,
    borderRadius: Spacing.m,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectorError: {
    borderColor: Colors.error,
  },
  selectorText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.size.xs,
    color: Colors.error,
    fontFamily: Typography.font.medium,
  },
  formGroup: {
    gap: Spacing.s,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.accent,
    padding: Spacing.m,
    borderRadius: Spacing.m,
  },
  switchLabel: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  infoBox: {
    padding: Spacing.m,
    borderRadius: Spacing.m,
    borderWidth: 1,
    justifyContent: "center",
  },
  infoBoxRow: {
    backgroundColor: "#f0f9ff",
    borderColor: "#e0f2fe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoBoxLabel: {
    fontFamily: Typography.font.medium,
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
  },
  infoBoxText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
    color: Colors.primary,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
    alignItems: "center",
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
  qrInfoCard: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Spacing.l,
    padding: Spacing.l,
    gap: Spacing.m,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    ...CardShadow,
    elevation: 1,
  },
  qrTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  qrReadyBox: {
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: Spacing.m,
    backgroundColor: "#ecfdf5",
    padding: Spacing.m,
    gap: Spacing.s,
  },
  qrReadyTitle: {
    color: "#065f46",
    fontFamily: Typography.font.bold,
    fontSize: Typography.size.s,
  },
  qrReadyText: {
    color: "#047857",
    fontFamily: Typography.font.regular,
    fontSize: Typography.size.s,
  },
  secondaryBtn: {
    flex: 1,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: Spacing.l,
    alignItems: "center",
    paddingVertical: Spacing.m,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
  qrModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: Spacing.l,
  },
  qrModalCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: Spacing.xl,
    padding: Spacing.l,
    gap: Spacing.m,
    alignItems: "center",
  },
  qrModalTitle: {
    fontFamily: Typography.font.bold,
    fontSize: Typography.size.l,
    color: Colors.text,
  },
  qrImage: {
    width: 280,
    height: 280,
  },
  qrExpiryText: {
    fontFamily: Typography.font.medium,
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
  },
  qrActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.s,
  },
});
