import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRouter } from "expo-router";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuthStore } from "../../stores/authStore";
import { validateEmail, validatePassword } from "../../utils/validation";
import { AuthStackParamList } from "../../types";

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

export function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const isBlockedError = error?.toLowerCase().includes("account blocked") || error?.toLowerCase().includes("blocked");

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
    } catch {
      // noop
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
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-10">
            <Text className="text-6xl mb-3">🌿</Text>
            <Text className="text-3xl font-bold text-primary-800">
              GardenVerse
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Cultivate. Connect. Thrive.
            </Text>
          </View>

          {error && (
            <View className={`rounded-xl px-4 py-3 mb-4 ${isBlockedError ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
              <Text className={`text-sm ${isBlockedError ? 'text-amber-800' : 'text-red-700'}`}>{error}</Text>
              {isBlockedError && (
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/support")}
                  className="mt-2"
                >
                  <Text className="text-primary-600 text-sm font-semibold underline">
                    Contact Support
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Input
            testID="login-email"
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
            testID="login-password"
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

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            className="self-end mb-6"
          >
            <Text className="text-primary-600 text-sm font-medium">
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button
            testID="login-button"
            title="Login"
            onPress={handleLogin}
            isLoading={isLoading}
            size="lg"
          />

          <View className="flex-row justify-center mt-6 mb-4">
            <Text className="text-gray-500 text-sm">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text className="text-primary-600 text-sm font-semibold">
                Create one
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
