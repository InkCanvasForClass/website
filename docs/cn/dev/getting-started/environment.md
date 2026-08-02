---
title: 环境搭建
description: 开发 InkCanvas For Class 所需的工具与环境
---

# 环境搭建

<UnderConstruction />

## 必需工具

### .NET 6 SDK

项目的 TargetFramework 是 `net6.0-windows10.0.19041.0`，需要：

- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)（最低版本 6.0.100）
- Windows 10 SDK 19041 或更高版本（Visual Studio 安装程序会自动安装）

验证安装：

```powershell
dotnet --list-sdks
# 应看到 6.0.x
```

### Visual Studio 2022

推荐 VS 2022（17.0 或更高），需要安装以下工作负载：

- **.NET 桌面开发**（含 WPF 和 Windows Forms）
- **通用 Windows 平台开发**（提供 Windows 10 SDK）

可选但推荐：
- **Visual Studio 扩展开发**（如果你要改 PowerPoint Add-in 项目）

### Git

克隆仓库需要 [Git](https://git-scm.com/)。

## 克隆仓库

```bash
git clone https://github.com/InkCanvasForClass/community.git
cd community
git checkout net6
```

**重要**：主分支是 `net6`，不是 `master`。所有 PR 都要提交到 `net6`。

## 目录结构速览

```
community/
├── Ink Canvas/               # 主程序（WPF）
├── InkCanvas.PluginSdk/     # 插件 SDK（打 NuGet 包）
├── InkCanvas.Controls/      # 控件库
├── InkCanvas.IACoreHelper/  # 辅助进程（x86）
├── InkCanvas.SettingsTreeView/  # 设置页树形控件
├── InkCanvas.PPTAgent.Contracts/  # PPT Agent 契约
├── build/                    # Inno Setup 打包脚本
├── version.json             # Nerdbank.GitVersioning 版本配置
└── Directory.Build.props    # 全局注入 Nerdbank.GitVersioning
```

磁盘上还有 `InkCanvas.PowerPointAddIn` 和 `InkCanvas.NativeInk.Tests`，但它们未加入 `Ink Canvas.sln`。

## 首次构建

打开 `Ink Canvas.sln`，选择 `Debug|Any CPU` 或 `Debug|x64`，按 `Ctrl+Shift+B` 构建。

首次构建时 Nerdbank.GitVersioning 会以 `version.json`（当前 `1.7.19.9`）作为基础版本，再结合 git 提交历史计算最终版本号，自动生成 `ThisAssembly.cs`。也就是说，即使在没有可用 git 信息的情况下，项目仍然有一个明确的基础版本可用；主程序在缺少提交缩写时会回退为 `UNKNOWN`。

**IACoreHelper 平台问题**：`InkCanvas.IACoreHelper` 强制为 `x86`（因为 IACore 原生库是 32 位），在解决方案配置里所有平台都被映射到 `x86`。如果你用 `Any CPU` 构建整个解决方案，主程序会是 `Any CPU`（启动时 JIT 成 64 位），但 IACoreHelper 始终是 32 位——这是正常的。

## 调试启动

设置 `InkCanvasForClass` 为启动项目，按 `F5` 启动调试。

启动流程详见 [启动流程](/cn/dev/core/startup)。

如果启动失败，看日志：日志写在**程序目录**下的 `Logs\` 文件夹（`App.RootPath` 即 `AppDomain.CurrentDomain.SetupInformation.ApplicationBase`），文件名形如 `Log_yyyy-MM-dd-HH-mm-ss.txt`。崩溃转储在同级的 `Crashes\` 目录。

::: tip 注意
`Logs` 文件夹超过 5 MB 时会被 `LogHelper.CheckAndCleanLogsFolder()` 自动清空，排查问题时记得及时备份。
:::


## 常见问题

### 构建报错 `NBGV002`：找不到 git 仓库

Nerdbank.GitVersioning 要求代码在 git 仓库里。如果你下载的是 zip 而非 clone，或者在非 git 目录下打开了 sln，会报此错。解决方法：用 `git clone` 获取代码。

### IACoreHelper 构建警告平台不匹配

这是预期行为。IACoreHelper 必须是 x86，与主程序的 AnyCPU 不匹配。可以忽略警告，或在解决方案配置管理器里把 IACoreHelper 从某些平台的构建中移除。

### Office Interop 报错

主程序依赖 `Microsoft.Office.Interop.PowerPoint` 与本机 Office COM 组件通信。如果你没装 PowerPoint，PPT 联动功能会被禁用，但应用本身仍能运行——PPTManager 里有回退逻辑。

### 调试时插件无法加载

插件目录默认是 `<程序目录>/Plugins`。Debug 构建时是 `Ink Canvas\bin\Debug\net6.0-windows10.0.19041.0\Plugins\`。确保：
1. 插件文件夹存在
2. 里面有有效的 `manifest.json`
3. 日志里没有 `PluginCompatibility` 报错

## 下一步

- [解决方案结构](./solution-layout) — 6 个项目各自做什么
- [构建与运行](./build-and-run) — 版本号、打包、CI
