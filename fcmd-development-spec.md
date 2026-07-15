# fcmd 命令行工具开发文档

## 1. 项目概述

`fcmd` 是一个 AI-first 的命令行辅助工具，面向终端新手和初级开发者。用户通过自然语言描述想完成的操作，工具调用 LLM API 理解需求，并返回结构化的终端命令建议、参数格式、示例、说明和必要的安全提示。

示例：

```bash
fcmd 移动一张图片到另一个文件夹
```

输出示例：

```text
推荐命令：
mv <源文件路径> <目标文件夹路径>

示例：
mv ./photo.png ./images/

说明：
mv 用于移动或重命名文件。目标路径是文件夹时，会把源文件移动到该文件夹中。

注意：
如果目标位置已有同名文件，可能会被覆盖。可以使用 mv -i 开启覆盖前确认。
```

`fcmd` 的核心不是维护本地命令库，而是把自然语言请求交给模型理解，再通过 structured output 约束模型返回可验证、可渲染、适合终端阅读的结果。

## 2. 背景与问题

刚开始使用终端工作或开发的用户，经常知道自己想完成什么操作，却不知道应该使用哪个命令。例如：

- 想移动图片，但不知道应使用 `mv`
- 想复制文件夹，但不清楚 `cp -r` 的格式
- 想查看当前目录内容，但不知道 `ls`
- 想删除文件，但不了解 `rm` 的风险

传统命令手册通常按照命令组织内容，对新手不够友好。用户需要先知道命令名称，才能查询详细用法，而新手真正缺少的是“需求到命令”的转换。

`fcmd` 的目标是反过来工作：让用户先描述需求，再由 AI 生成合适、可解释、带安全提示的命令建议。

## 3. 产品目标

### 3.1 核心目标

- 支持用户使用自然语言查询终端命令。
- 使用 LLM API 理解中文、英文和口语化表达。
- 要求模型返回 structured output，保证 CLI 渲染稳定。
- 返回一个或多个命令建议、参数格式、示例和简短解释。
- 对删除、覆盖、权限、强制执行等高风险操作提供明显安全提醒。
- 使用 TypeScript 开发，便于维护、测试和扩展。
- 提供简洁、稳定、适合命令行环境的交互体验。

### 3.2 非目标

MVP 阶段不追求：

- 维护完整的本地命令库。
- 使用本地关键词规则匹配命令。
- 完整替代 `man` 或官方文档。
- 自动执行返回的命令。
- 保证覆盖所有系统命令。
- 完成复杂多步骤开发任务的自动规划和执行。
- 与 Shell 深度集成，例如自动补全、历史记录增强等。

## 4. 目标用户

### 4.1 新手终端用户

用户特征：

- 刚开始学习终端。
- 能描述自己想做什么，但记不住命令。
- 更需要示例和解释，而不是完整手册。

典型需求：

- “把文件移动到另一个文件夹”
- “创建一个新文件夹”
- “查看当前目录下有哪些文件”

### 4.2 初级开发者

用户特征：

- 会使用部分常见命令，但不熟悉参数。
- 经常查询 Git、npm、文件操作等基础命令。
- 需要快速获得可复制的命令格式。

典型需求：

- “初始化一个 git 仓库”
- “安装项目依赖”
- “查看某个端口是否被占用”

## 5. 使用方式

### 5.1 基本调用

```bash
fcmd <自然语言需求>
```

示例：

```bash
fcmd 移动图片到 images 文件夹
fcmd 查看当前目录
fcmd 删除一个文件
fcmd 复制文件夹
```

### 5.2 查看帮助

```bash
fcmd --help
fcmd -h
```

### 5.3 查看版本

```bash
fcmd --version
fcmd -v
```

### 5.4 配置 API Key

MVP 阶段通过环境变量读取模型配置。

```bash
export FCMD_API_KEY="your-api-key"
export FCMD_MODEL="model-name"
export FCMD_BASE_URL="https://api.example.com/v1"

```

说明：

- `FCMD_API_KEY`：必填，用于调用 LLM API。
- `FCMD_MODEL`：必填，用于确定具体模型。
- `FCMD_BASE_URL`：必填，兼容OpenAI。

## 6. 功能需求

### 6.1 自然语言命令查询

用户输入自然语言需求后，系统应调用 LLM API，并返回一个或多个命令建议。

要求：

- 支持中文输入。
- 支持简单英文输入。
- 支持口语化表达。
- 输入为空时提示正确用法。
- API key 未配置时给出明确提示。
- 模型无法理解或返回不合法结构时给出友好错误。
- 不自动执行任何命令，只展示建议。

示例输入：

```bash
fcmd 移动一张图片到另一个文件夹
```

示例输出内容：

- 推荐命令：`mv`
- 命令格式：`mv <源文件路径> <目标文件夹路径>`
- 使用示例：`mv ./photo.png ./images/`
- 简短说明
- 安全提示

### 6.2 Structured Output

LLM 必须返回符合 schema 的结构化数据。CLI 不直接渲染模型的自由文本，而是先解析、校验结构，再由本地 renderer 生成终端输出。

数据结构建议：

```ts
type CommandRiskLevel = "safe" | "caution" | "danger";

interface FcmdResponse {
  intent: string;
  summary: string;
  suggestions: CommandSuggestion[];
  assumptions?: string[];
  warnings?: string[];
}

interface CommandSuggestion {
  command: string;
  usage: string;
  description: string;
  examples: CommandExample[];
  riskLevel: CommandRiskLevel;
  options?: CommandOption[];
  notes?: string[];
}

interface CommandExample {
  description: string;
  command: string;
}

interface CommandOption {
  option: string;
  description: string;
}
```

字段要求：

- `intent`：用户意图的短标识，例如 `move_file`、`delete_directory`。
- `summary`：对用户需求的简短复述。
- `suggestions`：至少 1 条，最多 3 条。
- `command`：命令名称或命令组合，例如 `mv`、`cp -r`、`git commit`。
- `usage`：可复制的命令格式，使用占位符表达路径、文件名或参数。
- `examples`：至少 1 条具体示例。
- `riskLevel`：用于决定是否突出显示风险提示。
- `warnings`：整体风险或不确定性提示。

### 6.3 模型提示词约束

系统提示词应明确约束模型行为：

- 只推荐终端命令，不执行命令。
- 不编造系统状态、文件是否存在、权限是否足够等事实。
- 如果需求不明确，应返回合理假设，或给出多个候选。
- 对删除、覆盖、权限修改、网络下载、进程结束等操作必须标记风险。
- 对危险命令优先推荐更安全的写法，例如使用交互确认、先预览、先备份。
- 返回必须符合 structured output schema，不输出额外自由文本。

### 6.4 多结果展示

当用户需求可能对应多个命令时，应展示多个候选。

示例：

```bash
fcmd 查找文件
```

可能输出：

```text
找到多个相关命令：

1. find
   用于按名称、类型、时间等条件查找文件。
   示例：find . -name "*.png"

2. grep
   用于在文件内容中搜索文本。
   示例：grep "hello" ./notes.txt
```

### 6.5 风险提示

涉及删除、覆盖、权限修改、强制操作、网络下载、进程结束等命令时，必须显示安全提示。

高风险命令示例：

- `rm`
- `rm -rf`
- `mv` 覆盖已有文件
- `chmod`
- `chown`
- `sudo`
- `kill`
- 使用 `curl` 或 `wget` 下载并执行脚本

风险提示示例：

```text
注意：
rm 删除的文件通常不会进入回收站。执行前请确认路径正确。
```

### 6.6 帮助信息

`fcmd --help` 应展示：

- 工具简介
- 基本用法
- API key 配置方式
- 常用示例
- 可用参数

示例：

```text
fcmd - 用 AI 将自然语言转换为终端命令建议

用法：
  fcmd <自然语言需求>

示例：
  fcmd 移动文件
  fcmd 复制一个文件夹
  fcmd 查看当前目录

配置：
  export FCMD_API_KEY="your-api-key"
  export FCMD_MODEL="model-name"

参数：
  -h, --help       显示帮助
  -v, --version    显示版本
```

## 7. MVP 能力范围

MVP 不维护本地命令库，但应通过提示词和 schema 让模型稳定处理以下常见场景。

### 7.1 文件与目录操作

- 查看当前路径
- 查看目录内容
- 切换目录
- 创建目录
- 创建文件
- 复制文件或文件夹
- 移动或重命名文件
- 删除文件或文件夹
- 查看文件内容
- 分页查看文件

### 7.2 搜索与查看

- 查找文件
- 搜索文件内容
- 查看文件开头或结尾
- 统计行数、字数、字符数

### 7.3 系统与进程

- 查看进程
- 结束进程
- 查看系统资源
- 查看磁盘空间
- 查看目录占用空间
- 查看端口占用

### 7.4 开发常用命令

- 初始化 Git 仓库
- 克隆 Git 仓库
- 查看 Git 状态
- 添加、提交、拉取、推送代码
- 安装 npm 依赖
- 运行 npm scripts

## 8. 技术方案

### 8.1 技术栈

- 语言：TypeScript
- 运行环境：Node.js
- CLI 入口：Node 可执行脚本
- LLM 调用：使用 fetch 或轻量 SDK
- 包管理器：npm、pnpm 或 yarn，项目初始化时选择其一
- 测试框架：Vitest 或 Jest
- 打包工具：tsup、esbuild 或 tsc

推荐组合：

- TypeScript
- Node.js
- Commander.js 处理 CLI 参数
- Zod 校验 structured output
- Chalk 或 Picocolors 处理终端颜色
- Vitest 处理单元测试
- tsup 生成发布产物

### 8.2 项目结构建议

```text
fcmd/
  package.json
  tsconfig.json
  README.md
  src/
    cli.ts
    index.ts
    ai/
      client.ts
      prompt.ts
      schema.ts
      parseCommandRequest.ts
    renderer/
      renderResult.ts
      renderHelp.ts
      renderError.ts
    config/
      env.ts
    utils/
      normalize.ts
  tests/
    ai-schema.test.ts
    renderer.test.ts
    cli.test.ts
```

### 8.3 模块说明

`src/cli.ts`

- 负责命令行入口。
- 读取用户参数。
- 处理 `--help` 和 `--version`。
- 校验输入和环境变量。
- 调用核心查询逻辑。
- 输出结果到终端。

`src/index.ts`

- 暴露核心 API。
- 便于未来被其他工具或测试调用。

`src/config/env.ts`

- 读取 `FCMD_API_KEY`、`FCMD_MODEL`、`FCMD_BASE_URL`。
- 提供默认配置。
- 返回明确的配置错误。

`src/ai/prompt.ts`

- 存放系统提示词和用户提示词模板。
- 明确 structured output、风险提示和输出语言要求。

`src/ai/schema.ts`

- 定义 TypeScript 类型和运行时 schema。
- 校验模型返回结果。
- 拒绝不合法、缺字段或风险等级错误的响应。

`src/ai/client.ts`

- 封装 LLM API 请求。
- 处理超时、网络错误、鉴权错误和模型错误。
- 不把 API key 输出到日志或错误信息中。

`src/ai/parseCommandRequest.ts`

- 接收用户自然语言。
- 构造模型请求。
- 获取并校验 structured output。
- 返回 `FcmdResponse`。

`src/renderer/renderResult.ts`

- 将 `FcmdResponse` 渲染为适合终端阅读的文本。
- 处理颜色、缩进、多候选和风险提示。

## 9. 核心流程

```text
用户输入
  ↓
CLI 解析参数
  ↓
读取 API key 和模型配置
  ↓
构造 LLM prompt 和 structured output schema
  ↓
调用 LLM API
  ↓
校验 structured output
  ↓
渲染终端输出
```

## 10. 错误与边界处理

### 10.1 空输入

输入：

```bash
fcmd
```

输出：

```text
请输入你想完成的操作。

示例：
  fcmd 移动文件
  fcmd 创建文件夹
  fcmd 查看当前目录
```

### 10.2 API key 未配置

输出：

```text
缺少 API key。

请先设置环境变量：
  export FCMD_API_KEY="your-api-key"
```

### 10.3 模型调用失败

模型调用失败时应给出明确但不泄露敏感信息的提示。

常见原因：

- 网络不可用。
- API key 无效。
- 模型服务返回错误。
- 请求超时。

输出示例：

```text
暂时无法连接 AI 服务。

请检查网络、API key 或稍后重试。
```

### 10.4 Structured output 校验失败

如果模型返回内容不符合 schema，应提示用户重试，不直接渲染不可信内容。

输出示例：

```text
AI 返回的结果格式不符合预期。

请稍后重试，或换一种更具体的说法。
```

### 10.5 多结果歧义

当模型认为需求可能对应多个命令时，展示前 3 个候选，并提示用户补充需求。

## 11. CLI 输出规范

终端输出应遵循以下原则：

- 首屏信息尽量简洁。
- 优先展示可复制的命令格式。
- 解释要短，不输出长篇手册。
- 风险提示必须醒目。
- 中文文案应自然、明确、避免术语堆叠。
- 不显示原始 JSON，除非未来提供 debug 参数。

单结果输出模板：

```text
推荐命令：
<usage>

示例：
<example command>

说明：
<description>

常用参数：
<options>

注意：
<notes>
```

多结果输出模板：

```text
找到多个相关命令：

1. <command>
   <description>
   用法：<usage>
   示例：<example>

2. <command>
   <description>
   用法：<usage>
   示例：<example>
```

## 12. 测试要求

### 12.1 单元测试

应覆盖：

- 空输入处理。
- API key 未配置处理。
- structured output schema 校验。
- 高风险命令提示渲染。
- 单结果输出格式。
- 多结果输出格式。
- LLM client 的成功响应解析。
- LLM client 的错误响应处理。

示例测试用例：

| 场景                       | 预期                 |
| -------------------------- | -------------------- |
| 缺少 `FCMD_API_KEY`        | 输出配置提示         |
| 模型返回 `mv` 建议         | 渲染命令、示例和说明 |
| 模型返回 `rm -rf` 建议     | 渲染危险提示         |
| 模型返回缺少 `suggestions` | schema 校验失败      |
| 模型返回多个候选           | 展示候选列表         |

### 12.2 手动验收

安装并设置 API key 后执行：

```bash
fcmd 移动一张图片到另一个文件夹
fcmd 查看当前目录
fcmd 复制文件夹
fcmd 删除文件夹
fcmd git 提交代码
fcmd 查看 3000 端口是否被占用
fcmd --help
fcmd --version
```

每条命令都应得到明确、可读、无异常的输出。

## 13. 发布要求

### 13.1 npm 包配置

`package.json` 应包含：

```json
{
  "name": "fcmd",
  "version": "0.1.0",
  "bin": {
    "fcmd": "./dist/cli.js"
  },
  "type": "module"
}
```

### 13.2 本地开发命令

建议提供：

```bash
npm run dev
npm run build
npm test
npm run lint
```

### 13.3 安装方式

发布后用户可通过 npm 全局安装：

```bash
npm install -g fcmd
```

使用前配置：

```bash
export FCMD_API_KEY="your-api-key"
```

使用：

```bash
fcmd 移动文件
```

## 14. 未来扩展

后续版本可考虑：

- 支持多个模型服务商配置。
- 支持交互式追问模式。
- 支持根据当前操作系统返回不同命令。
- 支持 Shell 自动补全。
- 支持 `--explain` 展示更详细解释。
- 支持 `--json` 输出原始 structured output。
- 支持 `--copy` 将推荐命令复制到剪贴板。
- 支持本地历史记录，但不保存 API key。
- 支持用户自定义系统提示词片段。
- 支持可选的离线模式或小型本地模型。

## 15. 验收标准

MVP 版本完成时应满足：

- 用户可以通过 `fcmd <自然语言需求>` 查询命令。
- 工具会调用 LLM API 并解析 structured output。
- 未配置 API key 时有明确提示。
- 模型返回结果必须经过 schema 校验。
- 输出包含命令格式、示例、说明和注意事项。
- 删除、覆盖、权限、进程结束等风险相关命令有风险提示。
- `--help` 和 `--version` 可正常使用。
- 项目使用 TypeScript 编写。
- schema、renderer、LLM client 错误处理有单元测试。
- 可通过 npm 全局安装并运行。
