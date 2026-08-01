---
title: Repository Structure
description: What each project in the solution does, and the components outside it
---

# Repository Structure

## Projects in the solution

`Ink Canvas.sln` contains 6 projects:

| Project | Purpose |
| --- | --- |
| **InkCanvasForClass** | The main WPF application: windows, canvas, toolbar, settings, PowerPoint integration |
| **InkCanvas.PluginSdk** | Plugin SDK &mdash; the contract assembly third-party plugins compile against |
| **InkCanvas.Controls** | Reusable custom control library |
| **InkCanvas.IACoreHelper** | IACore handwriting recognition helper process |
| **InkCanvas.SettingsTreeView** | Tree navigation control used by the settings UI |
| **InkCanvas.PptAgent.Contracts** | Message contracts shared with the PowerPoint add-in |

## Components outside the solution

Several directories are **not part of the sln** and must be built separately:

- **InkCanvas.PowerPointAddIn** &mdash; the VSTO add-in installed into PowerPoint that pushes slide show events
- **InkCanvas.NativeInk.Tests** &mdash; tests for the native ink pipeline
- **inkore-mcp** &mdash; an MCP service written in Python, unrelated to the app build

::: tip Building only the app
Just open `Ink Canvas.sln`; none of the three directories above get pulled in.
:::

## Inside the main application

`Ink Canvas/` is organised by responsibility:

```
Ink Canvas/
├── MainWindow_cs/     42 partial files of the main window
├── Ink/
│   └── Native/        Vortice-based low-latency ink pipeline
├── Automation/        Automation rule engine
├── IPC/               Pipe client for the PowerPoint add-in
├── Controls/          In-app controls
├── Helpers/           Assorted helper classes
├── Plugins/           Plugin host
├── Windows/           Standalone windows such as settings
├── Models/            Data models
├── MarkupExtensions/  XAML markup extensions
├── Resources/         Resources
└── libs/              External dependencies
```

### About the 42 MainWindow partials

The main window carries a lot of logic, so it is split into 42 `partial class` files under `MainWindow_cs/`,
grouped by feature (toolbar, page list, gestures, PowerPoint, and so on).

When changing main window logic:

- Find the partial that matches the feature; don't pile new code into the main file
- Prefer a new partial file when adding a reasonably self-contained feature
- Partials share fields &mdash; check whether other files use the same field before changing it

## The Automation rule engine

`Automation/` is a self-contained rule engine with a clear layout:

```
Automation/
├── AutomationBootstrap.cs   Startup wiring
├── Abstractions/            Interface definitions
├── Triggers/                Triggers: when something fires
├── Rules/                   Rules: whether to act once fired
├── Actions/                 Action definitions
├── ActionHandlers/          Actual action execution
├── Services/                Supporting services
├── Models/  Enums/  Extensions/
```

You extend it by adding new Trigger / Action / ActionHandler implementations and registering them in the
bootstrap &mdash; not by editing existing branching logic.

## The native ink pipeline

`Ink/Native/` is a low-latency wet-ink rendering path built on **Vortice** (.NET bindings for Direct3D/Direct2D).
Together with the classic WPF `InkCanvas` it forms a **dual rendering path**:

- **Native path**: ink currently being drawn renders straight on the GPU for lower latency
- **Classic path**: once a stroke is finished, the dry ink is handed to the WPF InkCanvas for compatibility
  with existing features

Always verify both paths when touching this area; testing only one easily misses visual differences.
`InkCanvas.NativeInk.Tests` exists specifically for this pipeline.

## Cross-architecture IACore calls

The IACore component used for handwriting recognition is **32-bit only**, while the main app usually runs as
64-bit. Recognition therefore lives in a separate `InkCanvas.IACoreHelper` process that the main app drives
over inter-process communication.

Consequences:

- Recognition issues require looking at logs from *both* the app and the helper process
- The app must tolerate the helper dying and restart it
- To debug recognition, attach to the helper process, not the main one

## The three-way PowerPoint relationship

```
InkCanvasForClass (main app)
   │  IPC/PPTAgentPipeClient.cs (pipe client)
   │
   ├── InkCanvas.PptAgent.Contracts (message contracts shared by both sides)
   │
   └── InkCanvas.PowerPointAddIn (VSTO add-in, runs inside the PowerPoint process)
```

When changing the protocol, **update the contracts project together with both ends**, otherwise one side will
send messages the other cannot read. The add-in is outside the sln &mdash; remember to build and redeploy it
into PowerPoint separately.
