---
title: 自动化系统
description: 触发器 / 行动 / 规则的注册与扩展
---

# 自动化系统

<UnderConstruction />

自动化是「触发器 + 规则 + 行动」的组合：某个事件发生（触发器），满足某些条件（规则），执行某些操作（行动）。代码在 `Automation\` 目录，60 个文件约 5265 行。

::: danger 命名空间不是 Ink_Canvas.Automation
目录叫 `Automation\`，但里面每个文件声明的命名空间都是 **`Ink_Canvas.WorkflowAutomation.*`**。

搜索代码时用 `WorkflowAutomation` 而不是目录名，`using` 也要写 `Ink_Canvas.WorkflowAutomation.Abstractions`。
:::

目录结构：

```txt
Automation/
├─ AutomationBootstrap.cs      221 行，整个系统的注册入口
├─ Abstractions/               基类、特性、服务接口
├─ Triggers/                   11 个触发器
├─ Actions/                    9 个行动的设置类
├─ ActionHandlers/             9 个行动的执行逻辑
├─ Rules/                      7 个规则
├─ Models/                     Workflow 等数据模型
├─ Services/                   AutomationService / SystemEventMonitor 等
├─ Enums/
└─ Extensions/                 AddTrigger / AddAction / AddRule 扩展方法
```

## 用的是真正的 DI 容器

这是整个代码库里少见的一处——自动化系统用 `Microsoft.Extensions.DependencyInjection`，不是全局单例那套：

```csharp
var services = new ServiceCollection();

services.AddSingleton<SystemEventMonitor>();
services.AddSingleton<IActionService, ActionService>();
services.AddSingleton<IRulesetService, RulesetService>();
```

`AutomationBootstrap.Initialize()` 的 11 个步骤按注释编号排列，顺序不能乱。

## 三种可扩展点

### 触发器

继承 `TriggerBase` 或 `TriggerBase<T>`（带强类型设置），加 `[TriggerInfo]` 特性，然后在 bootstrap 里注册。

基类只要求实现两个方法：

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

触发时调受保护的方法，而不是直接 `Invoke` 事件：

```csharp
protected void Trigger()          // 条件成立
protected void TriggerRevert()    // 条件恢复
```

`Trigger` / `TriggerRevert` 是 `protected`，对应的 `Triggered` / `TriggeredRecover` 事件是 `internal`——**只有框架能订阅，只有子类能触发**。

强类型设置版本有个值得注意的实现：

```csharp
protected T Settings => (SettingsInternal as T) ?? Activator.CreateInstance<T>();
```

::: warning Settings 每次访问都可能是新对象
`SettingsInternal` 类型不匹配或为 null 时，**每次访问 `Settings` 都会 new 一个新实例**。所以别指望 `Settings.SomeField = x` 能存下来，也别在循环里反复访问它。要用就先取到局部变量。
:::

特性带三个参数，第三个是图标（默认 `"ClockOutline"`）：

```csharp
public TriggerInfoAttribute(string id, string name, string iconKind = "ClockOutline")
```

内置的 11 个触发器：

| ID | 名称 |
| --- | --- |
| `inkcanvas.processdetected` | 进程检测 |
| `inkcanvas.pptslideshow` | PPT放映检测 |
| `inkcanvas.pptslideshowenter` | 进入PPT放映 |
| `inkcanvas.pptslideshowexit` | 退出PPT放映 |
| `inkcanvas.timer` | 定时触发 |
| `inkcanvas.windowfocuschanged` | 前台窗口变化 |
| `inkcanvas.annotationenter` | 进入批注模式 |
| `inkcanvas.annotationexit` | 退出批注模式 |
| `inkcanvas.whiteboardenter` | 进入白板模式 |
| `inkcanvas.whiteboardexit` | 退出白板模式 |
| `inkcanvas.rulesetchanged` | 规则集更新 |

::: warning 文件名 Ppt，类名 PPT
`Triggers\PptSlideShowTrigger.cs` 里的类叫 `PPTSlideShowTrigger`。文件名用 `Ppt`，类名用 `PPT`，大小写不一致。按文件名搜类名会搜不到。
:::

### 行动

行动分成两半：`Actions\` 放设置类，`ActionHandlers\` 放执行逻辑。注册也是分开的：

```csharp
services.AddAction<FoldActionSettings>("inkcanvas.fold", "折叠/展开工具栏", "DockBottom");
...
services.AddTransient<FoldActionHandler>();
```

Handler 注册成 `Transient`，但初始化时要**手动 Resolve 一次**才会生效：

```csharp
// 9. 初始化行动处理器（注册 Handle/RevertHandle 委托）
_serviceProvider.GetRequiredService<FoldActionHandler>();
```

::: danger 加了新 Handler 必须在第 9 步也加一行
Handler 的构造函数负责把自己的 `Handle` / `RevertHandle` 委托注册到全局 Registry。只在第 6 步 `AddTransient` 而忘了第 9 步的 `GetRequiredService`，这个行动**永远不会被执行，也不会报错**。

9 个 Handler 在两处各出现一次，加新的记得两边都加。
:::

内置 9 个行动：折叠/展开工具栏、结束进程、保存笔画、切换批注模式、清空笔画、显示通知、切换窗口置顶、重置桌面模式位置、重置PPT模式位置。

### 规则

规则最简单，是纯函数。注册设置类之后，把静态 `Evaluate` 方法登记进去：

```csharp
_rulesetService.RegisterRuleHandler("inkcanvas.processrunning", ProcessRunningRule.Evaluate);
```

内置 7 个：进程正在运行、窗口标题包含、批注模式、PPT放映中、前台窗口进程名、工具栏已折叠、前台窗口是 ICC-CE 白板。

同样，加新规则要在 `AddRule` 和 `RegisterRuleHandlers()` 两处都加。

## Registry 是进程级单例

`Initialize()` 的第 0 步解释了一个坑：

```csharp
// 0. 清空全局 Registry 中残留的 Handler / Rule，避免重新初始化时累加
// Registry 是进程级单例字典，DI Handler 是 Transient 每次 Resolve 产生新 lambda 引用，
// 单纯靠 delegate 引用判等无法在 lambda 场景下命中幂等检查；直接重置是最简单可靠的做法。
ClearGlobalRegistryHandlers();
```

`IActionService.Actions` 和 `IRulesetService.Rules` 是**接口上的静态字典**，不随 DI 容器销毁。重复初始化时 lambda 引用每次都不同，判重失效，所以只能先清空：

```csharp
foreach (var info in IActionService.Actions.Values)
{
    info.Handle = null;
    info.RevertHandle = null;
}
```

::: warning 静态字典 + DI 容器混用
这个设计意味着自动化系统**不能在同一进程里跑两套独立实例**。写测试时要注意状态会跨用例泄漏。
:::

## 失败会整体回滚

```csharp
catch
{
    // 任意步骤失败时整体回滚到未初始化状态，避免后续 AutomationBootstrap 调用走错误路径
    try { Shutdown(); } catch { }
    throw;
}
```

`Shutdown()` 会卸载所有工作流、释放服务和容器，并把 `_isInitialized` 置回 false 以允许重新初始化。**异常会往外抛**，不像项目里其他地方那样静默吞掉。

## 配置存哪

工作流配置在**程序目录下的 `Automations\`**：

```csharp
public static AutomationService Service => _service ??= new AutomationService(
    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Automations"),
    _serviceProvider);
```

注意这里用的是 `AppDomain.CurrentDomain.BaseDirectory`，而不是 `App.RootPath`——两者值相同，但写法不统一。

加载分两步：

```csharp
Service.RefreshConfigs();
Service.LoadConfig();
```

## 加一个新触发器的完整清单

1. 在 `Triggers\` 建类，继承 `TriggerBase` 或 `TriggerBase<T>`
2. 加 `[TriggerInfo("inkcanvas.xxx", "显示名", "图标名")]`
3. 实现 `Loaded()` 订阅事件、`UnLoaded()` 取消订阅
4. 条件成立时调 `Trigger()`
5. 在 `AutomationBootstrap.Initialize()` 第 3 步加 `services.AddTrigger<XxxTrigger>();`
6. 需要设置界面就做一个 `TriggerSettingsControlBase` 子类，挂到特性的 `SettingsControlType`

::: tip UnLoaded 必须真的取消订阅
`Loaded()` / `UnLoaded()` 会随工作流的启用/停用反复调用。`UnLoaded()` 里漏了 `-=`，用户反复开关同一条自动化就会造成重复触发和内存泄漏。
:::

## 下一步

- [设置系统](./settings) — `Settings.Automation` 的开关
- [PPT 联动](./ppt) — PPT 类触发器的事件来源
- [代码规范](./conventions) — 提交前的检查项
