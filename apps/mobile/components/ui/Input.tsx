import React from 'react';
import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  function Input({ label, error, helpText, style, ...props }, ref) {
  const borderColor = error ? 'border-red-500' : 'border-gray-700';

  return (
    <View className="w-full">
      {label ? (
        <Text className="text-gray-300 text-sm font-medium mb-1">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        className={`bg-gray-900 ${borderColor} border rounded-xl px-4 py-3 text-white text-base`}
        placeholderTextColor="#6b7280"
        selectionColor="#7c3aed"
        accessibilityLabel={label}
        accessibilityHint={error}
        {...props}
      />
      {error ? (
        <Text className="text-red-400 text-xs mt-1">{error}</Text>
      ) : null}
      {helpText && !error ? (
        <Text className="text-gray-500 text-xs mt-1">{helpText}</Text>
      ) : null}
    </View>
  );
});
Input.displayName = 'Input';
