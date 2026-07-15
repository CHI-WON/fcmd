import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cliPath = resolve(process.cwd(), "dist/cli.js");

function runCli(...args: string[]) {
  return runCliWithEnv({}, ...args);
}

function runCliWithEnv(environment: NodeJS.ProcessEnv, ...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...environment },
  });
}

describe("fcmd CLI", () => {
  it("显示帮助信息", () => {
    const result = runCli("--help");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("用 AI 将自然语言转换为终端命令建议");
    expect(result.stdout).toContain("[request...]");
    expect(result.stdout).toContain("init");
    expect(result.stdout).toContain("--json");
  });

  it("显示版本号", () => {
    const result = runCli("--version");

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("0.1.0");
  });

  it("在没有输入需求时显示提示并以失败状态结束", () => {
    const result = runCli();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("请输入你想完成的操作。");
    expect(result.stderr).toContain("fcmd 移动文件");
  });

  it("显示脱敏后的当前配置", () => {
    const result = runCliWithEnv(
      {
        FCMD_API_KEY: "test-api-key",
        FCMD_MODEL: "test-model",
        FCMD_BASE_URL: "https://api.example.com/v1",
      },
      "config",
      "show",
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("API Key：****-key");
    expect(result.stdout).not.toContain("API Key：test-api-key");
    expect(result.stdout).toContain("模型名称：test-model");
  });
});
