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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  // Track live password value for the requirements checklist
  const [livePassword, setLivePassword] = useState('');

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

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setAuthError(getAuthErrorMessage(error));
    } else {
      setRegistrationSuccess(true);
    }
  };

  // Success state — show message + explicit Sign In button (no setTimeout)
  if (registrationSuccess) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-brand-deep"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10 items-center">
            <Text className="text-4xl font-bold text-brand-purple mb-2">Spicy Fairy Tales</Text>
          </View>

          <View className="bg-white/5 rounded-2xl p-6 border border-white/10 items-center gap-4">
            <Text className="text-green-400 text-2xl font-bold text-center">
              Account created! ✓
            </Text>
            <Text className="text-gray-300 text-sm text-center">
              Check your email to confirm your account, then sign in.
            </Text>
            <TouchableOpacity
              className="bg-brand-purple rounded-xl py-4 px-8 items-center mt-2 w-full"
              onPress={() => router.replace('/auth/login')}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
          <View className="mb-2">
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={(text) => { onChange(text); setLivePassword(text); }}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Min. 8 characters"
                  error={errors.password?.message}
                />
              )}
            />
            {/* Live password requirements checklist */}
            {livePassword.length > 0 && (
              <View className="mt-2 gap-1">
                <Text className={`text-xs ${livePassword.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}>
                  ✓ At least 8 characters
                </Text>
                <Text className={`text-xs ${/[A-Z]/.test(livePassword) ? 'text-green-400' : 'text-gray-500'}`}>
                  ✓ One uppercase letter
                </Text>
                <Text className={`text-xs ${/[0-9]/.test(livePassword) ? 'text-green-400' : 'text-gray-500'}`}>
                  ✓ One number
                </Text>
              </View>
            )}
          </View>

          {/* Confirm password field */}
          <View className="mb-6">
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Re-enter your password"
                  error={errors.confirmPassword?.message}
                />
              )}
            />
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
