---
title: PPT 联动
description: 三种联动架构、统一接口与 VSTO 加载项
---

# PPT 联动

<UnderConstruction />

联动有三种实现，用户在设置里选一种。选择逻辑在 `MainWindow_cs\MW_PPT.cs:291`：

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

枚举定义在 `Resources\Settings.cs:821`：

```csharp
public enum PPTLinkMode
{
    Com = 0,
    Rot = 1,
    Agent = 2
}
```

`Com` 是 `0`，也就是默认值。`default` 分支同时兜住了 `Com` 和任何非法值。

## 三种模式

| 模式 | 实现类 | 机制 |
| --- | --- | --- |
| `Com`（默认） | `ComPPTLinkManager` | 直接 COM Interop，内部包一层 `PPTManager` |
| `Rot` | `ROTPPTManager` | 从运行对象表（Running Object Table）抓已有 PowerPoint 实例 |
| `Agent` | `PPTAgentLinkManager` | VSTO 加载项进程 + 命名管道 IPC |

::: tip PPTManager 不是第四种模式
`Helpers\` 下有四个类名带 PPT 的文件，但只有三个实现 `IPPTLinkManager`。`PPTManager` 只实现 `IDisposable`，它是被 `ComPPTLinkManager` 包在里面的实际干活的类：

```csharp
_inner = new PPTManager();
```

（`Helpers\ComPPTLinkManager.cs:12`）

也就是说 `Com` 模式是「`ComPPTLinkManager` 适配 + `PPTManager` 实现」两层结构，另外两种模式是单层。
:::

`Agent` 模式选中时会先调 `VstoRegistrationHelper.EnsureRegistered()` 确保加载项已注册。另外两种模式不需要，所以**不装 VSTO 也能用 COM/ROT 模式**。

## 统一接口 IPPTLinkManager

三种实现共用 `Helpers\IPPTLinkManager.cs` 定义的接口（全文 68 行），继承 `IDisposable`。

七个事件：

```csharp
event Action<object> SlideShowBegin;
event Action<object> SlideShowNextSlide;
event Action<object> SlideShowEnd;
event Action<object> PresentationOpen;
event Action<object> PresentationClose;
event Action<bool> PPTConnectionChanged;
event Action<bool> SlideShowStateChanged;
```

前五个的参数是 `object`，实际传的是 COM 对象（`Presentation` / `SlideShowWindow`）。**接口层刻意不暴露 Office 类型**，这样 Agent 模式不必依赖 Office Interop。代价是拿到之后要自己转型。

状态查询：

```csharp
bool IsConnected { get; }
bool IsInSlideShow { get; }
bool IsSupportWPS { get; set; }
bool SkipAnimationsWhenNavigating { get; set; }
int SlidesCount { get; }
object PPTApplication { get; }
```

`IsSupportWPS` 和 `SkipAnimationsWhenNavigating` 是可写的配置项，在创建管理器后立刻从设置注入：

```csharp
_pptManager.IsSupportWPS = Settings.PowerPointSettings.IsSupportWPS;
_pptManager.SkipAnimationsWhenNavigating = Settings.PowerPointSettings.SkipAnimationsWhenGoNext;
```

导航与控制：

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

所有导航方法都是 `Try` 前缀返回 `bool`，**不抛异常**。PowerPoint 随时可能被关掉或进入不可操作状态，调用方靠返回值判断。

查询与导出：

```csharp
int GetCurrentSlideNumber();
string GetPresentationName();
bool TryShowSlideNavigation();
object GetCurrentActivePresentation();
List<PPTSlideThumbnail> ExportSlideThumbnails(int width, int height,
    IProgress<double> progress = null);
```

缩略图的载体很简单：

```csharp
public sealed class PPTSlideThumbnail
{
    public int SlideNumber { get; set; }
    public byte[] PngBytes { get; set; }
}
```

PNG 字节而不是 `BitmapSource`，同样是为了不把 WPF 类型带进跨进程边界。

## 只在 COM 模式生效的那套逻辑

`MW_PPT.cs` 里有一组方法开头都有同一道守卫：

```csharp
if (Settings.PowerPointSettings.PPTLinkMode != PPTLinkMode.Com) return;
```

出现在 `StartPowerPointProcessMonitoring`（L389）、`CreatePowerPointApplication`（L444）、`SetPPTManagerApplication`（L503）、监控定时器回调（L689）。

这套逻辑做的事：宿主自己 `new Microsoft.Office.Interop.PowerPoint.Application()` 创建一个**不可见、最小化**的后台 PowerPoint 实例，然后用 1 秒一次的定时器守着它：

```csharp
private const int ProcessMonitorInterval = 1000; // 应用程序监控间隔（毫秒）
```

实例失效就重建：

```csharp
if (!IsPowerPointApplicationValid())
{
    LogHelper.WriteLogToFile("检测到PowerPoint应用程序已失效，重新创建", LogHelper.LogType.Event);
    CreatePowerPointApplication();
}
```

::: warning 改 PPTLinkMode 相关代码时注意这道守卫
ROT 模式的前提是「PowerPoint 已经由用户打开」，宿主再自己创建一个实例会互相干扰。Agent 模式由加载项进程负责，也不需要。所以这四处守卫都是必要的，加新方法时别忘了照抄。
:::

## 一处反射调用

`SetPPTManagerApplication` 把创建好的实例注入管理器时用了反射：

```csharp
var connectMethod = pptManagerType.GetMethod("ConnectToPPT",
    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
if (connectMethod != null)
{
    connectMethod.Invoke(_pptManager, new object[] { app });
```

方法注释解释了原因：「尝试使用非公开的 `ConnectToPPT` 方法进行绑定，若不可用则回退到写入公共 `PPTApplication` 属性。」

`ConnectToPPT` 不在 `IPPTLinkManager` 接口里，是 `PPTManager` 的私有方法。反射拿不到就退化成给 `PPTApplication` 赋值。

::: danger 重命名 ConnectToPPT 不会有编译错误
这是反射调用，改名或改签名编译器完全不会报错，只会在运行时静默走进回退分支。改 `PPTManager` 私有成员时留意这里。
:::

## VSTO 加载项（Agent 模式）

Agent 模式涉及两个额外项目：

- **`InkCanvas.PowerPointAddIn`** — VSTO 加载项，`v4.7.2` + VSTO ProjectTypeGuids。跑在 PowerPoint 进程里采集放映状态，经命名管道推给主程序
- **`InkCanvas.PPTAgent.Contracts`** — `netstandard2.0`，双方共用的契约：管道常量、帧格式、命令、状态、SmartRegion

契约项目用 `netstandard2.0` 是因为要同时被 `net6.0-windows` 的主程序和 `v4.7.2` 的加载项引用。

::: warning PowerPointAddIn 不在 sln 里
`InkCanvas.PowerPointAddIn` 在磁盘上但**没有加入 `Ink Canvas.sln`**。用 VS 打开解决方案看不到它，需要单独打开 csproj。

CI 里是单独一步 `Build VSTO Add-in` 编译的，产物复制到主程序输出目录的 `ppt-agent/`。`prcheck.yml` 会检查 `Microsoft.Office.Tools.Common.v4.0.Utilities.dll` 是否生成，缺了直接失败。
:::

## 事件接线

管理器创建后统一挂事件（`MW_PPT.cs:309` 起）：

```csharp
_pptManager.PPTConnectionChanged += OnPPTConnectionChanged;
_pptManager.SlideShowBegin += OnPPTSlideShowBegin;
_pptManager.SlideShowNextSlide += OnPPTSlideShowNextSlide;
```

因为三种实现共用接口，这段接线代码与模式无关，只写一遍。

插件不直接碰 `IPPTLinkManager`，走 `IPowerPointService`（属性风格的简化封装）或 `IEventService`（只要事件）。两个接口的 `SlideShowStarted` / `SlideshowStarted` 大小写不一致，见 [宿主服务](../plugin/host-services)。

## 下一步

- [宿主服务](../plugin/host-services) — 插件侧的 `IPowerPointService`
- [解决方案结构](../getting-started/solution-layout) — 各项目的 TFM 与依赖
- [设置系统](./settings) — `PowerPointSettings` 的全部字段
