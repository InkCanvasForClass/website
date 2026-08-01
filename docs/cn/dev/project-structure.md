---
title: 仓库结构总览
description: 解决方案内各项目的职责划分，以及 sln 之外的组件
---

# 仓库结构总览

## 解决方案内的项目

`Ink Canvas.sln` 包含 6 个项目：

| 项目 | 说明 |
| --- | --- |
| **InkCanvasForClass** | 主程序（WPF）。窗口、画布、工具栏、设置、PPT 联动等主体逻辑 |
| **InkCanvas.PluginSdk** | 插件 SDK，第三方插件编译时引用的契约程序集 |
| **InkCanvas.Controls** | 可复用的自定义控件库 |
| **InkCanvas.IACoreHelper** | IACore 手写识别辅助进程 |
| **InkCanvas.SettingsTreeView** | 设置界面使用的树形导航控件 |
| **InkCanvas.PptAgent.Contracts** | 主程序与 PowerPoint 加载项之间的通信契约 |

## 解决方案之外的组件

仓库里还有几个**不在 sln 中**的目录，需要单独构建：

- **InkCanvas.PowerPointAddIn** —— VSTO 加载项，安装到 PowerPoint 中，把放映事件推送给主程序
- **InkCanvas.NativeInk.Tests** —— 原生墨迹管线的测试项目
- **inkore-mcp** —— Python 实现的 MCP 服务，与主程序构建无关

::: tip 只想编译主程序
直接打开 `Ink Canvas.sln` 即可，上述三个目录不会被牵连。
:::

## 主程序内部目录

`Ink Canvas/` 下按职责分目录：

```
Ink Canvas/
├── MainWindow_cs/     主窗口的 42 个 partial 分部文件
├── Ink/
│   └── Native/        基于 Vortice 的原生低延迟墨迹管线
├── Automation/        自动化规则引擎
├── IPC/               与 PPT 加载项的管道客户端
├── Controls/          主程序内的控件
├── Helpers/           各类辅助类
├── Plugins/           插件宿主
├── Windows/           设置等独立窗口
├── Models/            数据模型
├── MarkupExtensions/  XAML 标记扩展
├── Resources/         资源
└── libs/              外部依赖
```

### 关于 MainWindow 的 42 个分部文件

主窗口的逻辑非常庞大，因此被拆成 42 个 `partial class` 文件放在 `MainWindow_cs/` 下，
按功能划分（工具栏、页面列表、手势、PPT 等）。

修改主窗口逻辑时：

- 先按功能找到对应的分部文件，不要把新代码堆到主文件里
- 新增一块相对独立的功能时，倾向于新建一个分部文件
- 分部文件之间共享字段，改动前留意其他文件是否也在用同一个字段

## Automation 规则引擎

`Automation/` 是一套独立的规则引擎，结构清晰：

```
Automation/
├── AutomationBootstrap.cs   启动装配入口
├── Abstractions/            接口定义
├── Triggers/                触发器：什么时候触发
├── Rules/                   规则：触发后判断是否执行
├── Actions/                 动作定义
├── ActionHandlers/          动作的实际执行
├── Services/                支撑服务
├── Models/  Enums/  Extensions/
```

扩展方式是新增 Trigger / Action / ActionHandler 的实现并注册到 Bootstrap，而不是修改现有分支逻辑。

## 原生墨迹管线

`Ink/Native/` 是基于 **Vortice**（Direct3D/Direct2D 的 .NET 绑定）实现的低延迟湿墨迹渲染路径，
与 WPF 传统 `InkCanvas` 构成**双渲染路径**：

- **原生路径**：正在书写的湿墨迹直接走 GPU 渲染，延迟更低
- **传统路径**：落笔完成后的干墨迹交给 WPF InkCanvas 管理，保证兼容性与既有功能

改动这部分时务必两条路径同时验证，只测其中一条很容易漏掉视觉差异。
`InkCanvas.NativeInk.Tests` 就是为这条管线准备的测试项目。

## IACore 跨架构调用

手写识别依赖的 IACore 组件**只有 32 位版本**，而主程序通常以 64 位运行。
因此识别功能被拆到独立的 `InkCanvas.IACoreHelper` 进程中，由主程序通过进程间通信调用。

这意味着：

- 识别相关的问题要同时看主程序与辅助进程两边的日志
- 辅助进程意外退出时，主程序需要能容错并重启它
- 调试识别功能时需要附加到辅助进程，而不是主进程

## PPT 联动的三方关系

```
主程序 InkCanvasForClass
   │  IPC/PPTAgentPipeClient.cs（管道客户端）
   │
   ├── InkCanvas.PptAgent.Contracts（双方共享的消息契约）
   │
   └── InkCanvas.PowerPointAddIn（VSTO 加载项，运行在 PowerPoint 进程内）
```

修改通信协议时，**契约项目要与两端同时更新**，否则会出现一端能发不能收的情况。
加载项不在 sln 内，改完记得单独构建并重新部署到 PowerPoint。
