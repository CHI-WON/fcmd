import type { FcmdConfig } from "../config/env.js";

export interface ChatMessage {
    role: "system" | "user";
    content: string;
}

export const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;

export async function requestChatCompletion(
    config: FcmdConfig,
    messages: ChatMessage[],
    timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<string> {
    const url = new URL("chat/completions", `${config.baseUrl}/`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages,
            }),
            signal: controller.signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error("AI 服务请求超时，请检查网络或稍后重试。");
        }

        throw new Error("暂时无法连接 AI 服务，请检查网络后重试。");
    } finally {
        clearTimeout(timeoutId);
    }
    
    if (!response.ok) {
        throw new Error("AI 服务请求失败，请检查 API 配置或稍后重试。");
    }

    interface ChatCompletionResponse {
        choices: Array<{
            message: {
                content: string;
            };
        }>;
    }

    function isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }

    function isChatCompletionResponse(
        value: unknown,
    ): value is ChatCompletionResponse {
        if (!isRecord(value) || !Array.isArray(value.choices)) {
            return false;
        }

        const firstChoice = value.choices[0];

        if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
            return false;
        }

        return typeof firstChoice.message.content === "string";
    }

    const data: unknown = await response.json();

    if (!isChatCompletionResponse(data)) {
        throw new Error("AI 服务返回内容为空或格式不符合预期。");
    }

    const content = data.choices[0]?.message.content;
    if (!content) {
        throw new Error("AI 服务返回内容为空或格式不符合预期。");
    }

    return content;
}
