import { ActionPanel, Action, Icon, List, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { createOpenAIProvider, type EmojiResult } from "./provider";

interface Preferences {
  aiProvider: string;
  apiKey: string;
  apiBase: string;
  modelName: string;
  preferredLanguage: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<EmojiResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const preferences = getPreferenceValues<Preferences>();

  // 添加防抖搜索效果
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim()) {
        searchEmojis(searchText);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const searchEmojis = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // 检查 API Key 是否配置
    if (!preferences.apiKey) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Configuration Error",
        message: "Please configure your OpenAI API key in preferences",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 创建 OpenAI 提供者实例
      const openAIProvider = createOpenAIProvider({
        apiKey: preferences.apiKey,
        apiBase: preferences.apiBase,
        modelName: preferences.modelName,
        preferredLanguage: preferences.preferredLanguage,
      });

      // 验证配置
      if (!openAIProvider.validateConfig()) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Configuration Error",
          message: "Please check your OpenAI configuration in preferences",
        });
        return;
      }

      // 调用 OpenAI API 搜索 emoji
      const results = await openAIProvider.searchEmojis(query);
      setResults(results);
    } catch (error) {
      console.error("Error searching emojis:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to search emojis",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
  };

  return (
    <List
      searchBarPlaceholder="Describe the emoji you're looking for..."
      onSearchTextChange={handleSearchChange}
      isLoading={isLoading}
      throttle
    >
      {results.map((result, index) => (
        <List.Item
          key={index}
          icon={result.emoji}
          title={result.name}
          subtitle={result.description}
          accessories={[{ text: result.emoji }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Emoji"
                content={result.emoji}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action.CopyToClipboard
                title="Copy Emoji with Name"
                content={`${result.emoji} ${result.name}`}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}

      {isLoading && searchText && (
        <List.EmptyView
          icon={Icon.Circle}
          title="🔍 Searching for emojis..."
          description="Please wait while we find the perfect emoji for you"
        />
      )}

      {!isLoading && searchText && results.length === 0 && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="😕 No emojis found"
          description="Try a different search term"
        />
      )}

      {!isLoading && !searchText && (
        <List.EmptyView
          icon={Icon.Emoji}
          title="😊 Search for emojis"
          description="Describe what you're looking for in natural language"
        />
      )}
    </List>
  );
}
