import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { trpc } from "@/utils/api";
import { Tabs } from "expo-router";
import {
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  DoorOpen,
  HousePlug,
  IndianRupee,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  Plus,
  UserRound,
  UserRoundCheck,
  Users2,
} from "lucide-react-native";
import React from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProperty } from "@/context/PropertyContext";

export default function TabLayout() {
  return <TabLayoutContent />;
}

function TabLayoutContent() {
  const insets = useSafeAreaInsets();
  const {
    selectedPropertyId,
    setSelectedPropertyId,
    reconcileSelectedPropertyId,
    isLoading: isPropertyContextLoading,
  } = useProperty();

  // Fetch properties to determine if tabs should be hidden
  const { data: properties, isLoading: isPropertiesLoading } =
    trpc.property.getAllProperties.useQuery();
  const hasProperties = (properties?.length ?? 0) > 0;
  const propertyIds = React.useMemo(
    () => properties?.map((property) => property.id) || [],
    [properties],
  );
  const isSelectedPropertyValid = Boolean(
    selectedPropertyId && propertyIds.includes(selectedPropertyId),
  );

  React.useEffect(() => {
    if (!hasProperties) return;
    const firstPropertyId = properties?.[0]?.id;
    if (!firstPropertyId) return;

    reconcileSelectedPropertyId(propertyIds);

    if (!isSelectedPropertyValid) {
      setSelectedPropertyId(firstPropertyId);
    }
  }, [
    hasProperties,
    isSelectedPropertyValid,
    propertyIds,
    properties,
    reconcileSelectedPropertyId,
    setSelectedPropertyId,
  ]);

  const activeProperty =
    properties?.find((property) => property.id === selectedPropertyId) ||
    properties?.[0];
  const isFrozen = Boolean(activeProperty?.isFrozen);
  const hasUsableProperty = Boolean(hasProperties && !isFrozen);
  const { data: pendingApprovals } =
    trpc.resident.listPendingApprovals.useQuery(
      {
        scopePropertyId: selectedPropertyId || undefined,
      },
      {
        enabled: hasUsableProperty,
      },
    );
  const pendingCount = pendingApprovals?.length || 0;
  const shouldBlockRender =
    isPropertyContextLoading ||
    isPropertiesLoading ||
    (hasProperties && !isSelectedPropertyValid);

  if (shouldBlockRender) {
    // Wait for property context hydration/reconciliation before mounting tab screens.
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,

        tabBarLabelStyle: {
          fontSize: Typography.size.xs,
          fontFamily: Typography.font.regular,
        },

        tabBarStyle: {
          height: 55 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 0,
          borderTopWidth: 0,
          backgroundColor: Colors.white,
          display: hasUsableProperty ? "flex" : "none",
        },
        tabBarItemStyle: {
          justifyContent: "center",
          paddingVertical: Spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="residents"
        options={{
          title: "Residents",
          href: null,
          tabBarIcon: ({ color }) => <Users2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rents"
        options={{
          title: "Rents",
          tabBarIcon: ({ color }) => <IndianRupee size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-resident"
        options={{
          title: "Add Resident",
          tabBarStyle: { display: "none" },
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 16,
                backgroundColor: Colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <Plus size={28} color={Colors.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color }) => <CreditCard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: "Approvals",
          tabBarIcon: ({ color }) => (
            <React.Fragment>
              <UserRoundCheck size={24} color={color} />
              {pendingCount > 0 ? (
                <Animated.View
                  style={{
                    position: "absolute",
                    top: 1,
                    right: 6,
                    width: 6,
                    height: 6,
                    borderRadius: 50,
                    backgroundColor: Colors.error,
                  }}
                />
              ) : null}
            </React.Fragment>
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          href: null,
          tabBarIcon: ({ color }) => <DoorOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: "Complaints",
          href: null,
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: "Notices",
          href: null,
          tabBarIcon: ({ color }) => <Megaphone size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="property-details"
        options={{
          title: "Property Details",
          href: null,
          tabBarIcon: ({ color }) => <Building2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          title: "Onboarding",
          href: null,
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color }) => <HousePlug size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage-rooms"
        options={{
          title: "Manage",
          href: null,
          tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="property-incharge"
        options={{
          title: "Incharge",
          href: null,
          tabBarIcon: ({ color }) => <UserRound size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          href: null,
          tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checkouts"
        options={{
          title: "Checkouts",
          href: null,
          tabBarIcon: ({ color }) => <LogOut size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="write-us"
        options={{
          title: "Write Us",
          href: null,
        }}
      />
    </Tabs>
  );
}
