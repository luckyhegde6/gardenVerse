import React, { useEffect, useRef } from "react";
import {
  View,
  Modal as RNModal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";

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
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback>
            <Animated.View
              className="bg-white rounded-t-3xl p-6"
              style={[
                { transform: [{ translateY }] },
                height !== "auto" ? { height: height as number } : undefined,
              ]}
            >
              <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-4" />
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
