/**
 * 从环境变量读取 fcmd 的配置。
 *
 * 必填：
 *   - FCMD_API_KEY  : LLM API 鉴权 key
 *   - FCMD_MODEL    : 模型名
 *   - FCMD_BASE_URL : API endpoint
 *
 * 缺任一必填项时抛 Error。错误消息用中文，可直接给终端用户看。
 */

export interface FcmdConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export function readEnv(env: NodeJS.ProcessEnv = process.env): FcmdConfig {
  const apiKey = env.FCMD_API_KEY;
  const model = env.FCMD_MODEL;
  const baseUrl = env.FCMD_BASE_URL;

  if (!apiKey) {
    throw new Error(
      "缺少环境变量 FCMD_API_KEY。\n\n请先设置：\n  export FCMD_API_KEY=\"your-api-key\"",
    );
  }

  if (!model) {
    throw new Error(
      "缺少环境变量 FCMD_MODEL。\n\n请先设置：\n  export FCMD_MODEL=\"model-name\"",
    );
  }

  if (!baseUrl) {
    throw new Error(
      "缺少环境变量 FCMD_BASE_URL。\n\n请先设置：\n  export FCMD_BASE_URL=\"https://...\"",
    );
  }

  return { apiKey, model, baseUrl };
}
