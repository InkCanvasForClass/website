---
title: Startup Flow
description: Constructor branches, single instance, main window creation, and the heartbeat watchdog
---

# Startup Flow

<UnderConstruction />

`App.xaml.cs` is 1956 lines long and the startup logic comes in two parts: the constructor `App()` handles process-level concerns and routes special modes, while `App_Startup` handles the actual application startup.

## The four early-exit branches in the constructor

Before doing any application initialization, `App()` (L113-187) first determines whether this process is really "the main application".

```
App()
├─ SetHighDpiMode(PerMonitorV2) + SetCurrentProcessExplicitAppUserModelID
├─ ConfigureTlsForWindows7()
├─ --watchdog          → RunWatchdogIfNeeded() → Environment.Exit(0)
├─ --enable-uia-topmost-helper → UIAccessHelper → exit
├─ hook up Startup / SessionEnding / DispatcherUnhandledException / Exit
├─ StartHeartbeatMonitor()
└─ InitializeCrashListeners()
```

The same executable gets launched several times under completely different identities: the watchdog child process, the UIA elevation helper, the updater, and the final application. **Before adding startup logic, work out which branch you are in** — code placed at the top of the constructor also runs in the watchdog process.

### A historical decision worth remembering

The comment at L117-122 of the constructor documents a real pitfall the project ran into:

```
// Note: Switch.System.Windows.Input.Stylus.EnablePointerSupport is explicitly disabled here.
// Enabling this switch makes WPF use the WM_POINTER touch stack, which prevents the modal
// message loops of DragMove() and DoDragDrop() (used internally by the gong-wpf-dragdrop
// library) from receiving touch release messages.
// With simulated touch screens (virtual touch injected by remote control software such as
// UU Remote or spacedesk), drag operations freeze until a real mouse message is generated
// by bringing up the mouse or clicking another window.
```

::: danger Do not enable EnablePointerSupport
Seeing this switch disabled is not an oversight. The WM_POINTER touch stack causes drags to freeze under the virtual touch injected by remote control software.
:::

## The order of App_Startup

What matters in `App_Startup` (L945-1381) is the ordering — a lot of things must be settled before the main window is constructed.

1. `ReadSettingsJsonOnce()` reads the raw JSON (L955)
2. Sync the crash handling policy and determine whether fast startup applies (L958-959)
3. i18n: `LocalizationHelper.TrySetCulture(appearance.language)` (L962)
4. Splash screen: shown only if the conditions are met and this is not a file/URI launch (L965-977)
5. Parse `--final-app` / `--skip-mutex-check` / `--board` / `--show` (L995-1012)
6. `AutoUpdateHelper.HandleUpdateModeStartup(e.Args)` (L1028)
7. Single-instance check
8. Create and show `MainWindow`
9. `RunDeferredStartupTasksAsync()`

The language must be set before any UI is constructed, otherwise interface text falls back to the default language. The first read of the settings uses `JObject.SelectToken` to pull individual values directly rather than deserializing the whole file; see [Settings system](./settings) for why.

### Command-line arguments

`--board`, `--show`, `--watchdog`, `--skip-mutex-check`, `--final-app`, `--enable-uia-topmost-helper`, `--uia-source-pid`, plus `-m` (allow multiple instances) and `icc:` URIs.

## Single instance and argument forwarding

The mutex is named `"InkCanvasForClass CE"`:

```csharp
bool ret;
mutex = new Mutex(true, "InkCanvasForClass CE", out ret);

if (!ret && !e.Args.Contains("-m")) //-m multiple
{
    LogHelper.NewLog("Detected existing instance");
```

When an existing instance is detected, **it does not simply exit — it first forwards the startup arguments to the old instance**. Four mutually exclusive branches, in priority order:

| Argument | Forwarding method |
| --- | --- |
| `.icstk` file | `TrySendFileToExistingInstance(icstkFile)` |
| `--board` | `TrySendBoardModeCommandToExistingInstance()` |
| `--show` | `TrySendShowModeCommandToExistingInstance()` |
| `icc:` URI | `TrySendUriCommandToExistingInstance(uriArg)` |

All of them go through `FileAssociationManager`. This is why double-clicking a `.icstk` file opens it in the already running instance instead of starting a second copy of the program.

Three things have to happen on exit:

```csharp
IsAppExitByUser = true; // mark as a user-initiated exit when multiple instances are allowed
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

::: warning Calm the watchdog down before exiting
Calling `Environment.Exit(0)` without writing the exit signal and killing the watchdog makes the watchdog think the main application crashed and start it again — what users see is an application that "cannot be closed".

The signal file path includes the process id: `%TEMP%\icc_watchdog_exit_<pid>.flag`.

Also note that `Environment.Exit(0)` here **does not release the mutex**. The OS reclaims it when the process exits, so it does not affect behavior.
:::

Special modes like `isUpdateMode` / `isFinalApp` / `skipMutexCheck` skip the single-instance check, but they still create a temporary mutex under a different name "to keep other checks from breaking":

```csharp
string mutexName = isFinalApp ? "InkCanvasForClass CE Final" : "InkCanvasForClass CE Update";
```

## Creating the main window

```csharp
var mainWindow = new MainWindow();
MainWindow = mainWindow;

// Register plugin services. In fast startup mode, service registration is deferred until
// after the first frame is displayed so plugin-related objects do not block main window creation.
if (!IsFastStartupEnabled)
{
    RegisterPluginServices(mainWindow);
}
```

The splash screen is closed in `mainWindow.Loaded`, not after `Show()`. The same callback also does several important things:

```csharp
mainWindow.Loaded += (s, args) =>
{
    isStartupComplete = true;
    startupCompleteHeartbeat = DateTime.Now;
    LogHelper.SuppressCallerInfo = false;   // startup finished, resume collecting call stacks in logs
    StartupCount.Reset();                   // startup succeeded, reset the crash-restart counter
```

::: tip Logs carry no call stacks during startup
`LogHelper.SuppressCallerInfo` is `true` during startup because collecting call stack information is expensive. That is why logs look sparser than usual when you are investigating a startup problem.
:::

`StartupCount.Reset()` resets the circuit breaker: consecutive crash restarts increment the counter, and one successful startup clears it.

### How FastStartup differs

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

Fast startup defers both plugin service registration and topmost manager initialization until after the first frame renders. **The cost is that plugin services are not ready during the first second or two after startup.** Keep that in mind if a plugin calls host services immediately inside `Initialize`.

URI argument handling is deferred too, with a fixed one-second wait:

```csharp
// delay slightly to make sure window initialization has finished
_ = Task.Delay(1000).ContinueWith(_ => { ... mainWindow.HandleUriCommand(startupUriArg); });
```

## Heartbeat and watchdog

`StartHeartbeatMonitor()` (L1717) contains two timers with different jobs.

**The heartbeat timer** runs on the UI thread and refreshes a timestamp once per second:

```csharp
heartbeatTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
heartbeatTimer.Tick += (_, __) =>
{
    lastHeartbeat = DateTime.Now;
    UpdateCpuUsageSnapshot();
};
```

Using a `DispatcherTimer` is the key — when the UI thread hangs it stops firing, so the timestamp naturally stops updating.

**The monitor timer** is a plain `Timer` (thread pool) that checks every 3 seconds:

```csharp
}, null, 0, 3000);
```

There are two separate verdicts.

A hang during startup, with a **2 minute** threshold:

```csharp
if (elapsedSinceStart.TotalMinutes >= 2)
{
    string restartReason = $"检测到启动假死：{timeType}{elapsedSinceStart.TotalMinutes:F2}分钟，但未收到启动完成心跳，自动重启。";
```

An unresponsive main thread at runtime, with a **10 second** threshold and a **30 second** grace period after startup completes:

```csharp
if (sinceStartupComplete.TotalSeconds < 30)
{
    return;
}

if (sinceHeartbeat.TotalSeconds > 10)
{
    string restartReason = $"检测到主线程无响应，自动重启。心跳超时 {sinceHeartbeat.TotalSeconds:F1} 秒。";
```

The 30 second grace period exists because resources are still loading right after startup, so the UI thread is naturally prone to brief stalls.

In both cases a restart only actually happens when `CrashAction == CrashActionType.SilentRestart`, and it goes through `TryRestartWithBreaker()` — which includes the circuit breaker that prevents infinite restarts.

### Two skip conditions

```csharp
if (isAppExiting)
    return;
if (IsOobeShowing)
    return;
```

::: warning Automatic restarts will interrupt debugging
If you sit on a breakpoint on the UI thread for more than 10 seconds (and more than 30 seconds after startup completes), the watchdog decides the main thread is hung and restarts the program.

While debugging you can stop the heartbeat timer with `App.DebugStopHeartbeat()`. Note that this method is `internal static`, so it can only be called from inside the main application.

`IsOobeShowing` exists for the same reason: waiting for user input on the OOBE pages should not count as a hang. Whenever you write a modal flow that blocks the UI thread for a long time, consider adding a similar skip flag.
:::

## Directory conventions

Everything is based on `App.RootPath`:

```csharp
public static string RootPath = AppDomain.CurrentDomain.SetupInformation.ApplicationBase;
```

That is the **application directory, not %AppData%**.

- `Logs\Log_{yyyy-MM-dd-HH-mm-ss}.txt`
- `Crashes\`
- `Configs\Settings.json`
- `Plugins\` / `PluginPackages\` / `PluginConfigs\` / `PluginLogs\`

::: warning Logs over 5MB get wiped entirely
`CheckAndCleanLogsFolder()` sets `MaxLogsFolderSizeBytes = 5 * 1024 * 1024`. When exceeded it does not roll off the oldest files — it **clears the whole directory**. Copy logs out promptly if you need to keep them.
:::

## Next steps

- [Main window](./mainwindow) — how `MainWindow` is split into partials
- [Settings system](./settings) — why settings are read twice during startup
- [Plugin lifecycle](../plugin/lifecycle) — where in the startup flow plugins get loaded
