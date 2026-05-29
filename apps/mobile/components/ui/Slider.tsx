import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  valueLabel?: string;
}

export function Slider({ label, value, min, max, onChange, valueLabel }: SliderProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View className="w-full">
      <Text className="text-gray-300 text-sm font-medium mb-2">{label}</Text>
      <View className="flex-row items-center justify-between bg-gray-900 border border-gray-700 rounded-xl p-1">
        <TouchableOpacity
          onPress={decrement}
          disabled={!canDecrement}
          className={`w-10 h-10 rounded-lg items-center justify-center ${
            canDecrement ? 'bg-gray-700' : 'bg-gray-800'
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-xl font-bold ${canDecrement ? 'text-white' : 'text-gray-600'}`}
          >
            −
          </Text>
        </TouchableOpacity>

        <View className="flex-1 items-center px-3">
          <Text className="text-white text-2xl font-bold">{value}</Text>
          {valueLabel ? (
            <Text className="text-gray-400 text-xs mt-0.5">{valueLabel}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={increment}
          disabled={!canIncrement}
          className={`w-10 h-10 rounded-lg items-center justify-center ${
            canIncrement ? 'bg-brand-purple' : 'bg-gray-800'
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-xl font-bold ${canIncrement ? 'text-white' : 'text-gray-600'}`}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between mt-1 px-1">
        <Text className="text-gray-600 text-xs">{min}</Text>
        <Text className="text-gray-600 text-xs">{max}</Text>
      </View>
    </View>
  );
}
