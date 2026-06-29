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
import { COLORS, SPACING, BORDER_RADIUS } from "@/styles/tokens";

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
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                animatedStyle,
                height !== "auto" ? { height: height as number } : undefined,
              ]}
            >
              <View style={styles.handle} />
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
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
});
