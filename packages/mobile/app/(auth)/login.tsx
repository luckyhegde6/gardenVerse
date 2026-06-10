import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useAuthStore } from "../../src/stores/authStore";
import { validateEmail, validatePassword } from "../../src/utils/validation";
import { colors, spacing, typography, globalStyles } from "../../src/styles/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validate = (): boolean => {
    const e = validateEmail(email);
    const p = validatePassword(password);
    setEmailError(e || "");
    setPasswordError(p || "");
    return !e && !p;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    try {
      await login({ email, password });
      router.replace("/(tabs)/garden");
    } catch {
      // noop
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.logo}>🌿</Text>
            <Text style={styles.title}>GardenVerse</Text>
            <Text style={styles.subtitle}>Cultivate. Connect. Thrive.</Text>
          </View>

          {error && (
            <View style={globalStyles.errorBox}>
              <Text style={globalStyles.errorBoxText}>{error}</Text>
            </View>
          )}

          <Input
            label="Email or Username"
            placeholder="Enter your email or username"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setEmailError("");
              clearError();
            }}
            error={emailError}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setPasswordError("");
              clearError();
            }}
            error={passwordError}
            isPassword
          />

          <Link href="/(auth)/forgot-password" style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Link>

          <Button
            title="Login"
            onPress={handleLogin}
            isLoading={isLoading}
            size="lg"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register">
              <Text style={styles.footerLink}>Create one</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl + spacing.sm,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.sm + 4,
  },
  title: {
    ...typography.h1,
    color: colors.primaryDark,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  footerText: {
    ...typography.bodySmall,
  },
  footerLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
});
