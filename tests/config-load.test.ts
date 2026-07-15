import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { saveConfig } from "../src/config/file.js";
import { loadConfig } from "../src/config/load.js";

const temporaryDirectories: string[] = [];

async function createConfigPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "fcmd-load-test-"));
  temporaryDirectories.push(directory);
  return join(directory, "config.json");
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("loadConfig", () => {
  it("读取已保存配置，并允许环境变量覆盖单个字段", async () => {
    const filePath = await createConfigPath();
    await saveConfig(
      {
        apiKey: "saved-key",
        model: "saved-model",
        baseUrl: "https://saved.example.com/v1",
      },
      filePath,
    );

    await expect(
      loadConfig({ FCMD_MODEL: "environment-model" }, filePath),
    ).resolves.toEqual({
      apiKey: "saved-key",
      model: "environment-model",
      baseUrl: "https://saved.example.com/v1",
    });
  });

  it("在环境变量和已保存配置都不存在时提示初始化", async () => {
    const filePath = await createConfigPath();

    await expect(loadConfig({}, filePath)).rejects.toThrow("fcmd init");
  });
});
