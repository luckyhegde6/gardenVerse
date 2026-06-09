import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity } from "react-native";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

interface ToastProps extends ToastConfig {
  visible: boolean;
}

const typeStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "bg-green-500", icon: "✓" },
  error: { bg: "bg-red-500", icon: "✕" },
  warning: { bg: "bg-yellow-500", icon: "⚠" },
  info: { bg: "bg-blue-500", icon: "ℹ" },
};

export function Toast({
  message,
  type = "info",
  visible,
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss?.());
  };

  const tStyle = typeStyles[type];

  return (
    <Animated.View
      className="absolute top-12 left-4 right-4 z-50"
      style={{
        transform: [{ translateY }],
        opacity,
      }}
    >
      <TouchableOpacity
        onPress={hide}
        activeOpacity={0.9}
        className={`flex-row items-center ${tStyle.bg} rounded-xl px-4 py-3 shadow-lg`}
      >
        <Text className="text-white text-lg font-bold mr-2">{tStyle.icon}</Text>
        <Text className="text-white text-sm font-medium flex-1">{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function useToast() {
  const [toast, setToast] = React.useState<ToastConfig | null>(null);

  const show = React.useCallback((config: ToastConfig) => {
    setToast(config);
  }, []);

  const hide = React.useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    show,
    hide,
    ToastComponent: toast ? (
      <Toast {...toast} visible={!!toast} onDismiss={hide} />
    ) : null,
  };
}
