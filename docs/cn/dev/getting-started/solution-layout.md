---
title: 解决方案结构
description: 各项目的职责与依赖关系
---

# 解决方案结构

<UnderConstruction />

`Ink Canvas.sln` 包含 6 个项目。磁盘上另有 2 个项目（`InkCanvas.PowerPointAddIn`、`InkCanvas.NativeInk.Tests`）**未加入解决方案**，需要单独打开构建。

## 项目一览

| 项目 | 目标框架 | 输出 | 职责 |
| --- | --- | --- | --- |
| **InkCanvasForClass** | `net6.0-windows10.0.19041.0` | WinExe | 主程序。所有 UI、墨迹、PPT 联动、自动化、插件宿主都在这里 |
| **InkCanvas.PluginSdk** | `net6.0-windows10.0.19041.0` | Library + NuGet | 插件 SDK。接口与宿主服务抽象，插件项目引用它 |
| **InkCanvas.Controls** | `net6.0-windows10.0.19041.0` | Library + NuGet | 宿主与插件共用的 WPF 控件（工具栏按钮、颜色选择、设置卡片、弹窗外壳） |
| **InkCanvas.IACoreHelper** | **.NET Framework 4.7.2** | Exe (x86) | 外挂进程，为主程序提供 IACore 墨迹形状/文字识别 |
| **InkCanvas.SettingsTreeView** | `net6.0-windows10.0.19041.0` | WinExe | 独立小工具，树形查看设置项结构 |
| **InkCanvas.PPTAgent.Contracts** | `netstandard2.0` | Library | 主程序与 PPT VSTO 加载项之间的 IPC 契约 |

未在 sln 中：

| 项目 | 目标框架 | 说明 |
| --- | --- | --- |
| **InkCanvas.PowerPointAddIn** | .NET Framework 4.7.2 (VSTO) | PowerPoint 加载项，采集放映状态推送给主程序 |
| **InkCanvas.NativeInk.Tests** | — | 原生墨迹相关测试 |

## 依赖关系

```txt
InkCanvasForClass (主程序)
  ├─> InkCanvas.PluginSdk
  ├─> InkCanvas.Controls
  └─> InkCanvas.PPTAgent.Contracts

InkCanvas.PowerPointAddIn (VSTO，独立构建)
  └─> InkCanvas.PPTAgent.Contracts
```

`InkCanvas.IACoreHelper` 与 `InkCanvas.SettingsTreeView` 都是独立可执行程序，不被主程序引用，通过进程间通信或手工运行。

## 为什么框架版本不统一

三种目标框架并存，各有原因：

- **主程序用 net6.0-windows**：需要 WPF、WinRT 墨迹分析（`InkAnalyzer`）、现代 .NET 性能。
- **IACoreHelper 用 .NET Framework 4.7.2 + x86**：IACore 原生库是 32 位 COM 组件，主程序如果直接加载会把自己锁死在 32 位。拆成独立 x86 进程，主程序保持 AnyCPU/64 位，两者通过命名管道 + 共享内存通信。
- **PPTAgent.Contracts 用 netstandard2.0**：它要同时被 net6 的主程序和 .NET Framework 4.7.2 的 VSTO 加载项引用，netstandard2.0 是两者的公共分母。
- **PowerPointAddIn 用 .NET Framework 4.7.2**：VSTO 加载项模型不支持 .NET 6。

## 主程序内部结构

`Ink Canvas/` 下的目录划分：

| 目录 | 内容 |
| --- | --- |
| `Automation/` | 自动化引擎。Trigger/Rule/Action 三段式，见 [自动化引擎](/cn/dev/core/automation) |
| `Controls/` | 内嵌 WPF 控件。`Toolbar/` 是工具栏体系，`Popups/` 是各工具弹层 |
| `Helpers/` | 最大的一块（约 105 个文件）。墨迹平滑与识别、PPT 联动、性能监控、窗口管理、摄像头、云上传等 |
| `Plugins/` | 插件宿主实现。`PluginManager.cs` 是核心 |
| `Windows/` | 各个独立窗口（设置、启动画面等） |
| `Resources/` | 图标、图片、字体等资源 |

`MainWindow` 被拆成多个 partial 文件，详见 [主窗口](/cn/dev/core/mainwindow)。

## 配置文件位置

运行时配置都在**程序目录**下（不是 `%AppData%`）：

```txt
<程序目录>/
├── Configs/
│   ├── Settings.json          # 主设置
│   └── disabled_plugins.json  # 被禁用的插件列表
├── Plugins/                    # 已安装插件
├── PluginPackages/            # 待安装的 .icpx 包
├── PluginConfigs/             # 各插件的配置
├── PluginLogs/                # 插件日志
├── Logs/                       # 主程序日志
└── Crashes/                    # 崩溃转储
```

::: warning 便携化的代价
配置放在程序目录让软件可以绿色便携，但如果安装到 `C:\Program Files\` 且没有写权限，配置会保存失败。这是设计权衡，改动时要注意。
:::

## 下一步

- [构建与运行](./build-and-run) — 版本号、CI、打包
- [贡献流程](./contributing) — 提交规范
