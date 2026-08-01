---
title: 宿主服务
description: IPluginHost 与各服务接口
---

# 宿主服务

插件通过 `IPluginHost` 与宿主交互。`IPluginHost` 本身提供日志、DI 容器、工具栏注册、IPC 四类能力，更细分的功能通过 DI 容器取具体服务接口。

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
    void RegisterIpcHandler(string method, Func<JsonElement?, object> handler);
    IPluginIpcBus Ipc { get; }

    SecurityVerdict EvaluateTrust(string packagePath, string expectedSha256, string declaredPluginId);
}
```

::: warning Services 与 ServiceProvider 的时机
`Services`（`IServiceCollection`）只在 `Initialize` 阶段可用——宿主在所有插件 `Initialize` 完成后才调用 `BuildServiceProvider()`。

也就是说：**`Initialize` 里不要用 `ServiceProvider` 取自己刚注册的服务**，那时容器还没建好。需要延迟获取时，把逻辑放到首次使用时再调 `GetService<T>()`。
:::

获取服务的两种写法等价：

```csharp
// PluginBase 提供的便捷方法
var settings = GetService<ISettingsService>();

// 直接用 host
var settings = Host.GetService<ISettingsService>();
```

## ISettingsService

读写主程序设置。键用 `.` 分隔层级。

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

订阅宿主事件。

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

::: tip 记得退订
在 `Shutdown()` 里退订所有事件，否则插件被卸载后回调仍会被触发，引发异常或内存泄漏。
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

public enum NotificationLevel { Info, Warning, Error, Success }
```

```csharp
GetService<INotificationService>()
    .Show("导出完成", "已保存到桌面", NotificationLevel.Success, () => OpenFolder());
```

## IWindowService

控制主窗口状态。

```csharp
bool IsTopMost { get; }
bool IsFullscreen { get; }
bool IsCollapsed { get; }
bool IsWhiteboardMode { get; }

void SetTopMost(bool topMost);
void ToggleTopMost();
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

event Action<int> SlideChanged;
event Action      SlideshowStarted;
event Action      SlideshowEnded;
```

::: warning 注意事件名差异
`IEventService` 里是 `SlideShowStarted`（大写 S），`IPowerPointService` 里是 `SlideshowStarted`（小写 s）。两者都存在，写代码时注意区分。
:::

## IHotkeyService

```csharp
bool Register(string id, uint modifiers, uint key, Action callback);
bool Unregister(string id);
bool IsRegistered(string id);
```

修饰键是位标志：`Alt=1`、`Ctrl=2`、`Shift=4`、`Win=8`。`key` 是虚拟键码。

```csharp
// Ctrl+Shift+B
GetService<IHotkeyService>().Register("myplugin.toggle", 2 | 4, 0x42, () => Toggle());
```

热键是全局注册的，`Shutdown()` 里务必 `Unregister`，否则会一直占用。

## ICanvasCompositionService

最复杂的一个服务，用于往画布下方注入背景层——PDF 阅读器这类插件靠它实现。

典型流程：

1. `InjectBackgroundLayer(factory)` 把自己的页面视图放到 InkCanvas 下方（不参与命中测试，不抢书写事件）
2. `ConfigurePages(pageCount, currentIndex, pageRenderer)` 告知分页信息与离屏渲染回调
3. 自己翻页后调 `SetCurrentPageAsync(index)`，宿主自动保存/恢复每页墨迹
4. `ExportWithInkAsync(path, fromPage)` 导出「背景 + 墨迹」合成的 PDF

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

几个容易踩的点：

- **所有方法都可以从任意线程调用**，宿主内部会切到 UI 线程。
- **背景居中留边时必须调 `SetPageContentRect`**，否则导出的墨迹会被拉伸成画布比例，且留边上的墨迹不会被裁掉。
- **一次显示多页（双页模式）要用 `SetVisiblePagesAsync`** 而不是 `SetCurrentPageAsync`，否则左右页笔迹会混进同一个页索引。
- **内容容器会缩放时要调 `SetCanvasContentAnchor`**，把锚点指向真正承载内容的元素，宿主才能正确换算墨迹坐标。

## IPluginCanvasGestureHandler

配合 `ICanvasCompositionService.SetCanvasGestureHandler` 使用。宿主检测到画布双指操作时优先转发给它，返回 `true` 表示插件接管，宿主跳过默认的墨迹/画布变换。同一时刻只允许一个处理器，传 `null` 注销。

## IFileAssociationService

```csharp
bool Register(string extension, string progId, string description, string iconPath = null);
bool Unregister(string extension);
bool IsRegistered(string extension);
```

注册文件关联**需要管理员权限**，非管理员运行时会失败返回 `false`。

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

调用这些方法会**立即重启整个应用**，用之前先确认用户已知情。

## IPluginIpcBus

跨进程/跨插件通信，JSON 透明传输。

```csharp
void Start();
void RegisterHandler(string method, Func<JsonElement?, object> handler);
Task<object> InvokeAsync(string method, JsonElement? args, TimeSpan? timeout = null);
event EventHandler<IpcMessage> MessageReceived;
```

注册处理器更常用的是 `IPluginHost.RegisterIpcHandler`：

```csharp
host.RegisterIpcHandler("myplugin.getStatus", args => new { ok = true, count = 42 });
```

注册前确保方法名未被占用，重复注册同一 `method` 的行为未定义。

## ICanvasInkService

读写主画布墨迹、切换工具、控制白板分页与撤销重做。所有方法都可以从任意线程调用，宿主内部负责切到 UI 线程。

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

几个要点：

- 插入/清除会写入 TimeMachine 历史，用户能用 Ctrl+Z 撤销。
- 当前页处于**墨迹冻结**时，变更类操作（`TryAddStrokes`、`TryClearStrokes`、编辑类 `SelectTool`）会被拒绝，返回 `false`。先看 `IsPageFrozen`，或用 `ToggleInkFreeze()` 解冻。
- `PluginInkTool` 枚举：`Select`、`Pen`、`Eraser`、`StrokeEraser`、`Shape`、`Roaming`。
- `CurrentWhiteboardPage` / `WhiteboardPageCount` 非白板模式下都是 0。
- **`StrokesChanged` 事件自触发死循环风险**：经 `ICanvasInkService` 的插入/清除会触发 `IEventService.StrokesChanged`，在处理器里再调写入会绕成死循环。

## IRecognitionService

包装宿主的 WinRT / IACore 双引擎，做手写转文字、图形识别与手写体美化。引擎不可用时返回 `IsSuccess=false` 的结果，**不抛异常**。

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

`PluginRecognitionEngine` 取值：`Auto`（Windows 10+ 默认 WinRT）、`IACore`（需 IPC 辅助进程）、`WinRT`。

`PluginHandwritingResult` 提供 `CombinedText`（拼接全文）和 `Words`（分词列表，`TextCandidates` 按置信度降序）。`PluginShapeRecognitionResult` 提供 `ShapeName`、`StrokesToRemove`（应移除的原始笔画）、`HotPoints`、`Centroid` 等几何信息。

`CorrectInk` 启用 `applyHandwritingBeautify` 时会把原始笔画替换为手写风格字体轮廓墨迹。`handwritingFontFamilyList` 为空则用宿主内置默认字体。

## ITrayService

控制托盘图标与主窗口显隐，并往托盘右键菜单注入菜单项。所有方法都可以从任意线程调用。

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

注入的菜单项落在宿主固定菜单区（隐藏窗口/重启/关闭等）之间，不影响宿主菜单的动态状态更新。`id` 重复或参数无效时 `AddMenuItem` 返回 `false`。

`IsIconVisible` 只是叠加控制——宿主自身的「启用托盘图标」设置（`Settings.Appearance.EnableTrayIcon`）关闭时，即使插件设为 `true` 也不会显示图标。

## IWindowOverviewService

提供系统窗口枚举能力，配合 `PluginWindowInfo` 使用。用于做窗口切换、多窗口管理类插件。

## 服务可用性

不是所有服务在任何时候都可用。`GetService<T>()` 取不到时返回 `null`，**调用前判空**：

```csharp
var ppt = GetService<IPowerPointService>();
if (ppt == null)
{
    Log("PPT 服务不可用，跳过相关功能");
    return;
}
```

例如没装 PowerPoint 时，PPT 相关服务可能不会被注册。

## 下一步

- [UI 集成](./ui-integration) — 工具栏项与设置项
- [生命周期](./lifecycle) — 什么时候能用什么
