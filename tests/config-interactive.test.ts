import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@inquirer/prompts", () => ({
  confirm: vi.fn(),
  input: vi.fn(),
  password: vi.fn(),
}));

import { confirm, input, password } from "@inquirer/prompts";
import { readSavedConfig, saveConfig } from "../src/config/file.js";
import { initializeConfig } from "../src/config/interactive.js";

const confirmMock = vi.mocked(confirm);
const inputMock = vi.mocked(input);
const passwordMock = vi.mocked(password);
const temporaryDirectories: string[] = [];

async function createConfigPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "fcmd-init-test-"));
  temporaryDirectories.push(directory);
  return join(directory, "config.json");
}

beforeEach(() => {
  confirmMock.mockReset();
  inputMock.mockReset();
  passwordMock.mockReset();
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("initializeConfig", () => {
  it("收集输入并保存去除首尾空格后的配置", async () => {
    const filePath = await createConfigPath();
    passwordMock.mockResolvedValue("  test-key  ");
    inputMock
      .mockResolvedValueOnce("  test-model  ")
      .mockResolvedValueOnce(" https://api.example.com/v1 ");

    await expect(initializeConfig(filePath)).resolves.toEqual({
      apiKey: "test-key",
      model: "test-model",
      baseUrl: "https://api.example.com/v1",
    });
    await expect(readSavedConfig(filePath)).resolves.toEqual({
      apiKey: "test-key",
      model: "test-model",
      baseUrl: "https://api.example.com/v1",
    });
  });

  it("在用户拒绝覆盖已有配置时不再询问或写入", async () => {
    const filePath = await createConfigPath();
    await saveConfig(
      {
        apiKey: "saved-key",
        model: "saved-model",
        baseUrl: "https://api.example.com/v1",
      },
      filePath,
    );
    confirmMock.mockResolvedValue(false);

    await expect(initializeConfig(filePath)).resolves.toBeUndefined();
    expect(passwordMock).not.toHaveBeenCalled();
    expect(inputMock).not.toHaveBeenCalled();
    await expect(readSavedConfig(filePath)).resolves.toMatchObject({
      apiKey: "saved-key",
    });
  });
});
