import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  deleteSavedConfig,
  getConfigFilePath,
  readSavedConfig,
  saveConfig,
} from "../src/config/file.js";

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "fcmd-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("config file", () => {
  it("在用户目录下生成配置文件路径", () => {
    expect(getConfigFilePath("/tmp/example-home")).toBe(
      "/tmp/example-home/.fcmd/config.json",
    );
  });

  it("在配置文件不存在时返回 undefined", async () => {
    const directory = await createTemporaryDirectory();
    const filePath = join(directory, "missing.json");

    await expect(readSavedConfig(filePath)).resolves.toBeUndefined();
  });

  it("保存并读取完整配置，同时限制文件权限", async () => {
    const directory = await createTemporaryDirectory();
    const filePath = join(directory, ".fcmd", "config.json");
    const config = {
      apiKey: "test-api-key",
      model: "test-model",
      baseUrl: "https://api.example.com/v1",
    };

    await saveConfig(config, filePath);

    await expect(readSavedConfig(filePath)).resolves.toEqual(config);
    await expect(readFile(filePath, "utf8")).resolves.toContain("test-model");

    const fileStats = await stat(filePath);
    expect(fileStats.mode & 0o777).toBe(0o600);
  });

  it("拒绝格式不正确的本地配置文件", async () => {
    const directory = await createTemporaryDirectory();
    const filePath = join(directory, "config.json");
    await writeFile(filePath, JSON.stringify({ apiKey: "only-a-key" }));

    await expect(readSavedConfig(filePath)).rejects.toThrow(
      "本地配置文件格式不正确",
    );
  });

  it("删除已保存配置，并在文件不存在时返回 false", async () => {
    const directory = await createTemporaryDirectory();
    const filePath = join(directory, ".fcmd", "config.json");
    await saveConfig(
      {
        apiKey: "test-api-key",
        model: "test-model",
        baseUrl: "https://api.example.com/v1",
      },
      filePath,
    );

    await expect(deleteSavedConfig(filePath)).resolves.toBe(true);
    await expect(readSavedConfig(filePath)).resolves.toBeUndefined();
    await expect(deleteSavedConfig(filePath)).resolves.toBe(false);
  });
});
