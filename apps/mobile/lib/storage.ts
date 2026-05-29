import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAPTER_CACHE_PREFIX = 'chapter:';

export async function saveChapterLocally(chapterId: string, content: string): Promise<void> {
  await AsyncStorage.setItem(`${CHAPTER_CACHE_PREFIX}${chapterId}`, content);
}

export async function getLocalChapter(chapterId: string): Promise<string | null> {
  return AsyncStorage.getItem(`${CHAPTER_CACHE_PREFIX}${chapterId}`);
}

export async function clearLocalChapters(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const chapterKeys = keys.filter((k) => k.startsWith(CHAPTER_CACHE_PREFIX));
  if (chapterKeys.length > 0) await AsyncStorage.multiRemove(chapterKeys);
}
