import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { validateEmail } from '../../utils/validation';
import { AuthStackParamList } from '../../types';
import AuthService from '../../services/auth';

type ForgotPasswordNavProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavProp>();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const e = validateEmail(email);
    setEmailError(e || '');
    if (e) return;

    setIsLoading(true);
    setError('');
    try {
      await AuthService.requestPasswordReset({ email });
      setIsSent(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to send reset email'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
            <Text className="text-gray-500 text-lg">←</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-1">
            Reset Password
          </Text>
          <Text className="text-sm text-gray-500 mb-8">
            Enter your email and we'll send you a reset link
          </Text>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          {isSent ? (
            <View className="items-center py-8">
              <Text className="text-5xl mb-4">📧</Text>
              <Text className="text-lg font-semibold text-gray-900 text-center">
                Check your email
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-2 mb-6">
                We've sent a password reset link to {email}
              </Text>
              <Button
                title="Back to Login"
                onPress={() => navigation.navigate('Login')}
                variant="outline"
              />
            </View>
          ) : (
            <>
              <Input
                label="Email"
                placeholder="Enter your email address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setEmailError('');
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

              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-500 text-sm">
                  Remember your password?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text className="text-primary-600 text-sm font-semibold">
                    Login
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
