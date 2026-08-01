---
title: 清单文件
description: manifest.json 字段说明
---

# 清单文件

<HelpUsImprove />

每个插件必须在根目录放一个 `manifest.json`。宿主靠它发现插件、校验兼容性、解析依赖。

## 完整示例

```json
{
  "Id": "com.example.myplugin",
  "Name": "我的插件",
  "Version": "1.0.0",
  "Description": "一句话说明这个插件做什么",
  "Author": "你的名字",
  "EntranceAssembly": "MyPlugin.dll",
  "ApiVersion": "1.0.0",
  "MinHostVersion": "1.7.18",
  "Icon": "icon.png",
  "Url": "https://github.com/you/myplugin",
  "SourceUrl": "https://github.com/you/myplugin",
  "License": "MIT",
  "Tags": ["工具", "效率"],
  "Permissions": ["Settings", "Hotkeys"],
  "VersionRange": "",
  "Dependencies": []
}
```

## 字段说明

对应 SDK 里的 `PluginManifest` 类（`InkCanvas.PluginSdk/PluginManifest.cs`）。

### 必填

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | string | 插件唯一标识，建议用反向域名，如 `com.example.myplugin`。同时也是插件安装目录名 |
| `Name` | string | 显示名称 |
| `Version` | string | 插件版本号，如 `1.0.0` |
| `EntranceAssembly` | string | 入口程序集文件名，如 `MyPlugin.dll` |
| `ApiVersion` | string | 目标 API 版本。当前宿主是 `1.0.0`，主版本相同即兼容 |

::: warning Id 会成为目录名
`Id` 被用于拼接插件安装路径，宿主有路径逃逸校验（`IsValidPluginId`），含 `..`、路径分隔符等非法字符的 Id 会被拒绝加载。用字母、数字、点、连字符即可。
:::

### 兼容性

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `MinHostVersion` | string | 最低宿主版本，如 `1.7.18`。宿主版本低于此值时拒绝加载 |
| `VersionRange` | string | 插件版本兼容范围，如 `^1.0.0`、`>=1.0.0,<2.0.0`。**留空时只比较主版本号与 API 版本** |

### 元信息

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `Description` | string | `""` | 插件描述 |
| `Author` | string | `""` | 作者 |
| `Icon` | string | `"icon.png"` | 图标路径，相对于插件目录 |
| `Url` | string | `""` | 项目主页 |
| `SourceUrl` | string | `""` | 源码仓库 |
| `License` | string | `""` | 许可协议，如 `MIT`、`Apache-2.0` |
| `Tags` | string[] | `[]` | 标签，用于插件市场分类 |

### 权限

```json
"Permissions": ["Settings", "Hotkeys", "Network", "FileSystem"]
```

::: danger 权限不是沙箱
`Permissions` **只在安装时向用户提示**，运行时不做任何强制限制。插件与宿主同进程、同权限，声明了 `Settings` 的插件照样能读写文件、访问网络。

这个字段的作用是让用户在安装前对插件行为有心理预期，不是安全边界。审查第三方插件时不要依赖它。
:::

### 依赖

```json
"Dependencies": [
  { "Id": "com.example.baseplugin", "Version": "1.2.0", "IsRequired": true }
]
```

对应 `PluginDependency` 类：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `Id` | string | `""` | 依赖的插件 Id |
| `Version` | string | `""` | 最低版本 |
| `IsRequired` | bool | `true` | 是否必需。必需依赖缺失时本插件不会加载 |

依赖会参与加载顺序的拓扑排序，被依赖的插件先初始化。详见 [生命周期](./lifecycle)。

## 让 manifest.json 自动进输出目录

引用 `InkCanvas.PluginSdk` NuGet 包后，SDK 附带的 `.targets` 会自动处理：

```xml
<ItemGroup>
  <None Condition="Exists('$(MSBuildProjectDirectory)\manifest.json')"
        Include="manifest.json"
        CopyToOutputDirectory="PreserveNewest" />
</ItemGroup>
```

只要 `manifest.json` 放在项目根目录，构建时就会被复制到输出目录，无需手工配置。

打包 `.icpx` 时如果输出目录里没有 `manifest.json`，会直接报错：

```
ICSDK001: manifest.json not found in output directory.
```

## 加载顺序与 Order

`manifest.json` 里**没有** `Order` 字段。加载顺序由两部分决定：

1. **依赖拓扑排序**：`Dependencies` 决定谁先加载。
2. **`IPlugin.Order` 属性**：所有插件 `Initialize` 完成后，宿主按 `Order` 升序排序插件列表（影响 UI 呈现顺序等）。

`PluginBase.Order` 默认返回 `0`，需要时在代码里重写：

```csharp
public override int Order => 100;
```

## 下一步

- [快速上手](./quickstart)
- [生命周期](./lifecycle) — 兼容性校验与加载顺序的细节
