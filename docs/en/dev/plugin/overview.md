---
title: Plugin Overview
description: What plugins can do, and where the boundaries are
---

# Plugin Overview

<UnderConstruction />

A plugin is a separately compiled .NET assembly that the host discovers, loads, and initializes at startup. Plugins run inside the host process and interact with the host through the services exposed by `IPluginHost`.

The plugin API is evolving rapidly, so if in doubt, take a look at the SDK yourself!

## What a plugin can do

| Capability | Interface used |
| --- | --- |
| Add a toolbar button that opens its own panel | `IPluginHost.RegisterToolbarItem` |
| Add a toolbar button to the whiteboard toolbar | `IPluginHost.RegisterBoardToolbarItem` |
| Provide a main view / settings page | `IPlugin.GetMainView()` / `GetSettingsView()` |
| Read and write host settings | `ISettingsService` |
| Subscribe to whiteboard mode changes, slide changes, ink changes, etc. | `IEventService` |
| Post in-app notifications | `INotificationService` |
| Read notification history and show Windows toast notifications | `INotificationService` |
| Register global hotkeys | `IHotkeyService` |
| Enumerate/update host built-in hotkeys, pause all hotkey registration | `IHotkeyService` |
| Control window topmost, folding, entering/leaving the whiteboard, fullscreen | `IWindowService` |
| Control the slideshow and slide navigation, export slide thumbnails | `IPowerPointService` |
| Read and write canvas ink, switch tools, control whiteboard paging and undo/redo | `ICanvasInkService` |
| Export canvas ink as PNG, insert bitmap images into the canvas | `ICanvasInkService` |
| Handwriting-to-text, shape recognition, handwriting beautification | `IRecognitionService` |
| Show/hide the tray icon and add items to its context menu | `ITrayService` |
| Inject a background layer beneath the canvas, e.g. for a PDF reader | `ICanvasCompositionService` |
| Take over two-finger canvas gestures | `IPluginCanvasGestureHandler` |
| Communicate with other plugins or external processes | `IPluginIpcBus` |
| Register file type associations | `IFileAssociationService` |
| Restart the app (including elevated restart) | `IAppRestartService` |
| Register your own services for other plugins to use | `IPluginHost.Services` (the DI container) |
| Read and write clipboard text and images | `IClipboardService` |
| Enumerate cameras, start preview, capture frames | `ICameraService` |
| Capture fullscreen or region screenshots | `IScreenshotService` |
| Open file/save file dialogs | `IFileDialogService` |
| Manage config profiles (snapshots of settings) | `IConfigProfileService` |
| Read and manage the name roster (random name picker) | `INameRosterService` |
| Read host built-in quotes and trigger watermark refresh | `IQuoteService` |
| Display announcement center unread count and history | `IAnnouncementService` |
| Read screen/display information | `IScreenInfoService` |
| Read system/device info and usage statistics | `ISystemInfoService` |
| Detect and apply host theme | `IThemeService` |
| Control ink fade-out animation on the canvas | `IInkEffectService` |
| Register deep-link handlers, open `icc://` URIs | `IPluginUriService` |
| Control host auto-backup of settings | `IBackupService` |
| Check for host updates, read changelogs, trigger install | `IUpdateService` |
| Read host app version, installation path, update status | `IAppInfoService` |
| Enumerate system windows (for window switching plugins) | `IWindowOverviewService` |

## What a plugin cannot do

- **It cannot access `MainWindow` directly.** The SDK does not expose the main-window type; plugins can only act on it indirectly through service interfaces. This is deliberate, so plugins don't depend on internal implementation.
- **It cannot prevent the host from starting.** An exception thrown during plugin initialization is caught and logged, the host keeps starting, and that plugin is marked as failed to load.
- **It cannot ship the SDK assemblies.** `InkCanvas.PluginSdk.dll` and `InkCanvas.Controls.dll` are provided by the host; including them in the plugin package is blocked by a CI check, and may also cause type conflicts at runtime.
- **There is no permission sandbox.** The `Permissions` field in `manifest.json` is only used to inform the user at install time; nothing is enforced at runtime. A plugin shares the host's process and privileges — worth keeping in mind when installing third-party plugins.

## A minimal plugin

```csharp
using Ink_Canvas.Plugins;

[PluginEntrance]
public class MyPlugin : PluginBase
{
    public override void Initialize(IPluginHost host, IServiceCollection services)
    {
        base.Initialize(host, services);
        Log("MyPlugin 已加载");
    }

    public override void Shutdown()
    {
        Log("MyPlugin 已卸载");
    }
}
```

Add a `manifest.json`, compile, package it as an `.icpx`, drop it into the `PluginPackages/` directory, and restart the host. Full steps are in [Quickstart](./quickstart).

## Core concepts

### IPlugin and PluginBase

`IPlugin` is the plugin contract:

```csharp
public interface IPlugin
{
    string Id { get; }
    string Name { get; }
    string Version { get; }
    string Description { get; }
    string Author { get; }
    int Order { get; }

    void Initialize(IPluginHost host);
    void Shutdown();
    object GetMainView();
    object GetSettingsView();
}
```

In practice, **do not implement `IPlugin` directly** — derive from `PluginBase` instead. It forwards `Id`/`Name`/`Version` and friends to `Manifest` by default, so you only maintain `manifest.json` in one place:

```csharp
public virtual string Id => Manifest?.Id ?? "";
public virtual string Name => Manifest?.Name ?? "";
```

`PluginBase` also provides the three convenience methods `Log()`, `LogError()`, and `GetService<T>()`, plus the two path properties `PluginFolder` and `PluginConfigFolder`.

### The two Initialize overloads

`PluginBase` has two `Initialize` methods:

```csharp
// 旧签名，向后兼容
public virtual void Initialize(IPluginHost host)

// 新签名，支持 DI 服务注册。新插件应重写这个
public virtual void Initialize(IPluginHost host, IServiceCollection services)
```

What the host actually calls is the explicit implementation, which forwards to the new signature:

```csharp
void IPlugin.Initialize(IPluginHost host)
{
    Initialize(host, host.Services);
}
```

**New plugins should override the one taking `IServiceCollection`** — that's the only way to register services with the DI container.

### Note that GetMainView returns object

```csharp
object GetMainView();
object GetSettingsView();
```

The return type is `object` rather than `FrameworkElement`. In practice, just return a WPF `UserControl`; the host does the cast. The design intent was to keep the SDK theoretically free of a WPF dependency, but the SDK itself already sets `UseWPF=true` and references `FrameworkElement` elsewhere, so this layer of abstraction buys little — return a WPF control as usual.

## Ink, recognition, and the tray

These three services were added to the SDK more recently. All of them may be called from any thread; the host takes care of marshalling to the UI thread internally.

### ICanvasInkService

Read and write main-canvas ink, switch tools, and control whiteboard paging and undo/redo:

```csharp
var ink = GetService<ICanvasInkService>();   // PluginBase 便捷方法，取不到返回 null

var strokes = ink.GetStrokes();                 // 克隆副本，改它不影响宿主画布
ink.TryAddStrokes(strokes, new Point(400, 300)); // 按包围盒中心对齐插入
ink.SelectTool(PluginInkTool.Pen);
ink.SwitchToNextPage();
```

A few key points:

- Insertions and clears are written into the TimeMachine history, so the user can undo them with Ctrl+Z.
- While the current page is **ink-frozen**, mutating operations (`TryAddStrokes`, `TryClearStrokes`, editing-type `SelectTool`) are rejected and return `false`. Check `IsPageFrozen` first, or unfreeze with `ToggleInkFreeze()`.
- `GetStrokes()` / `GetDefaultDrawingAttributes()` return clones and do not share internal references.
- `CurrentWhiteboardPage` starts at 1; outside whiteboard mode both it and `WhiteboardPageCount` are 0.
- Coordinates are canvas coordinates (device-independent pixels); use `CanvasSize` when converting.

### IRecognitionService

Wraps the host's dual WinRT / IACore engines for handwriting-to-text, shape recognition, and handwriting beautification:

```csharp
var recog = GetService<IRecognitionService>();

var text = await recog.RecognizeHandwritingAsync(strokes);
if (text.IsSuccess) Log(text.CombinedText);

var shape = await recog.RecognizeShapeAsync(strokes, PluginRecognitionEngine.WinRT);
// shape.StrokesToRemove 指明应从画布移除的原始笔画
```

`PluginRecognitionEngine.Auto` defaults to WinRT on Windows 10 and above; IACore requires an IPC helper process. When an engine is unavailable the call returns a result with `IsSuccess=false` and **does not throw**, so check `IsSuccess` rather than relying on try/catch.

### ITrayService

Controls the tray icon and main-window visibility, and injects items into the tray context menu:

```csharp
var tray = GetService<ITrayService>();

tray.AddMenuItem("myplugin.open", "打开我的面板", () => ShowPanel());
tray.LeftClicked += OnTrayLeftClicked;
```

Injected items land between the host's fixed menu sections (hide window / restart / close, etc.) and do not interfere with the dynamic state updates of the host's own menu. `AddMenuItem` returns `false` if the `id` is a duplicate or an argument is invalid; remember to clean up with `RemoveMenuItem` in `Shutdown()`.

`IsIconVisible` is only an additional layer of control — when the host's own "enable tray icon" setting (`Settings.Appearance.EnableTrayIcon`) is off, the icon stays hidden anyway.

## The matching new events

`IEventService` gained three events at the same time, meant to pair with the ink operations above:

```csharp
event Action<StrokeCollection, StrokeCollection> StrokesChanged;  // added, removed
event Action<int, int> WhiteboardPageChanged;                     // pageIndex(从 1 开始), pageCount
event Action<bool, bool> UndoRedoStateChanged;                    // canUndo, canRedo
```

`StrokesChanged` comes with a trap: a plugin inserting or clearing via `ICanvasInkService` also fires it, so writing to the canvas inside the handler easily turns into an infinite loop. Host-internal programmatic rollbacks, such as the rollback of a frozen page, do not fire it.

## Version compatibility

The host declares its compatibility boundaries in `HostApiRequirement`:

```csharp
public static readonly string CurrentApiVersion = "1.0.0";      // 主版本相同即兼容
public static readonly string MinSupportedHostVersion = "1.7.18"; // 低于此版本的插件被拒绝
public const string HostVersion = ThisAssembly.AssemblyFileVersion;
```

A plugin declares `ApiVersion` and `MinHostVersion` in its `manifest.json`, and these are validated before loading. See [Lifecycle](./lifecycle) for details.

## Next steps

- [Quickstart](./quickstart) — write your first plugin
- [Manifest](./manifest) — every field of manifest.json
- [Host Services](./host-services) — each service interface in detail
