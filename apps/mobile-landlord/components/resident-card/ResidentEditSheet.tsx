import { AppTextInput } from "@/components/ui/AppTextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Colors } from "@/constants/Colors";
import { formatIndianCurrency } from "@/utils/common";
import { Camera, X } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  itemName: string;
  editProfileImage?: string;
  pickImage: () => void;
  removeImage: () => void;
  editName: string;
  setEditName: (value: string) => void;
  editRoom: string;
  setRoomSelectVisible: (visible: boolean) => void;
  editPrimaryPhone: string;
  setEditPrimaryPhone: (value: string) => void;
  editRentAmount: string;
  setEditRentAmount: (value: string) => void;
  editAdvanceMonths: string;
  setEditAdvanceMonths: (value: string) => void;
  editCheckInDate: string;
  setEditCheckInDate: (value: string) => void;
  editCheckOutDate?: string;
  setEditCheckOutDate: (value: string | undefined) => void;
  parseDate: (value?: string) => Date | undefined;
  formatDate: (value: Date) => string;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleSave: () => void;
  isSaving: boolean;
  styles: any;
};

export function ResidentEditSheet({
  itemName,
  editProfileImage,
  pickImage,
  removeImage,
  editName,
  setEditName,
  editRoom,
  setRoomSelectVisible,
  editPrimaryPhone,
  setEditPrimaryPhone,
  editRentAmount,
  setEditRentAmount,
  editAdvanceMonths,
  setEditAdvanceMonths,
  editCheckInDate,
  setEditCheckInDate,
  editCheckOutDate,
  setEditCheckOutDate,
  parseDate,
  formatDate,
  errors,
  setErrors,
  handleSave,
  isSaving,
  styles,
}: Props) {
  const hasProfileImage = !!editProfileImage;

  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetTitle}>Edit Resident</Text>

      <View style={styles.editAvatarContainer}>
        <View>
          {editProfileImage ? (
            <Image source={{ uri: editProfileImage }} style={styles.editAvatar} />
          ) : (
            <View style={styles.editAvatarPlaceholder}>
              <Text style={styles.editAvatarText}>{itemName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={hasProfileImage ? removeImage : pickImage}
          >
            {hasProfileImage ? (
              <X size={16} color={Colors.white} />
            ) : (
              <Camera size={16} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={pickImage}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <AppTextInput
        label="Full Name"
        bottomSheet
        value={editName}
        onChangeText={(t) => {
          setEditName(t);
          if (errors.name) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next.name;
              return next;
            });
          }
        }}
        placeholder="Enter name"
        error={errors.name}
      />

      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Room No</Text>
        <TouchableOpacity
          style={styles.selectorInput}
          onPress={() => setRoomSelectVisible(true)}
        >
          <Text style={[styles.selectorValue, !editRoom && { color: Colors.textSecondary }]}>
            {editRoom || "Select Room"}
          </Text>
        </TouchableOpacity>
      </View>

      <AppTextInput
        label="Primary Contact"
        bottomSheet
        value={editPrimaryPhone}
        onChangeText={(t) => {
          setEditPrimaryPhone(t);
          if (errors.primaryPhone) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next.primaryPhone;
              return next;
            });
          }
        }}
        placeholder="Phone"
        keyboardType="phone-pad"
        error={errors.primaryPhone}
      />

      <View style={styles.formRow}>
        <View style={{ flex: 1 }}>
          <AppTextInput
            label="Rent Amount"
            bottomSheet
            value={editRentAmount ? formatIndianCurrency(editRentAmount) : ""}
            onChangeText={(t) => {
              const val = t.replace(/[^0-9]/g, "");
              setEditRentAmount(val);
              if (errors.rentAmount && val) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.rentAmount;
                  return next;
                });
              }
            }}
            placeholder="Amount"
            keyboardType="numeric"
            error={errors.rentAmount}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppTextInput
            label="Advance Months"
            bottomSheet
            value={editAdvanceMonths}
            onChangeText={setEditAdvanceMonths}
            placeholder="Months"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={{ flex: 1 }}>
          <DatePicker
            label="Check-In Date"
            value={parseDate(editCheckInDate)}
            onChange={(date) => setEditCheckInDate(formatDate(date))}
            error={errors.checkInDate}
            bottomSheet
          />
        </View>
        <View style={{ flex: 1 }}>
          <DatePicker
            label="Check-Out Date"
            value={parseDate(editCheckOutDate)}
            onChange={(date) => setEditCheckOutDate(formatDate(date))}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
        <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
      </TouchableOpacity>
    </View>
  );
}
