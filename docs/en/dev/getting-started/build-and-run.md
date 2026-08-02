---
title: Build and Run
description: Compiling, versioning, CI, and packaging
---

# Build and Run

<UnderConstruction />

## Local build

### Command line

```powershell
cd community
dotnet restore "Ink Canvas.sln"
dotnet build "Ink Canvas.sln" -c Debug
```

Build only the main application:

```powershell
dotnet build "Ink Canvas/InkCanvasForClass.csproj" -c Debug
```

### Choosing a platform

The main application declares the platforms `AnyCPU;x86;x64`, and its RuntimeIdentifiers cover `win-x86;win-x64;win-arm64`.

::: warning The ARM64 catch
`RuntimeIdentifiers` includes `win-arm64` and the csproj has `Debug|ARM64` / `Release|ARM64` PropertyGroups, but `<Platforms>` only lists `AnyCPU;x86;x64` — ARM64 is not actually a selectable platform. In the solution configuration, ARM64 is mapped to `Any CPU`. If you want a native ARM64 build, you need to add it to `<Platforms>` first.
:::

### Package locking

The main application enables `RestorePackagesWithLockFile` and ships a `packages.lock.json`. If you add or remove NuGet packages, commit the updated lock file. CI restores with `--locked-mode`, and an out-of-date lock file fails the build outright.

## Versioning

Version numbers are managed centrally by [Nerdbank.GitVersioning](https://github.com/dotnet/Nerdbank.GitVersioning) (NBGV). **Do not edit AssemblyInfo by hand.**

`Directory.Build.props` injects NBGV 3.9.50 into every project in the repository:

```xml
<PackageReference Include="Nerdbank.GitVersioning" Condition="!Exists('packages.config')">
  <PrivateAssets>all</PrivateAssets>
  <Version>3.9.50</Version>
</PackageReference>
```

`version.json` defines the baseline version:

```json
{
  "version": "1.7.19.9",
  "assemblyVersion": { "precision": "revision" },
  "buildNumber": { "sha": true, "useAbbreviatedSha": true }
}
```

NBGV combines the baseline version with the git commit height to compute the final version and generates the `ThisAssembly` static class. You can use it directly in code:

```csharp
public const string HostVersion = ThisAssembly.AssemblyFileVersion;
```

(see `InkCanvas.PluginSdk/HostApiRequirement.cs`)

### Overriding the version manually for a release

```powershell
dotnet build -p:NBGV_OverrideVersion=1.8.0
```

### version.json vs AutomaticUpdateVersionControl.txt

The version numbers in these two files may differ, and that is normal:

- `version.json`: the **development baseline**. NBGV reads it to compute build versions.
- `AutomaticUpdateVersionControl.txt`: the **officially released version**. This is the target version clients compare against when auto-updating. It is only written back by the `prerelease.yml` workflow during an official release.

The in-development version being higher than the released version is the expected state.

## CI workflows

There are 7 workflows under `.github/workflows/`. These are the ones that matter most for day-to-day development:

| File | Trigger | Purpose |
| --- | --- | --- |
| `dotnet-desktop.yml` | push to `net6` / manual | Matrix build of AnyCPU + x86, compiles the VSTO add-in into `ppt-agent/`, code signing, artifact upload |
| `prcheck.yml` | PR to `main`/`net6` | PR gate. Same Debug build as above plus output verification |
| `prerelease.yml` | tag push / manual | Generates the changelog, creates the Release, writes back `AutomaticUpdateVersionControl.txt` |
| `plugin-build.yml` | `workflow_call` | Reusable plugin build pipeline for plugin repositories, see [Plugin packaging](/en/dev/plugin/packaging) |
| `linter.yml` | push/PR to `net6` | super-linter with `DISABLE_ERRORS: true` (reports only, never blocks) |

::: tip Make it build locally before opening a PR
`prcheck.yml` runs a full build. Getting `dotnet build` to pass locally first saves round trips waiting on CI.
:::

## Packaging

The `build/` directory holds the Inno Setup script (`InkCanvasForClass CE.iss`) that produces the installer. It:

- Packages every file from the main application's output directory
- Bundles `ppt-agent/` (the VSTO add-in)
- Detects and, if needed, downloads and installs the .NET 6 Desktop Runtime

`build/cliff.toml` is the [git-cliff](https://git-cliff.org/) configuration used to generate the changelog from commit messages, so try to follow Conventional Commits (`feat:` / `fix:` / `refactor:` and so on) in your commit messages.

## Debugging tips

### Attaching to a running instance

The main application is protected by a single-instance mutex. While debugging, if an instance is already running, the new one exits. Use `--skip-mutex-check` to bypass it:

```
InkCanvasForClass.exe --skip-mutex-check
```

### Command-line arguments

Arguments supported by the main application (see `App.xaml.cs`):

| Argument | Purpose |
| --- | --- |
| `--board` | Go straight into whiteboard mode on startup |
| `--show` | Show the floating bar immediately on startup |
| `--watchdog` | Internal. Marks this process as the watchdog child |
| `--skip-mutex-check` | Skip the single-instance check |
| `--final-app` | Internal, used by the update flow |
| `--enable-uia-topmost-helper` | Internal. UIAccess elevated topmost helper |
| `--uia-source-pid` | Pairs with the previous flag to specify the source process PID |

### Turning off the watchdog

The main application spawns a `--watchdog` child process of itself for liveness monitoring. While debugging it can interfere with breakpoints (the process gets restarted once it is considered hung). The watchdog stands down automatically while the OOBE is showing (`App.IsOobeShowing`), but sitting on a breakpoint for a long time can still trigger it. Disable automatic crash recovery in settings if needed.

## Next steps

- [Contributing](./contributing)
- [Startup flow](/en/dev/core/startup) — what actually happens during startup
