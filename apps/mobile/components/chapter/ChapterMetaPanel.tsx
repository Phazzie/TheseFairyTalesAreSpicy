import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ChapterMeta {
  beatUsed?: string;
  emotionalArc?: string;
  dialogueRatio?: number;
  chekhovSeeded?: string[];
  engineVersion?: string;
}

interface ChapterMetaPanelProps {
  meta: ChapterMeta;
}

export function ChapterMetaPanel({ meta }: ChapterMetaPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      <TouchableOpacity
        onPress={() => setExpanded((e) => !e)}
        className="flex-row items-center justify-between px-4 py-3"
        activeOpacity={0.7}
      >
        <Text className="text-gray-300 text-sm font-semibold">Chapter Metadata</Text>
        <Text className="text-gray-500 text-lg">{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View className="px-4 pb-4 gap-3 border-t border-gray-800">
          <MetaRow label="Beat Used" value={meta.beatUsed} />
          <MetaRow label="Emotional Arc" value={meta.emotionalArc} />
          {meta.dialogueRatio != null ? (
            <MetaRow label="Dialogue Ratio" value={`${meta.dialogueRatio}%`} />
          ) : null}
          {meta.chekhovSeeded && meta.chekhovSeeded.length > 0 ? (
            <View>
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Chekhov Elements Seeded
              </Text>
              {meta.chekhovSeeded.map((el, i) => (
                <Text key={i} className="text-gray-300 text-sm">
                  • {el}
                </Text>
              ))}
            </View>
          ) : null}
          <MetaRow label="Engine Version" value={meta.engineVersion} />
        </View>
      ) : null}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="mt-3">
      <Text className="text-gray-500 text-xs uppercase tracking-wide">{label}</Text>
      <Text className="text-gray-200 text-sm mt-0.5">{value}</Text>
    </View>
  );
}
