import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import api from "@services/api";

export function SupportScreen() {
  const navigation = useNavigation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError("Please describe your issue (at least 10 characters)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.post("/admin/support/tickets", {
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">✅</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Ticket Submitted
          </Text>
          <Text className="text-gray-500 text-center mb-8 leading-5">
            Your support request has been received. Our team will review it and
            get back to you via email.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.goBack()}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

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
          <View className="items-center mb-8">
            <Text className="text-6xl mb-3">🆘</Text>
            <Text className="text-2xl font-bold text-primary-800">
              Contact Support
            </Text>
            <Text className="text-sm text-gray-500 mt-1 text-center">
              Having trouble? Our team is here to help.
            </Text>
          </View>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          <Input
            label="Subject"
            placeholder="Brief description of your issue"
            value={subject}
            onChangeText={(t) => {
              setSubject(t);
              setError("");
            }}
            autoCapitalize="sentences"
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">
              Message
            </Text>
            <TextInputStyled
              placeholder="Describe your issue in detail..."
              value={message}
              onChangeText={(t) => {
                setMessage(t);
                setError("");
              }}
              multiline
              numberOfLines={5}
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-base min-h-[120px]"
              textAlignVertical="top"
            />
          </View>

          <Button
            title="Submit Ticket"
            onPress={handleSubmit}
            isLoading={isLoading}
            size="lg"
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="items-center mt-4"
          >
            <Text className="text-primary-600 text-sm font-medium">
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TextInputStyled(props: { placeholder?: string; value: string; onChangeText: (text: string) => void; multiline?: boolean; numberOfLines?: number; className?: string; textAlignVertical?: "auto" | "top" | "bottom" | "center" }) {
  return <TextInput {...props} />;
}
