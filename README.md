# fcmd

<p align="center">
  <img src="assets/fcmd-icon-manga.png" width="180" alt="fcmd 图标：漫画风命令提示符与前进箭头" />
</p>

<p align="center">
  <strong>把自然语言需求转换成安全、可理解的终端命令建议。</strong>
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> ·
  <a href="#使用方法">使用方法</a> ·
  <a href="#安全设计">安全设计</a> ·
  <a href="#开发">开发</a>
</p>

`fcmd` 是一个 TypeScript 命令行工具。用中文或英文描述想完成的终端操作，它会结合当前操作系统和 Shell，返回带有示例、参数说明与风险提示的命令建议。fcmd **只提出建议，永远不会自动执行命令**。

## 特性

- 自然语言输入：支持中文和英文需求。
- 跨平台：识别 macOS、Linux、Windows，以及常见 Shell 环境。
- 结构化输出：模型返回内容须通过 Zod 运行时校验后才会展示。
- 风险提示：对可能覆盖文件或造成不可逆影响的操作明确提醒。
- 多方案建议：当需求对应多个命令时，集中展示可选方案。
- 安全配置：支持交互式初始化和本地保存；API Key 显示时自动脱敏。
- 自动化集成：使用 `--json` 获取已经校验的 JSON 结果。

## 工作方式

```text
自然语言需求 → 运行环境识别 → LLM → JSON 校验 → 命令建议与风险提示
```

fcmd 会将当前系统、Shell 和路径分隔符一并提供给 AI，帮助生成符合当前环境的命令。模型的原始回复不会直接打印；只有通过结构化校验的结果才会被渲染输出。

## 快速开始

运行环境要求：Node.js 22.12.0 或更高版本。支持 macOS、Linux 和 Windows。

全局安装：

```bash
npm install -g fcmd-ai
fcmd init
```

完成配置后，直接描述要做的事：

```bash
fcmd 查看当前目录
fcmd 删除 logs 文件夹
fcmd "find all TypeScript files modified today"
```

也可以在本地开发环境运行：

```bash
npm install
npm run build
node dist/cli.js init
```

## 配置

执行 `fcmd init` 后，按提示输入兼容 OpenAI API 的服务信息。API Key 输入时会隐藏。

| 配置项 | 说明 |
| --- | --- |
| API Key | 服务访问凭据 |
| Model | 要使用的模型名称 |
| Base URL | API 服务地址，例如 `https://api.openai.com/v1` |

配置文件保存位置：

- macOS/Linux：`~/.fcmd/config.json`
- Windows：`%USERPROFILE%\.fcmd\config.json`

macOS/Linux 会将配置目录和文件权限分别限制为 `700` 与 `600`；Windows 使用用户目录继承的 ACL。也可用环境变量临时覆盖本地配置，优先级为：**环境变量 > 本地配置**。

macOS/Linux：

```sh
export FCMD_API_KEY="..."
export FCMD_MODEL="..."
export FCMD_BASE_URL="https://api.openai.com/v1"
```

Windows PowerShell：

```powershell
$env:FCMD_API_KEY = "..."
$env:FCMD_MODEL = "..."
$env:FCMD_BASE_URL = "https://api.openai.com/v1"
```

Windows Command Prompt：

```bat
set FCMD_API_KEY=...
set FCMD_MODEL=...
set FCMD_BASE_URL=https://api.openai.com/v1
```

## 使用方法

### 获取命令建议

```bash
fcmd <你的需求>
```

例如：

```bash
fcmd "把当前目录的所有 .log 文件移动到 archive 文件夹"
fcmd "查看占用 3000 端口的进程"
```

### 指定 Shell

fcmd 默认检测当前环境。需要为某个 Shell 生成命令时，可通过 `--shell` 覆盖：

```bash
fcmd --shell bash "查看当前目录"
fcmd --shell powershell "查看当前目录"
```

支持：`powershell`、`cmd`、`zsh`、`bash`、`fish`、`sh`。也可以设置 `FCMD_SHELL` 环境变量。

### 获取 JSON

适用于脚本、编辑器插件或其他程序调用：

```bash
fcmd --json "查看当前目录"
```

### 管理配置

```bash
fcmd config show   # 显示当前配置，API Key 自动脱敏
fcmd config reset  # 交互确认后删除本地配置
fcmd --version     # 显示版本
```

## 安全设计

- 不执行命令：fcmd 的职责是解释与建议，执行权始终在你手中。
- 风险分级：可能修改、覆盖或不可逆的操作会附带醒目的提示。
- 结构校验：输出须通过 Zod schema 校验，避免直接展示不符合预期的模型回复。
- 最小暴露：查看配置时仅显示 API Key 的末尾部分。

即使有风险提示，执行涉及删除、覆盖、权限或生产环境的命令前，也请自行核对路径、参数和影响范围。

## 开发

```bash
npm run build        # TypeScript 编译
npm test             # 构建并运行 Vitest 测试
npm run dev -- "查看当前目录"
npm pack --dry-run   # 预览将发布到 npm 的文件
```

`prepack` 会在打包前构建，`prepublishOnly` 会在发布前运行完整测试。GitHub Actions 会在 Windows、macOS 和 Linux 上执行相同的构建与测试。

## 许可证

[MIT](LICENSE)
