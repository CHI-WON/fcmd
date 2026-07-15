# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`fcmd` is an AI-first CLI tool that converts natural language (Chinese/English) into structured terminal command suggestions. The user describes what they want to do, the tool calls an LLM API, validates the structured output, and renders a human-readable command recommendation with examples, explanations, and safety warnings.

The full product specification lives in `fcmd-development-spec.md`. Read it before making significant design decisions — it defines the core pipeline, structured output schema, risk levels, CLI output format templates, and error handling requirements.

## Build / run / test

```bash
npm run build          # tsc
npm run dev -- "查看当前目录"
npm start -- "查看当前目录"
npm test               # build + Vitest
npm pack --dry-run      # preview the publishable package
```

TypeScript compiles directly to `dist/`; Vitest is the configured test runner. There is no bundler or linter.

## Architecture

**pipeline:** `user input → CLI arg parsing → config/env read → LLM prompt construction → LLM API call → structured output validation → terminal renderer`

Implemented modules:

| Module | Responsibility |
|--------|---------------|
| `src/cli.ts` | CLI entry point: parse args, handle `--help`/`--version`, orchestrate the pipeline |
| `src/index.ts` | Public core API exports |
| `src/config/env.ts` | Environment configuration type and strict environment reader |
| `src/config/file.ts` | Securely read, write, and delete `~/.fcmd/config.json` |
| `src/config/interactive.ts` | Interactive `fcmd init` configuration flow |
| `src/config/load.ts` | Merge environment overrides with saved configuration |
| `src/ai/schema.ts` | TypeScript types + Zod schemas for `FcmdResponse` / `CommandSuggestion` |
| `src/ai/prompt.ts` | System prompt and user prompt templates |
| `src/ai/client.ts` | LLM API wrapper (fetch-based, handles auth/timeout/errors) |
| `src/ai/parseCommandRequest.ts` | Glue: natural language in → structured `FcmdResponse` out |
| `src/renderer/renderResult.ts` | `FcmdResponse` → terminal-formatted text with color, indentation, risk highlighting |

**Key types** (from the spec):
- `FcmdResponse` — top-level: intent, summary, suggestions[], assumptions, warnings
- `CommandSuggestion` — command, usage, description, examples, riskLevel ("safe" | "caution" | "danger"), options, notes
- `CommandExample` — description + command string

**Critical constraints:**
- The tool never executes commands; it only displays suggestions.
- LLM output must pass Zod validation before rendering — never render raw model text.
- Risk levels must be visually prominent for dangerous commands (`rm -rf`, `chmod`, `sudo`, `kill`, etc.).
- API keys must never appear in logs, error messages, or terminal output.
- Chinese UX: error messages and help text should be in Chinese by default.

## Configuration

Users should run `fcmd init`, which saves masked interactive input to `~/.fcmd/config.json`. Environment variables override saved values for one-off runs:

```bash
export FCMD_API_KEY="your-api-key"
export FCMD_MODEL="model-name"
export FCMD_BASE_URL="https://..."
```

## Development philosophy (IMPORTANT)

The project owner is a **beginner developer** using this project to learn TypeScript + AI integration. All development work must follow these principles:

- **Modular and step-by-step.** Implement one module at a time, in dependency order. Before writing each module, briefly explain what requirement it addresses and why it's needed in the pipeline. Don't jump ahead.
- **Clarity over cleverness.** Use simple, readable TypeScript. Avoid advanced patterns, unnecessary generics, or terse one-liners that a beginner would struggle to understand.
- **Pacing.** Don't implement multiple modules in one go unless they are trivially small and tightly coupled. After each module, pause and let the user understand what was built.
- **Every file has a purpose.** When creating a new file, state clearly: what problem it solves, what it depends on, and what depends on it.
- **Test as you go.** After implementing a module, write or update its unit tests before moving on. This teaches the habit of verifying work incrementally.

## Current state

The MVP is implemented and uses ESM (`"type": "module"`). It supports `fcmd init`, natural-language queries, `--json`, risk-aware rendering, and `fcmd config show/reset`. Network requests time out after 20 seconds. Tests cover configuration, AI response validation, rendering, client failures, and CLI help/config behavior.

## Tech stack

TypeScript 7, Node.js ESM, Commander.js, Zod, Picocolors, `@inquirer/prompts`, and Vitest.
