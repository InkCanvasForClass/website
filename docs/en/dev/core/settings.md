---
title: Settings System
description: The Settings model, atomic saving, and how plugins access settings
---

# Settings System

<UnderConstruction />

Settings form one large object tree rooted at the `Settings` type (`Resources\Settings.cs`, 1711 lines), serialized to `Configs\Settings.json`. The global singleton hangs off `SettingsManager.Settings`:

```csharp
public static class SettingsManager
{
    public static Settings Settings { get; set; } = new Settings();
    public static string SettingsFileName { get; } = Path.Combine("Configs", "Settings.json");
```

The path is based on `App.RootPath`, which is the **application directory, not %AppData%**. The software is portable — copy the whole directory and your configuration comes with it.

## Root nodes

Each property of `Settings` is a section, and each has a `JsonProperty` attribute specifying its key in the JSON:

| Property | JSON key | Contents |
| --- | --- | --- |
| `Advanced` | `advanced` | Advanced options |
| `Appearance` | `appearance` | Appearance, language, inspirational tips |
| `Automation` | `automation` | Automation switches |
| `PowerPointSettings` | `behavior` | PowerPoint integration |
| `Canvas` | `canvas` | Canvas and ink |
| `Gesture` | `gesture` | Gestures |
| `InkToShape` | `inkToShape` | Ink-to-shape |
| `Startup` | `startup` | Startup behavior |
| `RandSettings` | `randSettings` | Random name picker |
| `ModeSettings` | `modeSettings` | Modes |
| `Camera` | `camera` | Camera |
| `Dlass` | `dlass` | Integration with Seewo, Hitevision, and similar all-in-one panels |
| `Upload` | `upload` | Upload |
| `Security` | `security` | Security |
| `Notification` | `notification` | Notifications |
| `Toolbar` | `toolbar` | Toolbar layout |
| `Performance` | `performance` | Performance monitoring |
| `MiniWhiteboard` | `miniWhiteboard` | Mini whiteboard |

::: warning The JSON key for PowerPointSettings is behavior
```csharp
[JsonProperty("behavior")]
public PowerPointSettings PowerPointSettings { get; set; } = new PowerPointSettings();
```

The C# property name and the JSON key do not match — a historical leftover. When editing `Settings.json` by hand to find PowerPoint-related configuration, look for `behavior`, not `powerPointSettings`.
:::

There are also two top-level keys that are not objects:

```csharp
[JsonProperty("toolbarConfigName")]
public string ToolbarConfigName { get; set; } = "default";

[JsonProperty("boardToolbarConfigName")]
public string BoardToolbarConfigName { get; set; } = "default";
```

They point at specific layout files under `Configs\ToolbarConfigs\`, see [Toolbar system](./toolbar).

Every section property has an `= new XxxSettings()` initializer, and the fields all carry default values. That means **the program starts fine whether you delete `Settings.json` entirely or just remove a section from it** — anything missing falls back to defaults.

## Saving is atomic

The comments around `SaveSettingsToFile()` record two real pitfalls the project hit, and they are worth reading in full:

```csharp
// 全局 SaveSettingsToFile 串行化：419 个调用点跨 UI 线程、公告轮询线程、插件线程，
// 互相 File.WriteAllText 同路径写时部分抛 IOException 被 catch 吞掉只记日志，用户感知不到
// 设置已丢失。先到先写、后到排队。
private static readonly object _saveGate = new object();
```

Writing goes through a temporary file plus an atomic replace:

```csharp
// 临时文件 + File.Replace 原子替换，避免断电/进程被杀导致 Settings.json 半截。
// 同目录移动替换是原子操作（Windows 同卷 NTFS 保证）。
var tmpPath = path + ".tmp";
ProcessProtectionManager.WithWriteAccess(tmpPath, () => File.WriteAllText(tmpPath, text));
if (File.Exists(path))
    ProcessProtectionManager.WithWriteAccess(path, () => File.Replace(tmpPath, path, null));
else
    ProcessProtectionManager.WithWriteAccess(path, () => File.Move(tmpPath, path));
```

If the replace fails, the temporary file is deleted and it **falls back to overwriting directly**, "keeping the old behavior available".

Note that serialization happens outside the lock while the file write happens inside it:

```csharp
var text = JsonConvert.SerializeObject(Settings, Formatting.Indented);
lock (_saveGate) { ... }
```

::: warning Serializing outside the lock means you can capture an intermediate state
While `JsonConvert.SerializeObject` walks the object tree, another thread may be changing settings, so the serialized result can be a mix of old and new values. The lock only guarantees "no half-written file", not "a consistent snapshot from a single moment".

In practice this rarely matters — settings are largely independent of each other. But if you add two settings that must change together, do not count on saving to make them atomic.
:::

After writing, the in-memory cache is updated:

```csharp
App.UpdateCachedSettingsJson(text);
```

Failures are logged explicitly, and the comment is blunt about why: a settings save failure must not be silent, because if the user does not notice it, their settings are gone on the next startup.

::: tip ProcessProtectionManager.WithWriteAccess
Every write is wrapped in this method. The application has process and file protection mechanisms, so a bare `File.WriteAllText` may be blocked by its own protection logic. Follow this pattern when adding code that writes configuration files.
:::

## Two reads during startup

Settings are read twice during startup, for different purposes.

The first read happens very early in `App_Startup`: `ReadSettingsJsonOnce()` loads the raw JSON text, and individual values are then pulled out with `JObject.SelectToken`:

```csharp
var obj = JObject.Parse(json);
return obj.SelectToken("startup.enableWindowChromeRendering")?.Value<bool>() ?? false;
```

This is done because window style, language, and the splash screen must be decided **before the main window is constructed**, at which point the full `Settings` object has not been deserialized yet.

The second read is the normal full deserialization that populates `SettingsManager.Settings`.

## Settings migration

When you change the settings structure and need to stay compatible with older configurations, write a migration method. `MigrateChickenSoupSettings()` is a ready-made example:

```csharp
if ((appearance.EnabledPresetTipsSources == null || appearance.EnabledPresetTipsSources.Count == 0)
    && appearance.ChickenSoupSource >= 0)
{
    string presetId = null;
    switch (appearance.ChickenSoupSource)
    {
        case 0: presetId = "osu"; break;
        case 1: presetId = "mottos"; break;
```

The single-choice `ChickenSoupSource` (int) became the multi-choice `EnabledPresetTipsSources` (`List<string>`). The migration condition is "the new field is empty and the old field has a value", and it maps the old enum values onto new string ids.

::: tip Migrations must be idempotent
A migration method may run more than once. The condition above guarantees that once the new field has a value it is never overwritten, so repeated calls have no side effects. Preserve that property when writing new migrations.
:::

Old fields are not deleted and remain in the class, otherwise deserializing an older configuration would lose data.

## How plugins access settings

Plugins go through `ISettingsService`, implemented in `Plugins\Services\SettingsService.cs`. It takes a dot-separated path and walks it with reflection:

```csharp
private static T GetByReflection<T>(object obj, string key)
{
    var parts = key.Split('.');
    object current = obj;
    foreach (var part in parts)
    {
        if (current == null) return default;
        var prop = current.GetType().GetProperty(part,
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        if (prop == null) return default;
        current = prop.GetValue(current);
    }
    if (current is T typed) return typed;
    return default;
}
```

::: danger Paths use C# property names, not JSON keys
`GetProperty` reflects over CLR property names. `IgnoreCase` only ignores casing and **does not honor the `JsonProperty` attribute**.

So the path for PowerPoint settings is `powerpointsettings.pptlinkmode`, **not** `behavior.pptLinkMode` — even though the JSON file says `behavior`. The SDK comment "keys use `.` to separate levels, e.g. `appearance.theme`" happens to pick an example where both names match, which easily misleads people into thinking the JSON path is used.

When in doubt, go by the C# property names in `Resources\Settings.cs`.
:::

When a value cannot be resolved it **always returns `default` silently**: a wrong path, a type mismatch, or a null along the way all pass without error. `Get<bool>("typo.path")` returns `false`, indistinguishable from a setting that really is false. Use `Has()` first if you need to tell them apart.

`Set` saves automatically and raises an event:

```csharp
SetByReflection(settings, key, value);
SettingsManager.SaveSettingsToFile();
SettingChanged?.Invoke(key, value);
```

Failures only log a warning; they do not throw.

::: warning Plugins writing settings modify the host's global object
There is no plugin-specific namespace. `Set("canvas.inkWidth", 5)` changes the host's pen width. If a plugin wants to store its own configuration, use the `PluginConfigs\` directory (through the configuration API provided by `IPluginHost`) rather than stuffing it into `Settings.json`.
:::

## The settings UI

The UI lives in `Windows\SettingsViews\`, and `SettingsManager` itself sits under `Helpers\` in that same directory.

The rules for changing settings entries (from `community/rules/settings_pages.md`): entries with a toggle must use `LabeledSettingsCard`, and `Header` must go through i18n. See [Code conventions](./conventions) for the full standards.

Event handlers **must save explicitly** — there is no automatic persistence:

```csharp
private void CardEnableInkFade_Toggled(object sender, RoutedEventArgs e)
{
    if (!_isLoaded) return;
    SettingsManager.Settings.Canvas.EnableInkFade = CardEnableInkFade.IsOn;
    SettingsManager.SaveSettingsToFile();
}
```

When a settings change needs the main window to react immediately, call the corresponding method on `SettingsActionHub` (`Windows\SettingsViews\Helpers\SettingsActionHub.cs`), for example `SettingsActionHub.OnHardwareAccelerationChanged()`. Ordinary settings without side effects can just read and write `SettingsManager.Settings` directly.

## Next steps

- [Code conventions](./conventions) — the full XAML standards for settings pages
- [Host services](../plugin/host-services) — the plugin-side signature of `ISettingsService`
- [Toolbar system](./toolbar) — the layout files `ToolbarConfigName` points at
