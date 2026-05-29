import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase.js';

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('user already registered') || msg.includes('already been registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (msg.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('password')) {
      return 'Your password does not meet security requirements.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export default function RegisterScreen() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (formData: RegisterFormData) => {
    setAuthError(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setAuthError(getAuthErrorMessage(error));
    } else {
      setSuccessMessage('Account created! Check your email to confirm, then sign in.');
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2500);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-deep"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-10 items-center">
          <Text className="text-4xl font-bold text-brand-purple mb-2">Spicy Fairy Tales</Text>
          <Text className="text-base text-gray-400">Create your account</Text>
        </View>

        {/* Form card */}
        <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
          {/* Auth error banner */}
          {authError ? (
            <View className="mb-4 rounded-lg bg-brand-rose/20 border border-brand-rose/40 px-4 py-3">
              <Text className="text-brand-rose text-sm">{authError}</Text>
            </View>
          ) : null}

          {/* Success banner */}
          {successMessage ? (
            <View className="mb-4 rounded-lg bg-green-500/20 border border-green-500/40 px-4 py-3">
              <Text className="text-green-400 text-sm">{successMessage}</Text>
            </View>
          ) : null}

          {/* Email field */}
          <View className="mb-4">
            <Text className="text-gray-300 text-sm mb-2 font-medium">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-white/10 rounded-xl px-4 py-3 text-white text-base border ${
                    errors.email ? 'border-brand-rose' : 'border-white/20'
                  }`}
                  placeholder="you@example.com"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email ? (
              <Text className="text-brand-rose text-xs mt-1">{errors.email.message}</Text>
            ) : null}
          </View>

          {/* Password field */}
          <View className="mb-4">
            <Text className="text-gray-300 text-sm mb-2 font-medium">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-white/10 rounded-xl px-4 py-3 text-white text-base border ${
                    errors.password ? 'border-brand-rose' : 'border-white/20'
                  }`}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password ? (
              <Text className="text-brand-rose text-xs mt-1">{errors.password.message}</Text>
            ) : null}
          </View>

          {/* Confirm password field */}
          <View className="mb-6">
            <Text className="text-gray-300 text-sm mb-2 font-medium">Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-white/10 rounded-xl px-4 py-3 text-white text-base border ${
                    errors.confirmPassword ? 'border-brand-rose' : 'border-white/20'
                  }`}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.confirmPassword ? (
              <Text className="text-brand-rose text-xs mt-1">
                {errors.confirmPassword.message}
              </Text>
            ) : null}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${isSubmitting ? 'bg-brand-purple/50' : 'bg-brand-purple'}`}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <View className="mt-6 flex-row justify-center items-center">
          <Text className="text-gray-400 text-sm">Already have an account? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text className="text-brand-purple text-sm font-semibold">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
