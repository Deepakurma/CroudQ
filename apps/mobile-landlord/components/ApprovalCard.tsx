import { AppTextInput } from "@/components/ui/AppTextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { formatIndianCurrency } from "@/utils/common";
import { Check, Pencil, X } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CardShadow } from "@/constants/Shadows";

interface ApprovalItem {
  id: string;
  name: string;
  primaryPhone: string;
  room: string;
  roomType: string;
  isAc: boolean;
  checkInDate: string;
  durationInMonths: string;
  checkOutDate: string;
  rentAmount: string | number;
  isAdvancePaid: boolean;
  advanceMonths?: string;
  rentTrackingDate?: string;
  profileImage?: string;
}

interface ApprovalCardProps {
  item: ApprovalItem;
  rentInput: string;
  advanceMonthsInput: string;
  durationMonthsInput: string;
  checkInDateValue: Date;
  checkOutDateValue: Date;
  rentTrackingStartsFrom: string;
  rentError?: string;
  onChangeRent: (value: string) => void;
  onChangeAdvanceMonths: (value: string) => void;
  onChangeDurationMonths: (value: string) => void;
  onChangeCheckInDate: (value: Date) => void;
  onChangeCheckOutDate: (value: Date) => void;
  onChangeRoom: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ApprovalCard({
  item,
  rentInput,
  advanceMonthsInput,
  durationMonthsInput,
  checkInDateValue,
  checkOutDateValue,
  rentTrackingStartsFrom,
  rentError,
  onChangeRent,
  onChangeAdvanceMonths,
  onChangeDurationMonths,
  onChangeCheckInDate,
  onChangeCheckOutDate,
  onChangeRoom,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  return (
    <View style={styles.card}>
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
          <View style={styles.userMeta}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.tagsRow}>
              <TouchableOpacity
                style={[styles.roomTag, styles.roomTagButton]}
                onPress={onChangeRoom}
              >
                <Text style={styles.roomTagText}>Room {item.room}</Text>
                <Pencil size={12} color={Colors.primary} />
              </TouchableOpacity>
              <View style={styles.roomTag}>
                <Text style={styles.roomTagText}>{item.roomType}</Text>
              </View>
              {item.isAc ? (
                <View style={[styles.acTag, styles.acTagActive]}>
                  <Text style={[styles.acTagText, styles.acTagTextActive]}>
                    AC
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppTextInput
              label="Phone Number"
              value={item.primaryPhone}
              editable={false}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppTextInput
              label="Duration (Months)"
              placeholder="0"
              keyboardType="numeric"
              value={durationMonthsInput}
              onChangeText={(t) =>
                onChangeDurationMonths(t.replace(/[^0-9]/g, ""))
              }
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <DatePicker
              label="Check-In Date"
              value={checkInDateValue}
              onChange={onChangeCheckInDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DatePicker
              label="Check-Out Date"
              value={checkOutDateValue}
              onChange={onChangeCheckOutDate}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppTextInput
              label="Rent Amount"
              placeholder="₹ Amount"
              keyboardType="numeric"
              value={rentInput ? formatIndianCurrency(rentInput) : ""}
              onChangeText={(t) => onChangeRent(t.replace(/[^0-9]/g, ""))}
            />
            {rentError ? <Text style={styles.errorText}>{rentError}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <AppTextInput
              label="Advance Paid (Months)"
              placeholder="0"
              keyboardType="numeric"
              value={advanceMonthsInput}
              onChangeText={(t) =>
                onChangeAdvanceMonths(t.replace(/[^0-9]/g, ""))
              }
            />
          </View>
        </View>

        <View style={styles.infoBoxRow}>
          <Text style={styles.infoBoxLabel}>Rent Tracking Starts From</Text>
          <Text style={styles.infoBoxText}>{rentTrackingStartsFrom}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={onReject}
        >
          <X size={20} color={Colors.error} />
          <Text style={[styles.actionBtnText, styles.rejectBtnText]}>
            Reject
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={onApprove}
        >
          <Check size={20} color={Colors.success} />
          <Text style={[styles.actionBtnText, styles.approveBtnText]}>
            Approve
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.l,
    gap: Spacing.m,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  userInfoContainer: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
    flex: 1,
  },
  userMeta: {
    flex: 1,
    gap: Spacing.xs,
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
  name: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  mobileText: {
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
    fontSize: Typography.size.s,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  roomTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Spacing.s,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomTagButton: {
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  roomTagText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  acTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Spacing.s,
  },
  acTagActive: {
    backgroundColor: "#e0f2fe",
  },
  acTagInactive: {
    backgroundColor: "#f1f1f1ff",
  },
  acTagText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  acTagTextActive: {
    color: "#0284c7",
  },
  acTagTextInactive: {
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  infoBoxRow: {
    backgroundColor: "#f0f9ff",
    borderColor: "#e0f2fe",
    borderWidth: 1,
    borderRadius: Spacing.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.m,
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
  footerRow: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    gap: Spacing.s,
  },
  rejectBtn: {
    backgroundColor: "#fdeaeaff",
  },
  rejectBtnText: {
    color: Colors.error,
  },
  approveBtn: {
    backgroundColor: "#e1f4edff",
  },
  approveBtnText: {
    color: Colors.success,
  },
  actionBtnText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
  },
  errorText: {
    marginTop: 6,
    color: Colors.error,
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.medium,
  },
});
