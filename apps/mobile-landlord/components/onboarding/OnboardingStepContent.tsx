import { AppTextInput } from "@/components/ui/AppTextInput";
import { Switch } from "@/components/ui/Switch";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { formatIndianCurrency } from "@/utils/common";
import {
  AirVent,
  BrushCleaning,
  Camera,
  Check,
  Plus,
  Trash2,
  Utensils,
  Wifi,
  X,
  Zap,
} from "lucide-react-native";
import React from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { ROOM_TYPES, type OnboardingFormData } from "./config";

type OnboardingStyles = Record<string, any>;

type OnboardingStepContentProps = {
  currentStep: number;
  formData: OnboardingFormData;
  errors: Record<string, string>;
  isEditMode: boolean;
  currLandmark: string;
  setCurrLandmark: (value: string) => void;
  currRule: string;
  setCurrRule: (value: string) => void;
  styles: OnboardingStyles;
  updateField: (key: string, value: any) => void;
  addListItem: (
    field: "landmarks" | "rules",
    value: string,
    setter: (v: string) => void,
  ) => void;
  removeListItem: (field: "landmarks" | "rules", index: number) => void;
  updateRoomsPerFloor: (index: number, value: string) => void;
  toggleRoomType: (type: string) => void;
  updateRent: (type: string, value: string) => void;
  pickImage: () => void;
  removePhoto: (index: number) => void;
  isUploadingPhotos?: boolean;
  isConvertingPhotos?: boolean;
};

export function OnboardingStepContent({
  currentStep,
  formData,
  errors,
  isEditMode,
  currLandmark,
  setCurrLandmark,
  currRule,
  setCurrRule,
  styles,
  updateField,
  addListItem,
  removeListItem,
  updateRoomsPerFloor,
  toggleRoomType,
  updateRent,
  pickImage,
  removePhoto,
  isUploadingPhotos = false,
  isConvertingPhotos = false,
}: OnboardingStepContentProps) {
  const isMediaBusy = isUploadingPhotos || isConvertingPhotos;
  const mediaStatusText = isConvertingPhotos
    ? "Converting photos..."
    : isUploadingPhotos
      ? "Uploading photos..."
      : null;

  switch (currentStep) {
    case 1:
      return (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Property Information</Text>

          <AppTextInput
            label="Property / Property Name *"
            placeholder="e.g. Sunshine Boys Hostel"
            value={formData.propertyName}
            onChangeText={(t) => updateField("propertyName", t)}
            error={errors.propertyName}
          />

          <AppTextInput
            label="In-charge Name *"
            placeholder="Full Name"
            value={formData.inchargeName}
            onChangeText={(t) => updateField("inchargeName", t)}
            error={errors.inchargeName}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppTextInput
                label="Phone Number *"
                placeholder="+91"
                keyboardType="phone-pad"
                value={formData.inchargePhone}
                onChangeText={(t) => updateField("inchargePhone", t)}
                error={errors.inchargePhone}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.typeSelector}>
              {[
                { value: "Boys", label: "Boys" },
                { value: "Girls", label: "Girls" },
                { value: "coliving", label: "Co-living" },
                { value: "PG", label: "PG" },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    formData.type === type.value && styles.typeOptionSelected,
                  ]}
                  onPress={() => updateField("type", type.value)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formData.type === type.value &&
                        styles.typeOptionTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    case 2:
      return (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location Details</Text>

          <AppTextInput
            label="Address Line *"
            placeholder="Flat / House No. / Building"
            value={formData.address1}
            onChangeText={(t) => updateField("address1", t)}
            error={errors.address1}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppTextInput
                label="City *"
                placeholder="City"
                value={formData.city}
                onChangeText={(t) => updateField("city", t)}
                error={errors.city}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppTextInput
                label="State *"
                placeholder="State"
                value={formData.state}
                onChangeText={(t) => updateField("state", t)}
                error={errors.state}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppTextInput
                label="Pincode *"
                placeholder="000000"
                keyboardType="numeric"
                value={formData.pincode}
                onChangeText={(t) => updateField("pincode", t)}
                error={errors.pincode}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppTextInput
                label="Area / Locality"
                placeholder="e.g. Indiranagar"
                value={formData.area}
                onChangeText={(t) => updateField("area", t)}
              />
            </View>
          </View>

          <View>
            <AppTextInput
              label="Google Maps Link"
              placeholder="Paste link here"
              value={formData.mapsLink}
              onChangeText={(t) => updateField("mapsLink", t)}
              error={errors.mapsLink}
            />
            <Text style={styles.helperText}>
              Optional. Helps residents find you easily.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nearby Landmarks (optional)</Text>
            <View style={[styles.addInputContainer, { alignItems: "flex-start" }]}>
              <TextInput
                style={[styles.input, { flex: 1, textAlignVertical: "top" }]}
                multiline
                placeholder="e.g. Near Metro Station"
                value={currLandmark}
                onChangeText={setCurrLandmark}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addListItem("landmarks", currLandmark, setCurrLandmark)}
              >
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {formData.landmarks.length > 0 && (
              <View style={styles.listContainer}>
                {formData.landmarks.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.listItemText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeListItem("landmarks", index)}>
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    case 3: {
      const numFloors = parseInt(formData.floors, 10) || 0;
      return (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Property Details</Text>

          <View style={styles.inputGroup}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={[styles.label, { marginBottom: 0 }]}>Number of Floors</Text>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
                onPress={() => {
                  if (isEditMode) {
                    Toast.show({
                      type: "info",
                      text1: "Cannot Edit",
                      text2: "You cannot change property structure in edit mode",
                    });
                    return;
                  }
                  updateField("includeGroundFloor", !formData.includeGroundFloor);
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: formData.includeGroundFloor
                      ? Colors.primary
                      : Colors.border,
                    backgroundColor: formData.includeGroundFloor
                      ? Colors.primary
                      : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {formData.includeGroundFloor && <Check size={12} color={Colors.white} />}
                </View>
                <Text style={styles.helperText}>Ground Floor Included</Text>
              </TouchableOpacity>
            </View>
            <AppTextInput
              keyboardType="numeric"
              placeholder="e.g 4"
              value={formData.floors}
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9]/g, "");
                if (cleaned === "" || parseInt(cleaned, 10) <= 50) {
                  updateField("floors", cleaned);
                } else {
                  Toast.show({
                    type: "error",
                    text1: "Limit Exceeded",
                    text2: "Maximum 50 floors allowed",
                  });
                }
              }}
              error={errors.floors}
              editable={!isEditMode}
            />
          </View>

          {numFloors > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rooms per Floor</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                {Array.from({ length: numFloors }).map((_, index) => {
                  let floorLabel = "";
                  if (formData.includeGroundFloor) {
                    floorLabel =
                      index === 0
                        ? "Ground Floor"
                        : index === 1
                          ? "1st Floor"
                          : index === 2
                            ? "2nd Floor"
                            : index === 3
                              ? "3rd Floor"
                              : `${index}th Floor`;
                  } else {
                    const floorNum = index + 1;
                    floorLabel =
                      floorNum === 1
                        ? "1st Floor"
                        : floorNum === 2
                          ? "2nd Floor"
                          : floorNum === 3
                            ? "3rd Floor"
                            : `${floorNum}th Floor`;
                  }

                  return (
                    <View key={index} style={{ width: "30%", minWidth: 100, flexGrow: 1 }}>
                      <AppTextInput
                        label={floorLabel}
                        keyboardType="numeric"
                        placeholder="Rooms"
                        value={formData.roomsPerFloor[index] || ""}
                        onChangeText={(t) => {
                          const cleaned = t.replace(/[^0-9]/g, "");
                          const parsed = parseInt(cleaned, 10);
                          if (
                            cleaned === "" ||
                            (Number.isFinite(parsed) && parsed >= 1 && parsed <= 50)
                          ) {
                            updateRoomsPerFloor(index, cleaned);
                          } else if (Number.isFinite(parsed) && parsed === 0) {
                            Toast.show({
                              type: "error",
                              text1: "Invalid Value",
                              text2: "At least 1 room is required per floor",
                            });
                          } else {
                            Toast.show({
                              type: "error",
                              text1: "Limit Exceeded",
                              text2: "Maximum 50 rooms per floor allowed",
                            });
                          }
                        }}
                        error={errors[`roomsPerFloor.${index}`]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Room Types Available</Text>
            <View style={styles.multiSelectContainer}>
              {ROOM_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    formData.roomTypes.includes(type) && styles.chipSelected,
                  ]}
                  onPress={() => toggleRoomType(type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.roomTypes.includes(type) && styles.chipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                  {formData.roomTypes.includes(type) && (
                    <Check size={14} color={Colors.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {formData.roomTypes.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rent Details (Per Bed / Month)</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.m,
                }}
              >
                {formData.roomTypes.map((type) => (
                  <View key={type} style={{ width: "47%", minWidth: 150, flexGrow: 1 }}>
                    <AppTextInput
                      label={type}
                      keyboardType="numeric"
                      placeholder="₹ Amount"
                      value={
                        formData.rents[type]
                          ? formatIndianCurrency(formData.rents[type])
                          : ""
                      }
                      onChangeText={(t) => {
                        const cleaned = t.replace(/[^0-9]/g, "");
                        if (cleaned === "" || parseInt(cleaned, 10) <= 200000) {
                          updateRent(type, cleaned);
                        } else {
                          Toast.show({
                            type: "error",
                            text1: "Limit Exceeded",
                            text2: "Maximum rent ₹2,00,000 allowed",
                          });
                        }
                      }}
                      error={errors[`rents.${type}`]}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      );
    }
    case 4:
      return (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.switchContainer}>
            {[
              {
                key: "electricity",
                label: "24x7 Electricity",
                icon: <Zap size={20} color={Colors.primary} />,
              },
              {
                key: "hotWater",
                label: "Hot / Heated Water",
                icon: <Utensils size={20} color={Colors.primary} />,
              },
              {
                key: "wifi",
                label: "Wi-Fi Internet",
                icon: <Wifi size={20} color={Colors.primary} />,
              },
              {
                key: "ac",
                label: "AC Rooms Available",
                icon: <AirVent size={20} color={Colors.primary} />,
              },
              {
                key: "powerBackup",
                label: "Power Backup",
                icon: <Zap size={20} color={Colors.primary} />,
              },
              {
                key: "food",
                label: "Food / Mess Facility",
                icon: <Utensils size={20} color={Colors.primary} />,
              },
              {
                key: "housekeeping",
                label: "Daily Housekeeping",
                icon: <BrushCleaning size={20} color={Colors.primary} />,
              },
              {
                key: "cctv",
                label: "CCTV Security",
                icon: <Camera size={20} color={Colors.primary} />,
              },
            ].map((item: any) => (
              <View key={item.key} style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  {item.icon}
                  <Text style={styles.switchLabel}>{item.label}</Text>
                </View>
                <Switch
                  value={!!formData[item.key as keyof typeof formData]}
                  onValueChange={(v) => updateField(item.key, v)}
                />
              </View>
            ))}
          </View>
        </View>
      );
    case 5:
      return (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Rules & Policies (Optional)</Text>
          <Text style={styles.helperText}>
            Set clear expectations for your residents.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Rules / Notes</Text>
            <View style={[styles.addInputContainer, { alignItems: "flex-start" }]}>
              <TextInput
                style={[styles.input, { flex: 1, textAlignVertical: "top" }]}
                multiline
                placeholder="e.g. Gates close at 10 PM"
                value={currRule}
                onChangeText={setCurrRule}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addListItem("rules", currRule, setCurrRule)}
              >
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {formData.rules.length > 0 && (
              <View style={styles.listContainer}>
                {formData.rules.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.listItemText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeListItem("rules", index)}>
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    case 6:
      return (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Photos & Media</Text>
          <Text style={styles.helperText}>
            Upload good quality photos to attract more residents.
          </Text>

          <TouchableOpacity
            style={[styles.uploadBox, isMediaBusy && { opacity: 0.7 }]}
            onPress={pickImage}
            disabled={isMediaBusy}
          >
            {formData.photos.length > 0 ? (
              <Image source={{ uri: formData.photos[0] }} style={styles.mainPhoto} />
            ) : (
              <>
                <Camera size={40} color={Colors.textSecondary} />
                <Text style={styles.uploadText}>Property Front View (Required)</Text>
                <Text style={styles.uploadSubText}>Tap to upload</Text>
              </>
            )}
          </TouchableOpacity>

          {mediaStatusText ? (
            <Text style={styles.mediaStatusText}>{mediaStatusText}</Text>
          ) : null}

          <Text style={[styles.label, { marginTop: Spacing.l }]}>Room Photos</Text>
          <View style={styles.photoGrid}>
            <TouchableOpacity
              style={[styles.miniUploadBox, isMediaBusy && { opacity: 0.7 }]}
              onPress={pickImage}
              disabled={isMediaBusy}
            >
              <Plus size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            {formData.photos.map((uri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <X size={12} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      );
    case 7:
      return (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Review Information</Text>
          <Text style={styles.helperText}>
            Please review all details before submitting.
          </Text>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionHeader}>Basic Details</Text>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Property Name</Text>
              <Text style={styles.reviewValue}>{formData.propertyName || "N/A"}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Type</Text>
              <Text style={styles.reviewValue}>{formData.type || "N/A"}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Incharge</Text>
              <Text style={styles.reviewValue}>{formData.inchargeName || "N/A"}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Phone</Text>
              <Text style={styles.reviewValue}>{formData.inchargePhone || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionHeader}>Location</Text>
            <Text style={styles.reviewValue}>
              {[
                formData.address1,
                formData.area,
                formData.city,
                formData.state,
                formData.pincode,
              ]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </Text>
            {formData.landmarks.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.reviewLabel}>Landmarks</Text>
                {formData.landmarks.map((item, index) => (
                  <View key={index} style={styles.reviewListItem}>
                    <View style={styles.reviewBullet} />
                    <Text style={styles.reviewValueSm}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionHeader}>Property Stats</Text>
            {(() => {
              const floorsCount = parseInt(formData.floors || "0", 10) || 0;
              const roomsTotal = Object.values(formData.roomsPerFloor || {}).reduce(
                (sum, value) => sum + (parseInt(value || "0", 10) || 0),
                0,
              );

              return (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{roomsTotal}</Text>
                    <Text style={styles.statLabel}>Rooms</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{floorsCount || "0"}</Text>
                    <Text style={styles.statLabel}>Floors</Text>
                  </View>
                </View>
              );
            })()}

            {formData.floors && parseInt(formData.floors, 10) > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.reviewLabel}>Rooms Layout</Text>
                {Array.from({ length: parseInt(formData.floors, 10) }).map((_, index) => {
                  let floorLabel = "";
                  if (formData.includeGroundFloor) {
                    floorLabel =
                      index === 0
                        ? "Ground Floor"
                        : index === 1
                          ? "1st Floor"
                          : index === 2
                            ? "2nd Floor"
                            : index === 3
                              ? "3rd Floor"
                              : `${index}th Floor`;
                  } else {
                    const floorNum = index + 1;
                    floorLabel =
                      floorNum === 1
                        ? "1st Floor"
                        : floorNum === 2
                          ? "2nd Floor"
                          : floorNum === 3
                            ? "3rd Floor"
                            : `${floorNum}th Floor`;
                  }
                  const roomCount = formData.roomsPerFloor[index] || "0";

                  return (
                    <View key={index} style={styles.reviewRowSm}>
                      <Text style={styles.reviewValueSm}>{floorLabel}</Text>
                      <Text style={styles.reviewValueSm}>{roomCount} Rooms</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {formData.roomTypes.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.reviewLabel}>Rent Config</Text>
                {formData.roomTypes.map((type) => (
                  <View key={type} style={styles.reviewRowSm}>
                    <Text style={styles.reviewValueSm}>{type}</Text>
                    <Text style={styles.reviewValueSm}>
                      {formatIndianCurrency(formData.rents[type] || "0")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionHeader}>Facilities</Text>
            <View style={styles.tagsContainer}>
              {[
                { key: "electricity", label: "Electricity" },
                { key: "powerBackup", label: "Power Backup" },
                { key: "hotWater", label: "Hot Water" },
                { key: "wifi", label: "WiFi" },
                { key: "ac", label: "AC" },
                { key: "food", label: "Food" },
                { key: "housekeeping", label: "Housekeeping" },
                { key: "cctv", label: "CCTV" },
                { key: "laundry", label: "Laundry" },
                { key: "parking", label: "Parking" },
                { key: "lift", label: "Lift" },
              ]
                .filter((f) => formData[f.key as keyof typeof formData])
                .map((f) => (
                  <View key={f.key} style={styles.tag}>
                    <Text style={styles.tagText}>{f.label}</Text>
                  </View>
                ))}
            </View>
          </View>

          {formData.rules.length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionHeader}>Rules</Text>
              {formData.rules.map((item, index) => (
                <View key={index} style={styles.reviewListItem}>
                  <View style={styles.reviewBullet} />
                  <Text style={styles.reviewValueSm}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {formData.photos.length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionHeader}>Photos ({formData.photos.length})</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {formData.photos.map((uri, index) => (
                    <Image
                      key={index}
                      source={{ uri }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        backgroundColor: Colors.accent,
                      }}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      );
    default:
      return null;
  }
}
