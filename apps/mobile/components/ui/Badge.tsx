import React from 'react';
import { View, Text } from 'react-native';
import { SPICE_LEVEL_COLORS } from '../../lib/constants.js';

type BadgeVariant =
  | 'spice'
  | 'theme'
  | 'status-open'
  | 'status-resolved'
  | 'creature'
  | 'chekhov'
  | 'callback'
  | 'dramatic-irony'
  | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  spiceLevel?: number;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  spice: 'bg-orange-900/60 border border-orange-600',
  theme: 'bg-purple-900/50 border border-purple-600',
  'status-open': 'bg-blue-900/50 border border-blue-500',
  'status-resolved': 'bg-green-900/50 border border-green-600',
  creature: 'bg-indigo-900/50 border border-indigo-500',
  chekhov: 'bg-red-900/50 border border-red-500',
  callback: 'bg-blue-900/50 border border-blue-500',
  'dramatic-irony': 'bg-purple-900/50 border border-purple-500',
  default: 'bg-gray-800 border border-gray-600',
};

export function Badge({ label, variant = 'default', spiceLevel }: BadgeProps) {
  const containerClass = `px-2 py-0.5 rounded-full flex-row items-center ${VARIANT_CLASSES[variant]}`;

  const dotColor =
    variant === 'spice' && spiceLevel != null
      ? SPICE_LEVEL_COLORS[spiceLevel] ?? '#f97316'
      : undefined;

  return (
    <View className={containerClass}>
      {dotColor ? (
        <View
          className="w-2 h-2 rounded-full mr-1"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      <Text className="text-xs text-gray-200 font-medium">{label}</Text>
    </View>
  );
}
