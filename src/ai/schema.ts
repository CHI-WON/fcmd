import * as z from "zod";

const commandExampleSchema = z.object({
    description: z.string(),
    command: z.string(),
});

const commandRiskLevelSchema = z.enum(["safe", "caution", "danger"]);

const commandSuggestionSchema = z.object({
    command: z.string(),
    usage: z.string(),
    description: z.string(),
    examples: z.array(commandExampleSchema).min(1),
    riskLevel: commandRiskLevelSchema,
    options: z.array(
        z.object({
            option: z.string(),
            description: z.string(),
        }),
    ).optional(),
    notes: z.array(z.string()).optional(),
});

export const fcmdResponseSchema = z.object({
    intent: z.string(),
    summary: z.string(),
    suggestions: z.array(commandSuggestionSchema).min(1).max(3),
    assumptions: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
});

export type FcmdResponse = z.infer<typeof fcmdResponseSchema>;

// 这里使用z.infer<typeof fcmdResponseSchema>得到了
// type FcmdResponse={
//     intent: string,
//     summary: string,
//     suggestions: Array<commandSuggestionSchema>,
//     assumptions?: Array<string>,
//     warnings?: Array<string>,
// }