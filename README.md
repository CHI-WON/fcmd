# fcmd

`fcmd` 是一个 TypeScript 命令行工具：将自然语言需求转换为带示例、说明和风险提示的终端命令建议。

## 功能

- 中文/英文自然语言查询
- AI 返回 JSON 后用 Zod 校验
- 多命令建议展示
- 高风险命令提示
- 支持交互式初始化和本地安全保存配置
- 支持 `--json` 输出已校验的结构化结果
- 不自动执行任何命令

## 安装

发布到 npm 后：

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

`init` 会隐藏输入 API Key，并将配置保存到 `~/.fcmd/config.json`。配置目录和文件仅允许当前用户访问。

也可以通过环境变量临时覆盖保存的配置。优先级为：环境变量 > 本地配置。

```bash
export FCMD_API_KEY="..."
export FCMD_MODEL="..."
export FCMD_BASE_URL="https://api.openai.com/v1"
```

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

## 安全说明

fcmd 只提供建议，不自动执行命令；危险操作会标记风险。
