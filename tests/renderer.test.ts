import { describe, expect, it } from "vitest";
import type { FcmdResponse } from "../src/ai/schema.js";
import { renderResult } from "../src/renderer/renderResult.js";

function createResponse({
  notes,
  options,
  warnings,
}: {
  notes?: string[];
  options?: Array<{ option: string; description: string }>;
  warnings?: string[];
} = {}): FcmdResponse {
  return {
    intent: "move_file",
    summary: "移动图片到 images 文件夹",
    suggestions: [
      {
        command: "mv",
        usage: "mv <源路径> <目标路径>",
        description: "移动文件到目标文件夹。",
        examples: [
          {
            description: "移动 photo.png 到 images 文件夹",
            command: "mv ./photo.png ./images/",
          },
        ],
        riskLevel: "caution",
        ...(notes ? { notes } : {}),
        ...(options ? { options } : {}),
      },
    ],
    ...(warnings ? { warnings } : {}),
  };
}

describe("renderResult", () => {
  it("渲染第一条命令建议的用法、示例和说明", () => {
    const result = renderResult(createResponse());

    expect(result).toContain("需求理解：");
    expect(result).toContain("移动图片到 images 文件夹");
    expect(result).toContain("推荐命令：");
    expect(result).toContain("mv <源路径> <目标路径>");
    expect(result).toContain("示例：");
    expect(result).toContain("mv ./photo.png ./images/");
    expect(result).toContain("说明：");
    expect(result).toContain("移动文件到目标文件夹。");
    expect(result).toContain("风险提示：该操作可能修改或覆盖现有内容，请先确认参数。");
  });

  it("合并并渲染建议备注和整体警告", () => {
    const result = renderResult(
      createResponse({
        notes: ["可能覆盖同名文件。"],
        warnings: ["执行前请确认路径。"],
      }),
    );

    expect(result).toContain("注意：");
    expect(result).toContain("可能覆盖同名文件。");
    expect(result).toContain("执行前请确认路径。");
  });

  it("渲染命令的常用参数", () => {
    const result = renderResult(
      createResponse({
        options: [{ option: "-i", description: "覆盖前请求确认。" }],
      }),
    );

    expect(result).toContain("常用参数：");
    expect(result).toContain("-i：覆盖前请求确认。");
  });

  it("在有多条建议时渲染编号列表", () => {
    const response: FcmdResponse = {
      intent: "find_files",
      summary: "查找文件",
      suggestions: [
        {
          command: "find",
          usage: "find <路径> <条件>",
          description: "按名称、类型等条件查找文件。",
          examples: [
            { description: "查找 PNG 文件", command: 'find . -name "*.png"' },
          ],
          riskLevel: "safe",
          options: [{ option: "-name", description: "按文件名匹配。" }],
          notes: ["搜索范围可能较大。"],
        },
        {
          command: "grep",
          usage: "grep <关键词> <文件>",
          description: "在文件内容中搜索文本。",
          examples: [
            { description: "搜索 hello", command: 'grep "hello" ./notes.txt' },
          ],
          riskLevel: "safe",
        },
      ],
      warnings: ["请根据实际目录调整路径。"],
    };

    const result = renderResult(response);

    expect(result).toContain("找到多个相关命令：");
    expect(result).toContain("1. find");
    expect(result).toContain("用法：find <路径> <条件>");
    expect(result).toContain('示例：find . -name "*.png"');
    expect(result).toContain("2. grep");
    expect(result).toContain("用法：grep <关键词> <文件>");
    expect(result).toContain("参数 -name：按文件名匹配。");
    expect(result).toContain("注意：搜索范围可能较大。");
    expect(result).toContain("整体注意：");
    expect(result).toContain("请根据实际目录调整路径。");
  });

  it("突出显示危险命令的风险提示", () => {
    const response: FcmdResponse = {
      intent: "delete_directory",
      summary: "删除目录",
      suggestions: [
        {
          command: "rm -rf",
          usage: "rm -rf <目录路径>",
          description: "递归强制删除目录。",
          examples: [{ description: "删除 logs", command: "rm -rf ./logs" }],
          riskLevel: "danger",
        },
      ],
    };

    expect(renderResult(response)).toContain(
      "危险提示：该操作可能造成不可逆影响，请确认命令和路径。",
    );
  });
});
