---
title: 调试
description: 免打包调试、日志位置与常见加载失败原因
---

# 调试

调试插件不需要反复打 `.icpx`。宿主加载的是 `Plugins/<Id>/` 目录，把文件直接丢进去就行。

## 免打包调试

把构建输出的三个文件复制到插件目录：

```
<程序目录>\Plugins\myplugin\
├── manifest.json
├── MyPlugin.dll
└── MyPlugin.deps.json
```

目录名必须等于 `manifest.json` 里的 `Id`。重启 ICC-CE 即可加载。

更省事的做法是在 csproj 里加一条构建后复制：

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

::: warning 改完 dll 必须重启宿主
插件在 `PluginLoadContext` 里加载，宿主运行期间 dll 文件被占用，直接覆盖会失败。而且 `UnloadPlugin()` 只是把引用置空并调 `Dispose()`，**没有调用 `AssemblyLoadContext.Unload()`**，程序集不会真正卸载。所以没有热重载，改一次重启一次。

细节见 [生命周期 — 卸载](./lifecycle#卸载)。
:::

## 附加调试器

插件是 DLL，没法直接 F5 启动。两种办法：

**方式一：附加到进程。** 启动 ICC-CE，Visual Studio 里「调试 → 附加到进程」，选 `InkCanvasForClass.exe`。断点要能命中，得保证 `Plugins/` 目录里的 dll 是 Debug 构建且 pdb 在旁边。

::: tip pdb 不在允许清单里
`.icpx` 只允许三个文件，pdb 打不进包。但**免打包调试时可以手动把 pdb 复制进插件目录**，宿主不会拒绝目录里的额外文件（只有 `.icpx` 包内容有严格校验）。断点命中不了先检查 pdb 在不在。
:::

**方式二：在插件里等调试器。** 在 `Initialize` 开头插一句：

```csharp
System.Diagnostics.Debugger.Launch();
```

启动时会弹出调试器选择框，能抓到最早期的初始化逻辑。调完记得删掉。

## 日志

### 插件日志

`IPluginHost.Log()` / `LogError()` 写到独立于宿主主日志的文件：

```
<程序目录>\PluginLogs\<插件Id>\<yyyy-MM-dd>.log
```

每个插件一个目录，按天分文件。行格式：

```
[yyyy-MM-dd HH:mm:ss.fff] [LEVEL] [source] message
```

`LogError` 传了异常时，异常内容会追加在消息之后。

::: tip 插件拿到的不是 PluginManager 本体
`Initialize` 收到的 `IPluginHost` 是一个 `PluginHostProxy`，它记住了是哪个插件在调用，再把请求转给真正的实现。这就是日志能自动分目录的原因——你不用也没法指定自己的插件 Id。
:::

调试时开两个窗口跟日志：

```powershell
Get-Content ".\PluginLogs\myplugin\$(Get-Date -f yyyy-MM-dd).log" -Wait -Tail 20
```

### 宿主日志

插件加载失败的信息在宿主日志里，不在插件日志里——加载都失败了，插件日志目录可能还没建。宿主日志见 [构建与运行](../getting-started/build-and-run)。

## 加载失败排查

`PluginMetadata.LoadStatus` 记录了每个插件的状态，取值来自 `PluginLoadStatus` 枚举：

| 状态 | 含义 |
| --- | --- |
| `Loaded` | 加载成功 |
| `NotLoaded` | 未加载（未启用等） |
| `Failed` | 加载失败，看 `LoadError` |
| `Incompatible` | 与当前宿主版本不兼容 |

### 常见原因

**`Incompatible`：** `manifest.json` 的 `MinHostVersion` 高于当前宿主版本。改低或升级宿主。

**类型转换失败 / 找不到 `IPlugin` 实现：** 包里混进了 `InkCanvas.PluginSdk.dll`。SDK 会在插件的 `LoadContext` 里被加载成另一个类型，与宿主的 `IPlugin` 不是同一个类型。csproj 里给 SDK 引用加 `<Private>False</Private>`。这是最高频的失败原因，CI 专门有一道校验挡它。

**`FileNotFoundException`：** 引用了宿主没有的第三方库。`.icpx` 装不下额外 dll，见 [打包与分发](./packaging)。

**插件目录没被扫描：** 目录名和 `manifest.json` 的 `Id` 不一致。

**`.icpx` 装不上：** 安装失败时 `.icpx` 会被改名隔离而不是删除，看 `PluginPackages/` 目录里有没有被改名的文件，再去宿主日志里找原因。

## 插件管理界面

设置里的插件页面（`Windows/SettingsViews/Pages/PluginPage.xaml`）提供这些操作：

- 打开插件目录
- 应用更新 / 检查更新
- 删除插件
- 导出 / 导入插件配置

::: warning 界面上没有启用/禁用按钮
`PluginManager` 里有 `EnablePlugin()` / `DisablePlugin()` 方法，但本轮排查没有找到调用它们的 UI 入口。想临时停用一个插件，把它的目录从 `Plugins/` 移走再重启。
:::

## 下一步

- [生命周期](./lifecycle) — 加载与卸载的完整链路
- [打包与分发](./packaging) — `.icpx` 校验规则
- [宿主服务](./host-services) — 可用的服务接口
