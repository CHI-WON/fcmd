import type { FcmdConfig } from "./env.js";
import { readSavedConfig } from "./file.js";

export async function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  filePath?: string,
): Promise<FcmdConfig> {
  const savedConfig = await readSavedConfig(filePath);
  const apiKey = env.FCMD_API_KEY ?? savedConfig?.apiKey;
  const model = env.FCMD_MODEL ?? savedConfig?.model;
  const baseUrl = env.FCMD_BASE_URL ?? savedConfig?.baseUrl;

  if (!apiKey || !model || !baseUrl) {
    throw new Error(
      "尚未配置 AI 服务。请先运行 fcmd init，或设置 FCMD_API_KEY、FCMD_MODEL 和 FCMD_BASE_URL 环境变量。",
    );
  }

  return { apiKey, model, baseUrl };
}
