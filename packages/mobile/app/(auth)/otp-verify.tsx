import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { Button } from "../../src/components/ui/Button";
import AuthService from "../../src/services/auth";
import { colors, spacing, borderRadius, typography, globalStyles } from "../../src/styles/theme";

export default function OTPVerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }, index: number) => {
    if (nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await AuthService.verifyOTP({ email, otp: code });
      router.replace("/(auth)/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await AuthService.requestPasswordReset({ email });
    } catch {
      // noop
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

          <Text style={styles.heading}>Verify OTP</Text>
          <Text style={styles.description}>
            Enter the 6-digit code sent to {email}
          </Text>

          {error && (
            <View style={globalStyles.errorBox}>
              <Text style={globalStyles.errorBoxText}>{error}</Text>
            </View>
          )}

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <Button
            title="Verify"
            onPress={handleVerify}
            isLoading={isLoading}
            size="lg"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.footerLink}>Resend</Text>
            </TouchableOpacity>
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
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
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
