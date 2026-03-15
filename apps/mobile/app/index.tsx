import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { Colors } from "@/constants/Colors";
import { CardShadow } from "@/constants/Shadows";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useResident } from "@/context/ResidentContext";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Bell,
  Building2,
  CalendarClock,
  ChevronRight,
  CircleUserRound,
  FilePenLine,
  Hand,
  House,
  LogOut,
  Phone,
  ScrollText,
  Megaphone,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/utils/api";

export default function ResidentDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const [isProfileDropdownVisible, setIsProfileDropdownVisible] =
    useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const { residentProfile, isLoading, isError } = useResident();
  const { data: latestNotice, isLoading: isNoticeLoading } =
    trpc.resident.getMyLatestActiveNotice.useQuery(undefined, {
      enabled: !!residentProfile,
      staleTime: 60_000,
      retry: false,
    });

  const headerHeight = insets.top + 70;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.scrollContent,
            { paddingTop: headerHeight + Spacing.s },
          ]}
        >
          <View style={styles.greetingCard}>
            <SkeletonLoader width="45%" height={26} borderRadius={8} />
            <SkeletonLoader width="70%" height={18} borderRadius={8} />
          </View>
          <View style={styles.detailsCard}>
            <SkeletonLoader width={70} height={70} borderRadius={35} />
            <SkeletonLoader width="50%" height={22} borderRadius={8} />
            <SkeletonLoader width="90%" height={18} borderRadius={8} />
            <SkeletonLoader width="80%" height={18} borderRadius={8} />
          </View>
          <View style={styles.rentDueCard}>
            <SkeletonLoader width="40%" height={18} borderRadius={8} />
            <SkeletonLoader width="55%" height={22} borderRadius={8} />
            <SkeletonLoader width="35%" height={20} borderRadius={8} />
          </View>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={House}
          title="Unable to load tenancy"
          description="Please refresh the app and try again."
        />
      </View>
    );
  }

  if (!residentProfile) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={House}
          title="No active tenancy found"
          description="This account is not linked to an active resident record."
        />
      </View>
    );
  }

  const profileName = residentProfile.name || "Resident";

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: headerHeight + Spacing.s,
              paddingBottom: 32,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isNoticeLoading ? (
            <View style={styles.noticeCard}>
              <SkeletonLoader width="32%" height={18} borderRadius={8} />
              <SkeletonLoader width="92%" height={16} borderRadius={8} />
              <SkeletonLoader width="78%" height={16} borderRadius={8} />
            </View>
          ) : latestNotice ? (
            <LinearGradient
              colors={["#f8e9d4", "#f4decb", "#f1d6c7"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.noticeCard}
            >
              <View style={styles.noticeHeader}>
                <View style={styles.noticeIconWrap}>
                  <Megaphone size={22} color="#ffffff" />
                </View>
                <View style={styles.noticeMeta}>
                  <Text style={styles.noticeLabel}>Notice</Text>
                  <Text style={styles.noticePostedOn} numberOfLines={1}>
                    Posted on{" "}
                    {format(new Date(latestNotice.createdAt), "dd MMM yyyy")}
                  </Text>
                </View>
              </View>
              <Text style={styles.noticeDescription}>
                {latestNotice.description}
              </Text>
            </LinearGradient>
          ) : null}

          <View style={styles.greetingCard}>
            <View style={styles.greetingContentRow}>
              <View style={styles.greetingWaveIcon}>
                <Hand size={24} color={Colors.white} />
              </View>
              <View style={styles.greetingTextWrap}>
                <Text style={styles.greetingTitle}>
                  Hello, {profileName.split(" ")[0]}!
                </Text>
                <Text style={styles.greetingSubtitle}>
                  Hope Your Having a wonderful day!
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                {residentProfile.profileImage ? (
                  <Image
                    source={{ uri: residentProfile.profileImage }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {profileName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.statusDot} />
              </View>
              <View>
                <Text style={styles.sheetName}>{profileName}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <View style={styles.sheetTag}>
                    <Text style={styles.sheetTagText}>
                      Room {residentProfile.room.roomNumber}
                    </Text>
                  </View>
                  <View style={styles.sheetTag}>
                    <Text style={styles.sheetTagText}>
                      {residentProfile.room.type?.name || "Shared"}
                    </Text>
                  </View>
                  {residentProfile.room.ac && (
                    <View style={styles.acTag}>
                      <Text style={styles.acTagText}>AC</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <InfoRow
              icon={<Phone size={18} color={Colors.textSecondary} />}
              label="Mobile Number"
              value={residentProfile.phoneNumber}
            />
            <InfoRow
              icon={<CalendarClock size={18} color={Colors.textSecondary} />}
              label="Check-in Date"
              value={format(
                new Date(residentProfile.checkInDate),
                "dd MMM yyyy",
              )}
            />
            {residentProfile.checkOutDate && (
              <InfoRow
                icon={<CalendarClock size={18} color={Colors.textSecondary} />}
                label="Check-out Date"
                value={format(
                  new Date(residentProfile.checkOutDate),
                  "dd MMM yyyy",
                )}
                isLast
              />
            )}
          </View>

          <View style={styles.rentDueCard}>
            <View style={styles.rentDueHeader}>
              <View style={styles.rentDueIconWrap}>
                <CalendarClock size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.rentDueLabel}>Next Rent Due</Text>
                <Text style={styles.rentDueDate}>
                  {format(
                    new Date(residentProfile.nextRentDueDate),
                    "dd MMM yyyy",
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.rentDueDivider} />

            <View style={styles.rentDueFooter}>
              <View>
                <Text style={styles.rentAmountSub}>Amount to Pay</Text>
                <Text style={styles.rentAmountText}>
                  ₹ {residentProfile.rentAmount.toLocaleString("en-IN")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.payNowButton}
                activeOpacity={0.85}
              >
                <Text style={styles.payNowButtonText}>Pay Now</Text>
                <ChevronRight size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionsPanel}>
            <ActionTile
              title={"Write\nComplaint"}
              icon={<FilePenLine size={21} color="#dd1b1b" />}
              iconBg="#ffeaea"
              onPress={() => router.push("/complaint" as any)}
            />
            <View style={styles.actionDivider} />
            <ActionTile
              title={"View\nReceipts"}
              icon={<ScrollText size={21} color="#2563EB" />}
              iconBg="#EAF2FF"
              onPress={() => router.push("/receipts" as any)}
            />
            <View style={styles.actionDivider} />
            <ActionTile
              title={"Contact\nIncharge"}
              icon={<Phone size={21} color="#0f7619" />}
              iconBg="#e8f7ec"
              onPress={() => {
                if (residentProfile.property.inchargePhone) {
                  Linking.openURL(
                    `tel:+91${residentProfile.property.inchargePhone}`,
                  );
                } else {
                  Linking.openURL("tel:+919876543210");
                }
              }}
            />
          </View>

          <View style={styles.switchStayCard}>
            <Text style={styles.switchStayTitle}>
              Looking to change your stay?
            </Text>
            <Text style={styles.switchStaySubtitle}>
              Explore Bunkezy and find your next perfect stay.
            </Text>
            <TouchableOpacity
              style={styles.switchStayButton}
              activeOpacity={0.9}
              onPress={async () => {
                const websiteUrl = "https://bunkezy.com";
                const canOpen = await Linking.canOpenURL(websiteUrl);
                if (canOpen) {
                  await Linking.openURL(websiteUrl);
                }
              }}
            >
              <Text style={styles.switchStayButtonText}>Explore Bunkezy</Text>
              <View style={styles.switchStayArrowChip}>
                <ChevronRight size={16} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View
          style={[
            styles.headerContainer,
            {
              paddingTop: insets.top,
              height: headerHeight,
              backgroundColor: Colors.background,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={{ zIndex: 100 }}>
              <View style={[styles.propertySelector]}>
                <View style={styles.propertyLeft}>
                  <View style={styles.propertyIcon}>
                    <Building2 size={24} color={Colors.primary} />
                  </View>
                  <View style={{ flexDirection: "column" }}>
                    <Text style={[styles.propertyLabel, { opacity: 0.8 }]}>
                      Your Current Stay
                    </Text>
                    <Text style={[styles.propertyName]} numberOfLines={1}>
                      {residentProfile.property.name}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
                <View style={styles.iconHolder}>
                  <Bell size={23} color={Colors.primary} />
                </View>
                <View style={styles.badge} />
              </TouchableOpacity>

              <View style={{ zIndex: 100 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setIsProfileDropdownVisible(!isProfileDropdownVisible);
                  }}
                  style={styles.profile}
                >
                  <CircleUserRound
                    size={28}
                    strokeWidth={1.75}
                    color={Colors.white}
                  />
                </TouchableOpacity>

                {isProfileDropdownVisible && (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownOverlay}
                      activeOpacity={1}
                      onPress={() => setIsProfileDropdownVisible(false)}
                    />
                    <View
                      style={[styles.dropdown, { right: 0, left: undefined }]}
                    >
                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => {
                          setIsProfileDropdownVisible(false);
                          setIsLogoutDialogOpen(true);
                        }}
                      >
                        <View style={styles.profileRow}>
                          <LogOut size={18} color={Colors.error} />
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              { color: Colors.error },
                            ]}
                          >
                            Logout
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        <ConfirmationDialog
          visible={isLogoutDialogOpen}
          title="Logout"
          description="Are you sure you want to logout?"
          confirmLabel="Logout"
          variant="danger"
          onConfirm={async () => {
            setIsLogoutDialogOpen(false);
            await logout();
          }}
          onCancel={() => setIsLogoutDialogOpen(false)}
        />
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowDivider]}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIcon}>{icon}</View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionTile({
  title,
  icon,
  iconBg,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionTile}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  screen: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.l,
    gap: Spacing.l,
  },

  greetingCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: Spacing.l,
    overflow: "hidden",
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

  greetingTitle: {
    color: Colors.white,
    fontFamily: Typography.font.bold,
    fontSize: Typography.size.xl,
  },

  greetingSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: Typography.font.regular,
    fontSize: Typography.size.m,
  },

  greetingContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    zIndex: 2,
  },

  greetingWaveIcon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  greetingTextWrap: {
    flex: 1,
  },

  noticeCard: {
    backgroundColor: "#f8e9d4",
    borderRadius: 28,
    paddingVertical: Spacing.m + 2,
    paddingHorizontal: Spacing.l,
    borderWidth: 1,
    borderColor: "#efd4bc",
    gap: Spacing.s,
    minHeight: 108,
    shadowColor: "#80520e",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    ...CardShadow,
    elevation: 2,
  },

  noticeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#f3aa26",
    justifyContent: "center",
    alignItems: "center",
  },

  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },

  noticeMeta: {
    flex: 1,
    justifyContent: "center",
    gap: 1,
  },

  noticeLabel: {
    color: "#e28a00",
    fontFamily: Typography.font.bold,
    fontSize: Typography.size.xl,
  },

  noticePostedOn: {
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
    fontSize: Typography.size.s,
  },

  noticeDescription: {
    color: "#e28a00",
    fontFamily: Typography.font.semibold,
    fontSize: Typography.size.l,
    lineHeight: 22,
  },

  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.l,
    justifyContent: "center",
    zIndex: 1000,
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
  },

  propertySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.xl,
    borderRadius: 25,
    gap: 5,
    backgroundColor: Colors.white,
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

  propertyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },

  propertyIcon: {
    padding: Spacing.xs,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  propertyLabel: {
    fontFamily: Typography.font.regular,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  propertyName: {
    fontFamily: Typography.font.semibold,
    fontSize: Typography.size.m,
    color: Colors.primary,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing["2xl"],
  },

  iconButton: {
    position: "relative",
    padding: 4,
  },

  iconHolder: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: 2,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  profile: {
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  dropdown: {
    position: "absolute",
    top: 40,
    left: 0,
    backgroundColor: Colors.white,
    borderRadius: Spacing.m,
    padding: Spacing.xs,
    minWidth: 120,
    zIndex: 100,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    ...CardShadow,
    elevation: 5,
  },

  dropdownOverlay: {
    position: "absolute",
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    backgroundColor: "transparent",
    zIndex: 99,
  },

  dropdownOption: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
  },

  dropdownOptionText: {
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.l,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: Typography.size["2xl"],
    fontFamily: Typography.font.bold,
    color: Colors.primary,
  },
  sheetName: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  sheetTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Spacing.s,
  },
  sheetTagText: {
    color: "#4B5563",
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  acTag: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Spacing.s,
  },
  acTagText: {
    color: "#0369A1",
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.l,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.s,
  },

  infoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    flex: 1,
  },

  infoIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  infoLabel: {
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
    fontSize: Typography.size.m,
  },

  infoValue: {
    color: Colors.text,
    fontFamily: Typography.font.semibold,
    fontSize: Typography.size.m,
  },

  rentDueCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
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

  rentDueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },

  rentDueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  rentDueDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  rentDueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rentDueLabel: {
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
    fontSize: Typography.size.s,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  rentDueDate: {
    color: Colors.text,
    fontFamily: Typography.font.semibold,
    fontSize: Typography.size.l,
    marginTop: 2,
  },

  rentAmountSub: {
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
    fontSize: Typography.size.s,
  },

  rentAmountText: {
    fontFamily: Typography.font.bold,
    fontSize: Typography.size["2xl"],
    color: Colors.text,
  },

  payNowButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },

  payNowButtonText: {
    color: Colors.white,
    fontFamily: Typography.font.bold,
    fontSize: Typography.size.m,
  },

  actionsPanel: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
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

  actionTile: {
    flex: 1,
    paddingVertical: Spacing.l,
    paddingHorizontal: Spacing.xs,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },

  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Spacing.l,
    justifyContent: "center",
    alignItems: "center",
  },

  actionContent: {
    justifyContent: "center",
    alignItems: "center",
  },

  actionTitle: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
    textAlign: "center",
  },

  actionDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.m,
  },

  switchStayCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: Spacing.l,
    gap: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.s,
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

  switchStayTitle: {
    color: Colors.white,
    fontFamily: Typography.font.bold,
    fontSize: Typography.size.xl,
  },

  switchStaySubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: Typography.font.regular,
    fontSize: Typography.size.m,
    lineHeight: 22,
  },

  switchStayButton: {
    marginTop: Spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  switchStayButtonText: {
    color: Colors.primary,
    fontFamily: Typography.font.semibold,
    fontSize: Typography.size.m,
    paddingLeft: 6,
  },

  switchStayArrowChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
  },
});
