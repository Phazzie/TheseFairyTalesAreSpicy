import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import type { TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const VARIANT_CONTAINER: Record<string, string> = {
  primary: 'bg-brand-purple',
  ghost: 'border border-gray-600 bg-transparent',
  destructive: 'bg-red-600',
};

const VARIANT_TEXT: Record<string, string> = {
  primary: 'text-white font-semibold',
  ghost: 'text-gray-300 font-semibold',
  destructive: 'text-white font-semibold',
};

const SIZE_CONTAINER: Record<string, string> = {
  sm: 'py-2 px-3 rounded-lg',
  md: 'py-3 px-4 rounded-xl',
  lg: 'py-4 px-6 rounded-xl',
};

const SIZE_TEXT: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerClass = [
    'flex-row items-center justify-center',
    VARIANT_CONTAINER[variant],
    SIZE_CONTAINER[size],
    isDisabled ? 'opacity-50' : 'opacity-100',
    className ?? '',
  ]
    .join(' ')
    .trim();

  const textClass = [VARIANT_TEXT[variant], SIZE_TEXT[size]].join(' ');

  return (
    <TouchableOpacity
      className={containerClass}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#ffffff" />
          <Text className={textClass}>Loading...</Text>
        </View>
      ) : (
        <Text className={textClass}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
