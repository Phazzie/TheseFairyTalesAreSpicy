import React, { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useArcStore } from '../../stores/arcStore.js';

export function StreamingText() {
  const streamingText = useArcStore((s) => s.streamingText);
  const isGenerating = useArcStore((s) => s.isGenerating);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (streamingText.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [streamingText]);

  if (!streamingText && !isGenerating) {
    return null;
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 bg-gray-900/50 rounded-xl p-4 mt-4"
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
    >
      <Text className="text-gray-100 text-base leading-7 font-serif">
        {streamingText}
        {isGenerating ? (
          <BlinkingCursor />
        ) : null}
      </Text>
    </ScrollView>
  );
}

function BlinkingCursor() {
  const [visible, setVisible] = React.useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text className={`text-brand-purple font-bold ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {' '}|
    </Text>
  );
}
