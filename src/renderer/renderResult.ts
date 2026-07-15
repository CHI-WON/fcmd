import pc from "picocolors";
import type { FcmdResponse } from "../ai/schema.js";

type CommandRiskLevel = FcmdResponse["suggestions"][number]["riskLevel"];

export function renderResult(response: FcmdResponse): string {
    if (response.suggestions.length > 1) {
        return renderMultipleSuggestions(response);
    }
    const suggestion = response.suggestions[0];

    if (!suggestion) {
        return "没有找到命令建议。";
    }

    const example = suggestion.examples[0];

    if (!example) {
        return "没有找到命令示例。";
    }

    const lines = [
        "需求理解：",
        response.summary,
        "",
        "推荐命令：",
        suggestion.usage,
        "",
        "示例：",
        example.command,
        example.description,
        "",
        "说明：",
        suggestion.description,
    ];

    renderOptions(lines, suggestion.options);

    const riskWarning = renderRiskWarning(suggestion.riskLevel);

    if (riskWarning) {
        lines.push("", riskWarning);
    }

    const notes = [
        ...(suggestion.notes ?? []),
        ...(response.warnings ?? []),
    ];

    if (notes.length > 0) {
        lines.push("", "注意：");

        for (const note of notes) {
            lines.push(note);
        }
    }

    return lines.join("\n");
}

function renderMultipleSuggestions(response: FcmdResponse): string {
    const lines = ["需求理解：", response.summary, "", "找到多个相关命令：", ""];

    for (const [index, suggestion] of response.suggestions.entries()) {
        const example = suggestion.examples[0];

        lines.push(`${index + 1}. ${suggestion.command}`);
        lines.push(`   ${suggestion.description}`);
        lines.push(`   用法：${suggestion.usage}`);

        if (example) {
            lines.push(`   示例：${example.command}`);
        }

        for (const option of suggestion.options ?? []) {
            lines.push(`   参数 ${option.option}：${option.description}`);
        }

        const riskWarning = renderRiskWarning(suggestion.riskLevel);

        if (riskWarning) {
            lines.push(`   ${riskWarning}`);
        }

        for (const note of suggestion.notes ?? []) {
            lines.push(`   注意：${note}`);
        }

        if (index < response.suggestions.length - 1) {
            lines.push("");
        }
    }

    if (response.warnings?.length) {
        lines.push("", "整体注意：", ...response.warnings);
    }

    return lines.join("\n");
}

function renderOptions(
    lines: string[],
    options: FcmdResponse["suggestions"][number]["options"],
): void {
    if (!options?.length) {
        return;
    }

    lines.push("", "常用参数：");

    for (const option of options) {
        lines.push(`${option.option}：${option.description}`);
    }
}

function renderRiskWarning(riskLevel: CommandRiskLevel): string | undefined {
    if (riskLevel === "caution") {
        return pc.yellow("风险提示：该操作可能修改或覆盖现有内容，请先确认参数。");
    }

    if (riskLevel === "danger") {
        return pc.red(
            pc.bold("危险提示：该操作可能造成不可逆影响，请确认命令和路径。"),
        );
    }

    return undefined;
}
