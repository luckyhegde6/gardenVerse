import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardTypeOptions,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "../../styles/theme";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  isPassword?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  leftIcon?: string;
  /** @deprecated Use StyleSheet instead of className */
  className?: string;
  /** @deprecated Use editable via ...rest */
  editable?: boolean;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  isPassword = false,
  autoCapitalize = "none",
  keyboardType = "default",
  multiline = false,
  leftIcon,
  className: _className,
  editable,
  ...rest
}: InputProps & Record<string, unknown>) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const containerStyles = [
    styles.container,
    isFocused && styles.containerFocused,
    error ? styles.containerError : null,
    multiline && styles.containerMultiline,
  ];

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={containerStyles}>
        {leftIcon ? <Text style={styles.leftIcon}>{leftIcon}</Text> : null}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label || placeholder}
          editable={editable}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            accessibilityRole="button"
          >
            <Text style={styles.passwordToggleText}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default Input;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs + 2,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  containerFocused: {
    borderColor: colors.borderFocus,
  },
  containerError: {
    borderColor: colors.error,
  },
  containerMultiline: {
    height: 120,
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
  },
  leftIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: 100,
    paddingTop: 0,
  },
  passwordToggle: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  passwordToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
