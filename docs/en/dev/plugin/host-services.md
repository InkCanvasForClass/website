---
title: Host Services
description: IPluginHost and each of the service interfaces
---

# Host Services

<HelpUsImprove />

Plugins interact with the host through `IPluginHost`. `IPluginHost` itself provides four categories of capability — logging, the DI container, toolbar registration, and IPC — while more specific functionality is obtained by resolving concrete service interfaces from the DI container.

## IPluginHost

```csharp
public interface IPluginHost
{
    void Log(string message);
    void LogError(string message, Exception ex = null);

    IServiceCollection Services { get; }      // 仅 Initialize 阶段可写
    IServiceProvider ServiceProvider { get; } // 所有插件 Initialize 完成后才可用
    T GetService<T>() where T : class;
    void RegisterService<T>(T service) where T : class;

    void RegisterToolbarItem(PluginToolbarItemInfo itemInfo);
    void RegisterBoardToolbarItem(PluginToolbarItemInfo itemInfo);
    void RegisterIpcHandler(string method, Func<JsonElement?, object> handler);
    IPluginIpcBus Ipc { get; }

    SecurityVerdict EvaluateTrust(string packagePath, string expectedSha256, string declaredPluginId);
}
```

::: warning The timing of Services and ServiceProvider
`Services` (`IServiceCollection`) is only usable during `Initialize` — the host does not call `BuildServiceProvider()` until every plugin has finished `Initialize`.

Which means: **do not use `ServiceProvider` inside `Initialize` to resolve a service you just registered**, because the container isn't built yet. When you need it later, move the logic so that `GetService<T>()` is called at first use.
:::

The two ways of obtaining a service are equivalent:

```csharp
// PluginBase 提供的便捷方法
var settings = GetService<ISettingsService>();

// 直接用 host
var settings = Host.GetService<ISettingsService>();
```

## ISettingsService

Reads and writes host settings. Keys use `.` to separate levels.

```csharp
T Get<T>(string key);              // 不存在返回 default
void Set<T>(string key, T value);
bool Has(string key);
event Action<string, object> SettingChanged;
```

```csharp
var theme = GetService<ISettingsService>();
var current = theme.Get<string>("appearance.theme");
theme.Set("appearance.theme", "Dark");
theme.SettingChanged += (key, value) =>
{
    if (key == "appearance.theme") ApplyTheme(value as string);
};
```

## IEventService

Subscribe to host events.

```csharp
event Action<bool> WhiteboardModeChanged;  // true=进入白板
event Action<bool> PenModeChanged;         // true=画笔模式
event Action<int>  SlideChanged;           // PPT 翻页，参数为页码
event Action       SlideShowStarted;
event Action       SlideShowEnded;
event Action<bool> TopMostChanged;
event Action       AppExiting;
event Action<StrokeCollection, StrokeCollection> StrokesChanged;   // added, removed
event Action<int, int> WhiteboardPageChanged;                      // pageIndex（从 1 开始）, pageCount
event Action<bool, bool> UndoRedoStateChanged;                     // canUndo, canRedo
```

::: tip Remember to unsubscribe
Unsubscribe from every event in `Shutdown()`, otherwise your callbacks still fire after the plugin is unloaded, causing exceptions or memory leaks.
:::

```csharp
private IEventService _events;

public override void Initialize(IPluginHost host, IServiceCollection services)
{
    base.Initialize(host, services);
    _events = GetService<IEventService>();
    _events.WhiteboardModeChanged += OnWhiteboardChanged;
}

public override void Shutdown()
{
    if (_events != null)
        _events.WhiteboardModeChanged -= OnWhiteboardChanged;
}
```

## INotificationService

```csharp
void Show(string title, string message, NotificationLevel level = NotificationLevel.Info);
void Show(string title, string message, NotificationLevel level, Action onClicked);
void ShowToast(string title, string message, NotificationLevel level = NotificationLevel.Info);
void ShowToast(string title, string message, NotificationLevel level, Action onClicked);

IReadOnlyList<NotificationHistoryItem> GetHistory();
NotificationHistoryItem GetLatestHistoryItem();

public enum NotificationLevel { Info, Warning, Error, Success }
```

```csharp
GetService<INotificationService>()
    .Show("导出完成", "已保存到桌面", NotificationLevel.Success, () => OpenFolder());
```

`ShowToast` sends a Windows toast notification (visible in the action center). `GetHistory` returns the full notification history; `GetLatestHistoryItem` returns the most recent entry.

## IWindowService

Controls the main window's state.

```csharp
bool IsTopMost { get; }
bool IsFullscreen { get; }
bool IsCollapsed { get; }
bool IsWhiteboardMode { get; }

void SetTopMost(bool topMost);
void ToggleTopMost();
void SetFullscreen(bool fullscreen);
void ToggleFullscreen();
void Collapse();      // 收纳浮动栏到屏幕边缘
void Expand();
void ToggleCollapse();
void EnterWhiteboard();
void ExitWhiteboard();

event Action<bool> TopMostChanged;
event Action<bool> CollapseChanged;
```

## IPowerPointService

```csharp
bool   IsSlideshowActive { get; }
int    CurrentSlide { get; }      // 从 1 开始，未放映返回 0
int    TotalSlides { get; }       // 未打开返回 0
string CurrentFileName { get; }   // 不含路径，未打开返回 null

void GoToSlide(int slideNumber);
void NextSlide();
void PreviousSlide();
void StartSlideshow();
void StopSlideshow();

Task<string> SaveSlideThumbnailAsync(int slideNumber, string outputPath);

event Action<int> SlideChanged;
event Action      SlideshowStarted;
event Action      SlideshowEnded;
```

::: warning Mind the difference in event names
`IEventService` has `SlideShowStarted` (capital S), while `IPowerPointService` has `SlideshowStarted` (lowercase s). Both exist, so keep them straight when writing code.
:::

## IHotkeyService

```csharp
bool Register(string id, uint modifiers, uint key, Action callback);
bool Unregister(string id);
bool IsRegistered(string id);

IReadOnlyList<HostHotkeyInfo> GetHostHotkeys();
bool UpdateHostHotkey(string id, uint modifiers, uint key);
void PauseAll();
void ResumeAll();
bool IsPaused { get; }
```

Modifiers are bit flags: `Alt=1`, `Ctrl=2`, `Shift=4`, `Win=8`. `key` is a virtual key code.

```csharp
// Ctrl+Shift+B
GetService<IHotkeyService>().Register("myplugin.toggle", 2 | 4, 0x42, () => Toggle());
```

Hotkeys are registered globally, so you must `Unregister` in `Shutdown()` or they stay occupied.

`GetHostHotkeys` returns the list of built-in host hotkeys. `UpdateHostHotkey` lets you change a built-in hotkey's binding. `PauseAll` / `ResumeAll` suspends and resumes all hotkey processing (including both host and plugin hotkeys).

## ICanvasCompositionService

The most complex service, used to inject a background layer beneath the canvas — plugins like a PDF reader are built on it.

The typical flow:

1. `InjectBackgroundLayer(factory)` places your page view below the InkCanvas (it does not participate in hit testing and does not steal writing events)
2. `ConfigurePages(pageCount, currentIndex, pageRenderer)` tells the host the paging information and the off-screen render callback
3. After you change pages yourself, call `SetCurrentPageAsync(index)`; the host saves and restores each page's ink automatically
4. `ExportWithInkAsync(path, fromPage)` exports a PDF composited from "background + ink"

```csharp
void InjectBackgroundLayer(Func<FrameworkElement> backgroundFactory);
void RemoveBackgroundLayer();
bool HasBackgroundLayer { get; }

void SetPageContentRect(Rect? contentRect);   // 声明页面内容矩形，避免墨迹被拉伸
void ConfigurePages(uint pageCount, uint currentPageIndex,
                    Func<uint, CancellationToken, Task<BitmapSource>> pageRenderer);
uint PageCount { get; }
uint CurrentPageIndex { get; }

Task SetCurrentPageAsync(uint pageIndex, CancellationToken ct = default);
Task SetVisiblePagesAsync(IReadOnlyList<PluginVisiblePage> pages, CancellationToken ct = default);
Task ScrollOffsetAsync(double deltaY, CancellationToken ct = default);
Task TransformInkAsync(Matrix matrix, CancellationToken ct = default);

void SetCanvasGestureHandler(IPluginCanvasGestureHandler handler);
void SetCanvasContentAnchor(FrameworkElement contentLayer);

Task<StrokeCollection> GetStrokesForPageAsync(uint pageIndex, CancellationToken ct = default);
Task<string> ExportWithInkAsync(string outputPath, uint pageIndex, CancellationToken ct = default);
```

A few things that are easy to get wrong:

- **Every method may be called from any thread**; the host marshals to the UI thread internally.
- **You must call `SetPageContentRect` when the background is centered with margins**, otherwise exported ink gets stretched to the canvas aspect ratio and ink on the margins is not clipped away.
- **To show multiple pages at once (two-page mode), use `SetVisiblePagesAsync`** rather than `SetCurrentPageAsync`, or the ink from the left and right pages ends up under the same page index.
- **Call `SetCanvasContentAnchor` when the content container can scale**, pointing the anchor at the element that actually carries the content, so the host can convert ink coordinates correctly.

## IPluginCanvasGestureHandler

Used together with `ICanvasCompositionService.SetCanvasGestureHandler`. When the host detects a two-finger gesture on the canvas it forwards it here first; returning `true` means the plugin took over and the host skips its default ink/canvas transform. Only one handler is allowed at a time; pass `null` to unregister.

## IFileAssociationService

```csharp
bool Register(string extension, string progId, string description, string iconPath = null);
bool Unregister(string extension);
bool IsRegistered(string extension);
```

Registering a file association **requires administrator privileges**; when running non-elevated it fails and returns `false`.

## IAppRestartService

```csharp
bool IsRunningAsAdmin { get; }
void RestartApp(bool asAdmin);
void RestartWithCurrentPrivileges();
void RestartAsAdmin();
void RestartAsNormal();
void SwitchToUIATopMostAndRestart();
void SwitchToNormalTopMostAndRestart();
```

Calling these **restarts the whole application immediately**, so make sure the user knows before you use them.

## IPluginIpcBus

Cross-process / cross-plugin communication, transported transparently as JSON.

```csharp
void Start();
void RegisterHandler(string method, Func<JsonElement?, object> handler);
Task<object> InvokeAsync(string method, JsonElement? args, TimeSpan? timeout = null);
event EventHandler<IpcMessage> MessageReceived;
```

The more common way to register a handler is `IPluginHost.RegisterIpcHandler`:

```csharp
host.RegisterIpcHandler("myplugin.getStatus", args => new { ok = true, count = 42 });
```

Make sure the method name isn't already taken before registering; the behavior of registering the same `method` twice is undefined.

## ICanvasInkService

Reads and writes main-canvas ink, switches tools, and controls whiteboard paging and undo/redo. Every method may be called from any thread; the host handles marshalling to the UI thread internally.

```csharp
bool   IsPenMode { get; }
bool   IsPageFrozen { get; }
bool   CanUndo { get; }
bool   CanRedo { get; }
int    CurrentWhiteboardPage { get; }  // 从 1 开始，非白板模式返回 0
int    WhiteboardPageCount { get; }
Size   CanvasSize { get; }            // DIP，供坐标换算

DrawingAttributes GetDefaultDrawingAttributes();   // 克隆，修改不影响宿主
StrokeCollection  GetStrokes();                    // 克隆，不共享内部引用

bool TryAddStrokes(StrokeCollection strokes);                   // 保持原坐标插入
bool TryAddStrokes(StrokeCollection strokes, Point center);     // 包围盒中心对齐到 center
bool TryClearStrokes();
bool SelectTool(PluginInkTool tool);

void Undo();
void Redo();
void SwitchToPreviousPage();
void SwitchToNextPage();
void AddWhiteboardPage();
void DeleteWhiteboardPage();

bool InsertImage();                   // 从文件插入图片流程
Task<bool> InsertImageAsync(string imagePath);
Task<string> ExportToPngAsync(string outputPath);
void ChangeBackgroundColor();
void ToggleGesture();                 // 双指手势开关
void ExitWhiteboard();
void ToggleInkFreeze();
```

```csharp
var ink = GetService<ICanvasInkService>();

// 读完当前页墨迹，做点处理再插回去
var strokes = ink.GetStrokes();
foreach (var s in strokes) s.DrawingAttributes.Color = Colors.Red;
ink.TryAddStrokes(strokes);
```

A few key points:

- Insertions and clears are written into the TimeMachine history, so the user can undo them with Ctrl+Z.
- While the current page is **ink-frozen**, mutating operations (`TryAddStrokes`, `TryClearStrokes`, editing-type `SelectTool`) are rejected and return `false`. Check `IsPageFrozen` first, or unfreeze with `ToggleInkFreeze()`.
- The `PluginInkTool` enum: `Select`, `Pen`, `Eraser`, `StrokeEraser`, `Shape`, `Roaming`.
- `CurrentWhiteboardPage` / `WhiteboardPageCount` are both 0 outside whiteboard mode.
- **Risk of a self-triggered infinite loop via `StrokesChanged`**: insertions and clears made through `ICanvasInkService` fire `IEventService.StrokesChanged`, so writing again from inside the handler loops forever.

## IRecognitionService

Wraps the host's dual WinRT / IACore engines for handwriting-to-text, shape recognition, and handwriting beautification. When an engine is unavailable it returns a result with `IsSuccess=false` and **does not throw**.

```csharp
Task<PluginShapeRecognitionResult> RecognizeShapeAsync(StrokeCollection strokes,
    PluginRecognitionEngine engine = PluginRecognitionEngine.Auto);

Task<PluginHandwritingResult> RecognizeHandwritingAsync(StrokeCollection strokes,
    PluginRecognitionEngine engine = PluginRecognitionEngine.Auto);

Task<StrokeCollection> CorrectInkAsync(StrokeCollection strokes,
    PluginRecognitionEngine engine = PluginRecognitionEngine.Auto,
    bool applyHandwritingBeautify = false,
    string handwritingFontFamilyList = null);

bool   IsValidShapeType(string shapeName);
string GetSystemInfo();
```

```csharp
var recog = GetService<IRecognitionService>();

var text = await recog.RecognizeHandwritingAsync(strokes);
if (text.IsSuccess)
{
    Log($"识别结果: {text.CombinedText}");
    foreach (var w in text.Words)
        Log($"  词: {w.TextCandidates[0]} 框: {w.BoundingRectangle}");
}
```

`PluginRecognitionEngine` values: `Auto` (WinRT by default on Windows 10+), `IACore` (requires the IPC helper process), and `WinRT`.

`PluginHandwritingResult` provides `CombinedText` (the concatenated text) and `Words` (the tokenized list, with `TextCandidates` in descending order of confidence). `PluginShapeRecognitionResult` provides `ShapeName`, `StrokesToRemove` (the original strokes that should be removed), `HotPoints`, `Centroid`, and other geometry.

When `CorrectInk` is called with `applyHandwritingBeautify` enabled, it replaces the original strokes with ink tracing handwriting-style font outlines. If `handwritingFontFamilyList` is empty, the host's built-in default font is used.

## ITrayService

Controls the tray icon and main-window visibility, and injects items into the tray context menu. Every method may be called from any thread.

```csharp
bool   IsIconVisible { get; set; }
bool   IsMainWindowVisible { get; set; }

void   ShowContextMenu();

bool   AddMenuItem(string id, string text, Action onClicked);
bool   RemoveMenuItem(string id);
bool   HasMenuItem(string id);

event  Action LeftClicked;
event  Action RightClicked;
```

```csharp
var tray = GetService<ITrayService>();

// 往托盘右键菜单加项，Shutdown 里记得 RemoveMenuItem
tray.AddMenuItem("myplugin.open", "打开我的面板", () => ShowPanel());

tray.LeftClicked += () => Log("托盘左键被点击");
```

Injected items land between the host's fixed menu sections (hide window / restart / close, etc.) and do not interfere with the dynamic state updates of the host's own menu. `AddMenuItem` returns `false` if the `id` is a duplicate or an argument is invalid.

`IsIconVisible` is only an additional layer of control — when the host's own "enable tray icon" setting (`Settings.Appearance.EnableTrayIcon`) is off, the icon stays hidden even if the plugin sets it to `true`.

## IWindowOverviewService

Provides system window enumeration, used together with `PluginWindowInfo`. Handy for window-switching and multi-window management plugins.

## IClipboardService

Reads and writes clipboard text and images.

```csharp
Task<string> GetTextAsync();
Task<bool> SetTextAsync(string text);

Task<BitmapSource> GetImageAsync();
Task<bool> SetImageAsync(BitmapSource image);
```

## ICameraService

Enumerates cameras, starts preview, captures frames.

```csharp
IReadOnlyList<PluginCameraInfo> GetCameras();

Task<PluginCameraPreview> StartPreviewAsync(string cameraId);
void StopPreview();

Task<BitmapSource> CaptureFrameAsync(string cameraId);
```

## IScreenshotService

Captures fullscreen or region screenshots.

```csharp
Task<BitmapSource> CaptureFullscreenAsync();
Task<BitmapSource> CaptureRegionAsync(Rect region);
```

## IFileDialogService

Opens file open/save dialogs.

```csharp
Task<string> OpenFileDialogAsync(PluginFileDialogOptions options);
Task<string> SaveFileDialogAsync(PluginFileDialogOptions options);
```

## IConfigProfileService

Manages config profiles (snapshots of settings for different scenarios).

```csharp
IReadOnlyList<PluginConfigProfile> GetProfiles();
bool CreateProfile(string name, string description = null);
bool ApplyProfile(string profileId);
bool DeleteProfile(string profileId);
```

## INameRosterService

Reads and manages the name roster used in the random name picker feature.

```csharp
IReadOnlyList<string> GetNames();
bool AddName(string name);
bool RemoveName(string name);
void ClearNames();
```

## IQuoteService

Reads the host's built-in quote presets and triggers a watermark refresh.

```csharp
IReadOnlyList<string> GetQuotes();
void RefreshCurrentWatermark();
```

## IAnnouncementService

Reads announcement center unread count and history.

```csharp
int UnreadCount { get; }
IReadOnlyList<PluginAnnouncement> GetHistory();
void MarkAsRead(string announcementId);
```

## IScreenInfoService

Reads display/ screen information.

```csharp
IReadOnlyList<PluginDisplayInfo> GetDisplays();
PluginDisplayInfo GetPrimaryDisplay();
```

## ISystemInfoService

Reads system/device information and usage statistics.

```csharp
string GetOSVersion();
string GetDeviceName();
long GetTotalMemory();
long GetAvailableMemory();
double GetCpuUsage();
```

## IThemeService

Detects and applies the host theme.

```csharp
PluginTheme CurrentTheme { get; }
event Action<PluginTheme> ThemeChanged;
```

## IInkEffectService

Controls the ink fade-out animation on the canvas.

```csharp
void SetFadeOutEnabled(bool enabled);
bool IsFadeOutEnabled { get; }
void SetFadeOutDuration(TimeSpan duration);
TimeSpan FadeOutDuration { get; }
```

## IPluginUriService

Registers deep-link handlers and opens `icc://` URIs.

```csharp
bool RegisterScheme(string scheme, Func<Uri, Task> handler);
bool UnregisterScheme(string scheme);
Task<bool> OpenUriAsync(Uri uri);
```

## IBackupService

Controls the host's auto-backup of settings.

```csharp
bool IsAutoBackupEnabled { get; }
void TriggerBackup();
DateTime? LastBackupTime { get; }
```

## IUpdateService

Checks for host updates, reads changelogs, and triggers installation.

```csharp
Task<PluginUpdateInfo> CheckForUpdatesAsync();
IReadOnlyList<string> GetChangelog(string version);
void InstallNewVersion(string version, bool isInSilence);
void RequestCancelDownload();
string LastDownloadFailure { get; }
```

## IAppInfoService

Reads host app version, installation path, and update status.

```csharp
string AppVersion { get; }
string InstallPath { get; }
bool IsUpdateAvailable { get; }
```

## Service availability

Not every service is available at all times. `GetService<T>()` returns `null` when it cannot be resolved, so **null-check before calling**:

```csharp
var ppt = GetService<IPowerPointService>();
if (ppt == null)
{
    Log("PPT 服务不可用，跳过相关功能");
    return;
}
```

For example, the PowerPoint-related services may not be registered at all when PowerPoint is not installed.

## Next steps

- [UI Integration](./ui-integration) — toolbar items and settings items
- [Lifecycle](./lifecycle) — what is available when
