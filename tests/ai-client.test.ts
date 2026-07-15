import { afterEach, describe, expect, it, vi } from "vitest";
import type { FcmdConfig } from "../src/config/env.js";
import {
  requestChatCompletion,
  type ChatMessage,
} from "../src/ai/client.js";

const config: FcmdConfig = {
  apiKey: "test-api-key",
  model: "test-model",
  baseUrl: "https://api.example.com/v1",
};

const messages: ChatMessage[] = [
  { role: "system", content: "你是终端命令助手。" },
  { role: "user", content: "查看当前目录" },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestChatCompletion", () => {
  it("返回 AI 的第一条文本内容", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"intent":"list_files"}' } }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestChatCompletion(config, messages)).resolves.toBe(
      '{"intent":"list_files"}',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.example.com/v1/chat/completions");
    expect(options.method).toBe("POST");
    expect(options.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer test-api-key",
    });
  });

  it("在 API Key 无效时显示 HTTP 状态和定位提示", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 401 })),
    );

    await expect(requestChatCompletion(config, messages)).rejects.toThrow(
      "AI 服务请求失败（HTTP 401）。API Key 无效或已失效。",
    );
  });

  it("在账户余额不足时显示充值提示", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 402 })),
    );

    await expect(requestChatCompletion(config, messages)).rejects.toThrow(
      "AI 服务请求失败（HTTP 402）。账户余额不足",
    );
  });

  it("在网络请求失败时给出友好错误", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    await expect(requestChatCompletion(config, messages)).rejects.toThrow(
      "暂时无法连接 AI 服务",
    );
  });

  it("在请求超时时给出友好错误", async () => {
    const fetchMock = vi.fn(
      (_url: URL, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = options.signal as AbortSignal;
          signal.addEventListener("abort", () => {
            const error = new Error("request aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestChatCompletion(config, messages, 0)).rejects.toThrow(
      "AI 服务请求超时",
    );
  });

  it("在 AI 返回格式不符合预期时抛错", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [] }))),
    );

    await expect(requestChatCompletion(config, messages)).rejects.toThrow(
      "AI 服务返回内容为空或格式不符合预期",
    );
  });
});
