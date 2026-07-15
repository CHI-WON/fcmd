# fcmd

`fcmd` 是一个 TypeScript 命令行工具：将自然语言需求转换为带示例、说明和风险提示的终端命令建议。

## 功能

- 中文/英文自然语言查询
- AI 返回 JSON 后用 Zod 校验
- 多命令建议展示
- 高风险命令提示
- 支持交互式初始化和本地安全保存配置
- 自动识别 macOS、Linux、Windows 和常见 Shell
- 支持 `--json` 输出已校验的结构化结果
- 不自动执行任何命令

## 安装

运行环境要求：Node.js 22.12.0 或更高版本。支持 macOS、Linux 和 Windows。

从 npm 全局安装：

```bash
npm install -g fcmd-ai
fcmd init
```

本地开发：

```bash
npm install
npm run build
node dist/cli.js init
```

`init` 会隐藏输入 API Key。配置文件位置：

- macOS/Linux：`~/.fcmd/config.json`
- Windows：`%USERPROFILE%\.fcmd\config.json`

macOS/Linux 下会将配置目录和文件权限分别限制为 `700` 和 `600`。Windows
使用用户目录继承的 ACL 权限，不使用 POSIX 权限位。

也可以通过环境变量临时覆盖保存的配置。优先级为：环境变量 > 本地配置。

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

这些环境变量只需在需要临时覆盖 `fcmd init` 保存的配置时使用。

## 跨平台命令

fcmd 会把当前操作系统、Shell 和路径分隔符发送给 AI，确保推荐的命令与
运行环境匹配。macOS 和 Linux 会根据 `SHELL` 自动识别；Windows 默认生成
PowerShell 命令。

可以针对单次请求指定其他 Shell：

```powershell
fcmd --shell cmd "查看当前目录"
fcmd --shell bash "查看当前目录"
```

也可以设置 `FCMD_SHELL`。支持的值为 `powershell`、`cmd`、`zsh`、`bash`、
`fish` 和 `sh`。

## 使用示例

```bash
fcmd 查看当前目录
fcmd 删除 logs 文件夹
fcmd --json "查看当前目录"
fcmd config show
fcmd config reset
```

`config show` 会隐藏 API Key 的大部分内容；`config reset` 删除本地保存的配置前会要求确认。

## 技术设计

```text
用户输入 → Commander → Prompt → LLM Client → Zod → Renderer
```

模型输出不会直接打印；必须先解析 JSON 并通过 Zod 运行时校验，才会渲染到终端。

## 本地开发

```bash
npm run build
npm test
npm run dev -- "查看当前目录"
npm pack --dry-run
```

`prepack` 会在生成 npm 包前构建项目，`prepublishOnly` 会在发布前执行完整测试。
项目通过 GitHub Actions 在 Windows、macOS 和 Linux 上执行相同的构建与测试。

## 安全说明

fcmd 只提供建议，不自动执行命令；危险操作会标记风险。
