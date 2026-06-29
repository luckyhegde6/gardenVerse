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
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { validateEmail } from "@utils/validation";
import AuthService from "@services/auth";
import { colors, spacing, typography, globalStyles } from "@/styles/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const e = validateEmail(email);
    setEmailError(e || "");
    if (e) return;

    setIsLoading(true);
    setError("");
    try {
      await AuthService.requestPasswordReset({ email });
      setIsSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
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
          <Link href="/(auth)/login" style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Link>

          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.description}>
            Enter your email and we'll send you a reset link
          </Text>

          {error && (
            <View style={globalStyles.errorBox}>
              <Text style={globalStyles.errorBoxText}>{error}</Text>
            </View>
          )}

          {isSent ? (
            <View style={styles.sentContainer}>
              <Text style={styles.sentIcon}>📧</Text>
              <Text style={styles.sentTitle}>Check your email</Text>
              <Text style={styles.sentDescription}>
                We've sent a password reset link to {email}
              </Text>
              <Button title="Back to Login" variant="outline" onPress={() => router.push("/(auth)/login")} />
            </View>
          ) : (
            <>
              <Input
                label="Email"
                placeholder="Enter your email address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setEmailError("");
                }}
                error={emailError}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Button
                title="Send Reset Link"
                onPress={handleSubmit}
                isLoading={isLoading}
                size="lg"
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <Link href="/(auth)/login">
                  <Text style={styles.footerLink}>Login</Text>
                </Link>
              </View>
            </>
          )}
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
    paddingVertical: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodySmall,
    marginBottom: spacing.xl,
  },
  sentContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  sentIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  sentTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: "center",
  },
  sentDescription: {
    ...typography.bodySmall,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
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
