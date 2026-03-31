import { HapticTab } from "@/components/haptic-tab";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { Tabs } from "expo-router";
import {
  BarChart3,
  Brain,
  MessageSquareText,
  Settings,
  Video,
} from "lucide-react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const { youtubeConnection } = useAuth();
  const insets = useSafeAreaInsets();
  const youtubeLocked = !youtubeConnection.isConnected;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          position: "absolute",
          height: 65 + insets.bottom,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: {
          fontFamily: "Outfit_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Brain color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: "Videos",
          tabBarButton: (props) => (
            <HapticTab
              {...props}
              disabled={youtubeLocked}
              disabledMessage="Connect YouTube account to view."
            />
          ),
          tabBarIcon: ({ color, size }) => <Video color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarButton: (props) => (
            <HapticTab
              {...props}
              disabled={youtubeLocked}
              disabledMessage="Connect YouTube account to view."
            />
          ),
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="comments"
        options={{
          title: "Comments",
          tabBarButton: (props) => (
            <HapticTab
              {...props}
              disabled={youtubeLocked}
              disabledMessage="Connect YouTube account to view."
            />
          ),
          tabBarIcon: ({ color, size }) => (
            <MessageSquareText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
