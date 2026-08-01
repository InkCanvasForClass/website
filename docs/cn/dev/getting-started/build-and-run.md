---
title: 构建与运行
description: 编译、版本号、CI 与打包
---

# 构建与运行

## 本地构建

### 命令行

```powershell
cd community
dotnet restore "Ink Canvas.sln"
dotnet build "Ink Canvas.sln" -c Debug
```

只构建主程序：

```powershell
dotnet build "Ink Canvas/InkCanvasForClass.csproj" -c Debug
```

### 平台选择

主程序声明的平台是 `AnyCPU;x86;x64`，RuntimeIdentifier 支持 `win-x86;win-x64;win-arm64`。

::: warning ARM64 的坑
`RuntimeIdentifiers` 里有 `win-arm64`，csproj 里也有 `Debug|ARM64` / `Release|ARM64` 的 PropertyGroup，但 `<Platforms>` 只列了 `AnyCPU;x86;x64`——ARM64 并不是一个可选平台。解决方案配置里 ARM64 被映射到了 `Any CPU`。如果你要做 ARM64 原生构建，需要先补 `<Platforms>`。
:::

### 包锁定

主程序启用了 `RestorePackagesWithLockFile`，存在 `packages.lock.json`。如果你增删了 NuGet 包，需要提交更新后的锁文件；CI 上用 `--locked-mode` 恢复时锁文件不一致会直接失败。

## 版本号

版本号由 [Nerdbank.GitVersioning](https://github.com/dotnet/Nerdbank.GitVersioning)（NBGV）统一管理，**不要手改 AssemblyInfo**。

`Directory.Build.props` 给仓库内所有项目注入了 NBGV 3.9.50：

```xml
<PackageReference Include="Nerdbank.GitVersioning" Condition="!Exists('packages.config')">
  <PrivateAssets>all</PrivateAssets>
  <Version>3.9.50</Version>
</PackageReference>
```

`version.json` 定义基线版本：

```json
{
  "version": "1.7.19.9",
  "assemblyVersion": { "precision": "revision" },
  "buildNumber": { "sha": true, "useAbbreviatedSha": true }
}
```

NBGV 会结合基线版本与 git 提交高度算出最终版本，生成 `ThisAssembly` 静态类。代码里可以直接用：

```csharp
public const string HostVersion = ThisAssembly.AssemblyFileVersion;
```

（见 `InkCanvas.PluginSdk/HostApiRequirement.cs`）

### 发版时手工覆盖版本

```powershell
dotnet build -p:NBGV_OverrideVersion=1.8.0
```

### version.json 与 AutomaticUpdateVersionControl.txt 的区别

两个文件版本号可能不一致，这是正常的：

- `version.json`：**开发版本基线**，NBGV 读它算构建版本。
- `AutomaticUpdateVersionControl.txt`：**正式发布版本**，客户端自动更新时比对的目标版本。只在正式发版时由 `prerelease.yml` 工作流回写。

开发中的版本高于已发布版本是预期状态。

## CI 工作流

`.github/workflows/` 下有 7 个工作流，与日常开发关系最大的是这几个：

| 文件 | 触发 | 作用 |
| --- | --- | --- |
| `dotnet-desktop.yml` | push 到 `net6` / 手动 | 矩阵构建 AnyCPU + x86，编译 VSTO 加载项到 `ppt-agent/`，代码签名，上传 artifact |
| `prcheck.yml` | PR 到 `main`/`net6` | PR 门禁，与上面同构的 Debug 构建 + 产物校验 |
| `prerelease.yml` | push tag / 手动 | 生成 changelog、创建 Release、回写 `AutomaticUpdateVersionControl.txt` |
| `plugin-build.yml` | `workflow_call` | 供各插件仓库复用的插件构建流水线，见 [插件打包](/cn/dev/plugin/packaging) |
| `linter.yml` | push/PR 到 `net6` | super-linter，`DISABLE_ERRORS: true`（只报告不阻断） |

::: tip 本地跑通再提 PR
`prcheck.yml` 会跑完整构建。本地 `dotnet build` 通过再提 PR，能省去来回等 CI 的时间。
:::

## 打包

`build/` 目录下是 Inno Setup 脚本（`InkCanvasForClass CE.iss`），负责生成安装包。它会：

- 打包主程序输出目录的全部文件
- 附带 `ppt-agent/`（VSTO 加载项）
- 检测并按需下载安装 .NET 6 桌面运行时

`build/cliff.toml` 是 [git-cliff](https://git-cliff.org/) 配置，用于从 commit message 生成 changelog——所以提交信息尽量遵循 Conventional Commits（`feat:` / `fix:` / `refactor:` 等）。

## 调试技巧

### 附加到已运行实例

主程序有单实例 Mutex 保护。调试时如果已经有一个实例在跑，新实例会退出。可以用 `--skip-mutex-check` 参数跳过：

```
InkCanvasForClass.exe --skip-mutex-check
```

### 命令行参数

主程序支持的参数（见 `App.xaml.cs`）：

| 参数 | 作用 |
| --- | --- |
| `--board` | 启动后直接进入白板模式 |
| `--show` | 启动后直接显示浮动栏 |
| `--watchdog` | 内部使用，标识本进程是看门狗子进程 |
| `--skip-mutex-check` | 跳过单实例检查 |
| `--final-app` | 更新流程内部使用 |
| `--enable-uia-topmost-helper` | 内部使用，UIAccess 提权置顶助手 |
| `--uia-source-pid` | 配合上一项，指定原进程 PID |

### 关掉看门狗

主程序会拉起一个自身的 `--watchdog` 子进程做保活监控。调试时它可能干扰断点（进程被判定卡死后重启）。看门狗在 OOBE 显示期间会自动让路（`App.IsOobeShowing`），但长时间停在断点上仍可能触发。必要时在设置里关闭崩溃自动恢复。

## 下一步

- [贡献流程](./contributing)
- [启动流程](/cn/dev/core/startup) — 启动时到底发生了什么
