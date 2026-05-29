import React, { useRef, useEffect } from 'react';
import { ScrollView, Text, Animated } from 'react-native';
import { useArcStore } from '../../stores/arcStore.js';

// Memoized paragraph — only re-renders if text changes (never, once added)
const Paragraph = React.memo(({ text }: { text: string }) => (
  <Text className="text-gray-100 text-base leading-8 mb-4" selectable>
    {text}
  </Text>
));
Paragraph.displayName = 'Paragraph';

export function StreamingText() {
  const paragraphs = useArcStore((s) => s.streamingParagraphs);
  const tail = useArcStore((s) => s.streamingTail);
  const isGenerating = useArcStore((s) => s.isGenerating);
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to bottom only when tail length changes (new chunk), not every render
  const tailLength = tail.length;
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [paragraphs.length, tailLength > 0]);

  if (!isGenerating && paragraphs.length === 0 && !tail) return null;

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {paragraphs.map((p, i) => (
        <Paragraph key={i} text={p} />
      ))}
      {(tail || isGenerating) && (
        <Text className="text-gray-100 text-base leading-8">
          {tail}
          {isGenerating ? <BlinkingCursor /> : null}
        </Text>
      )}
    </ScrollView>
  );
}

// BlinkingCursor is now a SIBLING to the text content, not nested inside it
function BlinkingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 265, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 265, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.Text style={{ opacity }} className="text-brand-purple">▌</Animated.Text>;
}
