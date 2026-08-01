---
title: 插件概览
description: 插件能做什么，边界在哪
---

# 插件概览

插件是独立编译的 .NET 程序集，被主程序在启动时发现、加载并初始化。插件运行在主程序进程内，通过 `IPluginHost` 提供的服务与宿主交互。

## 插件能做什么

| 能力 | 用到的接口 |
| --- | --- |
| 在工具栏加一个按钮，点击弹出自己的面板 | `IPluginHost.RegisterToolbarItem` |
| 提供一个主视图 / 设置页 | `IPlugin.GetMainView()` / `GetSettingsView()` |
| 读写主程序设置 | `ISettingsService` |
| 订阅白板模式切换、PPT 翻页等事件 | `IEventService` |
| 发应用内通知 | `INotificationService` |
| 注册全局热键 | `IHotkeyService` |
| 控制窗口置顶、收纳、进出白板 | `IWindowService` |
| 控制 PPT 放映与翻页 | `IPowerPointService` |
| 往画布下方注入背景层，做 PDF 阅读器这类功能 | `ICanvasCompositionService` |
| 接管画布双指手势 | `IPluginCanvasGestureHandler` |
| 与其他插件/外部进程通信 | `IPluginIpcBus` |
| 注册文件类型关联 | `IFileAssociationService` |
| 重启应用（含提权重启） | `IAppRestartService` |
| 注册自己的服务供其他插件使用 | `IPluginHost.Services`（DI 容器） |

## 插件不能做什么

- **不能直接访问 `MainWindow`**。SDK 没有暴露主窗口类型，插件只能通过服务接口间接操作。这是有意为之，避免插件依赖内部实现。
- **不能阻止宿主启动**。插件初始化抛异常会被捕获并记录，宿主继续启动，该插件被标记为加载失败。
- **不能自带 SDK 程序集**。`InkCanvas.PluginSdk.dll` 和 `InkCanvas.Controls.dll` 由宿主提供，插件包里带上会被 CI 校验拦截，运行时也可能引发类型冲突。
- **没有权限沙箱**。`manifest.json` 里的 `Permissions` 字段只用于安装时向用户提示，运行时不做强制限制。插件与宿主同进程、同权限——这一点在安装第三方插件时要注意。

## 一个最小插件

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

加上一个 `manifest.json`，编译，打包成 `.icpx`，放进 `PluginPackages/` 目录，重启主程序即可。完整步骤见 [快速上手](./quickstart)。

## 核心概念

### IPlugin 与 PluginBase

`IPlugin` 是插件契约：

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

实际开发中**不要直接实现 `IPlugin`**，而是继承 `PluginBase`。它把 `Id`/`Name`/`Version` 等属性默认转发到 `Manifest`，你只需要维护 `manifest.json` 一处：

```csharp
public virtual string Id => Manifest?.Id ?? "";
public virtual string Name => Manifest?.Name ?? "";
```

`PluginBase` 还提供了 `Log()`、`LogError()`、`GetService<T>()` 三个便捷方法，以及 `PluginFolder`、`PluginConfigFolder` 两个路径属性。

### 两个 Initialize 重载

`PluginBase` 有两个 `Initialize`：

```csharp
// 旧签名，向后兼容
public virtual void Initialize(IPluginHost host)

// 新签名，支持 DI 服务注册。新插件应重写这个
public virtual void Initialize(IPluginHost host, IServiceCollection services)
```

宿主实际调用的是显式实现，它会转发到新签名：

```csharp
void IPlugin.Initialize(IPluginHost host)
{
    Initialize(host, host.Services);
}
```

**新插件重写带 `IServiceCollection` 的那个**，这样才能向 DI 容器注册服务。

### 注意 GetMainView 返回 object

```csharp
object GetMainView();
object GetSettingsView();
```

返回类型是 `object` 而不是 `FrameworkElement`。实际使用时返回 WPF 的 `UserControl` 即可，宿主会做类型转换。这个设计是为了让 SDK 在理论上不绑定 WPF，但 SDK 本身已经 `UseWPF=true` 并在别处引用了 `FrameworkElement`，所以这层抽象意义有限——照常返回 WPF 控件就行。

## 版本兼容

宿主在 `HostApiRequirement` 里声明兼容边界：

```csharp
public static readonly string CurrentApiVersion = "1.0.0";      // 主版本相同即兼容
public static readonly string MinSupportedHostVersion = "1.7.18"; // 低于此版本的插件被拒绝
public const string HostVersion = ThisAssembly.AssemblyFileVersion;
```

插件在 `manifest.json` 里声明 `ApiVersion` 和 `MinHostVersion`，加载前会做校验。详见 [生命周期](./lifecycle)。

## 下一步

- [快速上手](./quickstart) — 动手写第一个插件
- [清单文件](./manifest) — manifest.json 完整字段
- [宿主服务](./host-services) — 13 个服务接口详解
