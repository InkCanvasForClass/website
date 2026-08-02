---
title: Development Docs
description: InkCanvas For Class development guide
---

# Development Docs

<UnderConstruction />

This documentation is written for two kinds of readers:

1. **Developers who want to contribute code to InkCanvas For Class itself**  
   You need to understand the project structure, the build process, the design of the core modules, and how to submit code that follows the project conventions.

2. **Developers who want to extend functionality through plugins**  
   You need to understand the plugin SDK, host services, lifecycle management, and how to package and distribute a plugin.

## What this documentation does not cover

- **End-user manual**: see the [Guide](/en/guide/getting-started) section
- **Operations and deployment guide**: topics system administrators care about — bulk deployment to classrooms, Group Policy configuration, service monitoring — are out of scope here
- **Auto-generated API documentation**: a full API reference will eventually be generated from XML doc comments with docfx. For now this documentation only covers core concepts and key interfaces

## Quick navigation

### Core application development

Getting started with contributing to the main application:

- [Environment setup](/en/dev/getting-started/environment) — .NET SDK, Visual Studio, cloning the repository
- [Solution layout](/en/dev/getting-started/solution-layout) — what each of the 8 projects does
- [Build and run](/en/dev/getting-started/build-and-run) — compiling, debugging, version management
- [Contributing](/en/dev/getting-started/contributing) — the rules to know before opening a PR

Understanding the core modules:

- [Startup flow](/en/dev/core/startup) — from `App.xaml.cs` to the main window appearing
- [Main window](/en/dev/core/mainwindow) — partial class split and the UI skeleton
- [Inking system](/en/dev/core/inking) — InkCanvas, smoothing, real-time frame scheduling
- [Toolbar](/en/dev/core/toolbar) — registry, configuration, dynamic loading
- [Settings](/en/dev/core/settings) — persistence, settings pages, conventions
- [PowerPoint integration](/en/dev/core/ppt) — the trade-offs across 4 implementations and their fallbacks
- [Automation engine](/en/dev/core/automation) — the Trigger/Rule/Action three-stage model
- [URI protocol](/en/dev/core/uri) — the `icc://` command list and external integration
- [Code conventions](/en/dev/core/conventions) — naming, XAML, branching strategy

### Plugin development

Writing a plugin from scratch:

- [Overview](/en/dev/plugin/overview) — what plugins can do and where the boundaries are
- [Quickstart](/en/dev/plugin/quickstart) — from template to running
- [Manifest](/en/dev/plugin/manifest) — manifest.json field reference
- [Lifecycle](/en/dev/plugin/lifecycle) — load order, dependency resolution, isolation
- [Host services](/en/dev/plugin/host-services) — how to use the 13 service interfaces
- [UI integration](/en/dev/plugin/ui-integration) — adding toolbar items, settings entries, main views
- [Packaging and distribution](/en/dev/plugin/packaging) — producing an .icpx, publishing to the plugin marketplace
- [Debugging](/en/dev/plugin/debugging) — debugging techniques, compatibility checks, common errors

## Contribution rules

- **AI-generated code must be fully reviewed**: review it line by line before submitting and make sure you understand the intent of every line. If maintainers find unreviewed AI code, the contributor will be removed and permanently banned from contributing. See [CONTRIBUTING.md](https://github.com/InkCanvasForClass/community/blob/net6/CONTRIBUTING.md) for details
- **Code standards**: see [Code conventions](/en/dev/core/conventions)
