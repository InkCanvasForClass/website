---
title: 贡献流程
description: 分支策略、提交规范、PR 检查与代码规范
---

# 贡献流程

主开发分支是 `net6`。`main` 是历史遗留分支，实际上已不活跃。所有 PR 都应提交到 `net6`。

## 分支策略

只有一个活跃开发分支：**`net6`**。

```
net6 (主开发分支)
  ├─ feature/xxx (功能分支)
  ├─ fix/yyy (修复分支)
  └─ PR → net6
```

`sync-net6-to-net10.yml` 会在 `net6` 有新提交时自动把改动合并到 `net10` 分支（.NET 10 迁移分支），细节见文末。


::: warning 不要直接推送到 main
虽然 `prcheck.yml` 允许 PR 到 `main`，但实际开发都在 `net6`。除非维护者明确要求，否则不要向 `main` 提交。
:::

## 提交信息规范

项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，`git-cliff` 根据提交信息自动生成 Changelog。

### 前缀到 Changelog 分组的映射

`build/cliff.toml` 的 `commit_parsers` 决定了提交落到哪个分组。**中文前缀同样被识别**，这是这套配置和标准 Conventional Commits 最大的区别：

| 提交信息前缀 | Changelog 分组 |
| --- | --- |
| `feat` / `add` / `新增` / `添加` | 🚀 新增功能 |
| `fix` / `修复` | 🐛 修复 |
| `refactor` | 🚜 重构 |
| `improve` / `改进` / `优化` | ⚡ 体验优化 |
| `delete` / `删除` / `移除` | ❌ 删除功能 |
| `doc` | 📚 文档更改 |
| `style` | 🎨 格式化 |
| `test` | 🧪 测试 |
| `chore` / `ci` | ⚙️ 杂项 |
| `Revert` | ◀️ 回退 |
| `版本` / `version` / `更新版本号` | 🎉 版本号更新 |
| 其他任何内容 | 💼 其他更改 |

::: warning 没有任何提交会被丢弃
`filter_commits = false` 且最后一条规则是 `{ message = ".*", group = "其他更改" }`。写得再随意的提交信息也会进 Changelog，只是落到「💼 其他更改」里。想让 Changelog 好看，就老老实实写前缀。
:::

以下几类会被显式跳过（`skip = true`），不出现在 Changelog：

- `chore(release): prepare for ...`
- `chore(deps...)` —— Dependabot 的依赖更新
- `chore(pr)` / `chore(pull)`
- `Merge branch ...`

::: tip 典型提交示例
```bash
feat(plugin): 支持插件注册全局快捷键

在 IPluginHost 添加 RegisterHotkey 方法，允许插件在 Initialize 阶段注册全局快捷键。

Closes #1234
```

提交信息里写 `#1234` 会被 `link_parsers` 自动转成指向 community 仓库 issue 的链接。
:::


## PR 检查门禁

提交 PR 到 `net6` 或 `main` 后会触发以下检查：

### 1. prcheck.yml —— 构建与打包

**触发条件**：PR opened/synchronize，`paths-ignore: ["**/*.md"]`（纯 Markdown 改动不跑）。

**矩阵**：`AnyCPU` 和 `x86` 两个架构并行构建。

**关键检查**：

- `dotnet restore --locked-mode` —— `PackageReference` 变更必须同步提交 `packages.lock.json`，否则失败
- 构建 `Debug` 配置 + `/p:RunAnalyzers=false`（不跑代码分析器，加快速度）
- 检查 VSTO DLL 是否生成（`Microsoft.Office.Tools.Common.v4.0.Utilities.dll` 必须存在）
- 检查主程序 exe 是否生成
- 打包产物并上传 artifact

证书相关：有 `CERT_PFX_BASE64` secret 则导入真实证书，否则自动生成自签证书。Fork 的 PR 也能过（会用自签）。

### 2. linter.yml —— 代码检查

**触发条件**：push/PR 到 `net6`，同样忽略 Markdown。

**Linter**：`super-linter v8.6.0`，但 `DISABLE_ERRORS: true`（**只报告，不阻断 PR**）。

**关闭的检查**：`VALIDATE_BIOME_FORMAT`、`VALIDATE_SPELL_CODESPELL`、`VALIDATE_GITLEAKS`（不检查密钥泄露，因为有测试用自签证书）。

::: tip Linter 不会让 PR 失败
即使有格式问题，`linter.yml` 也只会在 Summary 里报告，不会阻断合并。但还是建议修复，保持代码质量。
:::

## 代码规范

完整规范在 `community/rules/` 目录，这里列出最容易踩的几条。

### 通用规范（general.md）

1. **所有用户可见文本必须走 i18n**。不要在 XAML 或代码中直接写死中文/英文。用 `Strings.GetString("KeyName")`。
2. **`Geometry.Parse()` 结果是只读的**。修改前必须先 `Clone()`，否则抛异常。
3. **不要在 `AfterBuild` 事件里操作视觉树**。异常会被 try-catch 吞掉，你看不到报错。要操作视觉树就延迟到 `Loaded` 事件。
4. **`Thickness` 禁用双参构造函数**。WPF for .NET 6 不支持 `Thickness(double, double)`，必须用四参数 `Thickness(left, top, right, bottom)`。
5. **私有字段用 `_` 前缀**，如 `_stylusDownTimestamp`。XAML 控件名用 PascalCase，如 `CardEnableInkFade`。
6. **IsHighlighter 的语义**：普通笔/激光笔恒为 `false`，荧光笔为 `!Settings.Canvas.HighlighterOverlapEnabled`（覆盖模式时为 false，透明模式时为 true）。

### XAML 控件规范（xaml_controls.md）

1. **所有 `<ComboBox>` 不得设置 `Width`、`MinWidth` 或 `MaxWidth`**。应当删除这些属性，让 ComboBox 自适应。
2. **带开关的设置项必须用 `LabeledSettingsCard`**，不要手动在 `ui:SettingsCard` 里嵌套 `ui:ToggleSwitch`。
3. **`Expander.Items` 内禁用 `LabeledSettingsCard`**。Expander 里只能用 `ui:SettingsCard`（会产生视觉嵌套问题）。
4. **`<SymbolIcon>` 必须显式设置 `FontSize`**，否则在某些 DPI 下会异常放大。
5. **`<ComboBox>` / `<ComboBoxItem>` 禁止设置 `Background`**。会覆盖主题样式，导致选中态错误。

### 设置页规范（settings_pages.md）

这是最长的规范文档（378 行），核心要求：

1. **设置项必须有 `Header` 和 `Description`**。`Header` 用 i18n 字符串，`Description` 解释清楚这个选项的作用与影响。
2. **切换开关放在卡片右侧**，用 `<LabeledSettingsCard>`。
3. **复杂设置用 `Expander` 分组**，把高级选项收起来。
4. **设置变更必须通过 `SettingsActionHub` 调用主窗口方法**，而不是直接操作 `MainWindow` 字段。
5. **设置保存是自动的**。`SettingsManager` 会在属性变更后自动调用 `SaveSettingsToFile()`，你不需要显式保存。

### 工具栏规范（toolbar.md）

1. **浮动工具栏（FloatingToolbar）与白板工具栏（BoardToolbar）是两套独立体系**，没有共享接口。
2. **工具栏项通过反射自动发现**。实现 `IToolbarItem`，有公共无参构造函数，就会被 `ToolbarRegistry.Discover()` 找到。
3. **插件工具栏项通过 `RegisterToolbarItem()` 注册**，会被包装成 `PluginToolbarItemWrapper` 适配到 `IToolbarItem`。
4. **工具栏布局保存在 `Configs/ToolbarConfigs/<name>.json`**，用 Newtonsoft.Json 序列化，有备份机制（`.json.bak`）。

### Popup 规范（popups_menus.md）

1. **所有 `<Popup>` 必须注册到 `PopupManagerHelper`**，否则不会被 `CloseAllPopups()` 管理。
2. **Popup 内容用 `PopupShellContent` 或 `PopupTabShellContent`**。这两个控件提供统一的标题栏、关闭按钮、阴影效果。
3. **`StaysOpen="true"` + `Focusable="true"`**。这样点击外部时 Popup 不会立即关闭（由 PopupManager 统一处理）。

## 测试要求

`CONTRIBUTING.md` 里明确了两类测试要求：

### 人工编写代码

1. **简单的构建测试** —— 避免提交不完整的代码。
2. **简单的运行测试** —— UI 改动用「三步法」（一看样式，二看行为，三看 i18n 是否完整）；后端改动遵循「改什么测什么」。

### AI 辅助代码

1. **进行 AI 辅助时必须理解每一行改动**。
2. **进行全面的运行测试** —— 包含所有可能受影响的局部，回归测试，针对性修复。
3. **严禁盲目使用 AI 进行修复**。发现问题时必须仔细核对修改过程中的可疑 commit。

::: danger 严重后果
CONTRIBUTING.md 第 22 行明确警告：「如果发现您存在不懂装懂的情况且拒不改正我们将您从贡献者中除名，并永久禁止您进行代码贡献。」
:::

## 其他工作流

### publish-sdk-nuget.yml

把 `InkCanvas.PluginSdk` 和 `InkCanvas.Controls` 打包发布到 nuget.org。

**两种触发方式**：

- push 形如 `sdk-v1.7.19.9` 的 tag —— 以 tag 里的版本号强制发包
- 手动 `workflow_dispatch` —— 可输入 `branch`（默认 `net6`）和 `version`；`version` 留空则用 NBGV 依据 git 状态算出的版本

依赖仓库 Secret `NUGET_API_KEY`。并发组 `publish-sdk-nuget` 且 `cancel-in-progress: false`，避免两次发布互相打断。

### sync-net6-to-net10.yml

push 到 `net6`（或手动触发）后，把 `net6` 合并进 `net10`。这个工作流做的事比「合并」多得多：

1. 合并 `net6` → `net10`，**冲突自动解决**：csproj 取 `net6` 版本，再把 TFM 改回 net10
2. 删除旧的 `packages.lock.json`
3. 先尝试 `restore` + `build`（多数包同时支持 net6/net10，不用动）
4. 构建失败才把所有 NuGet 包升到最新稳定版，重新 `restore` + `build`
5. **只有编译通过才推送**，否则中止并报警

::: tip 不用管 net10 分支
`net10` 是迁移分支，由这个工作流自动维护。日常开发只需要关心 `net6`，除非收到同步失败的告警。
:::


## 下一步

- [环境搭建](./environment) — 安装 VS 2022、.NET 6 SDK、VSTO 工具
- [构建与运行](./build-and-run) — 完整的构建、版本号、CI、打包流程
- [代码规范汇总](../core/conventions) — `community/rules/` 下所有规范的完整引用
