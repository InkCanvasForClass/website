---
title: Debugging
description: Packaging-free debugging, log locations, and common load failures
---

# Debugging

<UnderConstruction />

You do not need to build an `.icpx` package over and over while developing. The host loads plugins straight from `Plugins/<Id>/`, so copying your build output into that folder is enough.

## Debugging without packaging

Copy the three output files into the plugin folder:

```
<program directory>\Plugins\myplugin\
├── manifest.json
├── MyPlugin.dll
└── MyPlugin.deps.json
```

The folder name must be exactly the `Id` from `manifest.json`, otherwise the folder is not scanned. Restart ICC-CE and the plugin is picked up.

You can automate the copy with an MSBuild target:

```xml
<Target Name="CopyToPlugins" AfterTargets="Build">
  <ItemGroup>
    <PluginFiles Include="$(TargetDir)manifest.json" />
    <PluginFiles Include="$(TargetDir)$(TargetName).dll" />
    <PluginFiles Include="$(TargetDir)$(TargetName).deps.json" />
  </ItemGroup>
  <Copy SourceFiles="@(PluginFiles)"
        DestinationFolder="D:\ICC-CE\Plugins\myplugin" />
</Target>
```

::: warning Note
After changing the dll you must restart the host. The file is locked while ICC-CE is running, and `UnloadPlugin()` only nulls the reference and calls `Dispose()` — it never calls `AssemblyLoadContext.Unload()`, so there is no hot reload. See [Lifecycle](./lifecycle#why-uninstalling-needs-a-uninstall-marker) for the details.
:::

## Attaching a debugger

**Method 1 — attach to the running process.** Attach your debugger to `InkCanvasForClass.exe`. You need a Debug build and the `.pdb` next to the dll for breakpoints to bind.

::: tip Note
The pdb is not part of the allow-list: an `.icpx` package may only contain the three files above. When debugging an unpackaged plugin you can still drop the pdb into the plugin folder — only `.icpx` contents are strictly validated.
:::

**Method 2 — break on startup.** Put this at the top of `Initialize` so the debugger picker appears as soon as the plugin loads:

```csharp
System.Diagnostics.Debugger.Launch();
```

## Logs

Plugin logs are written per plugin, per day:

```
<program directory>\PluginLogs\<PluginId>\<yyyy-MM-dd>.log
```

Each line looks like this:

```
[yyyy-MM-dd HH:mm:ss.fff] [LEVEL] [source] message
```

`LogError` appends the exception detail after the message.

::: tip Note
Your plugin receives a `PluginHostProxy`, not the `PluginManager` itself. That is why log calls are automatically namespaced into your own plugin's folder.
:::

Tail the log while testing:

```powershell
Get-Content ".\PluginLogs\myplugin\$(Get-Date -f yyyy-MM-dd).log" -Wait -Tail 20
```

### Host logs

Plugin **load** failures never reach the plugin log — the plugin was never initialised. Look in the host log instead; see [Build and Run](../getting-started/build-and-run) for its location.

## Investigating load failures

`PluginLoadStatus` tells you where a plugin stopped:

| Status | Meaning |
| --- | --- |
| `Loaded` | Loaded and initialised successfully |
| `NotLoaded` | Not loaded — for example the plugin is not enabled |
| `Failed` | Loading threw; read `LoadError` for the reason |
| `Incompatible` | The host does not satisfy the plugin's requirements |

### Common causes

- **`Incompatible`** — `MinHostVersion` in the manifest is higher than the running host version.
- **Cast failure, or "no `IPlugin` implementation found"** — `InkCanvas.PluginSdk.dll` was bundled into the package. Reference it with `<Private>False</Private>` so it is not copied. This is by far the most frequent cause, and CI has a dedicated check for it.
- **`FileNotFoundException`** — your plugin depends on a third-party library the host does not ship. See [Packaging](./packaging).
- **The plugin folder is never scanned** — the folder name does not match the manifest `Id`.
- **An `.icpx` refuses to install** — on failure the package is renamed and quarantined in `PluginPackages/`. Check the host log for the validation error.

## The plugin management UI

`Windows/SettingsViews/Pages/PluginPage.xaml` gives you:

- Open the plugin folder
- Apply an update / check for updates
- Delete a plugin
- Export / import plugin configuration

::: warning Note
There is no enable/disable button in the UI. `PluginManager` exposes `EnablePlugin()` and `DisablePlugin()`, but no UI call site exists. To disable a plugin temporarily, move its folder out of `Plugins/` and restart.
:::

## Next steps

- [Lifecycle](./lifecycle) — the full load and unload chain
- [Packaging](./packaging) — `.icpx` validation rules
- [Host Services](./host-services) — the service interfaces available to you
