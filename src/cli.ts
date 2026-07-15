#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { Command, Option } from "commander";
import { confirm } from "@inquirer/prompts";
import { initializeConfig } from "./config/interactive.js";
import { loadConfig } from "./config/load.js";
import {
    deleteSavedConfig,
    getConfigFilePath,
    readSavedConfig,
} from "./config/file.js";
import { parseCommandRequest } from "./ai/parseCommandRequest.js";
import { renderResult } from "./renderer/renderResult.js";
import { detectRuntimeContext } from "./platform/runtime.js";

const program = new Command();

program
    .name("fcmd")
    .description("用 AI 将自然语言转换为终端命令建议")
    .version(readPackageVersion(), "-v, --version", "显示版本")
    .option("--json", "输出经过校验的 JSON 结果")
    .addOption(
        new Option("--shell <shell>", "指定生成命令所使用的 Shell").choices([
            "powershell",
            "cmd",
            "zsh",
            "bash",
            "fish",
            "sh",
        ]),
    )
    .argument("[request...]", "用自然语言描述想完成的终端操作");

program
    .command("init")
    .description("交互式配置 AI 服务")
    .action(async () => {
        try {
            const config = await initializeConfig();

            if (!config) {
                console.log("已取消配置更新。");
                return;
            }

            console.log("配置已安全保存。现在可以运行 fcmd <你的需求>。");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "配置时发生未知错误。";

            console.error(message);
            process.exitCode = 1;
        }
    });

const configCommand = program
    .command("config")
    .description("查看或清除本地配置");

configCommand
    .command("show")
    .description("显示当前配置（API Key 会脱敏）")
    .action(async () => {
        try {
            const config = await loadConfig();
            console.log(`API Key：${maskApiKey(config.apiKey)}`);
            console.log(`模型名称：${config.model}`);
            console.log(`服务地址：${config.baseUrl}`);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "读取配置时发生未知错误。";

            console.error(message);
            process.exitCode = 1;
        }
    });

configCommand
    .command("reset")
    .description("删除本地保存的配置")
    .action(async () => {
        try {
            const filePath = getConfigFilePath();
            const savedConfig = await readSavedConfig(filePath);

            if (!savedConfig) {
                console.log("没有可删除的本地配置。");
                return;
            }

            const shouldDelete = await confirm({
                message: "确定要删除本地保存的配置吗？",
                default: false,
            });

            if (!shouldDelete) {
                console.log("已取消删除配置。");
                return;
            }

            await deleteSavedConfig(filePath);
            console.log("本地配置已删除。");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "删除配置时发生未知错误。";

            console.error(message);
            process.exitCode = 1;
        }
    });

program.action(async (requestParts: string[] = []) => {
    const request = requestParts.join(" ").trim();

    if (!request) {
        console.error("请输入你想完成的操作。");
        console.error("\n示例：\n  fcmd 移动文件\n  fcmd 查看当前目录");
        process.exitCode = 1;
        return;
    }

    try {
        const config = await loadConfig();
        const options = program.opts<{ json?: boolean; shell?: string }>();
        const runtime = detectRuntimeContext(process.platform, {
            ...process.env,
            ...(options.shell ? { FCMD_SHELL: options.shell } : {}),
        });
        const response = await parseCommandRequest(request, config, runtime);

        if (options.json) {
            console.log(JSON.stringify(response, null, 2));
            return;
        }

        console.log(renderResult(response));
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "发生了未知错误，请稍后重试。";

        console.error(message);
        process.exitCode = 1;
    }
});

await program.parseAsync();

function maskApiKey(apiKey: string): string {
    if (apiKey.length <= 4) {
        return "****";
    }

    return `****${apiKey.slice(-4)}`;
}

function readPackageVersion(): string {
    const content = readFileSync(new URL("../package.json", import.meta.url), "utf8");
    const packageData: unknown = JSON.parse(content);

    if (
        typeof packageData !== "object" ||
        packageData === null ||
        !("version" in packageData) ||
        typeof packageData.version !== "string"
    ) {
        throw new Error("无法读取 package.json 中的版本号。");
    }

    return packageData.version;
}
