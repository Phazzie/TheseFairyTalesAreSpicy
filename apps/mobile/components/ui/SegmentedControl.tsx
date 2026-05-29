import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  label?: string;
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  scrollable?: boolean;
}

export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  scrollable = false,
}: SegmentedControlProps) {
  const inner = (
    <View className="flex-row bg-gray-900 border border-gray-700 rounded-xl p-1 gap-1">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 py-2 px-2 rounded-lg items-center justify-center ${
              isSelected ? 'bg-brand-purple' : 'bg-gray-800'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-semibold text-center ${
                isSelected ? 'text-white' : 'text-gray-400'
              }`}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View className="w-full">
      {label ? (
        <Text className="text-gray-300 text-sm font-medium mb-2">{label}</Text>
      ) : null}
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}
