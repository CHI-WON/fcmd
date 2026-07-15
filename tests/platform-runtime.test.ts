import { describe, expect, it } from "vitest";
import { detectRuntimeContext } from "../src/platform/runtime.js";

describe("detectRuntimeContext", () => {
  it("Windows 默认使用 PowerShell 和反斜杠路径", () => {
    expect(detectRuntimeContext("win32", {})).toEqual({
      operatingSystem: "Windows",
      shell: "PowerShell",
      pathSeparator: "\\",
    });
  });

  it("允许 Windows 用户通过 FCMD_SHELL 指定 CMD", () => {
    expect(detectRuntimeContext("win32", { FCMD_SHELL: "cmd.exe" })).toEqual({
      operatingSystem: "Windows",
      shell: "Command Prompt",
      pathSeparator: "\\",
    });
  });

  it("识别 Windows 下的 Git Bash", () => {
    expect(
      detectRuntimeContext("win32", {
        SHELL: "C:\\Program Files\\Git\\bin\\bash.exe",
      }),
    ).toMatchObject({ shell: "bash", pathSeparator: "/" });
  });

  it("识别 macOS 的 zsh", () => {
    expect(detectRuntimeContext("darwin", { SHELL: "/bin/zsh" })).toEqual({
      operatingSystem: "macOS",
      shell: "zsh",
      pathSeparator: "/",
    });
  });

  it("Linux 在无法识别 Shell 时默认使用 bash", () => {
    expect(detectRuntimeContext("linux", { SHELL: "/bin/unknown" })).toEqual({
      operatingSystem: "Linux",
      shell: "bash",
      pathSeparator: "/",
    });
  });

  it("FCMD_SHELL 的优先级高于 SHELL", () => {
    expect(
      detectRuntimeContext("linux", {
        FCMD_SHELL: "fish",
        SHELL: "/bin/bash",
      }),
    ).toMatchObject({ shell: "fish" });
  });
});
