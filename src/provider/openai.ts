import { PromptBuilder } from "./prompt-builder";
import { getErrorMessages } from "../locales";

export interface OpenAIConfig {
  apiKey: string;
  apiBase: string;
  modelName: string;
  preferredLanguage?: string;
}

export interface EmojiResult {
  emoji: string;
  name: string;
  description: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIProvider {
  private config: OpenAIConfig;
  private promptBuilder: PromptBuilder;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.promptBuilder = new PromptBuilder({ preferredLanguage: config.preferredLanguage });
  }

  /**
   * 搜索 emoji 的主要方法
   */
  async searchEmojis(query: string): Promise<EmojiResult[]> {
    if (!query.trim()) {
      return [];
    }

    const prompt = this.buildPrompt(query);

    try {
      const response = await this.makeAPIRequest(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error("OpenAI API request failed:", error);
      throw new Error(`Failed to search emojis: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * 构建发送给 OpenAI 的提示词
   */
  private buildPrompt(query: string): string {
    return this.promptBuilder.buildPrompt(query);
  }

  /**
   * 发送 API 请求到 OpenAI
   */
  private async makeAPIRequest(prompt: string): Promise<OpenAIResponse> {
    const url = `${this.config.apiBase}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return (await response.json()) as OpenAIResponse;
  }

  /**
   * 解析 OpenAI 的响应
   */
  private parseResponse(response: OpenAIResponse): EmojiResult[] {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }

      // 尝试解析 JSON 响应
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }

      return parsed.map((item, index) => ({
        emoji: item.emoji || "❓",
        name: item.name || `Emoji ${index + 1}`,
        description: item.description || "No description available",
      }));
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);

      // 打印原始内容
      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log("Original response content:", content);

        // 尝试从内容中提取 JSON
        const extractedJson = this.extractJsonFromContent(content);
        if (extractedJson) {
          try {
            const parsed = JSON.parse(extractedJson);
            if (Array.isArray(parsed)) {
              return parsed.map((item, index) => ({
                emoji: item.emoji || "❓",
                name: item.name || `Emoji ${index + 1}`,
                description: item.description || "No description available",
              }));
            }
          } catch (extractError) {
            console.error("Failed to parse extracted JSON:", extractError);
          }
        }
      }

      // 如果解析失败，返回表示抱歉的 emoji
      const errorMessages = getErrorMessages(this.config.preferredLanguage || "en");
      return [
        { emoji: "😔", name: "Pensive Face", description: errorMessages.noResults },
        { emoji: "🤔", name: "Thinking Face", description: errorMessages.tryDifferentKeywords },
        { emoji: "🙏", name: "Folded Hands", description: errorMessages.thankYou },
      ];
    }
  }

  /**
   * 从文本内容中提取 JSON
   */
  private extractJsonFromContent(content: string): string | null {
    // 尝试匹配 JSON 数组模式
    const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      return jsonArrayMatch[0];
    }

    // 尝试匹配 JSON 对象模式
    const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      return jsonObjectMatch[0];
    }

    // 尝试匹配被 ```json 包围的内容
    const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // 尝试匹配被 ``` 包围的内容
    const genericCodeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
    if (genericCodeBlockMatch) {
      return genericCodeBlockMatch[1];
    }

    return null;
  }

  /**
   * 验证配置是否有效
   */
  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.apiBase && this.config.modelName);
  }
}

/**
 * 创建 OpenAI 提供者实例的工厂函数
 */
export function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}
