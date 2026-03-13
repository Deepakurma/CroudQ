import { SelectRoomModal } from "@/components/SelectRoomModal";
import { ResidentDetailsSheet } from "@/components/resident-card/ResidentDetailsSheet";
import { ResidentEditSheet } from "@/components/resident-card/ResidentEditSheet";
import { ResidentPaymentHistorySheet } from "@/components/resident-card/ResidentPaymentHistorySheet";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useProperty } from "@/context/PropertyContext";
import { uploadImageToS3 } from "@/utils/s3-upload";
import { trpc } from "@/utils/api";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as ImagePicker from "expo-image-picker";
import { Edit2, History, Info, LogOut, Phone } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { z } from "zod";
import { CardShadow } from "@/constants/Shadows";

interface ResidentProps {
  id: string;
  name: string;
  room: string;
  dateCheckedIn: string;
  dateCheckedOut?: string;
  roomType: string;
  isAc: boolean;
  primaryPhone: string;
  rentAmount: string | number;
  advanceMonths?: string | number;
  upcomingRentDate: string;
  paymentDate?: string;
  lastPaymentDate?: string;
  nextRentDueDate?: string;
  profileImage?: string;
}

interface ResidentCardProps {
  item: ResidentProps;
  showRentStatus?: boolean;
  rentStatus?: "Paid" | "Due";
  statusDate?: string; // This is used for "Due/Paid on [Date]"
  readonly?: boolean;
}

const editResidentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  primaryPhone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  rentAmount: z
    .string()
    .min(1, "Rent amount is required")
    .regex(/^[0-9]+$/, "Rent amount must be a valid number")
    .refine((v) => Number(v) > 0, "Rent amount is required")
    .refine((v) => Number(v) <= 200000, "Rent amount cannot exceed ₹2,00,000"),
  checkInDate: z.string().min(1, "Check-in date is required"),
});

export function ResidentCard({
  item,
  showRentStatus,
  rentStatus,
  statusDate,
  readonly = false,
}: ResidentCardProps) {
  const { token } = useAuth();
  const { selectedPropertyId } = useProperty();
  const [activeDialog, setActiveDialog] = useState<
    "none" | "checkout" | "markPaid"
  >("none");

  const [activeSheet, setActiveSheet] = useState<
    "details" | "edit" | "history"
  >("details");

  // State for form editing
  const [editRentAmount, setEditRentAmount] = useState(
    item.rentAmount.toString(),
  );
  const [editName, setEditName] = useState(item.name);
  const [editRoom, setEditRoom] = useState(item.room);
  const [editRoomId, setEditRoomId] = useState(""); // Track ID for updates
  const [editPrimaryPhone, setEditPrimaryPhone] = useState(item.primaryPhone);
  const [editCheckInDate, setEditCheckInDate] = useState(item.dateCheckedIn);
  const [editCheckOutDate, setEditCheckOutDate] = useState<string | undefined>(
    item.dateCheckedOut,
  );
  const [editProfileImage, setEditProfileImage] = useState(item.profileImage);
  const [editAdvanceMonths, setEditAdvanceMonths] = useState(
    item.advanceMonths?.toString() || "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Picker States
  const [isRoomSelectVisible, setRoomSelectVisible] = useState(false);

  // Helper to safely parse "DD/MM/YYYY" or return undefined
  const parseDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const [day, month, year] = dateStr.split("/").map(Number);
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
    return undefined;
  };

  // Helper to format Date to "DD/MM/YYYY"
  const formatDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Reset form state to original values
  const resetFormState = useCallback(() => {
    setEditName(item.name);
    setEditRoom(item.room);
    setEditRoomId("");
    setEditPrimaryPhone(item.primaryPhone);
    setEditCheckInDate(item.dateCheckedIn);
    setEditCheckOutDate(item.dateCheckedOut);
    setEditProfileImage(item.profileImage);
    setEditRentAmount(item.rentAmount.toString());
    setEditAdvanceMonths(item.advanceMonths?.toString() || "");
    setErrors({});
  }, [item]);

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
      setEditProfileImage(result.assets[0].uri);
    }
  };

  // Bottom Sheet Ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Snap points - REMOVED for dynamic sizing
  // const snapPoints = useMemo(() => ["CONTENT_HEIGHT"], []);

  const openSheet = useCallback(
    (type: "details" | "edit" | "history") => {
      setActiveSheet(type);
      // Reset form state when opening edit sheet
      if (type === "edit") {
        resetFormState();
      }
      bottomSheetModalRef.current?.present();
    },
    [resetFormState],
  );

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleConfirm = () => {
    console.log(`Confirmed action: ${activeDialog} for ${item.name}`);
    // Here you would typically call an API or update parent state
    // For rent payment, we could add a specific mutation here later
    if (activeDialog === "markPaid") {
      markPaidMutation.mutate({ residentId: item.id });
      setActiveDialog("none");
    } else if (activeDialog === "checkout") {
      checkoutResidentMutation.mutate({
        residentId: item.id,
      });
    }
  };

  const utils = trpc.useUtils();
  const { data: paymentHistory = [], isLoading: isPaymentHistoryLoading } =
    trpc.resident.getPaymentHistory.useQuery(
      { residentId: item.id, limit: 24 },
      {
        enabled: activeSheet === "history",
      },
    );

  const markPaidMutation = trpc.resident.markRentPaid.useMutation({
    onSuccess: () => {
      utils.resident.list.invalidate();
      utils.property.getDashboardStats.invalidate(); // Stats show rent due counts
      utils.resident.getPaymentHistory.invalidate({ residentId: item.id });
      Toast.show({ type: "success", text1: "Rent Marked as Paid" });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not mark rent as paid. Please try again.",
      });
    },
  });

  const updateResidentMutation = trpc.resident.update.useMutation({
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Resident updated successfully",
      });
      utils.resident.list.invalidate();
      utils.resident.getResidentsByRoom.invalidate();
      bottomSheetModalRef.current?.dismiss();
      // Form will be reset by the onChange handler when sheet dismisses
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not update resident. Please try again.",
      });
    },
  });

  const checkoutResidentMutation = trpc.resident.checkout.useMutation({
    onSuccess: () => {
      utils.resident.list.invalidate();
      utils.resident.getResidentsByRoom.invalidate();
      utils.property.getDashboardStats.invalidate();
      utils.property.getRooms.invalidate(); // Room becomes vacant
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Resident checked out successfully",
      });
      setActiveDialog("none");
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not check out resident. Please try again.",
      });
    },
  });

  const handleSave = () => {
    const saveResident = async () => {
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Session expired",
          text2: "Please login again.",
        });
        return;
      }

      let profileImageToSave = editProfileImage;
      const isLocalAsset =
        !!editProfileImage &&
        (editProfileImage.startsWith("file://") ||
          editProfileImage.startsWith("content://"));

      if (isLocalAsset) {
        if (!selectedPropertyId) {
          throw new Error("Property context is missing.");
        }

        const uploaded = await uploadImageToS3({
          token,
          propertyId: selectedPropertyId,
          fileUri: editProfileImage,
          fileName: `resident-${Date.now()}.jpg`,
          contentType: "image/jpeg",
          folder: "resident",
        });
        profileImageToSave = uploaded.fileUrl;
      }

      updateResidentMutation.mutate({
        id: item.id,
        name: editName,
        phoneNumber: editPrimaryPhone,
        rentAmount: parseInt(editRentAmount) || 0,
        checkInDate: editCheckInDate,
        checkOutDate: editCheckOutDate || null,
        roomId: editRoomId || undefined, // Only send if changed/selected
        profileImage: profileImageToSave,
        advanceMonths: parseInt(editAdvanceMonths) || undefined,
      });
    };

    // Validate
    try {
      editResidentSchema.parse({
        name: editName,
        primaryPhone: editPrimaryPhone,
        rentAmount: editRentAmount,
        checkInDate: editCheckInDate,
      });
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0].toString()] = e.message;
        });
        setErrors(newErrors);
        return; // Stop execution
      }
    }
    void saveResident().catch(() => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not upload resident photo. Please try again.",
      });
    });
  };

  return (
    <View style={styles.residentCard}>
      {/* Header Row: Name & Rent */}
      <View style={styles.headerRow}>
        <View style={styles.userInfoContainer}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.name}>{item.name}</Text>

            {/* Room Tags Row */}
            <View style={styles.tagsRow}>
              <View style={styles.roomTag}>
                <Text style={styles.roomTagText}>Room {item.room}</Text>
              </View>
              <View style={styles.roomTag}>
                <Text style={styles.roomTagText}>{item.roomType}</Text>
              </View>
              {item.isAc && (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: Spacing.s,
                    backgroundColor: "#e0f2fe",
                  }}
                >
                  <Text
                    style={{
                      fontSize: Typography.size.s,
                      fontFamily: Typography.font.medium,
                      color: "#0284c7",
                    }}
                  >
                    AC
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider}></View>

      {/* Footer Actions */}
      <View style={styles.footerRow}>
        {showRentStatus ? (
          <View style={styles.statusContainer}>
            <View style={styles.statusTextContainer}>
              <View style={styles.statusRow}>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: Typography.size.m,
                    fontFamily: Typography.font.regular,
                  }}
                >
                  {rentStatus === "Paid" ? "Paid on " : "Due on "}
                </Text>
                <Text
                  style={{
                    color:
                      rentStatus === "Paid" ? Colors.success : Colors.error,
                    fontFamily: Typography.font.medium,
                    fontSize: Typography.size.m,
                  }}
                >
                  {statusDate}
                </Text>
              </View>

              {rentStatus === "Paid" && (
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: Typography.size.m,
                    fontFamily: Typography.font.medium,
                  }}
                >
                  (Paid Offline)
                </Text>
              )}
              {rentStatus === "Due" && (
                <TouchableOpacity
                  style={styles.paidBtn}
                  onPress={() => setActiveDialog("markPaid")}
                >
                  <Text
                    style={{
                      color: Colors.success,
                      fontSize: Typography.size.m,
                      fontFamily: Typography.font.medium,
                    }}
                  >
                    Mark as Paid
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => openSheet("history")}
              style={styles.iconBtnOutline}
            >
              <History size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtnOutline}
              onPress={() => openSheet("details")}
            >
              <Info size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : readonly ? (
          <View style={styles.leftActions}>
            <TouchableOpacity
              style={styles.iconBtnOutline}
              onPress={() => openSheet("history")}
            >
              <History size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtnOutline}
              onPress={() => openSheet("details")}
            >
              <Info size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.leftActions}>
            <TouchableOpacity
              style={styles.iconBtnOutline}
              onPress={() => openSheet("edit")}
            >
              <Edit2 size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtnOutline}
              onPress={() => openSheet("history")}
            >
              <History size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtnOutline}
              onPress={() => openSheet("details")}
            >
              <Info size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtnOutlineCheckOut}
              onPress={() => setActiveDialog("checkout")}
            >
              <LogOut size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => handleCall(item.primaryPhone)}
        >
          <Phone size={20} color={Colors.white} />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* Dialogs */}
      <ConfirmationDialog
        visible={activeDialog === "checkout"}
        title="Check-Out Resident"
        description={`Are you sure you want to check out ${item.name}? This action cannot be undone.`}
        confirmLabel="Check-Out"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setActiveDialog("none")}
      />
      <ConfirmationDialog
        visible={activeDialog === "markPaid"}
        title="Mark Rent as Paid"
        description={`Are you sure you want to mark rent as paid for ${item.name}?`}
        confirmLabel="Mark Paid"
        variant="success"
        onConfirm={handleConfirm}
        onCancel={() => setActiveDialog("none")}
      />

      {/* Resident Details Bottom Sheet */}
      <AppBottomSheet
        ref={bottomSheetModalRef}
        onChange={(index) => {
          if (index === -1) {
            // Reset form state when sheet is dismissed
            resetFormState();
          }
        }}
        enableDynamicSizing={true}
      >
        <View>
          {activeSheet === "details" && (
            <ResidentDetailsSheet item={item} readonly={readonly} styles={styles} />
          )}

          {activeSheet === "edit" && (
            <ResidentEditSheet
              itemName={item.name}
              editProfileImage={editProfileImage}
              pickImage={pickImage}
              editName={editName}
              setEditName={setEditName}
              editRoom={editRoom}
              setRoomSelectVisible={setRoomSelectVisible}
              editPrimaryPhone={editPrimaryPhone}
              setEditPrimaryPhone={setEditPrimaryPhone}
              editRentAmount={editRentAmount}
              setEditRentAmount={setEditRentAmount}
              editAdvanceMonths={editAdvanceMonths}
              setEditAdvanceMonths={setEditAdvanceMonths}
              editCheckInDate={editCheckInDate}
              setEditCheckInDate={setEditCheckInDate}
              editCheckOutDate={editCheckOutDate}
              setEditCheckOutDate={setEditCheckOutDate}
              parseDate={parseDate}
              formatDate={formatDate}
              errors={errors}
              setErrors={setErrors}
              handleSave={handleSave}
              isSaving={updateResidentMutation.isPending}
              styles={styles}
            />
          )}

          {activeSheet === "history" && (
            <ResidentPaymentHistorySheet
              isLoading={isPaymentHistoryLoading}
              paymentHistory={paymentHistory}
              styles={styles}
            />
          )}
        </View>
      </AppBottomSheet>

      <SelectRoomModal
        visible={isRoomSelectVisible}
        onClose={() => setRoomSelectVisible(false)}
        onSelect={(room: any) => {
          setEditRoom(room.roomNumber);
          setEditRoomId(room.id);
        }}
        selectedRoomNo={editRoom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  residentCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.l,
    gap: Spacing.l,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    ...CardShadow,
    elevation: 1,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfoContainer: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
  },
  name: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
    marginBottom: Spacing.s, // Reduced margin
  },
  tagsRow: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  roomTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Spacing.s,
  },
  roomTagText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  rentAmount: {
    fontSize: Typography.size.l, // Larger
    fontFamily: Typography.font.bold,
    color: Colors.primary, // Orange
  },
  rentContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  rentLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
    textTransform: "uppercase",
  },
  contactBox: {
    backgroundColor: Colors.accent,
    borderRadius: Spacing.m,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.l,
    justifyContent: "center",
  },
  contactCol: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    fontFamily: Typography.font.regular,
  },
  contactValue: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  verticalDivider: {
    width: 1,
    height: "100%",
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.l,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.m,
  },
  statusTextContainer: {
    alignItems: "flex-start",
    gap: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statusLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
    marginBottom: 2,
  },
  statusValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statusValue: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
  },
  leftActions: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  paidBtn: {
    // padding: 6,
    // paddingHorizontal: 10,
    borderRadius: Spacing.m,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "#e1f4edff",
  },
  iconBtnOutline: {
    padding: 8,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBtnOutlineCheckOut: {
    padding: 8,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fdeaeaff",
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: 8,
    paddingHorizontal: Spacing.m,
    borderRadius: 16,
    gap: Spacing.s,
  },
  callBtnText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
  },
  sheetSection: {
    gap: Spacing.l,
    paddingBottom: Spacing.s,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.l,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  avatarText: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    color: Colors.primary,
  },
  sheetName: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  sheetTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Spacing.s,
    marginTop: 0,
  },
  sheetTagText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionHeader: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.textSecondary,
  },
  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.m,
  },
  sheetLabel: {
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
    marginBottom: 3,
  },
  sheetValue: {
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  sheetTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  selectorContainer: {
    marginBottom: Spacing.m,
  },
  selectorLabel: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.s,
  },
  selectorInput: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.m,
    paddingVertical: 12,
    borderRadius: Spacing.m,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectorValue: {
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formRow: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iosPicker: {
    height: 200,
  },
  inputLabel: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.accent,
    borderRadius: Spacing.m,
    padding: Spacing.m,
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
  },
  paymentInfo: {
    gap: 4,
  },
  paymentTitle: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  paymentDate: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  paymentAmountCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  paymentAmount: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.success,
  },
  paymentStatus: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  editAvatarContainer: {
    alignItems: "center",
    gap: Spacing.s,
  },
  editAvatar: {
    width: 80,
    height: 80,
    borderRadius: 50,
  },
  editAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: "#f0f7feff",
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarText: {
    fontSize: Typography.size["2xl"],
    fontFamily: Typography.font.bold,
    color: Colors.primary,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.text,
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  changePhotoText: {
    fontSize: Typography.size.s,
    color: Colors.primary,
    fontFamily: Typography.font.medium,
  },
});
