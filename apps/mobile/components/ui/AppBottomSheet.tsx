import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AppBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
  onClose?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  enableDynamicSizing?: boolean;
  onChange?: (index: number) => void;
}

export const AppBottomSheet = forwardRef<BottomSheetModal, AppBottomSheetProps>(
  (
    {
      children,
      snapPoints = ["50%"],
      onClose,
      contentContainerStyle,
      enableDynamicSizing = false,
      onChange,
    },
    ref,
  ) => {
    const points = useMemo(
      () => (enableDynamicSizing ? undefined : snapPoints),
      [snapPoints, enableDynamicSizing],
    );
    const { top } = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={enableDynamicSizing ? undefined : 0}
        snapPoints={points}
        onChange={onChange}
        enableDynamicSizing={enableDynamicSizing}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: Colors.textSecondary,
          width: 40,
        }}
        backgroundStyle={{
          backgroundColor: Colors.white,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        onDismiss={onClose}
        topInset={top}
      >
        <BottomSheetScrollView
          style={styles.container}
          contentContainerStyle={[
            {
              padding: Spacing.xl,
            },
            contentContainerStyle,
          ]}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
