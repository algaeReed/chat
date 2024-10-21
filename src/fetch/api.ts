import OpenAI from 'openai';

export interface Message {
  sender: 'You' | 'AI';
  text: string;
}

export interface Conversation {
  id: number;
  messages: Message[];
}

export interface Response {
  id: string;
  provider: string;
  model: string;
  object: string;
  created: number;
  choices: Choice[];
  system_fingerprint: null;
  usage: Usage;
}

export interface Choice {
  logprobs: null;
  finish_reason: string;
  index: number;
  message: Message;
}

export interface Message {
  role: string;
  content: string;
  refusal: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

const openai = new OpenAI({
  baseURL: JSON.parse(localStorage.getItem('config') || '{}').url || '',
  apiKey: JSON.parse(localStorage.getItem('config') || '{}').key || '',
  defaultHeaders: {},
  dangerouslyAllowBrowser: true,
});

// 模拟打字机效果
const typeEffect = async (
  text: string,
  delay: number,
  onUpdate: (char: string) => void
): Promise<void> => {
  for (let i = 0; i < text.length; i++) {
    onUpdate(text.charAt(i)); // 每次更新一个字符
    await new Promise((resolve) => setTimeout(resolve, delay)); // 延迟
  }
};

export const fetchAIResponseStream = async (
  fullPrompt: string,
  onMessage: (text: string) => void
): Promise<void> => {
  try {
    const completionStream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      stream: true,
    });

    let completeMessage = '';

    for await (const part of completionStream) {
      if (part.choices[0]?.delta?.content) {
        const newChunk = part.choices[0].delta.content;
        completeMessage += newChunk;

        await typeEffect(newChunk, 50, (char: string) => {
          onMessage(char); // 更新一个字符
        });
      }
    }

    // onMessage(completeMessage);
  } catch (error: any) {
    console.error('Error fetching ChatGPT stream response:', error);
    alert(JSON.stringify(error?.error?.message || '未知错误'));
    throw error;
  }
};
