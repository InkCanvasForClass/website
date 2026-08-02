---
title: Lifecycle
description: What a plugin goes through inside the host, from discovery to unload
---

# Lifecycle

<UnderConstruction />

The host-side implementation is concentrated in `Ink Canvas/Plugins/PluginManager.cs` (roughly 1,380 lines). Understanding this chain saves most of the time you'd otherwise spend investigating "why didn't my plugin load".

## Directory conventions

The `PluginManager` constructor builds every path in one go, based on `AppDomain.CurrentDomain.BaseDirectory` — **the program directory, not `%AppData%`**:

```csharp
var basePath = AppDomain.CurrentDomain.BaseDirectory;
_pluginsDirectory = Path.Combine(basePath, "Plugins");
_pluginPackagesDirectory = Path.Combine(basePath, "PluginPackages");
_pluginConfigsDirectory = Path.Combine(basePath, "PluginConfigs");
_disabledPluginsFile = Path.Combine(basePath, "Configs", "disabled_plugins.json");
_pluginLogsDirectory = Path.Combine(basePath, "PluginLogs");
```

| Directory | Purpose |
| --- | --- |
| `Plugins/` | Installed plugins, one subdirectory per plugin, with the folder name = the plugin Id |
| `PluginPackages/` | `.icpx` packages awaiting installation; scanned and extracted at startup |
| `PluginConfigs/` | Per-plugin configuration; not deleted automatically when a plugin is uninstalled |
| `PluginLogs/` | Plugin logs; this is where `PluginBase.Log()` writes |
| `Configs/disabled_plugins.json` | The list of plugin Ids the user has manually disabled |

## The full startup chain

1. **Clean up directories pending uninstall.** Plugin directories carrying a `.uninstall` marker file are deleted.
2. **Process installation packages.** Scan `PluginPackages/` for `.icpx` files and extract them into `Plugins/<Id>/`.
3. **Discover plugins** (`DiscoverPlugins()`). Walk each subdirectory of `Plugins/` and read its `manifest.json`.
4. **Validate compatibility** (`PluginCompatibility.Check`).
5. **Resolve load order** (`ResolveLoadOrder()`). Topological sort by dependencies.
6. **Load and `Initialize` each one.** Every plugin is loaded in its own `PluginLoadContext`.
7. **Build the DI container.** `BuildServiceProvider()` is only called after every plugin has finished `Initialize`.

::: warning The timing of step 7 matters a lot
`IPluginHost.ServiceProvider` is still empty throughout step 6. **Do not use `ServiceProvider` inside `Initialize` to fetch a service registered by another plugin** — the container hasn't been built yet. If you need one, defer the lookup until you actually use it.
:::

## Why uninstalling needs a .uninstall marker

Once a plugin dll has been loaded, the file is locked by the process and cannot be deleted while it runs. So uninstalling is a two-stage process:

1. The user clicks uninstall → the host writes an empty `.uninstall` file into the plugin directory
2. On the next start → `PluginManager` deletes the directories carrying that marker first

`DiscoverPlugins()` also skips marked directories:

```csharp
// 跳过标记为待卸载的插件
if (File.Exists(Path.Combine(subDir, ".uninstall")))
    continue;
```

So a restart is required after uninstalling for it to actually take effect. That's not a bug.

## How manifest parsing failures are handled

`DiscoverPlugins()` deserializes with `System.Text.Json`, and if any step doesn't hold up it skips that plugin **without interrupting the loading of the others**:

```csharp
manifest = JsonSerializer.Deserialize<PluginManifest>(manifestText);
if (manifest == null || string.IsNullOrEmpty(manifest.Id) || !IsValidPluginId(manifest.Id))
{
    // 记录并跳过
}
```

`IsValidPluginId` is the path-escape guard. `GetPluginPath()` validates once more and confirms the resolved result is still inside the `Plugins/` root:

```csharp
if (!IsValidPluginId(pluginId))
    throw new ArgumentException("Invalid plugin id.", nameof(pluginId));
```

An Id containing characters like `..`, `/`, or `\` is refused outright.

## Compatibility validation

`Ink Canvas/Plugins/PluginCompatibility.cs` performs two checks.

### MinHostVersion

```csharp
if (!IsVersionAtLeast(HostApiRequirement.MinSupportedHostVersion, manifest.MinHostVersion))
{
    return CompatibilityResult.Fail(
        $"插件要求宿主版本 ≥ {manifest.MinHostVersion}，当前宿主为 {HostApiRequirement.MinSupportedHostVersion}");
}
```

::: warning This does not compare against the actual host version
What gets compared is `HostApiRequirement.MinSupportedHostVersion` (the constant `"1.7.18"`), not `HostVersion` (the actual build version).

Which means: **a plugin that sets `MinHostVersion` higher than `1.7.18` will be refused, even if the host you're actually running is newer than that**. Put `1.7.18` in your manifest's `MinHostVersion` and don't raise it to track the host's real version.
:::

### ApiVersion

```csharp
if (Version.TryParse(NormalizeVersion(required), out var req)
    && Version.TryParse(NormalizeVersion(HostApiRequirement.CurrentApiVersion), out var cur))
```

The same major version counts as compatible. `CurrentApiVersion` is currently `1.0.0`, so any `1.x.x` passes.

## Load order and circular dependencies

`ResolveLoadOrder()` topologically sorts the `Dependencies` declared in `manifest.json` so that dependencies load first. When a cycle is detected, the `LoadStatus` of the plugins involved is marked rather than an exception being thrown.

`PluginDependencyResolver.cs` performs supplementary static checks; its comments spell out the scenarios it covers:

- Duplicate ids (the same directory scanned twice, or duplicate entries from the marketplace)
- Circular dependencies (the primary detection is in `PluginManager.ResolveLoadOrder`; this class is only supplementary)
- Version conflicts: plugin A requires dep 1.0.0 while plugin B requires dep 1.5.0 and both cannot be satisfied at once

When a dependency with `IsRequired = false` is missing, the plugin still loads, so your code has to null-check for it.

## Assembly isolation

Each plugin is loaded in its own `PluginLoadContext` (deriving from `AssemblyLoadContext`), so different plugins can ship different versions of a third-party library without clashing.

At the same time, `PluginManager` installs a resolving hook on the default context:

```csharp
AssemblyLoadContext.Default.Resolving += _defaultResolvingHandler;
```

```csharp
// net6 的 AssemblyLoadContext.Resolving 事件委托类型是 Func<AssemblyLoadContext, AssemblyName, Assembly>，
// 不能用更高版本 .NET 才存在的嵌套委托 ResolvingEventHandler 声明。
private readonly Func<AssemblyLoadContext, AssemblyName, Assembly> _defaultResolvingHandler;
```

The key consequence: **SDK types must come from the host's default context.** If a plugin package bundles its own `InkCanvas.PluginSdk.dll`, it gets loaded inside that plugin's own context as a *different* `IPlugin` type from the one the host expects, and the cast fails outright. That's why packaging strictly excludes the SDK assemblies.

## The Initialize and Shutdown contract

```csharp
public override void Initialize(IPluginHost host, IServiceCollection services)
{
    base.Initialize(host, services);   // 必须先调，否则 Host 为 null
    // 订阅事件、注册工具栏项、注册服务
}

public override void Shutdown()
{
    // 退订事件、注销热键、释放非托管资源
}
```

A few practical recommendations:

- **Don't do anything slow in `Initialize`.** It runs synchronously on the startup path, so whatever it costs is added to the whole application's startup time. Kick off a background task if you need to warm something up.
- **Throwing won't take the host down** — the exception is caught and logged, that plugin is marked as failed to load, and the others carry on. But that also means exceptions are easy to miss, so add your own `LogError` on the critical paths.
- **Always clean up symmetrically in `Shutdown`.** Unsubscribe events, call `IHotkeyService.Unregister`, call `ICanvasCompositionService.RemoveBackgroundLayer` — hotkeys are registered globally and stay occupied if you don't unregister them.

## Investigating a load failure

Check these in order:

1. Whether there is a log for the plugin under `PluginLogs/`
2. Search the main program's `Logs/` for `PluginCompatibility` or the plugin Id — compatibility rejections are recorded there
3. Whether it is disabled in `Configs/disabled_plugins.json`
4. Whether the plugin folder name matches the `Id` in `manifest.json`
5. Whether the dll named in `EntranceAssembly` actually exists in the directory

## Next steps

- [Packaging](./packaging) — the `.icpx` layout and CI validation
- [Debugging](./debugging) — breakpoints, logs, and common errors
