---
title: Packaging
description: The .icpx layout, CI validation rules, and automated releases
---

# Packaging

<UnderConstruction />

An `.icpx` is just a zip with a different extension, and **exactly three files are allowed inside**. That restriction isn't a suggestion; it's a hard rule enforced by both CI and the host.

## Package layout

```
myplugin.icpx (zip)
├── manifest.json
├── MyPlugin.dll            ← the one named by EntranceAssembly in the manifest
└── MyPlugin.deps.json      ← the deps.json matching the entry dll's name
```

After packaging, `.github/workflows/plugin-build.yml` reopens the zip and compares entry by entry; one file too many or too few fails the build outright:

```powershell
$expected = @('manifest.json',
              $manifest.EntranceAssembly,
              "$($manifest.EntranceAssembly -replace '\.dll$','.deps.json')")
$unexpected = $entries | Where-Object { $_ -notin $expected }
if ($unexpected) { throw "包内出现意外条目：$($unexpected -join ', ')" }
$missing = $expected | Where-Object { $_ -notin $entries }
if ($missing) { throw "包内缺少条目：$($missing -join ', ')" }
```

The workflow comment spells it out: an `.icpx` must contain only these files, and even one extra may get the package rejected by the host's plugin validation.

::: danger Third-party dependencies cannot go into the package
Only the entry dll is allowed. If your plugin references a third-party library the host doesn't have, that library's dll cannot be installed and you get a `FileNotFoundException` at runtime.

A workable approach is to merge the dependency's code into the entry assembly (ILMerge / ILRepack), or to avoid external dependencies altogether. Libraries the host already has (Newtonsoft.Json, the iNKORE UI stack, etc.) can be referenced directly, as long as you keep `Private=False` so they aren't copied to the output.
:::

## Assemblies that must not appear

There is a separate post-build check for these four files in the output directory:

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

The workflow comment explains why: the host already embeds the WinRT projection assemblies, and SDK/Controls are `Private=False`, so none of these belong in a plugin package — their presence means the reference configuration has been broken.

::: warning Why shipping the SDK dll is fatal
This isn't merely a "the package got bigger" problem. Each plugin is loaded in its own `PluginLoadContext`, so if the package contains `InkCanvas.PluginSdk.dll`, that assembly gets loaded inside the plugin's context as **a different** `IPlugin` type. The object the host receives is not the same type as the `IPlugin` it expects, the cast fails outright, and the plugin never loads.

For the detailed mechanism, see [Lifecycle — Assembly isolation](./lifecycle#assembly-isolation).

The fix: check your csproj — the `PackageReference` / `ProjectReference` for SDK and Controls must carry `<Private>False</Private>` (or `ExcludeAssets="runtime"`).
:::

## Building with CI (recommended)

`plugin-build.yml` is a shared `workflow_call` workflow that plugin repositories reuse directly instead of writing their own build logic. It automatically builds the latest SDK from the community repository's `net6` branch and syncs it into the plugin's `lib/`, so **plugins are always compiled against the newest host SDK with no need to commit DLLs by hand**.

Create a `.github/workflows/build.yml` in your plugin repository:

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

### All parameters

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `project` | string | yes | — | Path to the entry csproj, relative to the plugin repository root |
| `plugin_id` | string | yes | — | The manifest Id, used for artifact and release naming |
| `plugin_name` | string | no | `""` | Display name, used in the release title |
| `plugin_description` | string | no | `""` | Feature description, used in the release body |
| `create_release` | boolean | no | `false` | Manual release switch, used with `release_tag` |
| `release_tag` | string | no | `""` | Explicitly names the release tag to attach the `.icpx` to |
| `auto_release` | boolean | no | `false` | On push to main, releases automatically based on the manifest version |

### Where the build output goes

The workflow tries two directories in order:

```
bin/Release/net6.0-windows10.0.19041.0
bin/x64/Release/net6.0-windows10.0.19041.0
```

If neither exists it reports `找不到构建输出目录`. If your csproj has changed `OutputPath` or the TFM, CI will fail outright.

## Automated releases

The decision logic when `auto_release: true` (the `Resolve release tag` step):

1. If `release_tag` is non-empty, use it directly (manual release wins)
2. Otherwise require `github.event_name == "push"` and `github.ref == "refs/heads/main"`
3. Read `Version` from `manifest.json` and form `v{Version}`
4. Probe with `gh release view` to see whether that release already exists
5. If it exists → skip; if not → create it

So **the way to publish is to change `Version` in `manifest.json` and push to main**. Pushing the same version again does not create a duplicate release; the whole flow is idempotent.

::: tip A PowerShell pitfall the workflow handles explicitly
`gh release view` returns a non-zero exit code when the release doesn't exist, and the pwsh wrapper in GitHub Actions treats the final `$LASTEXITCODE` as the step's exit code. Without resetting it, the perfectly normal "doesn't exist" branch of the probe makes the whole step report a false failure.

The workflow captures and resets it explicitly:

```powershell
gh release view $candidate --repo "${{ github.repository }}" 2>$null | Out-Null
$probeCode = $LASTEXITCODE
$LASTEXITCODE = 0
```

Remember to do the same when writing similar probe logic yourself.
:::

The release body automatically includes the SHA256 and installation instructions. The `.icpx`'s SHA256 is computed with `Get-FileHash` and lowercased; this value corresponds to the trust evaluation performed at install time (the `expectedSha256` parameter of `IPluginHost.EvaluateTrust`).

## Manual packaging

For quick local testing you don't need CI; assemble it by hand after a `Release` build:

```powershell
$out = "bin\Release\net6.0-windows10.0.19041.0"
$staging = "$env:TEMP\icpx_myplugin"
Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $staging | Out-Null
Copy-Item "$out\manifest.json","$out\MyPlugin.dll","$out\MyPlugin.deps.json" $staging
Compress-Archive "$staging\*" "myplugin.zip"
Rename-Item "myplugin.zip" "myplugin.icpx"
```

::: tip No packaging needed while debugging
Dropping the three files straight into `<program directory>\Plugins\<PluginId>\` is enough to load them, skipping the whole `.icpx` flow. See [Debugging](./debugging).
:::

## How users install it

1. Put the `.icpx` into `<program directory>\PluginPackages\`
2. Restart ICC-CE

At startup, `PluginManager.ProcessPluginPackages()` scans that directory, validates each package, and extracts it into `Plugins/<Id>/`. On success the `.icpx` is deleted; on failure it is renamed and quarantined to help with investigation.

Before installing, the host performs a round of security evaluation. `SecurityVerdict` carries this information (`InkCanvas.PluginSdk/IPluginHost.cs`):

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

::: warning The folder name must equal the manifest's Id
The extraction target directory is taken from the `Id` in `manifest.json`. That `Id` goes through `IsValidPluginId()` validation (to prevent path escapes), and characters like `..`, `/`, or `\` are refused outright.
:::

## Next steps

- [Manifest](./manifest) — what each `manifest.json` field means
- [Debugging](./debugging) — packaging-free debugging and common errors
- [Lifecycle](./lifecycle) — the full install, load, and uninstall chain
