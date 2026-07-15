export type OperatingSystem = "Windows" | "macOS" | "Linux" | "其他";

export type TerminalShell =
  | "PowerShell"
  | "Command Prompt"
  | "zsh"
  | "bash"
  | "fish"
  | "sh"
  | "未知";

export interface RuntimeContext {
  operatingSystem: OperatingSystem;
  shell: TerminalShell;
  pathSeparator: "/" | "\\";
}

/**
 * 识别生成命令时需要考虑的运行环境。
 *
 * Windows 无法从 Node.js 中可靠区分 PowerShell 和 CMD，因此默认使用
 * PowerShell。用户可以用 FCMD_SHELL=cmd 覆盖，也可以用它指定 Git Bash。
 */
export function detectRuntimeContext(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): RuntimeContext {
  const operatingSystem = detectOperatingSystem(platform);
  const shell =
    detectShell(env.FCMD_SHELL ?? env.SHELL) ?? defaultShell(operatingSystem);
  const usesPosixPaths = ["zsh", "bash", "fish", "sh"].includes(shell);

  return {
    operatingSystem,
    shell,
    pathSeparator:
      operatingSystem === "Windows" && !usesPosixPaths ? "\\" : "/",
  };
}

function detectOperatingSystem(platform: NodeJS.Platform): OperatingSystem {
  switch (platform) {
    case "win32":
      return "Windows";
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return "其他";
  }
}

function detectShell(value: string | undefined): TerminalShell | undefined {
  if (!value) {
    return undefined;
  }

  const executable = value.toLowerCase().split(/[\\/]/).at(-1) ?? "";

  if (executable === "pwsh" || executable === "pwsh.exe") {
    return "PowerShell";
  }
  if (executable === "powershell" || executable === "powershell.exe") {
    return "PowerShell";
  }
  if (executable === "cmd" || executable === "cmd.exe") {
    return "Command Prompt";
  }
  if (executable === "zsh" || executable === "zsh.exe") {
    return "zsh";
  }
  if (executable === "bash" || executable === "bash.exe") {
    return "bash";
  }
  if (executable === "fish" || executable === "fish.exe") {
    return "fish";
  }
  if (executable === "sh" || executable === "sh.exe") {
    return "sh";
  }

  return undefined;
}

function defaultShell(operatingSystem: OperatingSystem): TerminalShell {
  switch (operatingSystem) {
    case "Windows":
      return "PowerShell";
    case "macOS":
      return "zsh";
    case "Linux":
      return "bash";
    default:
      return "未知";
  }
}
