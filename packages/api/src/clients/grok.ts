// xAI Grok API client
// Model: grok-4-0709 (use this exact model name)
// Uses Edge-runtime-compatible fetch only

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokOptions {
  maxTokens?: number;
  temperature?: number;
}

export async function generateStory(
  systemPrompt: string,
  userPrompt: string,
  opts?: GrokOptions,
): Promise<string> {
  const apiKey = process.env['XAI_API_KEY'];
  if (!apiKey) throw new Error('XAI_API_KEY env var is required');

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-0709',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ] satisfies GrokMessage[],
      max_tokens: opts?.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.85,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('Grok API returned empty content');
  return content;
}

// Streaming version — returns a ReadableStream of text chunks
export async function generateStoryStreaming(
  systemPrompt: string,
  userPrompt: string,
  opts?: GrokOptions,
): Promise<ReadableStream<string>> {
  const apiKey = process.env['XAI_API_KEY'];
  if (!apiKey) throw new Error('XAI_API_KEY env var is required');

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error('Grok API timeout after 20 seconds'));
  }, 20000);

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-0709',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ] satisfies GrokMessage[],
      max_tokens: opts?.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.85,
      stream: true,
    }),
    signal: timeoutController.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(`Grok API error ${response.status}: ${errorText}`);
  }

  // Parse SSE stream and emit text chunks
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  // Carry-over buffer: SSE events can be split across network chunks.
  // Accumulate bytes here and only process complete '\n'-terminated lines.
  let lineBuffer = '';

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        // Flush any remaining buffered data
        const remaining = lineBuffer.trim();
        if (remaining.startsWith('data: ') && remaining !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(remaining.slice(6)) as {
              choices: Array<{ delta: { content?: string } }>;
            };
            const chunk = parsed.choices[0]?.delta?.content;
            if (chunk) controller.enqueue(chunk);
          } catch { /* ignore */ }
        }
        controller.close();
        return;
      }
      // Append decoded bytes to buffer, split on newlines
      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      lineBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') {
          controller.close();
          return;
        }
        try {
          const parsed = JSON.parse(dataStr) as {
            choices: Array<{ delta: { content?: string } }>;
          };
          const chunk = parsed.choices[0]?.delta?.content;
          if (chunk) controller.enqueue(chunk);
        } catch {
          // Skip malformed SSE lines
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// Summarization prompt for rolling arc summaries (lightweight, not story generation)
export async function generateSummary(chaptersText: string): Promise<string> {
  const apiKey = process.env['XAI_API_KEY'];
  if (!apiKey) throw new Error('XAI_API_KEY env var is required');

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-0709',
      messages: [
        {
          role: 'system',
          content:
            'You are summarizing a supernatural romance serial for continuity purposes. Be factual and concise. Write in present tense.',
        },
        {
          role: 'user',
          content: `Summarize in 300-400 words: the key plot events, the current emotional state of each character, open plot threads, unresolved tensions, and any planted story elements not yet paid off.\n\nCHAPTERS:\n${chaptersText}`,
        },
      ] satisfies GrokMessage[],
      max_tokens: 600,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!response.ok) throw new Error(`Grok summary error ${response.status}`);
  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '';
}
