---
title: Solution Layout
description: Responsibilities and dependencies of each project
---

# Solution Layout

<HelpUsImprove />

`Ink Canvas.sln` contains 6 projects. Two more projects exist on disk (`InkCanvas.PowerPointAddIn`, `InkCanvas.NativeInk.Tests`) that are **not part of the solution** and must be opened and built separately.

## Project overview

| Project | Target framework | Output | Responsibility |
| --- | --- | --- | --- |
| **InkCanvasForClass** | `net6.0-windows10.0.19041.0` | WinExe | The main application. All UI, inking, PowerPoint integration, automation, and the plugin host live here |
| **InkCanvas.PluginSdk** | `net6.0-windows10.0.19041.0` | Library + NuGet | The plugin SDK. Interfaces and host service abstractions that plugin projects reference |
| **InkCanvas.Controls** | `net6.0-windows10.0.19041.0` | Library + NuGet | WPF controls shared by the host and plugins (toolbar buttons, color pickers, settings cards, popup shells) |
| **InkCanvas.IACoreHelper** | **.NET Framework 4.7.2** | Exe (x86) | Out-of-process helper providing IACore ink shape and text recognition for the main application |
| **InkCanvas.SettingsTreeView** | `net6.0-windows10.0.19041.0` | WinExe | Standalone utility for browsing the settings structure as a tree |
| **InkCanvas.PPTAgent.Contracts** | `netstandard2.0` | Library | IPC contracts between the main application and the PowerPoint VSTO add-in |

Not in the solution:

| Project | Target framework | Notes |
| --- | --- | --- |
| **InkCanvas.PowerPointAddIn** | .NET Framework 4.7.2 (VSTO) | PowerPoint add-in that collects slideshow state and pushes it to the main application |
| **InkCanvas.NativeInk.Tests** | — | Tests related to native inking |

## Dependencies

```
InkCanvasForClass (main application)
  ├─> InkCanvas.PluginSdk
  ├─> InkCanvas.Controls
  └─> InkCanvas.PPTAgent.Contracts

InkCanvas.PowerPointAddIn (VSTO, built separately)
  └─> InkCanvas.PPTAgent.Contracts
```

`InkCanvas.IACoreHelper` and `InkCanvas.SettingsTreeView` are both standalone executables. They are not referenced by the main application and are used through inter-process communication or run by hand.

## Why the framework versions differ

Three target frameworks coexist, each for a reason:

- **The main application uses net6.0-windows**: it needs WPF, WinRT ink analysis (`InkAnalyzer`), and modern .NET performance.
- **IACoreHelper uses .NET Framework 4.7.2 + x86**: the native IACore library is a 32-bit COM component. Loading it directly would lock the main application into 32-bit. Splitting it into a separate x86 process keeps the main application AnyCPU/64-bit, and the two communicate over a named pipe plus shared memory.
- **PPTAgent.Contracts uses netstandard2.0**: it must be referenced by both the net6 main application and the .NET Framework 4.7.2 VSTO add-in, and netstandard2.0 is the common denominator.
- **PowerPointAddIn uses .NET Framework 4.7.2**: the VSTO add-in model does not support .NET 6.

## Inside the main application

How `Ink Canvas/` is organized:

| Directory | Contents |
| --- | --- |
| `Automation/` | The automation engine. Trigger/Rule/Action three-stage model, see [Automation engine](/en/dev/core/automation) |
| `Controls/` | Embedded WPF controls. `Toolbar/` holds the toolbar system, `Popups/` holds the per-tool popup layers |
| `Helpers/` | The largest area (around 105 files). Ink smoothing and recognition, PowerPoint integration, performance monitoring, window management, camera, cloud upload, and more |
| `Plugins/` | The plugin host implementation. `PluginManager.cs` is the core |
| `Windows/` | Individual standalone windows (settings, splash screen, and so on) |
| `Resources/` | Icons, images, fonts, and other resources |

`MainWindow` is split across multiple partial files, see [Main window](/en/dev/core/mainwindow).

## Where configuration lives

All runtime configuration sits under the **application directory** (not `%AppData%`):

```
<application directory>/
├── Configs/
│   ├── Settings.json          # main settings
│   └── disabled_plugins.json  # list of disabled plugins
├── Plugins/                    # installed plugins
├── PluginPackages/            # .icpx packages waiting to be installed
├── PluginConfigs/             # per-plugin configuration
├── PluginLogs/                # plugin logs
├── Logs/                       # main application logs
└── Crashes/                    # crash dumps
```

::: warning The cost of being portable
Keeping configuration in the application directory makes the software portable, but if it is installed into `C:\Program Files\` without write permission, saving configuration will fail. This is a deliberate trade-off — keep it in mind when making changes.
:::

## Next steps

- [Build and run](./build-and-run) — versioning, CI, packaging
- [Contributing](./contributing) — submission conventions
