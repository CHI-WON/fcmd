import { describe, expect, it } from "vitest";
import { fcmdResponseSchema } from "../src/ai/schema.js";

const validResponse = {
  intent: "delete_directory",
  summary: "删除 logs 文件夹",
  suggestions: [
    {
      command: "rm -ri",
      usage: "rm -ri <目录路径>",
      description: "递归删除目录，并在删除每项前要求确认。",
      examples: [
        {
          description: "删除当前目录中的 logs 文件夹",
          command: "rm -ri ./logs",
        },
      ],
      riskLevel: "danger",
      options: [
        {
          option: "-i",
          description: "每次删除前要求确认。",
        },
      ],
      notes: ["删除操作通常不会进入回收站。"],
    },
  ],
  assumptions: ["logs 是一个目录。"],
  warnings: ["执行前请确认路径正确。"],
};

describe("fcmdResponseSchema", () => {
  it("接受符合约定的 AI 响应", () => {
    expect(fcmdResponseSchema.safeParse(validResponse).success).toBe(true);
  });

  it("拒绝没有示例的命令建议", () => {
    const responseWithoutExamples = {
      ...validResponse,
      suggestions: [{ ...validResponse.suggestions[0], examples: [] }],
    };

    expect(fcmdResponseSchema.safeParse(responseWithoutExamples).success).toBe(
      false,
    );
  });

  it("拒绝未知的风险等级", () => {
    const responseWithInvalidRiskLevel = {
      ...validResponse,
      suggestions: [{ ...validResponse.suggestions[0], riskLevel: "high" }],
    };

    expect(
      fcmdResponseSchema.safeParse(responseWithInvalidRiskLevel).success,
    ).toBe(false);
  });
});
