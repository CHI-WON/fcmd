import { chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import * as z from "zod";
import type { FcmdConfig } from "./env.js";

const savedConfigSchema = z.object({
  apiKey: z.string().min(1),
  model: z.string().min(1),
  baseUrl: z.string().url(),
});

export function getConfigFilePath(homeDirectory: string = homedir()): string {
  return join(homeDirectory, ".fcmd", "config.json");
}

export async function readSavedConfig(
  filePath: string = getConfigFilePath(),
): Promise<FcmdConfig | undefined> {
  let content: string;

  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }

    throw new Error("无法读取本地配置文件，请检查文件权限。");
  }

  let data: unknown;

  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("本地配置文件不是有效的 JSON，请运行 fcmd init 重新配置。");
  }

  const result = savedConfigSchema.safeParse(data);

  if (!result.success) {
    throw new Error("本地配置文件格式不正确，请运行 fcmd init 重新配置。");
  }

  return result.data;
}

export async function saveConfig(
  config: FcmdConfig,
  filePath: string = getConfigFilePath(),
): Promise<void> {
  const result = savedConfigSchema.safeParse(config);

  if (!result.success) {
    throw new Error("无法保存不完整的配置。");
  }

  const directory = dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  await writeFile(temporaryPath, JSON.stringify(result.data, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, filePath);
  await chmod(filePath, 0o600);
}

export async function deleteSavedConfig(
  filePath: string = getConfigFilePath(),
): Promise<boolean> {
  try {
    await unlink(filePath);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw new Error("无法删除本地配置文件，请检查文件权限。");
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
