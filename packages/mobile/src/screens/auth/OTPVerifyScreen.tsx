import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Button } from "../../components/ui/Button";
import { AuthStackParamList } from "../../types";
import AuthService from "../../services/auth";
type OTPVerifyRouteProp = RouteProp<AuthStackParamList, "OTPVerify">;

export function OTPVerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute<OTPVerifyRouteProp>();
  const { email } = route.params;

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

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
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
      const response = await AuthService.verifyOTP({ email, otp: code });
      navigation.goBack();
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-8">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mb-6"
          >
            <Text className="text-gray-500 text-lg">←</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-1">
            Verify OTP
          </Text>
          <Text className="text-sm text-gray-500 mb-8">
            Enter the 6-digit code sent to {email}
          </Text>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          <View className="flex-row justify-between mb-8">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                className="w-12 h-14 bg-gray-50 border border-gray-300 rounded-xl text-center text-xl font-bold text-gray-900"
                value={digit}
                onChangeText={(v) => handleOtpChange(v, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
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

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 text-sm">
              Didn't receive the code?{" "}
            </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text className="text-primary-600 text-sm font-semibold">
                Resend
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
