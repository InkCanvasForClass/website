---
title: 打包与分发
description: .icpx 结构、CI 校验规则与自动发版
---

# 打包与分发

`.icpx` 就是个改了扩展名的 zip，里面**严格只允许三个文件**。这个限制不是建议，是 CI 和宿主都会强制校验的硬规则。

## 包结构

```
myplugin.icpx (zip)
├── manifest.json
├── MyPlugin.dll            ← manifest 里 EntranceAssembly 指定的那个
└── MyPlugin.deps.json      ← 入口 dll 同名的 deps.json
```

`.github/workflows/plugin-build.yml` 打包后会重新打开 zip 逐条比对，多一个少一个都直接 fail：

```powershell
$expected = @('manifest.json',
              $manifest.EntranceAssembly,
              "$($manifest.EntranceAssembly -replace '\.dll$','.deps.json')")
$unexpected = $entries | Where-Object { $_ -notin $expected }
if ($unexpected) { throw "包内出现意外条目：$($unexpected -join ', ')" }
$missing = $expected | Where-Object { $_ -notin $entries }
if ($missing) { throw "包内缺少条目：$($missing -join ', ')" }
```

工作流注释里写得很明确：「`.icpx` 必须只含这几个文件，多一个都可能被宿主插件校验拒绝。」

::: danger 第三方依赖不能打进包里
包里只能有入口 dll。如果你的插件引用了宿主没有的第三方库，那个库的 dll 装不进去，运行时会 `FileNotFoundException`。

可行的做法是把依赖代码合并进入口程序集（ILMerge / ILRepack），或者干脆不用外部依赖。宿主已有的库（Newtonsoft.Json、iNKORE UI 等）可以直接引用，只要保证 `Private=False` 不复制到输出。
:::

## 禁止出现的程序集

构建后有一道单独的校验，检查输出目录里有没有这四个文件：

```powershell
$forbidden = @(
  'WinRT.Runtime.dll',
  'Microsoft.Windows.SDK.NET.dll',
  'InkCanvas.PluginSdk.dll',
  'InkCanvas.Controls.dll'
)
foreach ($f in $forbidden) {
  if (Test-Path (Join-Path $outDir $f)) {
    throw "输出目录出现不应分发的程序集：$f"
  }
}
```

工作流注释解释了原因：「宿主已嵌入 WinRT 投影程序集，SDK/Controls 是 `Private=False`，这些不该出现在插件包里；出现即说明引用配置被改坏了。」

::: warning 为什么带上 SDK dll 会致命
这不只是「体积变大」的问题。每个插件在自己的 `PluginLoadContext` 里加载，如果包里有 `InkCanvas.PluginSdk.dll`，它会在插件的上下文里被加载成**另一个** `IPlugin` 类型。宿主拿到的对象与宿主期望的 `IPlugin` 不是同一个类型，转换直接失败，插件加载不起来。

详细机制见 [生命周期 — 程序集隔离](./lifecycle#程序集隔离)。

修复办法：检查 csproj，SDK 与 Controls 的 `PackageReference` / `ProjectReference` 必须带 `<Private>False</Private>`（或 `ExcludeAssets="runtime"`）。
:::

## 用 CI 构建（推荐）

`plugin-build.yml` 是 `workflow_call` 类型的共享工作流，插件仓库直接复用，不用自己写构建逻辑。它会自动从 community 仓库的 `net6` 分支构建最新 SDK 同步进插件的 `lib/`，所以**插件始终基于最新宿主 SDK 编译，不需要手动提交 DLL**。

插件仓库里建一个 `.github/workflows/build.yml`：

```yaml
jobs:
  build:
    uses: InkCanvasForClass/community/.github/workflows/plugin-build.yml@net6
    with:
      project: MyPlugin.csproj
      plugin_id: myplugin
      plugin_name: 我的插件
      plugin_description: 插件功能简介
      auto_release: true
```

### 全部参数

| 参数 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `project` | string | 是 | — | 入口 csproj 路径，相对插件仓库根目录 |
| `plugin_id` | string | 是 | — | 插件清单 Id，用于 artifact 与 Release 命名 |
| `plugin_name` | string | 否 | `""` | 显示名，Release 标题用 |
| `plugin_description` | string | 否 | `""` | 功能描述，Release 正文用 |
| `create_release` | boolean | 否 | `false` | 手动发版开关，配合 `release_tag` |
| `release_tag` | string | 否 | `""` | 显式指定要附加 `.icpx` 的 Release tag |
| `auto_release` | boolean | 否 | `false` | push 到 main 时按 manifest 版本号自动发版 |

### 构建产物在哪

工作流按顺序尝试两个目录：

```
bin/Release/net6.0-windows10.0.19041.0
bin/x64/Release/net6.0-windows10.0.19041.0
```

两个都不存在就报 `找不到构建输出目录`。如果你的 csproj 改过 `OutputPath` 或 TFM，CI 会直接失败。

## 自动发版

`auto_release: true` 时的判定逻辑（`Resolve release tag` 步骤）：

1. `release_tag` 非空则直接用它（手动发版优先）
2. 否则要求 `github.event_name == "push"` 且 `github.ref == "refs/heads/main"`
3. 读 `manifest.json` 的 `Version`，拼成 `v{Version}`
4. 用 `gh release view` 探测该 Release 是否已存在
5. 已存在 → 跳过；不存在 → 创建

所以**发版方式就是改 `manifest.json` 的 `Version` 然后推到 main**。同一个版本号重复推不会重复发版，整个流程是幂等的。

::: tip 一个 PowerShell 的坑，工作流里专门处理了
`gh release view` 在 Release 不存在时返回非零退出码，而 GitHub Actions 的 pwsh 包装器会把最后的 `$LASTEXITCODE` 当作步骤退出码。不复位的话，探测「不存在」这个正常分支会让整个步骤误报失败。

工作流里显式捕获并复位了：

```powershell
gh release view $candidate --repo "${{ github.repository }}" 2>$null | Out-Null
$probeCode = $LASTEXITCODE
$LASTEXITCODE = 0
```

自己写类似的探测逻辑时记得照做。
:::

Release 正文会自动带上 SHA256 与安装说明。`.icpx` 的 SHA256 由 `Get-FileHash` 计算并转小写，这个值和宿主安装时的信任评估（`IPluginHost.EvaluateTrust` 的 `expectedSha256` 参数）对应。

## 手动打包

本地临时测试时不必走 CI，`Release` 构建后手工组装：

```powershell
$out = "bin\Release\net6.0-windows10.0.19041.0"
$staging = "$env:TEMP\icpx_myplugin"
Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $staging | Out-Null
Copy-Item "$out\manifest.json","$out\MyPlugin.dll","$out\MyPlugin.deps.json" $staging
Compress-Archive "$staging\*" "myplugin.zip"
Rename-Item "myplugin.zip" "myplugin.icpx"
```

::: tip 调试时不用打包
把三个文件直接丢进 `<程序目录>\Plugins\<插件Id>\` 就能加载，跳过整个 `.icpx` 流程。见 [调试](./debugging)。
:::

## 用户如何安装

1. 把 `.icpx` 放进 `<程序目录>\PluginPackages\`
2. 重启 ICC-CE

启动时 `PluginManager.ProcessPluginPackages()` 会扫描这个目录，校验后解压到 `Plugins/<Id>/`。安装成功后 `.icpx` 会被删除；失败则改名隔离，便于排查。

安装前宿主会做一轮安全评估，`SecurityVerdict` 包含这些信息（`InkCanvas.PluginSdk/IPluginHost.cs`）：

```csharp
public class SecurityVerdict
{
    public string PluginId { get; set; }
    public PluginTrustLevel TrustLevel { get; set; }  // Unknown / Known / Trusted
    public string PackageSha256 { get; set; }
    public bool IsOnMarket { get; set; }
    public List<string> Permissions { get; }
    public List<string> Reasons { get; }
}
```

::: warning 目录名必须等于 manifest 的 Id
解压目标目录用的是 `manifest.json` 里的 `Id`。`Id` 会经过 `IsValidPluginId()` 校验（防路径逃逸），带 `..`、`/`、`\` 之类字符会被直接拒绝。
:::

## 下一步

- [清单文件](./manifest) — `manifest.json` 各字段含义
- [调试](./debugging) — 免打包调试与常见错误
- [生命周期](./lifecycle) — 安装、加载、卸载的完整链路
