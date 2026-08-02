---
title: Manifest
description: A field-by-field reference for manifest.json
---

# Manifest

<HelpUsImprove />

Every plugin must place a `manifest.json` in its root directory. The host relies on it to discover the plugin, validate compatibility, and resolve dependencies.

## A complete example

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

## Field reference

These map to the `PluginManifest` class in the SDK (`InkCanvas.PluginSdk/PluginManifest.cs`).

### Required

| Field | Type | Description |
| --- | --- | --- |
| `Id` | string | The plugin's unique identifier; a reverse domain name such as `com.example.myplugin` is recommended. It doubles as the plugin's installation folder name |
| `Name` | string | Display name |
| `Version` | string | The plugin's version, e.g. `1.0.0` |
| `EntranceAssembly` | string | The entry assembly's file name, e.g. `MyPlugin.dll` |
| `ApiVersion` | string | The targeted API version. The current host is at `1.0.0`; the same major version means compatible |

::: warning The Id becomes a folder name
`Id` is used to build the plugin installation path, and the host performs path-escape validation (`IsValidPluginId`): an Id containing `..`, path separators, or other illegal characters is refused. Stick to letters, digits, dots, and hyphens.
:::

### Compatibility

| Field | Type | Description |
| --- | --- | --- |
| `MinHostVersion` | string | The minimum host version, e.g. `1.7.18`. Loading is refused if the host version is lower |
| `VersionRange` | string | The plugin's compatible version range, e.g. `^1.0.0` or `>=1.0.0,<2.0.0`. **When left empty, only the major version and the API version are compared** |

### Metadata

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `Description` | string | `""` | Plugin description |
| `Author` | string | `""` | Author |
| `Icon` | string | `"icon.png"` | Icon path, relative to the plugin directory |
| `Url` | string | `""` | Project homepage |
| `SourceUrl` | string | `""` | Source repository |
| `License` | string | `""` | License, e.g. `MIT` or `Apache-2.0` |
| `Tags` | string[] | `[]` | Tags, used for categorization in the plugin marketplace |

### Permissions

```json
"Permissions": ["Settings", "Hotkeys", "Network", "FileSystem"]
```

::: danger Permissions are not a sandbox
`Permissions` is **only shown to the user at install time**; nothing is enforced at runtime. Plugins share the host's process and privileges, so a plugin that declares only `Settings` can still read and write files and access the network.

The purpose of this field is to set the user's expectations about a plugin's behavior before installing it — it is not a security boundary. Don't rely on it when reviewing third-party plugins.
:::

### Dependencies

```json
"Dependencies": [
  { "Id": "com.example.baseplugin", "Version": "1.2.0", "IsRequired": true }
]
```

These map to the `PluginDependency` class:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `Id` | string | `""` | The Id of the plugin depended upon |
| `Version` | string | `""` | Minimum version |
| `IsRequired` | bool | `true` | Whether it is mandatory. If a required dependency is missing, this plugin will not load |

Dependencies take part in the topological sort that determines load order, so a dependency is initialized first. See [Lifecycle](./lifecycle) for details.

## Getting manifest.json into the output directory automatically

Once you reference the `InkCanvas.PluginSdk` NuGet package, the `.targets` file shipped with the SDK handles it:

```xml
<ItemGroup>
  <None Condition="Exists('$(MSBuildProjectDirectory)\manifest.json')"
        Include="manifest.json"
        CopyToOutputDirectory="PreserveNewest" />
</ItemGroup>
```

As long as `manifest.json` sits in the project root, it is copied to the output directory at build time with no manual configuration.

When packaging an `.icpx`, a missing `manifest.json` in the output directory is a hard error:

```
ICSDK001: manifest.json not found in output directory.
```

## Load order and Order

There is **no** `Order` field in `manifest.json`. Load order is determined by two things:

1. **The dependency topological sort**: `Dependencies` decides who loads first.
2. **The `IPlugin.Order` property**: once every plugin has finished `Initialize`, the host sorts the plugin list by `Order` ascending (which affects UI presentation order and the like).

`PluginBase.Order` returns `0` by default; override it in code when needed:

```csharp
public override int Order => 100;
```

## Next steps

- [Quickstart](./quickstart)
- [Lifecycle](./lifecycle) — the details of compatibility validation and load order
