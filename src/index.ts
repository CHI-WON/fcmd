export { parseCommandRequest } from "./ai/parseCommandRequest.js";
export { renderResult } from "./renderer/renderResult.js";
export { fcmdResponseSchema } from "./ai/schema.js";
export { detectRuntimeContext } from "./platform/runtime.js";

export type { FcmdResponse } from "./ai/schema.js";
export type { FcmdConfig } from "./config/env.js";
export type {
  OperatingSystem,
  RuntimeContext,
  TerminalShell,
} from "./platform/runtime.js";
