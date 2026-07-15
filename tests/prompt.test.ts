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

  it("要求 AI 遵守目标操作系统和 Shell", () => {
    expect(systemPrompt).toContain("目标操作系统、Shell");
    expect(systemPrompt).toContain("不要混用");
  });
});

describe("buildUserPrompt", () => {
  it("保留用户的原始需求并要求 JSON 格式", () => {
    const request = "移动图片到 images 文件夹";
    const prompt = buildUserPrompt(request);

    expect(prompt).toContain(request);
    expect(prompt).toContain("JSON 格式");
  });

  it("把 Windows PowerShell 环境写入提示词", () => {
    const prompt = buildUserPrompt("查看当前目录", {
      operatingSystem: "Windows",
      shell: "PowerShell",
      pathSeparator: "\\",
    });

    expect(prompt).toContain("操作系统：Windows");
    expect(prompt).toContain("Shell：PowerShell");
    expect(prompt).toContain("路径分隔符：\\");
  });
});
