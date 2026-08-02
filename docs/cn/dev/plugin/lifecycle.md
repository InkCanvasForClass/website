---
title: 生命周期
description: 从发现到卸载，插件在宿主里经历了什么
---

# 生命周期

<UnderConstruction />

宿主侧的实现集中在 `Ink Canvas/Plugins/PluginManager.cs`（约 1380 行）。理解这条链路能省掉大部分"插件为什么没加载"的排查时间。

## 目录约定

`PluginManager` 构造函数里一次性拼好全部路径，基准是 `AppDomain.CurrentDomain.BaseDirectory`——**程序目录，不是 `%AppData%`**：

```csharp
var basePath = AppDomain.CurrentDomain.BaseDirectory;
_pluginsDirectory = Path.Combine(basePath, "Plugins");
_pluginPackagesDirectory = Path.Combine(basePath, "PluginPackages");
_pluginConfigsDirectory = Path.Combine(basePath, "PluginConfigs");
_disabledPluginsFile = Path.Combine(basePath, "Configs", "disabled_plugins.json");
_pluginLogsDirectory = Path.Combine(basePath, "PluginLogs");
```

| 目录 | 用途 |
| --- | --- |
| `Plugins/` | 已安装插件，每个插件一个子目录，目录名 = 插件 Id |
| `PluginPackages/` | 待安装的 `.icpx` 包，启动时被扫描并解压 |
| `PluginConfigs/` | 各插件的配置，插件被卸载时不会自动删除 |
| `PluginLogs/` | 插件日志，`PluginBase.Log()` 写到这里 |
| `Configs/disabled_plugins.json` | 用户手工禁用的插件 Id 列表 |

## 启动时的完整链路

1. **清理待卸载目录**。带 `.uninstall` 标记文件的插件目录会被删除。
2. **处理安装包**。扫描 `PluginPackages/` 下的 `.icpx`，解压到 `Plugins/<Id>/`。
3. **发现插件**（`DiscoverPlugins()`）。遍历 `Plugins/` 各子目录，读 `manifest.json`。
4. **兼容性校验**（`PluginCompatibility.Check`）。
5. **解析加载顺序**（`ResolveLoadOrder()`）。按依赖做拓扑排序。
6. **逐个加载并 `Initialize`**。每个插件在自己的 `PluginLoadContext` 里加载。
7. **构建 DI 容器**。所有插件 `Initialize` 完成后才 `BuildServiceProvider()`。

::: warning 第 7 步的时序影响很大
`IPluginHost.ServiceProvider` 在第 6 步期间还是空的。**不要在 `Initialize` 里通过 `ServiceProvider` 取别的插件注册的服务**——那时容器还没建。要用就延迟到真正需要时再取。
:::

## 卸载为什么需要 .uninstall 标记

插件 dll 一旦被加载，文件就被进程锁定，运行期间删不掉。所以卸载流程是两段式：

1. 用户点卸载 → 宿主在插件目录写一个 `.uninstall` 空文件
2. 下次启动 → `PluginManager` 先删掉带这个标记的目录

`DiscoverPlugins()` 里也会跳过带标记的目录：

```csharp
// 跳过标记为待卸载的插件
if (File.Exists(Path.Combine(subDir, ".uninstall")))
    continue;
```

所以卸载后必须重启一次才真正生效，这不是 bug。

## 清单解析的失败处理

`DiscoverPlugins()` 用 `System.Text.Json` 反序列化，任何一步不满足就跳过这个插件，**不中断其他插件的加载**：

```csharp
manifest = JsonSerializer.Deserialize<PluginManifest>(manifestText);
if (manifest == null || string.IsNullOrEmpty(manifest.Id) || !IsValidPluginId(manifest.Id))
{
    // 记录并跳过
}
```

`IsValidPluginId` 是路径逃逸防护。`GetPluginPath()` 也会再校验一次并确认解析结果仍在 `Plugins/` 根目录内：

```csharp
if (!IsValidPluginId(pluginId))
    throw new ArgumentException("Invalid plugin id.", nameof(pluginId));
```

Id 里带 `..`、`/`、`\` 之类字符会被直接拒绝。

## 兼容性校验

`Ink Canvas/Plugins/PluginCompatibility.cs` 做两项检查。

### MinHostVersion

```csharp
if (!IsVersionAtLeast(HostApiRequirement.HostVersion, manifest.MinHostVersion))
{
    return CompatibilityResult.Fail(
        $"插件要求宿主版本 ≥ {manifest.MinHostVersion}，当前宿主为 {HostApiRequirement.HostVersion}");
}
```

::: warning 这里比较的是宿主构建版本和插件声明的最低宿主版本
这一步调用的是 `IsVersionAtLeast(string hostVersion, string requiredMinVersion)`，并把 `HostApiRequirement.HostVersion` 传给了第一个参数位，所以比较的是宿主的实际构建版本（由 Nerdbank.GitVersioning 生成）和插件清单里的 `MinHostVersion`。

因此实际生效的是：

- `HostApiRequirement.HostVersion` 作为比较基准；
- 只要插件清单里的 `MinHostVersion` 高于当前宿主构建版本，就会被拒绝加载；
- `MinHostVersion` 留空时会直接跳过检查；
- `MinHostVersion` 填入不可解析字符串时，代码会记录警告并 `return true`，也就是放行。
:::

### ApiVersion

```csharp
if (Version.TryParse(NormalizeVersion(required), out var req)
    && Version.TryParse(NormalizeVersion(HostApiRequirement.CurrentApiVersion), out var cur))
```

主版本号相同即视为兼容。当前 `CurrentApiVersion` 是 `1.1.0`，所以填 `1.x.x` 都能过。

## 加载顺序与循环依赖

`ResolveLoadOrder()` 对 `manifest.json` 里声明的 `Dependencies` 做拓扑排序，被依赖者先加载。检测到循环依赖时会标记相关插件的 `LoadStatus` 而不是抛异常。

`PluginDependencyResolver.cs` 做静态补充检查，它的注释说明了负责的场景：

- 重复 id（同一目录扫描两次，或市场提供重复条目）
- 循环依赖（主检测在 `PluginManager.ResolveLoadOrder`，本类只做补充）
- 版本冲突：插件 A 要求 dep 1.0.0，插件 B 要求 dep 1.5.0 且无法同时满足

`IsRequired = false` 的依赖缺失时插件仍会加载，代码里要自己判空。

## 程序集隔离

每个插件在独立的 `PluginLoadContext`（继承 `AssemblyLoadContext`）里加载，这样不同插件可以带不同版本的第三方库而不冲突。

同时 `PluginManager` 在默认上下文上挂了解析钩子：

```csharp
AssemblyLoadContext.Default.Resolving += _defaultResolvingHandler;
```

```csharp
// net6 的 AssemblyLoadContext.Resolving 事件委托类型是 Func<AssemblyLoadContext, AssemblyName, Assembly>，
// 不能用更高版本 .NET 才存在的嵌套委托 ResolvingEventHandler 声明。
private readonly Func<AssemblyLoadContext, AssemblyName, Assembly> _defaultResolvingHandler;
```

关键推论：**SDK 类型必须来自宿主的默认上下文**。如果插件包里自带 `InkCanvas.PluginSdk.dll`，它会在插件自己的上下文里被加载成另一个 `IPlugin` 类型，与宿主期望的类型不是同一个，转换直接失败。这就是打包时严格排除 SDK 程序集的原因。

## Initialize 与 Shutdown 的契约

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

几条实践建议：

- **`Initialize` 里别做耗时操作**。它在启动路径上同步执行，拖慢的是整个应用的启动时间。要预热就开后台任务。
- **抛异常不会拖垮宿主**，会被捕获记录、该插件标记为加载失败，其他插件照常。但也意味着异常容易被忽略，自己在关键路径上加 `LogError`。
- **`Shutdown` 里务必对称清理**。事件退订、`IHotkeyService.Unregister`、`ICanvasCompositionService.RemoveBackgroundLayer` 都要做——热键是全局注册的，不注销会一直占用。

## 排查加载失败

按顺序看这几处：

1. `PluginLogs/` 下有没有对应插件的日志
2. 主程序 `Logs/` 里搜 `PluginCompatibility` 或插件 Id，兼容性拒绝会记在这
3. `Configs/disabled_plugins.json` 里是不是被禁用了
4. 插件目录名与 `manifest.json` 的 `Id` 是否一致
5. `EntranceAssembly` 写的 dll 名是否真的存在于目录里

## 下一步

- [打包与分发](./packaging) — `.icpx` 结构与 CI 校验
- [调试](./debugging) — 断点、日志、常见错误
