---
title: Quickstart
description: From an empty project to your first working plugin
---

# Quickstart

<HelpUsImprove />

## Create the project

```powershell
dotnet new classlib -n MyPlugin -f net6.0-windows10.0.19041.0
cd MyPlugin
dotnet add package InkCanvas.PluginSdk
```

Edit `MyPlugin.csproj` to add WPF support:

```xml
<PropertyGroup>
  <TargetFramework>net6.0-windows10.0.19041.0</TargetFramework>
  <UseWPF>true</UseWPF>
  <ImplicitUsings>disable</ImplicitUsings>
  <Nullable>disable</Nullable>
</PropertyGroup>
```

::: warning Do not bundle the SDK into your package
`InkCanvas.PluginSdk.dll` is provided by the host. If the plugin package ships its own copy, you may hit an `InvalidCastException` at runtime because the types come from two different assembly instances. The CI plugin build pipeline validates this and blocks it outright.

If you reference the SDK via `ProjectReference` rather than the NuGet package, remember to add `<Private>false</Private>`.
:::

## Write manifest.json

Create `manifest.json` in the project root:

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

`EntranceAssembly` must match your dll's file name. The `.targets` file that ships with the SDK copies `manifest.json` to the output directory automatically, so you don't need to configure `CopyToOutputDirectory` by hand.

## Write the entry class

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

Three key points:

1. **The `[PluginEntrance]` attribute.** `PluginManager` looks for a class carrying this attribute first when locating the entry point. It can still be found by scanning for `IPlugin` implementations without it, but the attribute is more explicit.
2. **Derive from `PluginBase` instead of implementing `IPlugin` directly.** `Id`/`Name`/`Version` are then read from `manifest.json` automatically, so you don't repeat them in code.
3. **Override the `Initialize` overload that takes `IServiceCollection`**, and call `base.Initialize(host, services)` on the first line — otherwise the `Host` property is null and neither `Log()` nor `GetService<T>()` works.

## Build and install

During development the quickest approach is to copy the output directory straight into the host's plugin folder:

```powershell
dotnet build
# 输出在 bin\Debug\net6.0-windows10.0.19041.0\

$dst = "<宿主程序目录>\Plugins\com.example.myplugin"
New-Item -ItemType Directory -Force $dst
Copy-Item "bin\Debug\net6.0-windows10.0.19041.0\*" $dst -Recurse -Force
```

::: tip The plugin folder name must equal the Id
`PluginManager` builds the plugin path and the config directory from the `Id` in `manifest.json`. A folder name that differs from `Id` will cause the config directory to be resolved incorrectly.
:::

Restart the host, and the plugin should appear on the plugins page in the settings. Toggling whiteboard mode once will pop up a notification.

## Package as .icpx for distribution

For real distribution you package it as an `.icpx` (which is essentially a zip). Once dropped into the host's `PluginPackages\` directory, the host extracts and installs it into `Plugins\` on its next start.

The required package layout is strict: only `manifest.json` + the entry dll + `deps.json` are allowed. See [Packaging](./packaging) for the details.

## Add a toolbar button

Register it in `Initialize`:

```csharp
host.RegisterToolbarItem(new PluginToolbarItemInfo
{
    Id = "com.example.myplugin.button",
    DisplayName = "我的工具",
    Description = "点击弹出面板",
    PopupContentFactory = () => new MyPanel()
});
```

Once you supply a `PopupContentFactory`, clicking the button automatically opens a flyout containing that content — you don't have to handle the click yourself. See [UI Integration](./ui-integration) for the full story.

## Debugging

Plugins run inside the host process, so the way to debug them is to **attach to the host process**:

1. Open the plugin project in Visual Studio
2. Debug → Attach to Process → pick `InkCanvasForClass.exe`
3. Set breakpoints in your plugin code

To break inside `Initialize` you need the host to wait for you, which you can arrange by temporarily adding:

```csharp
System.Diagnostics.Debugger.Launch();
```

More techniques in [Debugging](./debugging).

## Next steps

- [Manifest](./manifest) — every field of manifest.json
- [Lifecycle](./lifecycle) — load order and assembly isolation
- [Host Services](./host-services) — every service you can call
