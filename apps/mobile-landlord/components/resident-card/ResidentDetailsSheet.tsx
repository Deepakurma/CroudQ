import { formatIndianCurrency } from "@/utils/common";
import React from "react";
import { Image, Text, View } from "react-native";

type ResidentItem = {
  name: string;
  room: string;
  roomType: string;
  isAc: boolean;
  profileImage?: string;
  primaryPhone: string;
  rentAmount: string | number;
  dateCheckedIn: string;
  dateCheckedOut?: string;
  advanceMonths?: string | number;
  upcomingRentDate: string;
};

type Props = {
  item: ResidentItem;
  readonly: boolean;
  styles: any;
};

export function ResidentDetailsSheet({ item, readonly, styles }: Props) {
  return (
    <View style={styles.sheetSection}>
      <View style={styles.profileSection}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View>
          <Text style={styles.sheetName}>{item.name}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <View style={styles.sheetTag}>
              <Text style={styles.sheetTagText}>Room {item.room}</Text>
            </View>
            <View style={styles.sheetTag}>
              <Text style={styles.sheetTagText}>{item.roomType}</Text>
            </View>
            {item.isAc && (
              <View style={[styles.sheetTag, { backgroundColor: "#e0f2fe" }]}>
                <Text style={[styles.sheetTagText, { color: "#0284c7" }]}>AC</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>Resident Information</Text>
      <View style={styles.sheetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetLabel}>Primary Phone</Text>
          <Text style={styles.sheetValue}>{item.primaryPhone}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sheetLabel}>Rent Amount</Text>
          <Text style={styles.sheetValue}>{formatIndianCurrency(item.rentAmount)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>Stay Information</Text>
      <View style={styles.sheetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetLabel}>Check-In Date</Text>
          <Text style={styles.sheetValue}>{item.dateCheckedIn}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetLabel}>Check-Out Date</Text>
          <Text style={styles.sheetValue}>{item.dateCheckedOut || "-"}</Text>
        </View>
      </View>

      <View style={styles.sheetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetLabel}>Advance Paid</Text>
          <Text style={styles.sheetValue}>
            {item.advanceMonths
              ? `${item.advanceMonths} Month${Number(item.advanceMonths) > 1 ? "s" : ""}`
              : "-"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetLabel}>
            {readonly ? "Check-Out Date" : "Upcoming Rent Date"}
          </Text>
          <Text style={styles.sheetValue}>{item.upcomingRentDate}</Text>
        </View>
      </View>
    </View>
  );
}
