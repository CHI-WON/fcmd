import { describe, expect, it } from "vitest";
import { buildUserPrompt, systemPrompt } from "../src/ai/prompt.js";

describe("systemPrompt", () => {
  it("要求 AI 只给建议并以 JSON 返回", () => {
    expect(systemPrompt).toContain("只提供建议，不执行任何命令");
    expect(systemPrompt).toContain("返回 JSON");
  });

  it("要求 AI 为危险操作提供风险提示", () => {
    expect(systemPrompt).toContain("危险操作");
    expect(systemPrompt).toContain("warnings 或 notes");
  });
});

describe("buildUserPrompt", () => {
  it("保留用户的原始需求并要求 JSON 格式", () => {
    const request = "移动图片到 images 文件夹";
    const prompt = buildUserPrompt(request);

    expect(prompt).toContain(request);
    expect(prompt).toContain("JSON 格式");
  });
});
