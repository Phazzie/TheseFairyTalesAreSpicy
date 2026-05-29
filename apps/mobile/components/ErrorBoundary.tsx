import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-brand-deep items-center justify-center px-8">
          <Text className="text-white text-xl font-bold mb-3">Something went wrong</Text>
          <Text className="text-gray-400 text-sm text-center mb-6">
            An unexpected error occurred. Tap below to reload the app.
          </Text>
          <TouchableOpacity
            className="bg-brand-purple px-6 py-3 rounded-xl"
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
