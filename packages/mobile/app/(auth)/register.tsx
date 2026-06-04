import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useAuthStore } from "../../src/stores/authStore";
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateConfirmPassword,
  validateInviteCode,
} from "../../src/utils/validation";
import { colors, spacing, borderRadius, typography, globalStyles } from "../../src/styles/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {
      username: validateUsername(username) || "",
      email: validateEmail(email) || "",
      password: validatePassword(password) || "",
      confirmPassword: validateConfirmPassword(password, confirmPassword) || "",
      inviteCode: inviteCode ? validateInviteCode(inviteCode) || "" : "",
      terms: acceptTerms ? "" : "You must accept the terms",
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    try {
      await register({
        username,
        email,
        password,
        inviteCode: inviteCode || undefined,
      });
      // TODO: Re-enable OTP verify redirect when SMTP/email service is configured
      // router.push({ pathname: "/(auth)/otp-verify", params: { email } });
      router.replace("/(auth)/login");
    } catch {}
  };

  const updateField = (field: string, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
    clearError();
    switch (field) {
      case "username":
        setUsername(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      case "inviteCode":
        setInviteCode(value);
        break;
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

          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.description}>Join the GardenVerse community</Text>

          {error && (
            <View style={globalStyles.errorBox}>
              <Text style={globalStyles.errorBoxText}>{error}</Text>
            </View>
          )}

          <Input
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChangeText={(t) => updateField("username", t)}
            error={errors.username}
            autoCapitalize="none"
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(t) => updateField("email", t)}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="Min 8 chars with a number"
            value={password}
            onChangeText={(t) => updateField("password", t)}
            error={errors.password}
            isPassword
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={(t) => updateField("confirmPassword", t)}
            error={errors.confirmPassword}
            isPassword
          />

          <Input
            label="Invite Code (optional)"
            placeholder="Enter invite code"
            value={inviteCode}
            onChangeText={(t) => updateField("inviteCode", t)}
            error={errors.inviteCode}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            onPress={() => setAcceptTerms(!acceptTerms)}
            style={styles.termsRow}
          >
            <View
              style={[
                styles.checkbox,
                acceptTerms && styles.checkboxChecked,
              ]}
            >
              {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I accept the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>
          {errors.terms && (
            <Text style={styles.errorText}>{errors.terms}</Text>
          )}

          <Button
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            size="lg"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text style={styles.footerLink}>Login</Text>
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
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  termsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: -spacing.sm - 4,
    marginBottom: spacing.md,
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
