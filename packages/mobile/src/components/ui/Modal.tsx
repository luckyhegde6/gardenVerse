import React, { useEffect } from "react";
import {
  View,
  Modal as RNModal,
  Dimensions,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SPACING, BORDER_RADIUS, useThemeColors } from "@/styles/tokens";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function Modal({
  visible,
  onClose,
  children,
  height = "auto",
}: ModalProps) {
  const colors = useThemeColors();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    }
  }, [visible, translateY]);

  const handleClose = () => {
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: 250 },
      () => {
        runOnJS(onClose)();
      }
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                animatedStyle,
                { backgroundColor: colors.surface },
                height !== "auto" ? { height: height as number } : undefined,
              ]}
            >
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

export default Modal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
});
