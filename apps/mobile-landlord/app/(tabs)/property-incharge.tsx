import { EmptyState } from "@/components/EmptyState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useProperty } from "@/context/PropertyContext";
import { trpc } from "@/utils/api";
import { validateSchema } from "@/utils/validation";
import {
  Building2,
  Pencil,
  Phone,
  UserRound,
  UserRoundPen,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { z } from "zod";

const inchargeSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid phone number (10 digits required)"),
});

export default function PropertyInchargeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const { selectedPropertyId } = useProperty();
  const utils = trpc.useUtils();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    data: propertyData,
    isLoading,
    isFetching,
  } = trpc.property.getPropertyDetails.useQuery(undefined, {
    enabled: !!selectedPropertyId,
  });

  const updateInchargeMutation = trpc.property.updateIncharge.useMutation({
    onSuccess: async () => {
      await utils.property.getPropertyDetails.invalidate();
      setIsEditing(false);
      setErrors({});
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Property in-charge updated successfully",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Failed to update property in-charge. Please try again.",
      });
    },
  });

  const currentIncharge = {
    name: propertyData?.inchargeName || "",
    phone: propertyData?.inchargePhone || "",
  };

  const updateField = (key: "name" | "phone", value: string) => {
    const nextValue =
      key === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prev) => ({ ...prev, [key]: nextValue }));

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleEditPress = () => {
    setFormData(currentIncharge);
    setErrors({});
    setIsEditing(true);
  };

  const handleSave = () => {
    const result = validateSchema(inchargeSchema, formData);

    if (!result.success) {
      setErrors(result.errors || {});
      return;
    }

    updateInchargeMutation.mutate({
      inchargeName: formData.name.trim(),
      inchargePhone: formData.phone,
    });
  };

  const handleCall = () => {
    if (!currentIncharge.phone) {
      Toast.show({
        type: "error",
        text1: "Phone Number Missing",
        text2: "No in-charge phone number found for this property",
      });
      return;
    }

    Linking.openURL(`tel:${currentIncharge.phone}`);
  };

  if (!selectedPropertyId) {
    return (
      <ScreenWrapper title="Property Incharge" scrollY={scrollY}>
        <EmptyState
          icon={Building2}
          title="No Property Selected"
          description="Please select a property from dashboard to manage in-charge details."
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Property Incharge" scrollY={scrollY}>
      <View style={[styles.container, { paddingTop: headerHeight }]}>
        <View style={styles.viewContainer}>
          {isLoading || isFetching ? (
            <View style={styles.skeletonCard}>
              {/* Header: Avatar + Info */}
              <View style={styles.skeletonHeader}>
                <SkeletonLoader width={48} height={48} borderRadius={12} />
                <View style={{ gap: 8 }}>
                  <SkeletonLoader width={150} height={20} borderRadius={4} />
                  <SkeletonLoader width={120} height={20} borderRadius={8} />
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: Colors.border,
                  width: "100%",
                }}
              />

              {/* Footer Actions */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  paddingTop: 4,
                }}
              >
                <SkeletonLoader width="90%" height={30} borderRadius={18} />
              </View>
            </View>
          ) : (
            <>
              {!isEditing ? (
                <>
                  <View style={styles.cardHeader}>
                    <UserRound size={24} color={Colors.primary} />
                    <Text style={styles.cardTitle}>Current In-Charge</Text>
                  </View>

                  <View style={styles.contactDetails}>
                    <View>
                      <Text style={styles.label}>Name</Text>
                      <Text style={styles.value}>
                        {currentIncharge.name || "Not set"}
                      </Text>
                      <Text style={styles.label}>Phone</Text>
                      <Text style={styles.subValue}>
                        {currentIncharge.phone
                          ? `+91 ${currentIncharge.phone}`
                          : "Not set"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={handleCall}
                      disabled={!currentIncharge.phone}
                    >
                      <Phone size={20} color={Colors.white} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleEditPress}
                  >
                    <Pencil size={18} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Change Incharge</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.cardHeader}>
                    <UserRoundPen size={24} color={Colors.primary} />
                    <Text style={styles.cardTitle}>
                      Update In-Charge Details
                    </Text>
                  </View>

                  <AppTextInput
                    label="Full Name"
                    placeholder="Ex. Rajesh Singh"
                    value={formData.name}
                    onChangeText={(value) => updateField("name", value)}
                    error={errors.name}
                  />

                  <AppTextInput
                    label="Phone Number"
                    placeholder="10-digit phone number"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    error={errors.phone}
                  />

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setIsEditing(false);
                        setErrors({});
                      }}
                      disabled={updateInchargeMutation.isPending}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        updateInchargeMutation.isPending
                          ? styles.submitBtnDisabled
                          : null,
                      ]}
                      onPress={handleSave}
                      disabled={updateInchargeMutation.isPending}
                    >
                      {updateInchargeMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text style={styles.submitBtnText}>Save Update</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewContainer: {
    marginHorizontal: Spacing.l,
    gap: Spacing.m,
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
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  contactDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.s,
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
  label: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.bold,
    color: Colors.text,
    marginBottom: Spacing.s,
  },
  subValue: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.m,
    marginTop: Spacing.s,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    color: Colors.text,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },

  skeletonCard: {
    gap: Spacing.m,
  },
  skeletonHeader: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
  },
});
