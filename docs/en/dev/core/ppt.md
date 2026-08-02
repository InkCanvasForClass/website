---
title: PowerPoint Integration
description: Three integration architectures, the unified interface, and the VSTO add-in
---

# PowerPoint Integration

<UnderConstruction />

There are three implementations of the integration; the user picks one in the settings. The selection logic lives in `MainWindow_cs\MW_PPT.cs:291`:

```csharp
// 根据设置选择 COM / ROT / Agent 架构
switch (Settings.PowerPointSettings.PPTLinkMode)
{
    case PPTLinkMode.Rot:
        _pptManager = new ROTPPTManager();
        break;
    case PPTLinkMode.Agent:
        VstoRegistrationHelper.EnsureRegistered();
        _pptManager = new PPTAgentLinkManager();
        break;
    default:
        _pptManager = new ComPPTLinkManager();
        break;
}
```

The enum is defined in `Resources\Settings.cs:821`:

```csharp
public enum PPTLinkMode
{
    Com = 0,
    Rot = 1,
    Agent = 2
}
```

`Com` is `0`, so it is the default value. The `default` branch therefore covers both `Com` and any invalid value.

## The three modes

| Mode | Implementation | Mechanism |
| --- | --- | --- |
| `Com` (default) | `ComPPTLinkManager` | Direct COM Interop, wrapping a `PPTManager` internally |
| `Rot` | `ROTPPTManager` | Grabs an existing PowerPoint instance from the Running Object Table |
| `Agent` | `PPTAgentLinkManager` | VSTO add-in process + named-pipe IPC |

::: tip PPTManager is not a fourth mode
There are four files under `Helpers\` whose class names contain "PPT", but only three of them implement `IPPTLinkManager`. `PPTManager` only implements `IDisposable`; it is the class that does the actual work and is wrapped inside `ComPPTLinkManager`:

```csharp
_inner = new PPTManager();
```

(`Helpers\ComPPTLinkManager.cs:12`)

In other words, `Com` mode is a two-layer structure — "`ComPPTLinkManager` adapter + `PPTManager` implementation" — while the other two modes are single-layer.
:::

When `Agent` mode is selected, `VstoRegistrationHelper.EnsureRegistered()` is called first to make sure the add-in is registered. The other two modes do not need it, so **COM/ROT modes work fine without VSTO installed**.

## The unified IPPTLinkManager interface

All three implementations share the interface defined in `Helpers\IPPTLinkManager.cs` (68 lines in total), which inherits `IDisposable`.

Seven events:

```csharp
event Action<object> SlideShowBegin;
event Action<object> SlideShowNextSlide;
event Action<object> SlideShowEnd;
event Action<object> PresentationOpen;
event Action<object> PresentationClose;
event Action<bool> PPTConnectionChanged;
event Action<bool> SlideShowStateChanged;
```

The first five take an `object` parameter that actually carries a COM object (`Presentation` / `SlideShowWindow`). **The interface layer deliberately does not expose Office types**, so that Agent mode need not depend on Office Interop. The price is that you have to cast the value yourself once you receive it.

State queries:

```csharp
bool IsConnected { get; }
bool IsInSlideShow { get; }
bool IsSupportWPS { get; set; }
bool SkipAnimationsWhenNavigating { get; set; }
int SlidesCount { get; }
object PPTApplication { get; }
```

`IsSupportWPS` and `SkipAnimationsWhenNavigating` are writable configuration options, injected from the settings right after the manager is created:

```csharp
_pptManager.IsSupportWPS = Settings.PowerPointSettings.IsSupportWPS;
_pptManager.SkipAnimationsWhenNavigating = Settings.PowerPointSettings.SkipAnimationsWhenGoNext;
```

Navigation and control:

```csharp
void StartMonitoring();
void StopMonitoring(bool isShutdown = false);
void ReloadConnection();
bool TryStartSlideShow();
bool TryEndSlideShow();
bool TryNavigateToSlide(int slideNumber);
bool TryNavigateNext();
bool TryNavigatePrevious();
```

Every navigation method is prefixed with `Try` and returns a `bool` — **none of them throw**. PowerPoint can be closed or enter an inoperable state at any moment, so callers rely on the return value.

Queries and export:

```csharp
int GetCurrentSlideNumber();
string GetPresentationName();
bool TryShowSlideNavigation();
object GetCurrentActivePresentation();
List<PPTSlideThumbnail> ExportSlideThumbnails(int width, int height,
    IProgress<double> progress = null);
```

The thumbnail carrier is very simple:

```csharp
public sealed class PPTSlideThumbnail
{
    public int SlideNumber { get; set; }
    public byte[] PngBytes { get; set; }
}
```

PNG bytes rather than a `BitmapSource` — again so that WPF types are not dragged across a cross-process boundary.

## The logic that only applies in COM mode

A group of methods in `MW_PPT.cs` all begin with the same guard:

```csharp
if (Settings.PowerPointSettings.PPTLinkMode != PPTLinkMode.Com) return;
```

It appears in `StartPowerPointProcessMonitoring` (L389), `CreatePowerPointApplication` (L444), `SetPPTManagerApplication` (L503), and the monitoring timer callback (L689).

What this logic does: the host itself calls `new Microsoft.Office.Interop.PowerPoint.Application()` to create an **invisible, minimized** background PowerPoint instance, then watches over it with a timer that ticks once per second:

```csharp
private const int ProcessMonitorInterval = 1000; // 应用程序监控间隔（毫秒）
```

If the instance becomes invalid it is recreated:

```csharp
if (!IsPowerPointApplicationValid())
{
    LogHelper.WriteLogToFile("检测到PowerPoint应用程序已失效，重新创建", LogHelper.LogType.Event);
    CreatePowerPointApplication();
}
```

::: warning Mind this guard when touching PPTLinkMode-related code
ROT mode assumes "PowerPoint has already been opened by the user"; if the host created its own instance on top of that, the two would interfere with each other. Agent mode is handled by the add-in process and does not need it either. All four guards are therefore necessary — don't forget to copy them when adding new methods.
:::

## One reflection call

`SetPPTManagerApplication` uses reflection to inject the created instance into the manager:

```csharp
var connectMethod = pptManagerType.GetMethod("ConnectToPPT",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
if (connectMethod != null)
{
    connectMethod.Invoke(_pptManager, new object[] { app });
```

The method comment explains why: try to bind through the non-public `ConnectToPPT` method, and fall back to writing the public `PPTApplication` property if it is unavailable.

`ConnectToPPT` is not part of the `IPPTLinkManager` interface; it is a private method on `PPTManager`. If reflection cannot find it, the code degrades to assigning `PPTApplication`.

::: danger Renaming ConnectToPPT produces no compile error
This is a reflection call — renaming it or changing its signature will not upset the compiler at all; it will just silently take the fallback branch at runtime. Keep this in mind when modifying private members of `PPTManager`.
:::

## The VSTO add-in (Agent mode)

Agent mode involves two extra projects:

- **`InkCanvas.PowerPointAddIn`** — the VSTO add-in, `v4.7.2` + VSTO ProjectTypeGuids. It runs inside the PowerPoint process, collects slideshow state, and pushes it to the main program over a named pipe
- **`InkCanvas.PPTAgent.Contracts`** — `netstandard2.0`, the contracts shared by both sides: pipe constants, frame format, commands, state, SmartRegion

The contracts project targets `netstandard2.0` because it must be referenced both by the `net6.0-windows` main program and by the `v4.7.2` add-in.

::: warning PowerPointAddIn is not in the sln
`InkCanvas.PowerPointAddIn` exists on disk but is **not added to `Ink Canvas.sln`**. You won't see it when you open the solution in VS; you need to open the csproj separately.

In CI it is compiled by a dedicated `Build VSTO Add-in` step, and the output is copied into `ppt-agent/` inside the main program's output directory. `prcheck.yml` checks whether `Microsoft.Office.Tools.Common.v4.0.Utilities.dll` was produced and fails outright if it is missing.
:::

## Event wiring

Events are hooked up uniformly after the manager is created (from `MW_PPT.cs:309`):

```csharp
_pptManager.PPTConnectionChanged += OnPPTConnectionChanged;
_pptManager.SlideShowBegin += OnPPTSlideShowBegin;
_pptManager.SlideShowNextSlide += OnPPTSlideShowNextSlide;
```

Because all three implementations share the same interface, this wiring code is mode-agnostic and is written only once.

Plugins never touch `IPPTLinkManager` directly; they go through `IPowerPointService` (a simplified, property-style wrapper) or `IEventService` (if they only need events). The casing of `SlideShowStarted` / `SlideshowStarted` differs between the two interfaces — see [Host Services](../plugin/host-services).

## Next steps

- [Host Services](../plugin/host-services) — `IPowerPointService` on the plugin side
- [Solution Layout](../getting-started/solution-layout) — TFMs and dependencies of each project
- [Settings System](./settings) — every field of `PowerPointSettings`
