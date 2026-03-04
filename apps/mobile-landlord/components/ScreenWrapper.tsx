import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  title: string;
  children: React.ReactNode;
  scrollY?: unknown;
}

export function ScreenWrapper({
  title,
  children,
}: ScreenWrapperProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const headerHeight = insets.top + 60;

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.contentContainer}>{children}</View>

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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={{
                width: 30,
                height: 30,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={Spacing["3xl"]} color={Colors.primary} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: Colors.primary }]}>
              {title}
            </Text>
          </View>
        </View>
      </View>
    </View>
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
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: Spacing.xl,
    fontFamily: Typography.font.bold,
  },
  contentContainer: {
    flex: 1,
  },
});
