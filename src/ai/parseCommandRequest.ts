import type { FcmdConfig } from "../config/env.js";
import { requestChatCompletion } from "./client.js";
import { buildUserPrompt, systemPrompt } from "./prompt.js";
import { fcmdResponseSchema, type FcmdResponse } from "./schema.js";

export async function parseCommandRequest(request: string, config: FcmdConfig): Promise<FcmdResponse> {
    if (!request.trim()) {
        throw new Error("请输入你想完成的操作。");
    }

    const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: buildUserPrompt(request) },
    ];

    const rawContent = await requestChatCompletion(config, messages);

    let data: unknown;

    try {
        data = JSON.parse(rawContent);
    } catch {
        throw new Error("AI 返回的结果不是有效的 JSON，请稍后重试");
    }

    const result = fcmdResponseSchema.safeParse(data);

    if (!result.success) {
        throw new Error("AI 返回的结果格式不符合预期，请稍后重试。");
    }

    return result.data;
}