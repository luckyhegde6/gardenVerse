import React, { useCallback, useRef, useEffect } from "react";
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from "@/styles/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CommunitySearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

function CommunitySearchBarComponent({
  value,
  onChangeText,
  placeholder = "Search gardeners, groups, events...",
}: CommunitySearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const borderColor = useSharedValue<string>(COLORS.border);
  const scale = useSharedValue(1);
  const clearScale = useSharedValue(1);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const clearAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clearScale.value }],
  }));

  const handleFocus = useCallback(() => {
    borderColor.value = withSpring(COLORS.primary, {
      damping: 15,
      stiffness: 300,
    });
    scale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
  }, [borderColor, scale]);

  const handleBlur = useCallback(() => {
    borderColor.value = withSpring(COLORS.border, {
      damping: 15,
      stiffness: 300,
    });
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [borderColor, scale]);

  const handleChange = useCallback(
    (text: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChangeText(text);
      }, 300);
    },
    [onChangeText],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    onChangeText("");
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleClearPressIn = useCallback(() => {
    clearScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  }, [clearScale]);

  const handleClearPressOut = useCallback(() => {
    clearScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [clearScale]);

  const hasText = value.length > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedBorderStyle,
        animatedScaleStyle,
      ]}
    >
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {hasText && (
        <AnimatedPressable
          style={[styles.clearButton, clearAnimatedStyle]}
          onPress={handleClear}
          onPressIn={handleClearPressIn}
          onPressOut={handleClearPressOut}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearIcon}>✕</Text>
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}

export const CommunitySearchBar = React.memo(CommunitySearchBarComponent);
export default CommunitySearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
  },
  searchIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: SPACING.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
