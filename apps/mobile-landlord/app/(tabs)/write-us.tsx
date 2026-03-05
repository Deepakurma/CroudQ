import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/EmptyState";
import { NoticeSkeletonCard } from "@/components/skeletons/NoticeSkeletonCard";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { trpc } from "@/utils/api";
import { validateSchema } from "@/utils/validation";
import { format } from "date-fns";
import {
  AlertCircle,
  MailCheck,
  MailX,
  Send,
  Trash2,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { z } from "zod";

const writeUsSchema = z.object({
  query: z
    .string()
    .trim()
    .min(10, "Please enter at least 10 characters")
    .max(2000, "Query is too long"),
});

export default function WriteUsScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [queryToDeleteId, setQueryToDeleteId] = useState<string | null>(null);
  const {
    data: myQueries,
    isLoading,
    refetch,
  } = trpc.admin.listMyLandlordQueries.useQuery();
  const utils = trpc.useUtils();

  const submitMutation = trpc.admin.submitLandlordQuery.useMutation({
    onSuccess: () => {
      setQuery("");
      setError("");
      utils.admin.listMyLandlordQueries.invalidate();
      Toast.show({
        type: "success",
        text1: "Query submitted",
        text2: "Our team will review and get back to you.",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Submission failed",
        text2: "Could not submit your query right now.",
      });
    },
  });
  const deleteMutation = trpc.admin.deleteMyLandlordQuery.useMutation({
    onSuccess: () => {
      utils.admin.listMyLandlordQueries.invalidate();
      setQueryToDeleteId(null);
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Query deleted successfully",
      });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Delete failed",
        text2: "Could not delete query right now.",
      });
    },
  });

  const handleSubmit = () => {
    const result = validateSchema(writeUsSchema, { query });
    if (!result.success) {
      setError(result.errors?.query || "Please enter a valid query.");
      return;
    }
    setError("");

    submitMutation.mutate({
      query: query.trim(),
    });
  };

  const handleDelete = (id: string) => {
    setQueryToDeleteId(id);
  };

  const handleCancelDelete = () => {
    if (!deleteMutation.isPending) {
      setQueryToDeleteId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!queryToDeleteId || deleteMutation.isPending) return;
    deleteMutation.mutate({ id: queryToDeleteId });
  };

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const renderHeader = (
    <View style={styles.createCard}>
      <Text style={styles.cardTitle}>Write Your Query</Text>
      <View>
        <TextInput
          style={[styles.textInput, error ? styles.inputError : null]}
          placeholder="Describe your issue or request..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          textAlignVertical="top"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (error) setError("");
          }}
        />
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={14} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            setQuery("");
            setError("");
          }}
          disabled={submitMutation.isPending}
        >
          <Text style={styles.cancelBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Send size={18} color={Colors.white} />
              <Text style={styles.postBtnText}>Submit Query</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper title="Write Us" scrollY={scrollY}>
      {isLoading ? (
        <Animated.ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerHeight, paddingHorizontal: Spacing.l },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
        >
          {renderHeader}
          {[1, 2, 3].map((i) => (
            <NoticeSkeletonCard key={i} />
          ))}
        </Animated.ScrollView>
      ) : (
        <Animated.FlatList
          data={myQueries || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerHeight, paddingHorizontal: Spacing.l },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          refreshing={isLoading}
          onRefresh={onRefresh}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.noticeCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <MailCheck size={20} color={Colors.primary} />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.noticeDate}>
                    {format(new Date(item.createdAt), "dd/MM/yyyy")}
                  </Text>
                  <Text style={styles.metaText}>Submitted Query</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending &&
                  deleteMutation.variables?.id === item.id ? (
                    <ActivityIndicator size="small" color={Colors.error} />
                  ) : (
                    <Trash2 size={16} color={Colors.error} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.noticeContent}>{item.query}</Text>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={MailX}
              title="No Queries Yet"
              description="Your submitted queries will appear here."
            />
          }
        />
      )}
      <ConfirmationDialog
        visible={!!queryToDeleteId}
        title="Delete Query"
        description="Are you sure you want to delete this query?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
    gap: Spacing.l,
  },
  createCard: {
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
    elevation: 1,
  },
  cardTitle: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  textInput: {
    minHeight: 60,
    fontSize: Typography.size.l,
    fontFamily: Typography.font.regular,
    color: Colors.text,
    textAlignVertical: "top",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputError: {
    borderBottomWidth: 1,
    borderColor: Colors.error,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.error,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.s,
  },
  cancelBtn: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: 20,
    minWidth: 134,
    justifyContent: "center",
  },
  postBtnText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.white,
  },
  noticeCard: {
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
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  noticeDate: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  metaText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  deleteButton: {
    marginLeft: Spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
  },
  noticeContent: {
    color: Colors.textSecondary,
    fontSize: Typography.size.l,
    marginLeft: 2,
    fontFamily: Typography.font.regular,
    lineHeight: 22,
  },
});
