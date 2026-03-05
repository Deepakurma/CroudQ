import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import {
  Bell,
  Building2,
  ChevronDown,
  CircleUserRound,
  LayoutGrid,
  LogOut,
} from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";

// Removed PROPERTY_OPTIONS

interface DashboardHeaderProps {
  insets: EdgeInsets;
  properties: { id: string; name: string }[];
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  utils: any; // tRPC utils for query invalidation
  setSelectedPropertyId: (id: string | null) => void;
}

export function DashboardHeader({
  insets,
  properties = [],
  selectedPropertyId,
  onSelectProperty,
  utils,
  setSelectedPropertyId,
}: DashboardHeaderProps) {
  // const [selectedProperty, setSelectedProperty] = useState(PROPERTY_OPTIONS[0]); // Managed by parent
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isProfileDropdownVisible, setIsProfileDropdownVisible] =
    useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { logout } = useAuth(); // Destructure logout from useAuth
  const router = useRouter();

  const selectedProperty =
    properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const selectedPropertyName = selectedProperty?.name || "Add Property";

  const toggleProfileDropdown = () => {
    setIsProfileDropdownVisible(!isProfileDropdownVisible);
  };

  const handleProfilePress = () => {
    setIsProfileDropdownVisible(false);
    router.push("/property-details" as any);
  };

  const handleManageRoomsPress = () => {
    setIsProfileDropdownVisible(false);
    router.push("/manage-rooms" as any);
  };

  const handleLogoutPress = () => {
    setIsProfileDropdownVisible(false);
    setIsLogoutDialogOpen(true);
  };

  const confirmLogout = async () => {
    setIsLogoutDialogOpen(false);

    // SECURITY FIX: Clear property context to prevent next user seeing it
    setSelectedPropertyId(null);

    // Clear property-scoped cache entries before logout
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

    // Finally logout (clears auth state)
    await logout();
  };

  const toggleDropdown = () => {
    if (properties.length > 1) {
      setIsDropdownVisible(!isDropdownVisible);
    }
  };

  const selectProperty = (id: string) => {
    onSelectProperty(id);
    setIsDropdownVisible(false);
  };

  // Interpolations
  const headerHeight = insets.top + 70;

  return (
    <>
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
          {/* Property Selector */}
          <View style={{ zIndex: 100 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={toggleDropdown}>
              <View style={styles.propertySelector}>
                <View style={styles.propertyIconBox}>
                  <Building2 size={20} color={Colors.primary} />
                </View>
                <Text style={[styles.propertyName, { color: Colors.primary }]}>
                  {selectedPropertyName}
                </Text>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ChevronDown size={18} color={Colors.primary} />
                </View>
              </View>
            </TouchableOpacity>

            {isDropdownVisible && (
              <>
                <TouchableOpacity
                  style={styles.dropdownOverlay}
                  activeOpacity={1}
                  onPress={() => setIsDropdownVisible(false)}
                />
                <View style={[styles.dropdown]}>
                  {properties.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.dropdownOption}
                      onPress={() => selectProperty(option.id)}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          selectedPropertyId === option.id &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Right Actions */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/notifications" as any)}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Bell size={23} color={Colors.primary} />
              </View>
              <View style={styles.badge} />
            </TouchableOpacity>
            <View style={{ zIndex: 100 }}>
              <TouchableOpacity
                onPress={toggleProfileDropdown}
                activeOpacity={0.8}
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
                    {properties.length > 0 && (
                      <>
                        <TouchableOpacity
                          style={styles.dropdownOption}
                          onPress={handleProfilePress}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Building2 size={18} color={Colors.text} />
                            <Text style={styles.dropdownOptionText}>
                              Property Details
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.dropdownOption}
                          onPress={handleManageRoomsPress}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <LayoutGrid size={18} color={Colors.text} />
                            <Text style={styles.dropdownOptionText}>
                              Manage Rooms
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}

                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={handleLogoutPress}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
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
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
    padding: Spacing.xs,
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
    elevation: 1,
  },
  propertyIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
  },
  propertyName: {
    fontFamily: Typography.font.semibold,
    fontSize: Typography.size.m,
  },
  dropdown: {
    position: "absolute",
    top: 40,
    left: 0,
    backgroundColor: Colors.white,
    borderRadius: Spacing.m,
    padding: Spacing.xs,
    minWidth: 150,
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
  dropdownOptionTextSelected: {
    fontFamily: Typography.font.semibold,
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
    // padding: 1,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
