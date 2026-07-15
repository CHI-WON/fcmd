import { describe, it, expect } from "vitest";
import { readEnv } from "../src/config/env.js";

describe("readEnv", () => {
  it("三个环境变量都齐时返回配置", () => {
    const cfg = readEnv({
      FCMD_API_KEY: "k",
      FCMD_MODEL: "m",
      FCMD_BASE_URL: "https://example.com/v1",
    });
    expect(cfg).toEqual({
      apiKey: "k",
      model: "m",
      baseUrl: "https://example.com/v1",
    });
  });

  it("缺 FCMD_API_KEY 时抛错", () => {
    expect(() =>
      readEnv({ FCMD_MODEL: "m", FCMD_BASE_URL: "u" }),
    ).toThrow(/FCMD_API_KEY/);
  });

  it("缺 FCMD_MODEL 时抛错", () => {
    expect(() =>
      readEnv({ FCMD_API_KEY: "k", FCMD_BASE_URL: "u" }),
    ).toThrow(/FCMD_MODEL/);
  });

  it("缺 FCMD_BASE_URL 时抛错", () => {
    expect(() =>
      readEnv({ FCMD_API_KEY: "k", FCMD_MODEL: "m" }),
    ).toThrow(/FCMD_BASE_URL/);
  });
});
