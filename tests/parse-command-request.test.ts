import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FcmdConfig } from "../src/config/env.js";

vi.mock("../src/ai/client.js", () => ({
  requestChatCompletion: vi.fn(),
}));

import { requestChatCompletion } from "../src/ai/client.js";
import { parseCommandRequest } from "../src/ai/parseCommandRequest.js";

const requestChatCompletionMock = vi.mocked(requestChatCompletion);

const config: FcmdConfig = {
  apiKey: "test-api-key",
  model: "test-model",
  baseUrl: "https://api.example.com/v1",
};

const validResponse = {
  intent: "list_files",
  summary: "查看当前目录内容",
  suggestions: [
    {
      command: "ls",
      usage: "ls",
      description: "列出当前目录中的文件和文件夹。",
      examples: [{ description: "查看当前目录", command: "ls" }],
      riskLevel: "safe",
    },
  ],
};

describe("parseCommandRequest", () => {
  beforeEach(() => {
    requestChatCompletionMock.mockReset();
  });

  it("将 AI 的合法 JSON 解析为 FcmdResponse", async () => {
    requestChatCompletionMock.mockResolvedValue(JSON.stringify(validResponse));

    await expect(parseCommandRequest("查看当前目录", config)).resolves.toEqual(
      validResponse,
    );
  });

  it("将指定的 Windows Shell 环境传给 AI", async () => {
    requestChatCompletionMock.mockResolvedValue(JSON.stringify(validResponse));

    await parseCommandRequest("查看当前目录", config, {
      operatingSystem: "Windows",
      shell: "Command Prompt",
      pathSeparator: "\\",
    });

    expect(requestChatCompletionMock).toHaveBeenCalledWith(
      config,
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: expect.stringContaining("Shell：Command Prompt"),
        }),
      ]),
    );
  });

  it("拒绝空白的用户输入，且不调用 AI client", async () => {
    await expect(parseCommandRequest("   ", config)).rejects.toThrow(
      "请输入你想完成的操作。",
    );

    expect(requestChatCompletionMock).not.toHaveBeenCalled();
  });

  it("在 AI 返回无效 JSON 时抛出友好错误", async () => {
    requestChatCompletionMock.mockResolvedValue("这不是 JSON");

    await expect(parseCommandRequest("查看当前目录", config)).rejects.toThrow(
      "AI 返回的结果不是有效的 JSON",
    );
  });

  it("在 AI 返回内容不符合 schema 时抛出友好错误", async () => {
    requestChatCompletionMock.mockResolvedValue(
      JSON.stringify({ intent: "list_files" }),
    );

    await expect(parseCommandRequest("查看当前目录", config)).rejects.toThrow(
      "AI 返回的结果格式不符合预期",
    );
  });
});
