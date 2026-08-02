---
title: 开发文档
description: InkCanvas For Class 开发指南
---

# 开发文档

<UnderConstruction />

这份文档写给两类读者：

1. **想要为 InkCanvas For Class 本体贡献代码的开发者**  
   你需要了解项目结构、构建流程、核心模块的设计，以及如何提交符合规范的代码。

2. **想要开发插件扩展功能的开发者**  
   你需要了解插件 SDK、宿主服务、生命周期管理，以及如何打包和分发插件。

## 这份文档不写什么

- **用户使用手册**：请看 [指南](/cn/guide/getting-started) 和 [功能](/cn/features/overview) 部分
- **运维部署指南**：如何批量部署到教室、配置组策略、监控服务状态等系统管理员关心的内容不在此范围
- **API 自动生成文档**：后续会用 docfx 从 XML 文档注释生成完整 API 参考，目前这份文档只覆盖核心概念和关键接口

## 快速导航

### 本体开发

从零开始参与本体开发：

- [环境搭建](/cn/dev/getting-started/environment) — .NET SDK、Visual Studio、克隆仓库
- [解决方案结构](/cn/dev/getting-started/solution-layout) — 8 个项目各自做什么
- [构建与运行](/cn/dev/getting-started/build-and-run) — 编译、调试、版本号管理
- [贡献流程](/cn/dev/getting-started/contributing) — 提交 PR 前需要知道的规则

理解核心模块：

- [启动流程](/cn/dev/core/startup) — 从 `App.xaml.cs` 到主窗口显示
- [主窗口](/cn/dev/core/mainwindow) — partial 类拆分与 UI 骨架
- [墨迹系统](/cn/dev/core/inking) — InkCanvas、平滑、实时帧调度
- [工具栏](/cn/dev/core/toolbar) — 注册表、配置、动态加载
- [设置](/cn/dev/core/settings) — 持久化、设置页、约定
- [PPT 联动](/cn/dev/core/ppt) — 4 套实现的取舍与降级
- [自动化引擎](/cn/dev/core/automation) — Trigger/Rule/Action 三段式
- [URI 协议调用](/cn/dev/core/uri) — `icc://` 命令清单与外部集成
- [代码约定](/cn/dev/core/conventions) — 命名、XAML、分支策略

### 插件开发

从零开始写一个插件：

- [概览](/cn/dev/plugin/overview) — 插件能做什么、边界在哪
- [快速上手](/cn/dev/plugin/quickstart) — 从模板到跑起来
- [清单文件](/cn/dev/plugin/manifest) — manifest.json 字段说明
- [生命周期](/cn/dev/plugin/lifecycle) — 加载顺序、依赖解析、隔离机制
- [宿主服务](/cn/dev/plugin/host-services) — 13 个服务接口的用法
- [UI 集成](/cn/dev/plugin/ui-integration) — 添加工具栏项、设置项、主视图
- [打包与分发](/cn/dev/plugin/packaging) — 生成 .icpx、发布到插件市场
- [调试](/cn/dev/plugin/debugging) — 调试技巧、兼容性检查、常见报错

## 贡献约定

- **AI 生成代码必须完整审查**：提交前逐行审查，确保理解每一行的意图。项目维护者发现 AI 代码未经审查会将贡献者除名并永久禁止贡献。详见 [CONTRIBUTING.md](https://github.com/InkCanvasForClass/community/blob/net6/CONTRIBUTING.md)
- **代码规范**：见 [代码约定](/cn/dev/core/conventions)
