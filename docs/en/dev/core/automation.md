---
title: Automation
description: Registering and extending triggers, actions, and rules
---

# Automation

<UnderConstruction />

Automation is a combination of "trigger + rule + action": some event happens (trigger), certain conditions are met (rule), and certain operations are performed (action). The code lives in the `Automation\` directory — 60 files, roughly 5,265 lines.

::: danger The namespace is not Ink_Canvas.Automation
The directory is called `Automation\`, but every file inside declares the namespace **`Ink_Canvas.WorkflowAutomation.*`**.

When searching the code, use `WorkflowAutomation` rather than the directory name, and write your `using` as `Ink_Canvas.WorkflowAutomation.Abstractions`.
:::

Directory layout:

```
Automation/
├─ AutomationBootstrap.cs      221 lines, the registration entry point for the whole system
├─ Abstractions/               base classes, attributes, service interfaces
├─ Triggers/                   11 triggers
├─ Actions/                    settings classes for the 9 actions
├─ ActionHandlers/             execution logic for the 9 actions
├─ Rules/                      7 rules
├─ Models/                     Workflow and other data models
├─ Services/                   AutomationService / SystemEventMonitor, etc.
├─ Enums/
└─ Extensions/                 the AddTrigger / AddAction / AddRule extension methods
```

## It uses a real DI container

This is one of the rare spots in the whole codebase — the automation system uses `Microsoft.Extensions.DependencyInjection` instead of the usual global-singleton approach:

```csharp
var services = new ServiceCollection();

services.AddSingleton<SystemEventMonitor>();
services.AddSingleton<IActionService, ActionService>();
services.AddSingleton<IRulesetService, RulesetService>();
```

The 11 steps of `AutomationBootstrap.Initialize()` are laid out in the numbered order of their comments, and that order must not be changed.

## Three extension points

### Triggers

Derive from `TriggerBase` or `TriggerBase<T>` (the latter carries strongly-typed settings), add the `[TriggerInfo]` attribute, then register it in the bootstrap.

The base class only requires two methods to be implemented:

```csharp
/// <summary>
/// 当此触发器被加载到工作流上时，调用此方法。
/// </summary>
public abstract void Loaded();

/// <summary>
/// 当此触发器被从工作流上卸载时，调用此方法。
/// </summary>
public abstract void UnLoaded();
```

To fire, call the protected methods rather than `Invoke`-ing the events directly:

```csharp
protected void Trigger()          // condition met
protected void TriggerRevert()    // condition restored
```

`Trigger` / `TriggerRevert` are `protected` while the corresponding `Triggered` / `TriggeredRecover` events are `internal` — **only the framework can subscribe, and only subclasses can fire**.

The strongly-typed settings version has one implementation detail worth noting:

```csharp
protected T Settings => (SettingsInternal as T) ?? Activator.CreateInstance<T>();
```

::: warning Settings may be a new object on every access
When `SettingsInternal` has a mismatched type or is null, **every access to `Settings` news up a fresh instance**. So don't expect `Settings.SomeField = x` to persist, and don't access it repeatedly inside a loop. Grab it into a local variable first.
:::

The attribute takes three parameters; the third is the icon (default `"ClockOutline"`):

```csharp
public TriggerInfoAttribute(string id, string name, string iconKind = "ClockOutline")
```

The 11 built-in triggers:

| ID | Name |
| --- | --- |
| `inkcanvas.processdetected` | Process detected |
| `inkcanvas.pptslideshow` | PowerPoint slideshow detected |
| `inkcanvas.pptslideshowenter` | Slideshow entered |
| `inkcanvas.pptslideshowexit` | Slideshow exited |
| `inkcanvas.timer` | Timer |
| `inkcanvas.windowfocuschanged` | Foreground window changed |
| `inkcanvas.annotationenter` | Annotation mode entered |
| `inkcanvas.annotationexit` | Annotation mode exited |
| `inkcanvas.whiteboardenter` | Whiteboard mode entered |
| `inkcanvas.whiteboardexit` | Whiteboard mode exited |
| `inkcanvas.rulesetchanged` | Ruleset updated |

::: warning File name says Ppt, class name says PPT
The class inside `Triggers\PptSlideShowTrigger.cs` is called `PPTSlideShowTrigger`. The file name uses `Ppt` while the class name uses `PPT`, so the casing does not match — searching for the class name by file name will come up empty.
:::

### Actions

An action is split in two: `Actions\` holds the settings class and `ActionHandlers\` holds the execution logic. Registration is likewise split:

```csharp
services.AddAction<FoldActionSettings>("inkcanvas.fold", "折叠/展开工具栏", "DockBottom");
...
services.AddTransient<FoldActionHandler>();
```

Handlers are registered as `Transient`, but they only take effect if you **manually resolve one once** during initialization:

```csharp
// 9. 初始化行动处理器（注册 Handle/RevertHandle 委托）
_serviceProvider.GetRequiredService<FoldActionHandler>();
```

::: danger A new handler must also be added to step 9
The handler's constructor is what registers its own `Handle` / `RevertHandle` delegates into the global registry. If you only `AddTransient` it in step 6 and forget the `GetRequiredService` in step 9, that action **will never execute, and will never report an error**.

Each of the 9 handlers appears once in each of the two places — remember to add yours in both.
:::

The 9 built-in actions: fold/unfold the toolbar, kill a process, save strokes, toggle annotation mode, clear strokes, show a notification, toggle window topmost, reset the desktop-mode position, and reset the PowerPoint-mode position.

### Rules

Rules are the simplest — they are pure functions. After registering the settings class, register the static `Evaluate` method:

```csharp
_rulesetService.RegisterRuleHandler("inkcanvas.processrunning", ProcessRunningRule.Evaluate);
```

There are 7 built in: process is running, window title contains, annotation mode, slideshow in progress, foreground window process name, toolbar is folded, and foreground window is the ICC-CE whiteboard.

Again, adding a new rule requires touching both `AddRule` and `RegisterRuleHandlers()`.

## The registry is a process-wide singleton

Step 0 of `Initialize()` explains one pitfall:

```csharp
// 0. 清空全局 Registry 中残留的 Handler / Rule，避免重新初始化时累加
// Registry 是进程级单例字典，DI Handler 是 Transient 每次 Resolve 产生新 lambda 引用，
// 单纯靠 delegate 引用判等无法在 lambda 场景下命中幂等检查；直接重置是最简单可靠的做法。
ClearGlobalRegistryHandlers();
```

`IActionService.Actions` and `IRulesetService.Rules` are **static dictionaries on the interfaces**, so they do not go away when the DI container is disposed. On re-initialization the lambda references differ every time, which defeats deduplication — hence they must simply be cleared first:

```csharp
foreach (var info in IActionService.Actions.Values)
{
    info.Handle = null;
    info.RevertHandle = null;
}
```

::: warning Static dictionaries mixed with a DI container
This design means the automation system **cannot run two independent instances in the same process**. Keep in mind when writing tests that state leaks across test cases.
:::

## A failure rolls everything back

```csharp
catch
{
    // 任意步骤失败时整体回滚到未初始化状态，避免后续 AutomationBootstrap 调用走错误路径
    try { Shutdown(); } catch { }
    throw;
}
```

`Shutdown()` unloads every workflow, releases the services and the container, and sets `_isInitialized` back to false so that re-initialization is possible. **The exception is rethrown** — unlike many other places in the project, it is not swallowed silently.

## Where the configuration is stored

Workflow configuration lives in **`Automations\` under the program directory**:

```csharp
public static AutomationService Service => _service ??= new AutomationService(
    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Automations"),
    _serviceProvider);
```

Note that this uses `AppDomain.CurrentDomain.BaseDirectory` rather than `App.RootPath` — the two evaluate to the same value, but the style is inconsistent.

Loading happens in two steps:

```csharp
Service.RefreshConfigs();
Service.LoadConfig();
```

## Full checklist for adding a new trigger

1. Create a class under `Triggers\` deriving from `TriggerBase` or `TriggerBase<T>`
2. Add `[TriggerInfo("inkcanvas.xxx", "Display name", "IconName")]`
3. Implement `Loaded()` to subscribe to events and `UnLoaded()` to unsubscribe
4. Call `Trigger()` when the condition is met
5. Add `services.AddTrigger<XxxTrigger>();` to step 3 of `AutomationBootstrap.Initialize()`
6. If you need a settings UI, create a `TriggerSettingsControlBase` subclass and wire it to the attribute's `SettingsControlType`

::: tip UnLoaded must genuinely unsubscribe
`Loaded()` / `UnLoaded()` are called repeatedly as the workflow is enabled and disabled. If you miss a `-=` in `UnLoaded()`, a user toggling the same automation on and off will cause duplicate triggering and memory leaks.
:::

## Next steps

- [Settings System](./settings) — the `Settings.Automation` switches
- [PowerPoint Integration](./ppt) — the event source behind the PowerPoint triggers
- [Code Conventions](./conventions) — what to check before committing
