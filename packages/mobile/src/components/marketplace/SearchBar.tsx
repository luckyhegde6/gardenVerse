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

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function SearchBarComponent({
  value,
  onChangeText,
  placeholder = "Search listings...",
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const borderColor = useSharedValue<string>(COLORS.border);
  const scale = useSharedValue(1);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleFocus = useCallback(() => {
    borderColor.value = withSpring(COLORS.primary, { damping: 15, stiffness: 300 });
    scale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
  }, [borderColor, scale]);

  const handleBlur = useCallback(() => {
    borderColor.value = withSpring(COLORS.border, { damping: 15, stiffness: 300 });
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [borderColor, scale]);

  const handleChange = useCallback(
    (text: string) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        onChangeText(text);
      }, 300);
    },
    [onChangeText]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    onChangeText("");
    inputRef.current?.focus();
  }, [onChangeText]);

  const hasText = value.length > 0;

  return (
    <Animated.View style={[styles.container, animatedBorderStyle, animatedScaleStyle]}>
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
        <Pressable
          style={styles.clearButton}
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearIcon}>✕</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

export const SearchBar = React.memo(SearchBarComponent);
export default SearchBar;

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
