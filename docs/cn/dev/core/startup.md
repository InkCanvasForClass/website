---
title: 启动流程
description: 构造函数分支、单实例、主窗口创建与心跳看门狗
---

# 启动流程

<HelpUsImprove />

`App.xaml.cs` 有 1956 行，启动逻辑分两段：构造函数 `App()` 处理进程级的事和特殊模式分流，`App_Startup` 处理真正的应用启动。

## 构造函数里的四个提前退出分支

`App()`（L113-187）在做任何应用初始化之前，先判断这个进程到底是不是「主程序」。

```
App()
├─ SetHighDpiMode(PerMonitorV2) + SetCurrentProcessExplicitAppUserModelID
├─ ConfigureTlsForWindows7()
├─ --watchdog          → RunWatchdogIfNeeded() → Environment.Exit(0)
├─ --enable-uia-topmost-helper → UIAccessHelper → 退出
├─ 挂 Startup / SessionEnding / DispatcherUnhandledException / Exit
├─ StartHeartbeatMonitor()
└─ InitializeCrashListeners()
```

同一个 exe 会以完全不同的身份被启动多次：看门狗子进程、UIA 提权助手、更新器、最终应用。**加启动逻辑前先确认自己在哪个分支里**，写在构造函数顶部的代码看门狗进程也会执行。

### 一个值得记住的历史决策

构造函数 L117-122 的注释记录了一个真实踩过的坑：

```
// 注意：此处显式禁用 Switch.System.Windows.Input.Stylus.EnablePointerSupport。
// 启用该开关会让 WPF 使用 WM_POINTER 触摸栈，导致 DragMove() 和 DoDragDrop()
// （gong-wpf-dragdrop 库内部使用）的模态消息循环无法接收触摸释放消息。
// 在模拟触摸屏（UU 远程、spacedesk 等远程控制软件注入的虚拟触摸）下，
// 拖动操作会进入假死状态，直到呼出鼠标或点击其他窗口生成真实鼠标消息才解除。
```

::: danger 不要开启 EnablePointerSupport
看到这个开关被禁用不要以为是遗漏。WM_POINTER 触摸栈会让远程控制软件注入的虚拟触摸下拖动假死。
:::

## App_Startup 的顺序

`App_Startup`（L945-1381）的关键在于顺序——很多东西必须在主窗口构造之前定下来。

1. `ReadSettingsJsonOnce()` 读原始 JSON（L955）
2. 同步崩溃处理策略、判断是否快速启动（L958-959）
3. i18n：`LocalizationHelper.TrySetCulture(appearance.language)`（L962）
4. 启动画面：满足条件且非文件/URI 启动才显示（L965-977）
5. 解析 `--final-app` / `--skip-mutex-check` / `--board` / `--show`（L995-1012）
6. `AutoUpdateHelper.HandleUpdateModeStartup(e.Args)`（L1028）
7. 单实例检查
8. 创建并显示 `MainWindow`
9. `RunDeferredStartupTasksAsync()`

语言必须在任何 UI 构造之前设置，否则界面文本会是默认语言。设置的第一次读取用的是 `JObject.SelectToken` 直接取零散值，不是完整反序列化，原因见 [设置系统](./settings)。

### 命令行参数

`--board`、`--show`、`--watchdog`、`--skip-mutex-check`、`--final-app`、`--enable-uia-topmost-helper`、`--uia-source-pid`，另外还有 `-m`（允许多开）和 `icc:` URI。

## 单实例与参数转发

互斥体名是 `"InkCanvasForClass CE"`：

```csharp
bool ret;
mutex = new Mutex(true, "InkCanvasForClass CE", out ret);

if (!ret && !e.Args.Contains("-m")) //-m multiple
{
    LogHelper.NewLog("Detected existing instance");
```

检测到已有实例时，**不是简单退出，而是先把启动参数转发给老实例**。四条互斥分支，按优先级：

| 参数 | 转发方法 |
| --- | --- |
| `.icstk` 文件 | `TrySendFileToExistingInstance(icstkFile)` |
| `--board` | `TrySendBoardModeCommandToExistingInstance()` |
| `--show` | `TrySendShowModeCommandToExistingInstance()` |
| `icc:` URI | `TrySendUriCommandToExistingInstance(uriArg)` |

都走 `FileAssociationManager`。这就是双击 `.icstk` 文件能在已运行的实例里打开、而不是启动第二个程序的原因。

退出的时候要做三件事：

```csharp
IsAppExitByUser = true; // 多开时标记为用户主动退出
try
{
    StartupCount.Reset();
    File.WriteAllText(watchdogExitSignalFile, "exit");
    if (watchdogProcess != null && !watchdogProcess.HasExited)
    {
        watchdogProcess.Kill();
    }
}
catch (Exception ex) { System.Diagnostics.Debug.WriteLine(ex); }
Environment.Exit(0);
```

::: warning 退出必须先安抚看门狗
直接 `Environment.Exit(0)` 而不写退出信号、不 Kill 看门狗，看门狗会认为主程序崩了并把它重新拉起来——用户看到的现象是「关不掉」。

信号文件路径带进程 id：`%TEMP%\icc_watchdog_exit_<pid>.flag`。

另外这里 `Environment.Exit(0)` **没有释放 mutex**。进程退出时操作系统会回收，所以不影响功能。
:::

`isUpdateMode` / `isFinalApp` / `skipMutexCheck` 这些特殊模式会跳过单实例检查，但仍然创建一个名字不同的临时互斥体，「以避免其他检查出错」：

```csharp
string mutexName = isFinalApp ? "InkCanvasForClass CE Final" : "InkCanvasForClass CE Update";
```

## 主窗口创建

```csharp
var mainWindow = new MainWindow();
MainWindow = mainWindow;

// 注册插件服务。快速启动模式下将服务注册延迟到首帧显示之后，避免插件相关对象阻塞主窗口创建。
if (!IsFastStartupEnabled)
{
    RegisterPluginServices(mainWindow);
}
```

启动画面在 `mainWindow.Loaded` 里关闭，不是在 `Show()` 之后。同一个回调里还做了几件重要的事：

```csharp
mainWindow.Loaded += (s, args) =>
{
    isStartupComplete = true;
    startupCompleteHeartbeat = DateTime.Now;
    LogHelper.SuppressCallerInfo = false;   // 启动完成，恢复日志调用栈采集
    StartupCount.Reset();                   // 启动成功，重置崩溃重启计数器
```

::: tip 启动期间日志不带调用栈
`LogHelper.SuppressCallerInfo` 在启动期间是 `true`，采集调用栈信息开销大。排查启动问题时发现日志比平时简略，是这个原因。
:::

`StartupCount.Reset()` 是熔断器复位：连续崩溃重启会累加计数，成功启动一次就清零。

### FastStartup 的差异

```csharp
if (IsFastStartupEnabled)
{
    _ = RunFastStartupPostRenderTasksAsync(mainWindow);
    _ = Dispatcher.BeginInvoke(new Action(() => _taskbar?.ForceCreate()), DispatcherPriority.ContextIdle);
}
else
{
    WindowTopmostManager.Initialize(mainWindow, skipScan: true);
    _ = Task.Run(() => Dispatcher.Invoke(() => _taskbar?.ForceCreate()));
}
```

快速启动把插件服务注册、置顶管理器初始化都推迟到首帧渲染之后。**代价是启动后的头一两秒里插件服务还没就绪**。插件在 `Initialize` 里立刻调用宿主服务时要考虑这一点。

URI 参数的处理也是延迟的，固定等 1 秒：

```csharp
// 延迟一点执行，确保窗口初始化完成
_ = Task.Delay(1000).ContinueWith(_ => { ... mainWindow.HandleUriCommand(startupUriArg); });
```

## 心跳与看门狗

`StartHeartbeatMonitor()`（L1717）里有两个计时器，职责不同。

**心跳计时器**跑在 UI 线程上，1 秒一次刷新时间戳：

```csharp
heartbeatTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
heartbeatTimer.Tick += (_, __) =>
{
    lastHeartbeat = DateTime.Now;
    UpdateCpuUsageSnapshot();
};
```

用 `DispatcherTimer` 是关键——UI 线程卡死时它就不再触发，时间戳自然停止更新。

**监控计时器**是普通 `Timer`（线程池），3 秒一次检查：

```csharp
}, null, 0, 3000);
```

判定分两种情况。

启动阶段假死，阈值 **2 分钟**：

```csharp
if (elapsedSinceStart.TotalMinutes >= 2)
{
    string restartReason = $"检测到启动假死：{timeType}{elapsedSinceStart.TotalMinutes:F2}分钟，但未收到启动完成心跳，自动重启。";
```

运行期无响应，阈值 **10 秒**，但启动完成后有 **30 秒宽限期**：

```csharp
if (sinceStartupComplete.TotalSeconds < 30)
{
    return;
}

if (sinceHeartbeat.TotalSeconds > 10)
{
    string restartReason = $"检测到主线程无响应，自动重启。心跳超时 {sinceHeartbeat.TotalSeconds:F1} 秒。";
```

30 秒宽限是因为刚启动完还在加载资源，UI 线程本来就容易短暂卡住。

两种情况都只在 `CrashAction == CrashActionType.SilentRestart` 时才真的重启，且走 `TryRestartWithBreaker()`——带熔断，避免无限重启。

### 两个跳过条件

```csharp
if (isAppExiting)
    return;
if (IsOobeShowing)
    return;
```

::: warning 调试时会被自动重启打断
在 UI 线程上断点停超过 10 秒（且启动完成 30 秒后），看门狗会认为主线程卡死并重启程序。

调试期间可以用 `App.DebugStopHeartbeat()` 停掉心跳计时器。注意这个方法是 `internal static`，只能从主程序内部调。

`IsOobeShowing` 的存在是同样的道理：OOBE 引导页等待用户输入时不该被判定为卡死。写任何长时间阻塞 UI 线程的模态流程时，都要考虑加类似的跳过标志。
:::

## 目录约定

全部基于 `App.RootPath`：

```csharp
public static string RootPath = AppDomain.CurrentDomain.SetupInformation.ApplicationBase;
```

即**程序目录，不是 %AppData%**。

- `Logs\Log_{yyyy-MM-dd-HH-mm-ss}.txt`
- `Crashes\`
- `Configs\Settings.json`
- `Plugins\` / `PluginPackages\` / `PluginConfigs\` / `PluginLogs\`

::: warning Logs 超过 5MB 会被整个清空
`CheckAndCleanLogsFolder()` 里 `MaxLogsFolderSizeBytes = 5 * 1024 * 1024`，超了不是滚动删除最旧的，是**清空整个目录**。要留存日志就及时拷走。
:::

## 下一步

- [主窗口](./mainwindow) — `MainWindow` 的 partial 拆分
- [设置系统](./settings) — 启动时两次读设置的原因
- [插件生命周期](../plugin/lifecycle) — 插件在启动流程的哪一步被加载
