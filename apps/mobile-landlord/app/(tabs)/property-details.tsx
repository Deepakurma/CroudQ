import { EmptyState } from "@/components/EmptyState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { PropertyDetailsSkeleton } from "@/components/skeletons/PropertyDetailsSkeleton";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { trpc } from "@/utils/api";
import { formatIndianCurrency } from "@/utils/common";
import { useRouter } from "expo-router";
import {
  AirVent,
  BrushCleaning,
  Building2,
  Camera,
  Check,
  ChevronRight,
  DoorClosed,
  Layers,
  MapPin,
  ImageOff,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  Utensils,
  Wifi,
  Zap,
} from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProperty } from "@/context/PropertyContext";
import { CardShadow } from "@/constants/Shadows";

// Helper to map facilities to icons
const getFacilityIcon = (key: string) => {
  switch (key) {
    case "electricity":
      return <Zap size={20} color={Colors.primary} />;
    case "hotWater":
      return <Utensils size={20} color={Colors.primary} />; // Placeholder
    case "wifi":
      return <Wifi size={20} color={Colors.primary} />;
    case "ac":
      return <AirVent size={20} color={Colors.primary} />;
    case "powerBackup":
      return <Zap size={20} color={Colors.primary} />;
    case "food":
      return <Utensils size={20} color={Colors.primary} />;
    case "housekeeping":
      return <BrushCleaning size={20} color={Colors.primary} />;
    case "cctv":
      return <Camera size={20} color={Colors.primary} />;
    default:
      return <Check size={20} color={Colors.primary} />;
  }
};

const getFacilityLabel = (key: string) => {
  const labels: Record<string, string> = {
    electricity: "24x7 Power",
    hotWater: "Hot Water",
    wifi: "Free Wi-Fi",
    ac: "AC Rooms",
    powerBackup: "Power Backup",
    lift: "Lift",
    parking: "Parking",
    food: "Food / Mess",
    laundry: "Laundry",
    housekeeping: "Housekeeping",
    cctv: "CCTV Security",
  };
  return labels[key] || key;
};

const getFloorLabel = (floorNumber: number, includeGround: boolean) => {
  if (includeGround && floorNumber === 0) return "Ground Floor";
  if (floorNumber === 1) return "1st Floor";
  if (floorNumber === 2) return "2nd Floor";
  if (floorNumber === 3) return "3rd Floor";
  return `${floorNumber}th Floor`;
};

const isSafeImageUri = (value: string | null | undefined) => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("file:") || trimmed.startsWith("blob:")) return false;
  return true;
};

// ----------------------------------------------------------------------

export default function ProfileScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const router = useRouter();
  const utils = trpc.useUtils();
  const { selectedPropertyId } = useProperty();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: propertyData,
    isLoading,
    refetch,
  } = trpc.property.getPropertyDetails.useQuery(undefined, {
    enabled: !!selectedPropertyId,
  });
  const deletePropertyMutation = trpc.property.deleteProperty.useMutation();
  const cancelDeletionMutation =
    trpc.property.cancelPropertyDeletion.useMutation();

  const typeLabelMap: Record<string, string> = {
    Boys: "Boys Hostel",
    Girls: "Girls Hostel",
    PG: "PG",
    coliving: "Co-living",
  };

  const data = propertyData
    ? {
        propertyName: propertyData.name,
        inchargeName: propertyData.inchargeName || "",
        inchargePhone: propertyData.inchargePhone || "",
        type:
          typeLabelMap[propertyData.type || "Boys"] ||
          propertyData.type ||
          "Boys",
        address1: propertyData.addressLine1 || "",
        area: propertyData.area || "",
        city: propertyData.city || "",
        state: propertyData.state || "",
        pincode: propertyData.pincode || "",
        mapsLink: propertyData.mapsLink || "",
        landmarks: propertyData.landmarks || [],
        floors: propertyData.floors?.toString() || "0",
        includeGroundFloor: propertyData.includeGroundFloor || false,
        roomsPerFloor: propertyData.roomsPerFloor as Record<string, string>,
        roomTypes: propertyData.roomTypes as string[],
        rents: propertyData.rents as Record<string, string>,
        facilities:
          (propertyData.facilities as unknown as Record<string, boolean>) || {},
        photos: propertyData.photos || [],
        rules: propertyData.rules || [],
        specialInfo: propertyData.description || "",
      }
    : null;

  const handleCall = () => {
    if (data) Linking.openURL(`tel:${data.inchargePhone}`);
  };

  const handleMap = () => {
    if (data?.mapsLink) {
      Linking.openURL(data.mapsLink);
    }
  };

  // Calculate some stats for display
  const totalRooms = data
    ? Object.values(data.roomsPerFloor).reduce(
        (acc, curr) => acc + parseInt(curr),
        0,
      )
    : 0;

  // Use backend-calculated capacity
  const capacity = propertyData?.totalCapacity || 0;

  const scheduledDeletionDate = useMemo(() => {
    const value = propertyData?.deletionScheduledFor;
    if (!value) return null;
    const parsed =
      typeof value === "string" ? new Date(value) : new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [propertyData?.deletionScheduledFor]);

  const handleSchedulePropertyDeletion = async () => {
    try {
      const result = await deletePropertyMutation.mutateAsync();
      const scheduledFor = result?.scheduledFor
        ? new Date(result.scheduledFor)
        : null;
      const formatted =
        scheduledFor && !Number.isNaN(scheduledFor.getTime())
          ? new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(scheduledFor)
          : "3 days";

      Toast.show({
        type: "success",
        text1: result?.alreadyScheduled
          ? "Deletion already scheduled"
          : "Deletion scheduled",
        text2: `Property will be deleted on ${formatted}.`,
      });
      setShowDeleteDialog(false);
      await refetch();
      await Promise.all([
        utils.property.getAllProperties.invalidate(),
        utils.property.getPropertyDetails.invalidate(),
        utils.property.getDashboardStats.invalidate(),
      ]);
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: "Could not schedule property deletion right now.",
      });
    }
  };

  const handleCancelPropertyDeletion = async () => {
    try {
      await cancelDeletionMutation.mutateAsync();
      Toast.show({
        type: "success",
        text1: "Deletion cancelled",
        text2: "Your property will remain active.",
      });
      await refetch();
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
  };

  return (
    <ScreenWrapper title="Property Details" scrollY={scrollY}>
      {isLoading ? (
        <PropertyDetailsSkeleton />
      ) : !data ? (
        <EmptyState
          icon={Building2}
          title="No Property Found"
          description="You haven't added any property details yet."
        >
          <TouchableOpacity
            onPress={() => router.push("/onboarding" as any)}
            style={{ marginTop: Spacing.m }}
          >
            <Text
              style={{
                color: Colors.primary,
                fontFamily: Typography.font.semibold,
                fontSize: Typography.size.m,
              }}
            >
              Add Property Details
            </Text>
          </TouchableOpacity>
        </EmptyState>
      ) : (
        <View style={styles.container}>
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
            {/* Header Card */}
            <View style={styles.headerCard}>
              {isSafeImageUri(data.photos[0]) ? (
                <Image
                  source={{ uri: data.photos[0] }}
                  style={styles.headerImage}
                />
              ) : (
                <View style={styles.imageFallbackSurface}>
                  <View style={styles.imageFallbackBadge}>
                    <ImageOff size={28} color={Colors.textSecondary} />
                  </View>
                </View>
              )}
              <View style={styles.headerOverlay} />
              <View style={styles.headerInfo}>
                <Text style={styles.propertyName}>{data.propertyName}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{data.type}</Text>
                  </View>
                  <View style={styles.locationBadge}>
                    <MapPin size={12} color={Colors.white} />
                    <Text style={styles.locationText}>
                      {data.area}, {data.city}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.editButton,
                  scheduledDeletionDate ? styles.editButtonDisabled : null,
                ]}
                onPress={() => {
                  if (scheduledDeletionDate) return;
                  router.push({
                    pathname: "/onboarding" as any,
                    params: { mode: "edit" },
                  });
                }}
                disabled={Boolean(scheduledDeletionDate)}
              >
                <Pencil size={17} color={Colors.white} />
                <Text style={styles.editButtonText}>Edit Property</Text>
              </TouchableOpacity>
            </View>

            {/* Owner & Contact */}
            <View style={styles.contactRow}>
              <View>
                <Text style={styles.label}>Property In-Charge</Text>
                <Text style={styles.value}>{data.inchargeName}</Text>
                <Text style={styles.subValue}>+91 {data.inchargePhone}</Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Phone size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Address Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Address</Text>
              </View>
              <Text style={styles.addressText}>
                {data.address1}
                {"\n"}
                {data.city}, {data.state} - {data.pincode}
              </Text>
              {data.landmarks.length > 0 && (
                <View style={styles.landmarksContainer}>
                  <Text style={styles.sectionSubtitle}>Nearby:</Text>
                  {data.landmarks.map((landmark, index) => (
                    <View key={index} style={styles.landmarkChip}>
                      <Text style={styles.landmarkText}>{landmark}</Text>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.mapButton} onPress={handleMap}>
                <Text style={styles.mapButtonText}>View on Google Maps</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Property Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{data.floors}</Text>
                <Text style={styles.statLabel}>Floors</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{totalRooms}</Text>
                <Text style={styles.statLabel}>Total Rooms</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>~{capacity}</Text>
                <Text style={styles.statLabel}>Capacity</Text>
              </View>
            </View>

            {/* Floor Details */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Layers size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Floor Details</Text>
              </View>
              <View style={styles.rentList}>
                {Object.entries(data.roomsPerFloor).map(
                  ([floorKey, count], index, arr) => {
                    const floorIndex = parseInt(floorKey);
                    const label = getFloorLabel(
                      floorIndex,
                      data.includeGroundFloor,
                    );
                    return (
                      <View
                        key={floorKey}
                        style={[
                          styles.rentRow,
                          index === arr.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <Text style={styles.roomType}>{label}</Text>
                        <Text style={styles.rentAmount}>
                          {count} <Text style={styles.perMonth}>Rooms</Text>
                        </Text>
                      </View>
                    );
                  },
                )}
              </View>
            </View>

            {/* Rent Details */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <DoorClosed size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Room Configurations</Text>
              </View>
              <View style={styles.rentList}>
                {Object.entries(data.rents).map(
                  ([type, amount], index, arr) => (
                    <View
                      key={type}
                      style={[
                        styles.rentRow,
                        index === arr.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <Text style={styles.roomType}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                      <Text style={styles.rentAmount}>
                        {formatIndianCurrency(Number(amount))}
                        <Text style={styles.perMonth}>/mo</Text>
                      </Text>
                    </View>
                  ),
                )}
              </View>
            </View>

            {/* Facilities */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Zap size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Amenities & Facilities</Text>
              </View>
              <View style={styles.facilitiesGrid}>
                {Object.values(data.facilities).some((v) => v === true) ? (
                  Object.entries(data.facilities).map(([key, isAvailable]) => {
                    const ignoredKeys = [
                      "id",
                      "propertyId",
                      "createdAt",
                      "updatedAt",
                    ];
                    if (ignoredKeys.includes(key) || !isAvailable) return null;
                    return (
                      <View key={key} style={styles.facilityItem}>
                        <View style={styles.facilityIconBox}>
                          {getFacilityIcon(key)}
                        </View>
                        <Text style={styles.facilityText}>
                          {getFacilityLabel(key)}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <EmptyState description="No amenities added"></EmptyState>
                )}
              </View>
            </View>

            {/* Rules */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <ShieldCheck size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>House Rules</Text>
              </View>
              <View style={styles.rulesList}>
                {data.rules.length > 0 ? (
                  data.rules.map((rule, index) => (
                    <View key={index} style={styles.ruleItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))
                ) : (
                  <EmptyState description="No rules added"></EmptyState>
                )}
              </View>
            </View>

            {/* Gallery */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Camera size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Gallery</Text>
              </View>
              {data.photos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  {data.photos.map((photo, index) =>
                    isSafeImageUri(photo) ? (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.galleryImage}
                      />
                    ) : (
                      <View
                        key={index}
                        style={[
                          styles.galleryImage,
                          styles.imageFallbackSurface,
                        ]}
                      >
                        <View style={styles.imageFallbackBadge}>
                          <ImageOff size={24} color={Colors.textSecondary} />
                        </View>
                      </View>
                    ),
                  )}
                </ScrollView>
              ) : (
                <EmptyState description="Add property images to see"></EmptyState>
              )}
            </View>

            <TouchableOpacity
              style={styles.deletePropertyButton}
              onPress={() => {
                if (scheduledDeletionDate) {
                  void handleCancelPropertyDeletion();
                  return;
                }
                setShowDeleteDialog(true);
              }}
              disabled={
                deletePropertyMutation.isPending ||
                cancelDeletionMutation.isPending
              }
            >
              <Trash2 size={14} color={Colors.error} />
              <Text style={styles.deletePropertyButtonText}>
                {scheduledDeletionDate
                  ? cancelDeletionMutation.isPending
                    ? "Cancelling..."
                    : "Cancel Deletion"
                  : deletePropertyMutation.isPending
                    ? "Scheduling..."
                    : "Delete Property"}
              </Text>
            </TouchableOpacity>
          </Animated.ScrollView>

          <ConfirmationDialog
            visible={showDeleteDialog}
            title="Schedule Property Deletion?"
            description="Your property will be deleted after 3 days. You can cancel before the deadline."
            confirmLabel={
              deletePropertyMutation.isPending ? "Scheduling..." : "Schedule"
            }
            cancelLabel="Keep Property"
            variant="danger"
            onCancel={() => setShowDeleteDialog(false)}
            onConfirm={() => {
              void handleSchedulePropertyDeletion();
            }}
          />
        </View>
      )}
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
  headerCard: {
    height: 200,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    marginBottom: Spacing.s,
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
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerInfo: {
    position: "absolute",
    bottom: Spacing.l,
    left: Spacing.l,
    right: Spacing.l,
  },
  editButton: {
    position: "absolute",
    top: Spacing.l,
    right: Spacing.l,
    borderRadius: 20,
    padding: Spacing.s,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  editButtonDisabled: {
    opacity: 0.45,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
  },
  propertyName: {
    fontSize: Typography.size["2xl"],
    fontFamily: Typography.font.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Spacing.s,
  },
  badgeText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.bold,
    color: Colors.white,
    textTransform: "uppercase",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.white,
  },
  label: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.bold,
    color: Colors.text,
    marginBottom: 1,
  },
  subValue: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.l,
    borderRadius: 24,
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
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  cardTitle: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  addressText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
    color: Colors.text,
    lineHeight: 22,
  },
  landmarksContainer: {
    marginTop: Spacing.m,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
    alignItems: "center",
  },
  sectionSubtitle: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  landmarkChip: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.m,
    paddingVertical: 6,
    borderRadius: Spacing.m,
  },
  landmarkText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.primary,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.m,
    paddingTop: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mapButtonText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.m,
    borderRadius: 24,
    alignItems: "center",
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
  statNumber: {
    fontSize: Typography.size["2xl"],
    fontFamily: Typography.font.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  rentList: {
    gap: Spacing.m,
  },
  rentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roomType: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
    textTransform: "capitalize",
    fontWeight: "500",
  },
  rentAmount: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  perMonth: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
  },
  facilityItem: {
    width: "30%",
    alignItems: "center",
    gap: Spacing.s,
    padding: Spacing.s,
    backgroundColor: "#f9fafb",
    borderRadius: Spacing.m,
    flexGrow: 1,
  },
  facilityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  facilityText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.text,
    textAlign: "center",
  },
  rulesList: {
    gap: Spacing.s,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.s,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  ruleText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
  },
  galleryScroll: {
    gap: Spacing.m,
  },
  galleryImage: {
    width: 200,
    height: 120,
    borderRadius: Spacing.m,
    backgroundColor: Colors.accent,
  },
  imageFallbackSurface: {
    width: "100%",
    height: "100%",
    borderRadius: Spacing.m,
    backgroundColor: "#f3f5f8",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  imageFallbackBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  deletePropertyButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    backgroundColor: "rgba(239,68,68,0.08)",
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.s,
  },
  deletePropertyButtonText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.semibold,
    color: Colors.error,
  },
});
