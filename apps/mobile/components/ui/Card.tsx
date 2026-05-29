import React from 'react';
import { Pressable, View } from 'react-native';
import type { PressableProps, ViewProps } from 'react-native';

interface CardProps {
  onPress?: PressableProps['onPress'];
  children: React.ReactNode;
  className?: string;
  style?: ViewProps['style'];
}

export function Card({ onPress, children, className, style }: CardProps) {
  const baseClass = `bg-gray-900/80 rounded-xl p-4 ${className ?? ''}`.trim();

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={baseClass}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClass} style={style}>
      {children}
    </View>
  );
}
