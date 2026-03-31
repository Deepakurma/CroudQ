import { AppColors } from "@/constants/Colors";
import { CardShadow } from "@/constants/Shadows";
import { useAppTheme } from "@/context/ThemeContext";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutRectangle,
  type ViewStyle,
} from "react-native";

type FloatingDropdownMenuProps = {
  renderTrigger: (args: {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
  }) => React.ReactNode;
  children: (args: { close: () => void }) => React.ReactNode;
  menuWidth?: number;
  align?: "left" | "right";
  offset?: number;
};

const SCREEN_PADDING = 14;

export function FloatingDropdownMenu({
  renderTrigger,
  children,
  menuWidth = 220,
  align = "right",
  offset = 8,
}: FloatingDropdownMenuProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const triggerRef = useRef<View>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);

  const close = () => setIsOpen(false);

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setIsOpen(true);
    });
  };

  const toggle = () => {
    if (isOpen) {
      close();
      return;
    }

    open();
  };

  const menuPosition = useMemo<ViewStyle | null>(() => {
    if (!anchor) {
      return null;
    }

    const screenWidth = Dimensions.get("window").width;

    if (align === "right") {
      const desiredRight = screenWidth - (anchor.x + anchor.width);
      const right = Math.max(0, Math.min(desiredRight, screenWidth - menuWidth));

      return {
        top: anchor.y + anchor.height + offset,
        right,
        width: menuWidth,
      };
    }

    const left = Math.max(
      SCREEN_PADDING,
      Math.min(anchor.x, screenWidth - menuWidth - SCREEN_PADDING),
    );

    return {
      top: anchor.y + anchor.height + offset,
      left,
      width: menuWidth,
    };
  }, [align, anchor, menuWidth, offset]);

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        {renderTrigger({ isOpen, toggle, close })}
      </View>

      <Modal
        transparent
        visible={isOpen}
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.overlay} onPress={close}>
          {menuPosition ? (
            <Pressable style={[styles.menu, menuPosition]} onPress={() => null}>
              {children({ close })}
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "transparent",
    },
    menu: {
      position: "absolute",
      padding: 8,
      borderRadius: 22,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      ...CardShadow,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  });
