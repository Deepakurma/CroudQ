import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { ComplaintComposer } from "@/components/tenant/ComplaintComposer";
import {
  ComplaintList,
  TenantComplaintItem,
} from "@/components/tenant/ComplaintList";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/utils/api";
import { format } from "date-fns";
import Toast from "react-native-toast-message";

export default function TenantComplaintScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  const [complaintText, setComplaintText] = useState("");
  const [complaintToDeleteId, setComplaintToDeleteId] = useState<string | null>(
    null,
  );

  const utils = trpc.useUtils();
  const {
    data: complaintsData,
    isLoading,
    refetch,
  } = trpc.resident.getMyComplaints.useQuery(undefined, {
    staleTime: 10000,
  });

  const createComplaintMutation = trpc.resident.createMyComplaint.useMutation({
    onSuccess: async () => {
      setComplaintText("");
      await utils.resident.getMyComplaints.invalidate();
      await refetch();
    },
  });
  const deleteComplaintMutation = trpc.resident.deleteMyComplaint.useMutation({
    onSuccess: async () => {
      await utils.resident.getMyComplaints.invalidate();
      await refetch();
      setComplaintToDeleteId(null);
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Complaint deleted successfully",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Delete failed",
        text2: "Could not delete complaint right now.",
      });
    },
  });

  const handlePost = async () => {
    if (!complaintText.trim() || createComplaintMutation.isPending) return;

    createComplaintMutation.mutate({
      title: complaintText.trim(),
    });
  };

  const mappedComplaints: TenantComplaintItem[] =
    complaintsData?.map((c) => ({
      id: c.id,
      date: format(new Date(c.createdAt), "dd/MM/yyyy"),
      active: c.status !== "resolved",
      text: c.description
        ? `${c.title}\n${c.description}`
        : c.title,
    })) || [];

  const handleClear = () => {
    setComplaintText("");
  };

  const handleDelete = (id: string) => {
    setComplaintToDeleteId(id);
  };

  const handleCancelDelete = () => {
    if (!deleteComplaintMutation.isPending) {
      setComplaintToDeleteId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!complaintToDeleteId || deleteComplaintMutation.isPending) return;
    deleteComplaintMutation.mutate({ id: complaintToDeleteId });
  };

  return (
    <ScreenWrapper title="Complaints" scrollY={scrollY}>
      <View style={styles.container}>
        <ComplaintList
          data={mappedComplaints}
          scrollY={scrollY}
          headerHeight={headerHeight}
          ListHeaderComponent={
            <ComplaintComposer
              complaintText={complaintText}
              setComplaintText={setComplaintText}
              onSubmit={handlePost}
              onClear={handleClear}
            />
          }
          refreshing={isLoading || createComplaintMutation.isPending}
          onRefresh={refetch}
          isLoading={isLoading}
          onDeleteComplaint={handleDelete}
          deletingComplaintId={
            deleteComplaintMutation.isPending
              ? deleteComplaintMutation.variables?.id
              : undefined
          }
        />
        <ConfirmationDialog
          visible={!!complaintToDeleteId}
          title="Delete Complaint"
          description="Are you sure you want to delete this complaint?"
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
