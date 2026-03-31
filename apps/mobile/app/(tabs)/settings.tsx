import { AccountConnectCard } from "@/components/settings/AccountConnectCard";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Card } from "@/components/ui/Card";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { DialogBox } from "@/components/ui/DialogBox";
import { FloatingDropdownMenu } from "@/components/ui/FloatingDropdownMenu";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Switch } from "@/components/ui/Switch";
import { TabScreen } from "@/components/ui/TabScreen";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { type HomePlatform, useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { trpc } from "@/utils/api";
import { validateSchema } from "@/utils/validation";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  Check,
  ChevronDown,
  Instagram,
  LogOut,
  MessageSquare,
  Smartphone,
  Sun,
  MoonStar,
  PencilLine,
  ShieldCheck,
  Trash2,
  Youtube,
} from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { z } from "zod";

const editProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  currentPassword: z.string().min(1, "Current password is required"),
});

const feedbackSchema = z.object({
  message: z.string().trim().min(3, "Feedback must be at least 3 characters"),
});

const formatDeletionDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export default function SettingsScreen() {
  const { colors, mode, setMode } = useAppTheme();
  const {
    cancelAccountDeletion,
    logout,
    openUpgradePage,
    requestAccountDeletion,
    updateProfile,
    user,
    youtubeConnection,
    isYouTubeConnecting,
    connectYouTube,
    selectedHomePlatform,
    setSelectedHomePlatform,
  } = useAuth();
  const router = useRouter();
  const styles = getStyles(colors);
  const [isLogoutDialogVisible, setIsLogoutDialogVisible] =
    React.useState(false);
  const [isEditDialogVisible, setIsEditDialogVisible] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isFeedbackDialogVisible, setIsFeedbackDialogVisible] =
    React.useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] =
    React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState("");
  const [feedbackError, setFeedbackError] = React.useState("");
  const [isDeletionSubmitting, setIsDeletionSubmitting] = React.useState(false);
  const submitFeedbackMutation = useMutation(
    trpc.feedback.submit.mutationOptions(),
  );
  const [editForm, setEditForm] = React.useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    currentPassword: "",
  });
  const [editErrors, setEditErrors] = React.useState<Record<string, string>>(
    {},
  );

  const openEditDialog = () => {
    setEditForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      currentPassword: "",
    });
    setEditErrors({});
    setIsEditDialogVisible(true);
  };

  const updateEditField = (
    field: "name" | "email" | "currentPassword",
    value: string,
  ) => {
    setEditForm((current) => ({ ...current, [field]: value }));
    setEditErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: "",
      };
    });
  };

  const handleSaveProfile = async () => {
    const result = validateSchema(editProfileSchema, editForm);
    if (!result.success) {
      setEditErrors(result.errors || {});
      return;
    }

    if (!result.data) {
      return;
    }

    setEditErrors({});
    setIsSavingProfile(true);

    try {
      await updateProfile(result.data);
      setIsEditDialogVisible(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("Current password is incorrect")) {
        setEditErrors((current) => ({
          ...current,
          currentPassword: "Current password is incorrect",
        }));
      }

      if (message.includes("already exists")) {
        setEditErrors((current) => ({
          ...current,
          email: "This email is already in use",
        }));
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openFeedbackDialog = () => {
    setFeedbackMessage("");
    setFeedbackError("");
    setIsFeedbackDialogVisible(true);
  };

  const handleSubmitFeedback = async () => {
    const result = validateSchema(feedbackSchema, {
      message: feedbackMessage,
    });

    if (!result.success) {
      setFeedbackError(result.errors?.message || "Please share your feedback");
      return;
    }

    if (!result.data) {
      return;
    }

    setFeedbackError("");

    try {
      await submitFeedbackMutation.mutateAsync({
        message: result.data.message,
      });
      setIsFeedbackDialogVisible(false);
      setFeedbackMessage("");
      Toast.show({
        type: "success",
        text1: "Feedback recieved",
        text2: "Thanks for sharing your feedback.",
      });
    } catch {
      setFeedbackError("Could not submit feedback. Please try again.");
      Toast.show({
        type: "error",
        text1: "Feedback",
        text2: "Could not submit feedback right now.",
      });
    }
  };

  const accounts = [
    {
      id: "yt",
      platform: "YouTube" as const,
      handle:
        youtubeConnection.channelName ||
        (youtubeConnection.isConnected
          ? (user?.handle ?? "@connected")
          : "Tap to connect"),
      status: isYouTubeConnecting
        ? "Connecting"
        : youtubeConnection.isConnected
          ? "Connected"
          : "Not connected",
      onPress: youtubeConnection.isConnected
        ? () => router.push("/connect-account" as never)
        : connectYouTube,
      disabled: isYouTubeConnecting,
    },
    {
      id: "ig",
      platform: "Instagram" as const,
      handle: "Coming soon",
      status: "Soon",
      onPress: () => router.push("/connect-account" as never),
      disabled: false,
    },
  ];
  const platformOptions: {
    id: HomePlatform;
    label: string;
    Icon: typeof Youtube;
    accent: string;
  }[] = [
    {
      id: "youtube",
      label: "YouTube",
      Icon: Youtube,
      accent: "#FF3B30",
    },
    {
      id: "instagram",
      label: "Instagram",
      Icon: Instagram,
      accent: "#E4405F",
    },
  ];
  const activePlatform =
    platformOptions.find((option) => option.id === selectedHomePlatform) ||
    platformOptions[0];
  const themeOptions: {
    id: "system" | "light" | "dark";
    label: string;
    Icon: typeof MoonStar;
  }[] = [
    {
      id: "system",
      label: "Default",
      Icon: Smartphone,
    },
    {
      id: "light",
      label: "Light",
      Icon: Sun,
    },
    {
      id: "dark",
      label: "Dark",
      Icon: MoonStar,
    },
  ];
  const activeTheme = themeOptions.find((option) => option.id === mode);
  const scheduledDeletionAt = user?.scheduledDeletionAt ?? null;
  const isDeletionPending = Boolean(scheduledDeletionAt);

  const handleDeletionAction = async () => {
    setIsDeletionSubmitting(true);

    try {
      if (isDeletionPending) {
        await cancelAccountDeletion();
      } else {
        await requestAccountDeletion();
      }
      setIsDeleteDialogVisible(false);
    } finally {
      setIsDeletionSubmitting(false);
    }
  };

  return (
    <TabScreen>
      <SectionHeader
        title="Settings"
        subtitle="Manage your account and connected channels"
      />

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>D</Text>
        </View>
        <View style={styles.profileCopy}>
          <View style={{ gap: 2 }}>
            <Text style={styles.name}>{user?.name ?? "Deepak"}</Text>
            <Text style={styles.handle}>{user?.email ?? "Not available"}</Text>
          </View>

          <Text style={styles.plan}>{user?.tier ?? "CroudQ Pro"}</Text>
        </View>
        <Pressable
          style={styles.editButton}
          accessibilityRole="button"
          onPress={openEditDialog}
        >
          <PencilLine size={14} color={colors.text} />
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
      </Card>

      <Pressable style={styles.upgradeBanner} onPress={() => void openUpgradePage()}>
        <View style={styles.upgradeCopy}>
          <Text style={styles.upgradeEyebrow}>WEB ONLY</Text>
          <Text style={styles.upgradeTitle}>Upgrade to CroudQ Pro</Text>
          <Text style={styles.upgradeDescription}>
            Continue securely in your browser without signing in again.
          </Text>
        </View>
        <View style={styles.upgradeIconWrap}>
          <ArrowUpRight size={18} color={colors.white} />
        </View>
      </Pressable>

      <Card style={styles.platformCard}>
        <View style={styles.platformSection}>
          <FloatingDropdownMenu
            align="right"
            menuWidth={180}
            renderTrigger={({ isOpen, toggle }) => (
              <Pressable style={styles.platformTrigger} onPress={toggle}>
                <View style={styles.platformCopy}>
                  <View
                    style={[
                      styles.platformBadge,
                      { backgroundColor: `${activePlatform.accent}20` },
                    ]}
                  >
                    <activePlatform.Icon
                      size={20}
                      color={activePlatform.accent}
                    />
                  </View>
                  <View style={styles.platformTextWrap}>
                    <Text style={styles.platformTitle}>Currently Showing</Text>
                    <Text style={styles.platformSubtitle}>
                      Showing insights for {activePlatform.label}
                    </Text>
                  </View>
                </View>
                <ChevronDown
                  size={20}
                  color={colors.textSecondary}
                  style={isOpen ? styles.chevronOpen : undefined}
                />
              </Pressable>
            )}
          >
            {({ close }) => (
              <View style={styles.platformOptions}>
                {platformOptions.map((option) => {
                  const isActive = option.id === selectedHomePlatform;

                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.platformOption,
                        isActive ? styles.platformOptionActive : null,
                      ]}
                      onPress={() => {
                        void setSelectedHomePlatform(option.id);
                        close();
                      }}
                    >
                      <View
                        style={[
                          styles.platformOptionBadge,
                          { backgroundColor: `${option.accent}20` },
                        ]}
                      >
                        <option.Icon size={16} color={option.accent} />
                      </View>
                      <Text style={styles.platformOptionLabel}>
                        {option.label}
                      </Text>
                      {isActive ? (
                        <Check size={16} color={colors.text} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </FloatingDropdownMenu>
        </View>
      </Card>

      <View style={styles.list}>
        {accounts.map((account) => (
          <AccountConnectCard
            key={account.id}
            platform={account.platform}
            handle={account.handle}
            status={account.status}
            onPress={account.onPress}
            disabled={account.disabled}
          />
        ))}
      </View>

      <Card style={styles.settingsCard}>
        <SettingsRow
          icon={MoonStar}
          title="App theme"
          subtitle="Choose how the app should look"
          trailing={
            <FloatingDropdownMenu
              align="right"
              menuWidth={150}
              renderTrigger={({ toggle }) => (
                <Pressable style={styles.themeTrigger} onPress={toggle}>
                  <Text style={styles.themeTriggerText}>
                    {activeTheme?.label ?? "Default"}
                  </Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            >
              {({ close }) => (
                <View style={styles.themeOptions}>
                  {themeOptions.map((option) => {
                    const isActive = option.id === mode;
                    return (
                      <Pressable
                        key={option.id}
                        style={[
                          styles.themeOption,
                          isActive ? styles.themeOptionActive : null,
                        ]}
                        onPress={() => {
                          void setMode(option.id);
                          close();
                        }}
                      >
                        <option.Icon
                          size={16}
                          color={
                            isActive ? colors.primary : colors.textSecondary
                          }
                        />
                        <Text style={styles.themeOptionLabel}>
                          {option.label}
                        </Text>
                        {isActive ? (
                          <Check size={16} color={colors.primary} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </FloatingDropdownMenu>
          }
        />
        <SettingsRow
          icon={BellRing}
          title="Daily recap"
          subtitle="Get a quick update on new audience shifts"
          trailing={<Switch value />}
        />
        <SettingsRow
          icon={MessageSquare}
          title="Share feedback"
          subtitle="Tell us what needs improvement"
          onPress={openFeedbackDialog}
        />
        <SettingsRow
          icon={ShieldCheck}
          title="Privacy"
          subtitle="Review permissions and exports"
        />
        <SettingsRow
          icon={isDeletionPending ? AlertTriangle : Trash2}
          title={isDeletionPending ? "Account deletion pending" : "Delete account"}
          subtitle={
            isDeletionPending
              ? `Your account will be deleted on ${formatDeletionDate(
                  scheduledDeletionAt!,
                )}.`
              : "Request permanent account deletion"
          }
          onPress={() => setIsDeleteDialogVisible(true)}
        />
      </Card>

      <Pressable
        style={styles.logoutButton}
        onPress={() => setIsLogoutDialogVisible(true)}
      >
        <LogOut size={18} color={colors.white} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <ConfirmationDialog
        visible={isLogoutDialogVisible}
        title="Log out?"
        description="You’ll be signed out of your CroudQ account on this device."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => setIsLogoutDialogVisible(false)}
        onConfirm={() => {
          setIsLogoutDialogVisible(false);
          void (async () => {
            await logout();
            router.replace("/login");
          })();
        }}
      />

      <ConfirmationDialog
        visible={isDeleteDialogVisible}
        title={
          isDeletionPending
            ? "Cancel account deletion?"
            : "Delete account?"
        }
        description={
          isDeletionPending
            ? `Your account is scheduled for deletion on ${formatDeletionDate(
                scheduledDeletionAt!,
              )}. Canceling will keep your account active.`
            : "Your account will be scheduled for permanent deletion in 3 days. You can cancel anytime."
        }
        confirmLabel={
          isDeletionSubmitting
            ? isDeletionPending
              ? "Canceling..."
              : "Scheduling..."
            : isDeletionPending
              ? "Cancel deletion"
              : "Schedule deletion"
        }
        cancelLabel="Back"
        variant="danger"
        onCancel={() => {
          if (isDeletionSubmitting) {
            return;
          }
          setIsDeleteDialogVisible(false);
        }}
        onConfirm={() => {
          if (isDeletionSubmitting) {
            return;
          }
          void handleDeletionAction();
        }}
      />

      <DialogBox
        visible={isFeedbackDialogVisible}
        title="Share feedback"
        description="Your feedback helps us improve CroudQ."
        confirmLabel={
          submitFeedbackMutation.isPending ? "Submitting..." : "Submit"
        }
        cancelLabel="Cancel"
        confirmDisabled={submitFeedbackMutation.isPending}
        confirmLoading={submitFeedbackMutation.isPending}
        keyboardAware
        onCancel={() => {
          if (submitFeedbackMutation.isPending) {
            return;
          }
          setIsFeedbackDialogVisible(false);
        }}
        onConfirm={() => {
          void handleSubmitFeedback();
        }}
      >
        <AppTextInput
          label="Feedback"
          value={feedbackMessage}
          onChangeText={(value) => {
            setFeedbackMessage(value);
            if (feedbackError) {
              setFeedbackError("");
            }
          }}
          error={feedbackError}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={2000}
          autoCorrect
          placeholder="Share your feedback..."
          style={styles.feedbackInput}
        />
      </DialogBox>

      <DialogBox
        visible={isEditDialogVisible}
        title="Edit profile"
        description="Update your name or email"
        confirmLabel={isSavingProfile ? "Saving..." : "Save changes"}
        cancelLabel="Cancel"
        confirmDisabled={isSavingProfile}
        confirmLoading={isSavingProfile}
        keyboardAware
        onCancel={() => {
          if (isSavingProfile) {
            return;
          }
          setIsEditDialogVisible(false);
        }}
        onConfirm={() => {
          void handleSaveProfile();
        }}
      >
        <AppTextInput
          label="Name"
          value={editForm.name}
          onChangeText={(value) => updateEditField("name", value)}
          error={editErrors.name}
          autoCapitalize="words"
          textContentType="name"
          placeholder="Your name"
        />
        <AppTextInput
          label="Email"
          value={editForm.email}
          onChangeText={(value) => updateEditField("email", value)}
          error={editErrors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          placeholder="you@example.com"
        />
        <AppTextInput
          label="Current password"
          value={editForm.currentPassword}
          onChangeText={(value) => updateEditField("currentPassword", value)}
          error={editErrors.currentPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          placeholder="Enter your password"
        />
      </DialogBox>
    </TabScreen>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    avatarText: {
      color: colors.white,
      fontSize: Typography.size["3xl"],
      fontFamily: Typography.font.bold,
    },
    profileCopy: {
      flex: 1,
      gap: 5,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.s,
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.s,
      borderRadius: 14,
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    editButtonText: {
      color: colors.text,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    name: {
      color: colors.text,
      fontSize: Typography.size.xl,
      fontFamily: Typography.font.bold,
    },
    handle: {
      color: colors.textSecondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    plan: {
      color: colors.secondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    upgradeBanner: {
      padding: Spacing.l,
      borderRadius: 24,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.m,
    },
    upgradeCopy: {
      flex: 1,
      gap: 4,
    },
    upgradeEyebrow: {
      color: "rgba(255,255,255,0.72)",
      fontSize: Typography.size.xs,
      fontFamily: Typography.font.semibold,
      letterSpacing: 1,
    },
    upgradeTitle: {
      color: colors.white,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.bold,
    },
    upgradeDescription: {
      color: "rgba(255,255,255,0.82)",
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
      lineHeight: 20,
    },
    upgradeIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    list: {
      gap: 12,
    },
    settingsCard: {
      gap: 20,
    },
    feedbackInput: {
      minHeight: 140,
      paddingTop: Spacing.m,
    },
    platformCard: {
      gap: 12,
    },
    platformSection: {
      gap: 10,
    },
    platformTrigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    platformCopy: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    platformBadge: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    platformTextWrap: {
      flex: 1,
      gap: 2,
    },
    platformTitle: {
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
    platformSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
    },
    chevronOpen: {
      transform: [{ rotate: "180deg" }],
    },
    platformOptions: {},
    platformOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 14,
    },
    platformOptionActive: {
      backgroundColor: colors.cardSecondary,
    },
    platformOptionBadge: {
      width: 28,
      height: 28,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    platformOptionLabel: {
      flex: 1,
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    themeTrigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardSecondary,
    },
    themeTriggerText: {
      color: colors.text,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    themeOptions: {
      gap: 2,
    },
    themeOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 10,
    },
    themeOptionActive: {
      backgroundColor: colors.cardSecondary,
    },
    themeOptionLabel: {
      flex: 1,
      color: colors.text,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    logoutButton: {
      padding: Spacing.m,
      borderRadius: 18,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    logoutText: {
      color: colors.white,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
  });
