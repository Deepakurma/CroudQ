import { ScreenWrapper } from "@/components/ScreenWrapper";
import { CreateNoticeCard } from "@/components/notices/CreateNoticeCard";
import { NoticesList } from "@/components/notices/NoticesList";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/utils/api";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import Toast from "react-native-toast-message";
import { useProperty } from "@/context/PropertyContext";

const DURATIONS = ["1 Day", "2 Days", "3 Days", "1 Week"];

export default function NoticesScreen() {
  const { selectedPropertyId } = useProperty();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  const [noticeText, setNoticeText] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("1 Day");
  const [noticeToDeleteId, setNoticeToDeleteId] = useState<string | null>(null);

  const { data: notices, isLoading, refetch } = trpc.notice.list.useQuery(
    {
      scopePropertyId: selectedPropertyId || undefined,
    },
    {
      enabled: !!selectedPropertyId,
    },
  );
  const utils = trpc.useUtils();
  const createMutation = trpc.notice.create.useMutation({
    onSuccess: () => {
      utils.notice.list.invalidate();
      setNoticeText("");
      setSelectedDuration("1 Day");
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Notice posted successfully",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to post notice. Please try again.",
      });
    },
  });
  const deleteMutation = trpc.notice.delete.useMutation({
    onSuccess: () => {
      utils.notice.list.invalidate();
      setNoticeToDeleteId(null);
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Notice deleted successfully",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete notice. Please try again.",
      });
    },
  });

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePost = () => {
    if (!noticeText.trim()) return;

    let validUntil = new Date();
    switch (selectedDuration) {
      case "1 Day":
        validUntil.setDate(validUntil.getDate() + 1);
        break;
      case "2 Days":
        validUntil.setDate(validUntil.getDate() + 2);
        break;
      case "3 Days":
        validUntil.setDate(validUntil.getDate() + 3);
        break;
      case "1 Week":
        validUntil.setDate(validUntil.getDate() + 7);
        break;
      default:
        validUntil.setDate(validUntil.getDate() + 1);
    }

    createMutation.mutate({
      title: "Notice", // Default title for now
      description: noticeText,
      validFrom: new Date().toISOString(),
      validUntil: validUntil.toISOString(),
    });
  };

  const handleCancel = () => {
    setNoticeText("");
    setSelectedDuration("1 Day");
  };

  const handleDelete = (id: string) => {
    setNoticeToDeleteId(id);
  };

  const handleCancelDelete = () => {
    if (!deleteMutation.isPending) {
      setNoticeToDeleteId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!noticeToDeleteId || deleteMutation.isPending) return;
    deleteMutation.mutate({ id: noticeToDeleteId });
  };

  const mappedNotices = (notices || []).map((n) => {
    let duration = "Indefinite";
    if (n.validUntil && n.validFrom) {
      const days = differenceInCalendarDays(
        startOfDay(new Date(n.validUntil)),
        startOfDay(new Date(n.validFrom)),
      );
      duration = `${days} Day${days !== 1 ? "s" : ""}`;
    }

    return {
      id: n.id,
      text: n.description,
      date: format(new Date(n.createdAt), "dd/MM/yyyy"),
      duration: duration,
      active: n.isActive,
    };
  });

  return (
    <ScreenWrapper title="Notices" scrollY={scrollY}>
      <View style={styles.container}>
        <NoticesList
          data={mappedNotices}
          deletingNoticeId={
            deleteMutation.isPending ? deleteMutation.variables?.id : undefined
          }
          onDeleteNotice={handleDelete}
          scrollY={scrollY}
          headerHeight={headerHeight}
          ListHeaderComponent={
            <CreateNoticeCard
              noticeText={noticeText}
              setNoticeText={setNoticeText}
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              onPost={handlePost}
              onCancel={handleCancel}
              durations={DURATIONS}
            />
          }
          refreshing={isLoading}
          onRefresh={onRefresh}
          isLoading={isLoading}
        />
        <ConfirmationDialog
          visible={!!noticeToDeleteId}
          title="Delete Notice"
          description="Are you sure you want to delete this notice?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
