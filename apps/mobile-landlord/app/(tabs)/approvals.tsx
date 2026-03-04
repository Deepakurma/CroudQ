import { ApprovalCard } from "@/components/ApprovalCard";
import { EmptyState } from "@/components/EmptyState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { SelectRoomModal } from "@/components/SelectRoomModal";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { trpc } from "@/utils/api";
import { calculateRentTrackingStartDate } from "@/utils/rentTracking";
import {
  addMonths,
  differenceInCalendarMonths,
  format,
} from "date-fns";
import { UserRoundCheck } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useProperty } from "@/context/PropertyContext";

type DraftValue = {
  roomId: string;
  roomNumber: string;
  roomType: string;
  isAc: boolean;
  rentAmount: string;
  checkInDate: string;
  advanceMonths: string;
  durationMonths: string;
};

const formatDdMmYyyy = (value: string | null) =>
  value ? format(new Date(value), "dd/MM/yyyy") : "";

const parseDdMmYyyy = (value: string) => {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return new Date();
  return new Date(year, month - 1, day);
};

export default function ApprovalsScreen() {
  const { selectedPropertyId } = useProperty();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const utils = trpc.useUtils();

  const [drafts, setDrafts] = useState<Record<string, DraftValue>>({});
  const [rentErrors, setRentErrors] = useState<Record<string, string>>({});
  const [roomPickerRequestId, setRoomPickerRequestId] = useState<string | null>(
    null,
  );

  const {
    data: approvals,
    isLoading,
    isFetching,
    refetch,
  } = trpc.resident.listPendingApprovals.useQuery(
    {
      scopePropertyId: selectedPropertyId || undefined,
    },
    {
      enabled: !!selectedPropertyId,
    },
  );

  const approveMutation = trpc.resident.approveRequest.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.resident.listPendingApprovals.invalidate(),
        utils.resident.list.invalidate(),
        utils.resident.getResidentsByRoom.invalidate(),
        utils.property.getDashboardStats.invalidate(),
        utils.property.getRooms.invalidate(),
      ]);
      Toast.show({
        type: "success",
        text1: "Approved",
        text2: "Resident has been approved and added.",
      });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not approve request. Please try again.",
      });
    },
  });

  const rejectMutation = trpc.resident.rejectRequest.useMutation({
    onSuccess: async () => {
      await utils.resident.listPendingApprovals.invalidate();
      Toast.show({
        type: "success",
        text1: "Rejected",
        text2: "Request has been rejected.",
      });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not reject request. Please try again.",
      });
    },
  });

  const getDraft = useCallback(
    (request: NonNullable<typeof approvals>[number]): DraftValue => {
      if (drafts[request.id]) {
        return drafts[request.id];
      }

      return {
        roomId: request.room?.id || "",
        roomNumber: request.room?.roomNumber || "N/A",
        roomType: request.room?.roomType || "N/A",
        isAc: request.room?.isAc || false,
        rentAmount: request.rentAmount ? String(request.rentAmount) : "",
        checkInDate: formatDdMmYyyy(request.checkInDate),
        advanceMonths: String(request.advanceMonths || 0),
        durationMonths: request.durationMonths ? String(request.durationMonths) : "",
      };
    },
    [drafts],
  );

  const updateDraft = (
    requestId: string,
    patch: Partial<DraftValue>,
    request: NonNullable<typeof approvals>[number],
  ) => {
    const current = getDraft(request);
    if (patch.rentAmount !== undefined) {
      setRentErrors((prev) => {
        if (!prev[requestId]) return prev;
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    }
    setDrafts((prev) => ({
      ...prev,
      [requestId]: {
        ...current,
        ...patch,
      },
    }));
  };

  const handleApprove = (request: NonNullable<typeof approvals>[number]) => {
    const draft = getDraft(request);

    const rentAmount = Number(draft.rentAmount || 0);
    if (!rentAmount || rentAmount <= 0) {
      setRentErrors((prev) => ({
        ...prev,
        [request.id]: "Enter a valid rent amount before approval.",
      }));
      return;
    }
    setRentErrors((prev) => {
      if (!prev[request.id]) return prev;
      const next = { ...prev };
      delete next[request.id];
      return next;
    });

    approveMutation.mutate({
      requestId: request.id,
      roomId: draft.roomId || undefined,
      rentAmount,
      checkInDate: draft.checkInDate || undefined,
      advanceMonths: Number(draft.advanceMonths || 0),
      durationMonths: Number(draft.durationMonths || 0),
    });
  };

  const activeRoomSelected = useMemo(() => {
    if (!roomPickerRequestId || !approvals) return undefined;
    const request = approvals.find((r) => r.id === roomPickerRequestId);
    if (!request) return undefined;
    return getDraft(request).roomNumber;
  }, [approvals, roomPickerRequestId, getDraft]);

  return (
    <ScreenWrapper title="Approvals" scrollY={scrollY}>
      <View style={styles.container}>
        <Animated.FlatList
          data={approvals || []}
          keyExtractor={(item) => item.id}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerHeight, paddingHorizontal: Spacing.l },
          ]}
          ListHeaderComponent={
            <Text style={styles.subtitle}>Review and finalize details before approving</Text>
          }
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon={UserRoundCheck}
                title="No Pending Approvals"
                description="Requests submitted through QR onboarding will appear here."
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          renderItem={({ item }) => {
            const draft = getDraft(item);
            const checkInDate = draft.checkInDate
              ? parseDdMmYyyy(draft.checkInDate)
              : new Date();
            const durationMonths = Number(draft.durationMonths || 0);
            const checkOutDate =
              durationMonths > 0 ? addMonths(checkInDate, durationMonths) : checkInDate;

            return (
              <ApprovalCard
                item={{
                  id: item.id,
                  name: item.name,
                  primaryPhone: item.phoneNumber,
                  room: draft.roomNumber,
                  roomType: draft.roomType,
                  isAc: draft.isAc,
                  checkInDate: draft.checkInDate,
                  durationInMonths: draft.durationMonths,
                  checkOutDate: item.checkOutDate
                    ? format(new Date(item.checkOutDate), "dd/MM/yyyy")
                    : "N/A",
                  rentAmount: draft.rentAmount || 0,
                  isAdvancePaid: Number(draft.advanceMonths) > 0,
                  advanceMonths: draft.advanceMonths,
                  rentTrackingDate: calculateRentTrackingStartDate(
                    draft.checkInDate,
                    draft.advanceMonths,
                  ),
                  profileImage: item.profileImage || undefined,
                }}
                rentInput={draft.rentAmount}
                advanceMonthsInput={draft.advanceMonths}
                durationMonthsInput={draft.durationMonths}
                checkInDateValue={checkInDate}
                checkOutDateValue={checkOutDate}
                rentTrackingStartsFrom={calculateRentTrackingStartDate(
                  draft.checkInDate,
                  draft.advanceMonths,
                )}
                rentError={rentErrors[item.id]}
                onChangeRent={(value) =>
                  updateDraft(item.id, { rentAmount: value }, item)
                }
                onChangeAdvanceMonths={(value) =>
                  updateDraft(item.id, { advanceMonths: value }, item)
                }
                onChangeDurationMonths={(value) =>
                  updateDraft(item.id, { durationMonths: value }, item)
                }
                onChangeCheckInDate={(value) =>
                  updateDraft(item.id, { checkInDate: format(value, "dd/MM/yyyy") }, item)
                }
                onChangeCheckOutDate={(value) => {
                  const months = Math.max(
                    0,
                    differenceInCalendarMonths(value, checkInDate),
                  );
                  updateDraft(
                    item.id,
                    { durationMonths: months > 0 ? String(months) : "" },
                    item,
                  );
                }}
                onChangeRoom={() => setRoomPickerRequestId(item.id)}
                onApprove={() => handleApprove(item)}
                onReject={() => rejectMutation.mutate({ requestId: item.id })}
              />
            );
          }}
        />

        <SelectRoomModal
          visible={!!roomPickerRequestId}
          onClose={() => setRoomPickerRequestId(null)}
          onSelect={(room) => {
            if (!roomPickerRequestId || !approvals) return;
            const request = approvals.find((r) => r.id === roomPickerRequestId);
            if (!request) return;
            updateDraft(
              roomPickerRequestId,
              {
                roomId: room.id,
                roomNumber: room.roomNumber,
                roomType: room.type,
                isAc: room.isAc,
                rentAmount: room.price || "",
              },
              request,
            );
            setRoomPickerRequestId(null);
          }}
          selectedRoomNo={activeRoomSelected}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
    gap: Spacing.l,
  },
  subtitle: {
    fontFamily: Typography.font.regular,
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
  },
});
