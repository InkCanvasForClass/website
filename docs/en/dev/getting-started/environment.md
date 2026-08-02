---
title: Environment Setup
description: Tools and environment needed to develop InkCanvas For Class
---

# Environment Setup

<HelpUsImprove />

## Required tools

### .NET 6 SDK

The project targets `net6.0-windows10.0.19041.0`, so you need:

- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0) (6.0.100 minimum)
- Windows 10 SDK 19041 or later (the Visual Studio installer handles this automatically)

Verify the installation:

```powershell
dotnet --list-sdks
# you should see 6.0.x
```

### Visual Studio 2022

VS 2022 (17.0 or later) is recommended, with the following workloads installed:

- **.NET desktop development** (includes WPF and Windows Forms)
- **Universal Windows Platform development** (provides the Windows 10 SDK)

Optional but recommended:
- **Visual Studio extension development** (if you plan to modify the PowerPoint Add-in project)

### Git

You need [Git](https://git-scm.com/) to clone the repository.

## Cloning the repository

```bash
git clone https://github.com/InkCanvasForClass/community.git
cd community
git checkout net6
```

**Important**: the main branch is `net6`, not `master`. All PRs must target `net6`.

## Directory structure at a glance

```
community/
├── Ink Canvas/               # main application (WPF)
├── InkCanvas.PluginSdk/     # plugin SDK (packed as NuGet)
├── InkCanvas.Controls/      # control library
├── InkCanvas.IACoreHelper/  # helper process (x86)
├── InkCanvas.SettingsTreeView/  # settings tree view tool
├── InkCanvas.PPTAgent.Contracts/  # PPT Agent contracts
├── build/                    # Inno Setup packaging scripts
├── version.json             # Nerdbank.GitVersioning version config
└── Directory.Build.props    # injects Nerdbank.GitVersioning globally
```

`InkCanvas.PowerPointAddIn` and `InkCanvas.NativeInk.Tests` also exist on disk, but they are not part of `Ink Canvas.sln`.

## First build

Open `Ink Canvas.sln`, pick `Debug|Any CPU` or `Debug|x64`, and press `Ctrl+Shift+B` to build.

On the first build, Nerdbank.GitVersioning computes the version number from `version.json` (currently `1.7.19.9`) plus the git commit history and generates `ThisAssembly.cs`. If you are not inside a git repository or have a detached HEAD, the version will carry a `-g[commit]` suffix.

**IACoreHelper platform note**: `InkCanvas.IACoreHelper` is forced to `x86` (the native IACore library is 32-bit), and every platform in the solution configuration maps to `x86`. If you build the whole solution as `Any CPU`, the main application will be `Any CPU` (JIT-ed to 64-bit at startup) while IACoreHelper stays 32-bit — that is expected.

## Launching the debugger

Set `InkCanvasForClass` as the startup project and press `F5` to start debugging.

See [Startup flow](/en/dev/core/startup) for details on the startup sequence.

If startup fails, check the logs: they are written to the `Logs\` folder under the **application directory** (`App.RootPath`, i.e. `AppDomain.CurrentDomain.SetupInformation.ApplicationBase`), with file names like `Log_yyyy-MM-dd-HH-mm-ss.txt`. Crash dumps live in the sibling `Crashes\` directory.

::: tip Note
When the `Logs` folder exceeds 5 MB it is cleared automatically by `LogHelper.CheckAndCleanLogsFolder()`, so back up logs promptly while investigating an issue.
:::


## Common issues

### Build error `NBGV002`: git repository not found

Nerdbank.GitVersioning requires the code to live inside a git repository. If you downloaded a zip instead of cloning, or opened the solution from a non-git directory, you will hit this error. Fix: obtain the code with `git clone`.

### IACoreHelper build warning about platform mismatch

This is expected. IACoreHelper must be x86, which does not match the main application's AnyCPU. You can ignore the warning or exclude IACoreHelper from certain platforms in Configuration Manager.

### Office Interop errors

The main application uses `Microsoft.Office.Interop.PowerPoint` to talk to the local Office COM components. If PowerPoint is not installed, PowerPoint integration is disabled but the application still runs — PPTManager contains fallback logic.

### Plugins fail to load while debugging

The plugin directory defaults to `<application directory>/Plugins`. For a Debug build that is `Ink Canvas\bin\Debug\net6.0-windows10.0.19041.0\Plugins\`. Make sure:
1. The plugin folder exists
2. It contains a valid `manifest.json`
3. There are no `PluginCompatibility` errors in the log

## Next steps

- [Solution layout](./solution-layout) — what each of the 6 projects does
- [Build and run](./build-and-run) — versioning, packaging, CI
