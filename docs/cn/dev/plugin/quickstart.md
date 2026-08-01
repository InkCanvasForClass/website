---
title: 快速上手
description: 从空项目到能跑起来的第一个插件
---

# 快速上手

## 建项目

```powershell
dotnet new classlib -n MyPlugin -f net6.0-windows10.0.19041.0
cd MyPlugin
dotnet add package InkCanvas.PluginSdk
```

改 `MyPlugin.csproj`，补上 WPF 支持：

```xml
<PropertyGroup>
  <TargetFramework>net6.0-windows10.0.19041.0</TargetFramework>
  <UseWPF>true</UseWPF>
  <ImplicitUsings>disable</ImplicitUsings>
  <Nullable>disable</Nullable>
</PropertyGroup>
```

::: warning 不要把 SDK 打进包里
`InkCanvas.PluginSdk.dll` 由宿主提供。如果插件包里也带一份，运行时可能因为类型来自两个不同的程序集实例而报 `InvalidCastException`。CI 的插件构建流水线会直接校验并拦截这种情况。

如果你用 `ProjectReference` 而非 NuGet 包引用 SDK，记得加 `<Private>false</Private>`。
:::

## 写 manifest.json

在项目根目录新建 `manifest.json`：

```json
{
  "Id": "com.example.myplugin",
  "Name": "我的插件",
  "Version": "1.0.0",
  "Description": "第一个插件",
  "Author": "你的名字",
  "EntranceAssembly": "MyPlugin.dll",
  "ApiVersion": "1.0.0",
  "MinHostVersion": "1.7.18"
}
```

`EntranceAssembly` 必须和你的 dll 文件名一致。SDK 附带的 `.targets` 会自动把 `manifest.json` 复制到输出目录，不用手工配 `CopyToOutputDirectory`。

## 写入口类

```csharp
using Ink_Canvas.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace MyPlugin
{
    [PluginEntrance]
    public class MyPlugin : PluginBase
    {
        private IEventService _events;

        public override void Initialize(IPluginHost host, IServiceCollection services)
        {
            base.Initialize(host, services);

            _events = GetService<IEventService>();
            if (_events != null)
                _events.WhiteboardModeChanged += OnWhiteboardModeChanged;

            Log("MyPlugin 初始化完成");
        }

        private void OnWhiteboardModeChanged(bool isWhiteboard)
        {
            GetService<INotificationService>()?.Show(
                "MyPlugin",
                isWhiteboard ? "进入白板" : "退出白板",
                NotificationLevel.Info);
        }

        public override void Shutdown()
        {
            if (_events != null)
                _events.WhiteboardModeChanged -= OnWhiteboardModeChanged;
        }
    }
}
```

三个要点：

1. **`[PluginEntrance]` 特性**。`PluginManager` 会优先查找带这个特性的类作为入口。不加也能通过扫描 `IPlugin` 实现类找到，但加上更明确。
2. **继承 `PluginBase` 而不是直接实现 `IPlugin`**。`Id`/`Name`/`Version` 会自动从 `manifest.json` 读取，不用在代码里重复一遍。
3. **重写带 `IServiceCollection` 的 `Initialize` 重载**，并且第一行调 `base.Initialize(host, services)`——否则 `Host` 属性为 null，`Log()` 和 `GetService<T>()` 都不工作。

## 构建并安装

调试期最快的方式是直接把输出目录内容复制到宿主的插件目录：

```powershell
dotnet build
# 输出在 bin\Debug\net6.0-windows10.0.19041.0\

$dst = "<宿主程序目录>\Plugins\com.example.myplugin"
New-Item -ItemType Directory -Force $dst
Copy-Item "bin\Debug\net6.0-windows10.0.19041.0\*" $dst -Recurse -Force
```

::: tip 插件目录名要等于 Id
`PluginManager` 用 `manifest.json` 里的 `Id` 拼接插件路径与配置目录。目录名与 `Id` 不一致会导致定位配置目录出错。
:::

重启宿主，在设置的插件页面应该能看到「我的插件」。切换一次白板模式会弹出通知。

## 打成 .icpx 分发

正式分发要打成 `.icpx` 包（本质是 zip）。放进宿主的 `PluginPackages\` 目录后，宿主下次启动时会自动解压安装到 `Plugins\`。

包内结构要求很严格，只允许 `manifest.json` + 入口 dll + `deps.json`。细节见 [打包与分发](./packaging)。

## 加一个工具栏按钮

在 `Initialize` 里注册：

```csharp
host.RegisterToolbarItem(new PluginToolbarItemInfo
{
    Id = "com.example.myplugin.button",
    DisplayName = "我的工具",
    Description = "点击弹出面板",
    PopupContentFactory = () => new MyPanel()
});
```

给了 `PopupContentFactory` 之后，点击按钮会自动弹出包含该内容的浮层，不需要自己处理点击。完整说明见 [UI 集成](./ui-integration)。

## 调试

插件跑在宿主进程内，所以调试方式是**附加到宿主进程**：

1. 用 Visual Studio 打开插件项目
2. 调试 → 附加到进程 → 选 `InkCanvasForClass.exe`
3. 在插件代码里下断点

要断在 `Initialize` 上就得让宿主等你，可以临时加一句：

```csharp
System.Diagnostics.Debugger.Launch();
```

更多技巧见 [调试](./debugging)。

## 下一步

- [清单文件](./manifest) — manifest.json 全部字段
- [生命周期](./lifecycle) — 加载顺序与程序集隔离
- [宿主服务](./host-services) — 能调用的全部服务
