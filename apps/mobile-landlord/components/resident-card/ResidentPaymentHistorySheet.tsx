import { EmptyState } from "@/components/EmptyState";
import { PaymentSkeletonCard } from "@/components/skeletons/PaymentsSkeleton";
import { Spacing } from "@/constants/Spacing";
import { formatIndianCurrency } from "@/utils/common";
import { format } from "date-fns";
import React from "react";
import { Text, View } from "react-native";

type PaymentHistoryItem = {
  id: string;
  amount: number;
  paidAt: string;
};

type Props = {
  isLoading: boolean;
  paymentHistory: PaymentHistoryItem[];
  styles: any;
};

export function ResidentPaymentHistorySheet({
  isLoading,
  paymentHistory,
  styles,
}: Props) {
  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetTitle}>Payment History</Text>
      <View>
        {isLoading ? (
          <View style={{ gap: Spacing.m }}>
            {[1, 2].map((i) => (
              <PaymentSkeletonCard key={i} />
            ))}
          </View>
        ) : paymentHistory.length === 0 ? (
          <EmptyState description="No payments made yet" />
        ) : (
          paymentHistory.map((history, index) => (
            <View
              key={history.id}
              style={[
                styles.paymentRow,
                index === paymentHistory.length - 1 && {
                  borderBottomWidth: 0,
                },
              ]}
            >
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Rent Payment</Text>
                <Text style={styles.paymentDate}>
                  {format(new Date(history.paidAt), "dd MMM, yyyy")} •{" "}
                  {format(new Date(history.paidAt), "hh:mm a")}
                </Text>
              </View>
              <View style={styles.paymentAmountCol}>
                <Text style={styles.paymentStatus}>Amount Paid</Text>
                <Text style={styles.paymentAmount}>
                  {formatIndianCurrency(history.amount)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

