import { useState } from 'react';
import {
  View,
  Text,
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
import { Input } from '../../components/ui/Input.js';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
      return 'Invalid email or password. Please try again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (msg.includes('too many requests')) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export default function LoginScreen() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (formData: LoginFormData) => {
    setAuthError(null);
    setResetMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      setAuthError(getAuthErrorMessage(error));
    } else {
      router.replace('/(tabs)/write');
    }
  };

  const handleForgotPassword = async () => {
    setAuthError(null);
    setResetMessage(null);
    const email = getValues('email');
    if (!email) {
      setAuthError('Please enter your email address above, then tap "Forgot password?".');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setAuthError(getAuthErrorMessage(error));
    } else {
      setResetMessage('Check your email for a reset link.');
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
          <Text className="text-base text-gray-400">Sign in to continue your story</Text>
        </View>

        {/* Form card */}
        <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
          {/* Auth error banner */}
          {authError ? (
            <View className="mb-4 rounded-lg bg-brand-rose/20 border border-brand-rose/40 px-4 py-3">
              <Text className="text-brand-rose text-sm">{authError}</Text>
            </View>
          ) : null}

          {/* Reset password success */}
          {resetMessage ? (
            <View className="mb-4 rounded-lg bg-green-500/20 border border-green-500/40 px-4 py-3">
              <Text className="text-green-400 text-sm">{resetMessage}</Text>
            </View>
          ) : null}

          {/* Email field */}
          <View className="mb-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="you@example.com"
                  error={errors.email?.message}
                />
              )}
            />
          </View>

          {/* Password field */}
          <View className="mb-1">
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Your password"
                  error={errors.password?.message}
                />
              )}
            />
          </View>

          {/* Forgot password link */}
          <TouchableOpacity onPress={handleForgotPassword} className="self-end mt-1 mb-4">
            <Text className="text-brand-purple text-sm">Forgot password?</Text>
          </TouchableOpacity>

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
              <Text className="text-white font-semibold text-base">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View className="mt-6 flex-row justify-center items-center">
          <Text className="text-gray-400 text-sm">Don't have an account? </Text>
          <Link href="/auth/register" asChild>
            <TouchableOpacity>
              <Text className="text-brand-purple text-sm font-semibold">Create one</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
