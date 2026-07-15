import { confirm, input, password } from "@inquirer/prompts";
import type { FcmdConfig } from "./env.js";
import { getConfigFilePath, readSavedConfig, saveConfig } from "./file.js";

export async function initializeConfig(
  filePath: string = getConfigFilePath(),
): Promise<FcmdConfig | undefined> {
  const existingConfig = await readSavedConfig(filePath);

  if (existingConfig) {
    const shouldOverwrite = await confirm({
      message: "已有保存的配置，是否覆盖？",
      default: false,
    });

    if (!shouldOverwrite) {
      return undefined;
    }
  }

  const apiKey = await password({
    message: "API Key：",
    mask: "*",
    validate: requireValue("API Key 不能为空。"),
  });
  const model = await input({
    message: "模型名称：",
    validate: requireValue("模型名称不能为空。"),
  });
  const baseUrl = await input({
    message: "服务地址：",
    default: "https://api.deepseek.com",
    validate: validateUrl,
  });

  const config = {
    apiKey: apiKey.trim(),
    model: model.trim(),
    baseUrl: baseUrl.trim(),
  };

  await saveConfig(config, filePath);
  return config;
}

function requireValue(errorMessage: string) {
  return (value: string): true | string =>
    value.trim() ? true : errorMessage;
}

function validateUrl(value: string): true | string {
  try {
    new URL(value.trim());
    return true;
  } catch {
    return "请输入有效的服务地址。";
  }
}
