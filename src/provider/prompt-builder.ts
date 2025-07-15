import { getLanguageInstructions, getJSONExample } from "../locales";

export interface PromptConfig {
  preferredLanguage?: string;
}

export interface EmojiSearchPrompt {
  query: string;
  languageInstructions: string;
  jsonExample: string;
}

/**
 * 构建 emoji 搜索提示词的模块
 */
export class PromptBuilder {
  private config: PromptConfig;

  constructor(config: PromptConfig) {
    this.config = config;
  }

  /**
   * 构建发送给 AI 的完整提示词
   */
  buildPrompt(query: string): string {
    const language = this.config.preferredLanguage || "en";
    const languageInstructions = getLanguageInstructions(language);
    const jsonExample = getJSONExample(language);

    return `You are an emoji search assistant. Given a natural language query, return relevant emojis in JSON format.

Query: "${query}"

${languageInstructions}

Please return exactly 5 emojis that best match the query. For each emoji, provide:
- emoji: the actual emoji character
- name: a descriptive name for the emoji
- description: a brief explanation of when to use this emoji

Return the response as a valid JSON array like this:
${jsonExample}

Only return the JSON array, no other text.`;
  }

  /**
   * 获取提示词组件，用于更灵活的构建
   */
  getPromptComponents(query: string): EmojiSearchPrompt {
    const language = this.config.preferredLanguage || "en";
    return {
      query,
      languageInstructions: getLanguageInstructions(language),
      jsonExample: getJSONExample(language),
    };
  }
}

/**
 * 创建 PromptBuilder 实例的工厂函数
 */
export function createPromptBuilder(config: PromptConfig): PromptBuilder {
  return new PromptBuilder(config);
}
