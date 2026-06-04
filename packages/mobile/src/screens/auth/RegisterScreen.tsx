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
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuthStore } from "../../stores/authStore";
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateConfirmPassword,
  validateInviteCode,
} from "../../utils/validation";
import { AuthStackParamList } from "../../types";

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, "Register">;

export function RegisterScreen() {
  const navigation = useNavigation<RegisterNavProp>();
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
      navigation.navigate('OTPVerify', { email });
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
            Create Account
          </Text>
          <Text className="text-sm text-gray-500 mb-8">
            Join the GardenVerse community
          </Text>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
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
            className="flex-row items-center mb-6"
          >
            <View
              className={`w-5 h-5 rounded border-2 items-center justify-center ${
                acceptTerms
                  ? "bg-primary-600 border-primary-600"
                  : "border-gray-300"
              }`}
            >
              {acceptTerms && <Text className="text-white text-xs">✓</Text>}
            </View>
            <Text className="text-sm text-gray-600 ml-2 flex-1">
              I accept the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>
          {errors.terms && (
            <Text className="text-red-500 text-xs -mt-4 mb-4">
              {errors.terms}
            </Text>
          )}

          <Button
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            size="lg"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 text-sm">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text className="text-primary-600 text-sm font-semibold">
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
