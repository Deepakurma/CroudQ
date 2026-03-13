import { BedsAvailability } from "@/components/dashboard/BedsAvailability";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RentDue } from "@/components/dashboard/RentDue";
import { EmptyState } from "@/components/EmptyState";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useRentsFilter, useRoomsFilter } from "@/context/FilterContext";
import { trpc } from "@/utils/api";
import { useRouter } from "expo-router";
import { Building2 } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProperty } from "@/context/PropertyContext";
import { RecentNotice } from "@/components/dashboard/RecentNotice";
import { CardShadow } from "@/constants/Shadows";
// ... imports

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setStatus: setRoomsStatus } = useRoomsFilter();
  const { setStatus: setRentsStatus } = useRentsFilter();
  const {
    selectedPropertyId,
    setSelectedPropertyId,
    reconcileSelectedPropertyId,
    isLoading: isPropertyLoading,
  } = useProperty();

  // Fetch Properties
  const { data: properties, isLoading: isPropertiesLoading } =
    trpc.property.getAllProperties.useQuery();
  const hasProperties = (properties?.length ?? 0) > 0;
  const shouldShowGetStarted =
    !isPropertyLoading && !isPropertiesLoading && !hasProperties;
  const propertyIds = React.useMemo(
    () => properties?.map((property) => property.id) || [],
    [properties],
  );
  const isSelectedPropertyValid = Boolean(
    selectedPropertyId && propertyIds.includes(selectedPropertyId),
  );
  const activeProperty =
    properties?.find((property) => property.id === selectedPropertyId) ||
    properties?.[0];
  const cancelDeletionMutation = trpc.property.cancelPropertyDeletion.useMutation();
  const isFrozen = Boolean(activeProperty?.isFrozen);
  const canRunPropertyQueries = isSelectedPropertyValid && !isFrozen;
  const scheduledDeletionDate = React.useMemo(() => {
    const value = activeProperty?.deletionScheduledFor;
    if (!value) return null;
    const parsed =
      typeof value === "string" ? new Date(value) : new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [activeProperty?.deletionScheduledFor]);
  const scheduledDeletionLabel = React.useMemo(() => {
    if (!scheduledDeletionDate) return null;
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(scheduledDeletionDate);
  }, [scheduledDeletionDate]);

  // Enable hide-on-scroll for dashboard (only when properties exist)
  // useScrollToHideTabs(scrollY); // Removed for persistent tab bar

  // Get tRPC utils for query invalidation
  const utils = trpc.useUtils();

  // Auto-heal stale property id and set default selected property.
  React.useEffect(() => {
    if (isPropertyLoading || !properties || properties.length === 0) return;

    reconcileSelectedPropertyId(propertyIds);

    if (!isSelectedPropertyValid) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [
    propertyIds,
    properties,
    isSelectedPropertyValid,
    isPropertyLoading,
    reconcileSelectedPropertyId,
    setSelectedPropertyId,
  ]);

  // Fetch Dashboard Stats
  const { data: stats, isFetching } = trpc.property.getDashboardStats.useQuery(
    undefined,
    {
      enabled: canRunPropertyQueries,
    },
  );
  const {
    data: notices,
    isLoading: isNoticesLoading,
    isFetching: isNoticesFetching,
  } = trpc.notice.list.useQuery(
    {
      scopePropertyId: selectedPropertyId || undefined,
    },
    {
      enabled: canRunPropertyQueries,
    },
  );
  const { data: unresolvedComplaints } = trpc.complaint.list.useQuery(
    {
      status: "pending",
      scopePropertyId: selectedPropertyId || undefined,
    },
    {
      enabled: canRunPropertyQueries,
    },
  );

  const latestActiveNotice = React.useMemo(() => {
    const activeNotice = (notices ?? []).find((notice) => notice.isActive);
    if (!activeNotice) return null;

    return {
      id: activeNotice.id,
      text: activeNotice.description,
      createdAt: activeNotice.createdAt,
    };
  }, [notices]);

  // Property switch handler that prevents cache pollution
  const handlePropertySwitch = async (propertyId: string) => {
    // STEP 1: Cancel only property-dependent in-flight queries
    await Promise.all([
      utils.property.getDashboardStats.cancel(),
      utils.property.getRooms.cancel(),
      utils.property.getRoomTypes.cancel(),
      utils.property.getPropertyDetails.cancel(),
      utils.resident.list.cancel(),
      utils.resident.listCheckouts.cancel(),
      utils.resident.getResidentsByRoom.cancel(),
      utils.notice.list.cancel(),
      utils.complaint.list.cancel(),
    ]);

    // STEP 2: Update property ID (ref updated immediately)
    setSelectedPropertyId(propertyId);

    // STEP 3: Invalidate only property-dependent queries to refetch with new property ID
    await Promise.all([
      utils.property.getDashboardStats.invalidate(),
      utils.property.getRooms.invalidate(),
      utils.property.getRoomTypes.invalidate(),
      utils.property.getPropertyDetails.invalidate(),
      utils.resident.list.invalidate(),
      utils.resident.listCheckouts.invalidate(),
      utils.resident.getResidentsByRoom.invalidate(),
      utils.notice.list.invalidate(),
      utils.complaint.list.invalidate(),
    ]);
  };

  // Interpolations
  const headerHeight = insets.top + 70;

  const handleOpenDueRents = React.useCallback(() => {
    setRentsStatus("due");
    router.push("/rents" as any);
  }, [router, setRentsStatus]);

  const handleOpenAvailableRooms = React.useCallback(() => {
    setRoomsStatus("available");
    router.push("/rooms" as any);
  }, [router, setRoomsStatus]);

  const handleOpenOccupiedRooms = React.useCallback(() => {
    setRoomsStatus("occupied");
    router.push("/rooms" as any);
  }, [router, setRoomsStatus]);

  const handleCancelPropertyDeletion = React.useCallback(async () => {
    try {
      await cancelDeletionMutation.mutateAsync();
      Toast.show({
        type: "success",
        text1: "Deletion cancelled",
        text2: "Your property will remain active.",
      });
      await Promise.all([
        utils.property.getAllProperties.invalidate(),
        utils.property.getPropertyDetails.invalidate(),
        utils.property.getDashboardStats.invalidate(),
      ]);
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: "Could not cancel deletion right now.",
      });
    }
  }, [cancelDeletionMutation, utils]);

  const hasUnresolvedComplaints = (unresolvedComplaints?.length ?? 0) > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Main Content */}

      {shouldShowGetStarted ? (
        <View style={styles.GetStartedContainer}>
          <EmptyState
            icon={Building2}
            title="Welcome to Bunkezy!"
            description="Let's get started by adding your first property"
          >
            <TouchableOpacity
              style={styles.addPropertyButton}
              onPress={() => router.push("/onboarding" as any)}
            >
              <Text style={styles.addPropertyButtonText}>Add Property</Text>
            </TouchableOpacity>
          </EmptyState>
        </View>
      ) : !hasProperties ? (
        <View style={styles.GetStartedContainer} />
      ) : isFrozen ? (
        <View style={styles.GetStartedContainer}>
          <EmptyState
            icon={Building2}
            title="Account Frozen"
            description={
              activeProperty?.freezeReason ||
              "This property account has been frozen by admin. Please contact support."
            }
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: headerHeight },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {scheduledDeletionLabel ? (
            <View style={styles.deletionBanner}>
              <Text style={styles.deletionBannerText}>
                Property deletion is scheduled for {scheduledDeletionLabel}.
              </Text>
              <TouchableOpacity
                style={styles.cancelDeletionButton}
                onPress={() => {
                  void handleCancelPropertyDeletion();
                }}
                disabled={cancelDeletionMutation.isPending || !canRunPropertyQueries}
              >
                <Text style={styles.cancelDeletionButtonText}>
                  {cancelDeletionMutation.isPending ? "Cancelling..." : "Cancel Deletion"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <DashboardStats
            totalResidents={stats?.totalResidents ?? 0}
            occupancyRate={stats?.occupancyRate ?? 0}
            availableRooms={stats?.availableRooms ?? 0}
            occupiedRooms={stats?.occupiedRooms ?? 0}
            isLoading={isFetching}
          />
          <BedsAvailability
            emptyBeds={stats?.emptyBeds ?? 0}
            occupiedBeds={stats?.occupiedBeds ?? 0}
            isLoading={isFetching}
            onEmptyBedsPress={handleOpenAvailableRooms}
            onOccupiedBedsPress={handleOpenOccupiedRooms}
          />

          <View style={styles.contentCard}>
            <QuickActions hasUnresolvedComplaints={hasUnresolvedComplaints} />
          </View>

          <View style={styles.contentCard}>
            <RentDue onViewAllPress={handleOpenDueRents} />
          </View>

          {!latestActiveNotice ? (
            <View style={styles.contentCard}>
              <RecentNotice
                notice={latestActiveNotice}
                isLoading={isNoticesLoading || isNoticesFetching}
              />
            </View>
          ) : (
            <RecentNotice
              notice={latestActiveNotice}
              isLoading={isNoticesLoading || isNoticesFetching}
            />
          )}
        </ScrollView>
      )}

      {/* Sticky Header */}
      <DashboardHeader
        insets={insets}
        properties={properties || []}
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={handlePropertySwitch}
        utils={utils}
        setSelectedPropertyId={setSelectedPropertyId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  GetStartedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.l,
    padding: Spacing.l,
    paddingBottom: 20,
  },
  contentCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.l,
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
  addPropertyButton: {
    marginTop: Spacing.s,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.l,
    alignItems: "center",
  },
  addPropertyButtonText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
  deletionBanner: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 20,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  deletionBannerText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.error,
    lineHeight: 20,
  },
  cancelDeletionButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 14,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.white,
  },
  cancelDeletionButtonText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.semibold,
    color: Colors.error,
  },
});
