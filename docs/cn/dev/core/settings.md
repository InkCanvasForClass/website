---
title: 设置系统
description: Settings 模型、原子保存与插件访问路径
---

# 设置系统

<HelpUsImprove />

设置是一个大对象树，根类型 `Settings`（`Resources\Settings.cs`，1711 行），序列化成 `Configs\Settings.json`。全局单例挂在 `SettingsManager.Settings` 上：

```csharp
public static class SettingsManager
{
    public static Settings Settings { get; set; } = new Settings();
    public static string SettingsFileName { get; } = Path.Combine("Configs", "Settings.json");
```

路径基于 `App.RootPath`，也就是**程序目录，不是 %AppData%**。绿色软件，整个目录拷走就能带走全部配置。

## 根节点

`Settings` 的每个属性是一个分区，都有 `JsonProperty` 特性指定 JSON 里的键名：

| 属性 | JSON 键 | 内容 |
| --- | --- | --- |
| `Advanced` | `advanced` | 高级选项 |
| `Appearance` | `appearance` | 外观、语言、鸡汤提示 |
| `Automation` | `automation` | 自动化开关 |
| `PowerPointSettings` | `behavior` | PPT 联动 |
| `Canvas` | `canvas` | 画布与墨迹 |
| `Gesture` | `gesture` | 手势 |
| `InkToShape` | `inkToShape` | 墨迹转形状 |
| `Startup` | `startup` | 启动行为 |
| `RandSettings` | `randSettings` | 随机点名 |
| `ModeSettings` | `modeSettings` | 模式 |
| `Camera` | `camera` | 摄像头 |
| `Dlass` | `dlass` | 希沃/鸿合等一体机集成 |
| `Upload` | `upload` | 上传 |
| `Security` | `security` | 安全 |
| `Notification` | `notification` | 通知 |
| `Toolbar` | `toolbar` | 工具栏布局 |
| `Performance` | `performance` | 性能监控 |
| `MiniWhiteboard` | `miniWhiteboard` | 小白板 |

::: warning PowerPointSettings 的 JSON 键是 behavior
```csharp
[JsonProperty("behavior")]
public PowerPointSettings PowerPointSettings { get; set; } = new PowerPointSettings();
```

C# 属性名和 JSON 键名对不上，这是历史遗留。手改 `Settings.json` 找 PPT 相关配置时，要找 `behavior` 而不是 `powerPointSettings`。
:::

还有两个不是对象的顶层键：

```csharp
[JsonProperty("toolbarConfigName")]
public string ToolbarConfigName { get; set; } = "default";

[JsonProperty("boardToolbarConfigName")]
public string BoardToolbarConfigName { get; set; } = "default";
```

指向 `Configs\ToolbarConfigs\` 下的具体布局文件，见 [工具栏系统](./toolbar)。

每个分区属性都有 `= new XxxSettings()` 初始化器，字段也都带默认值。所以**删掉 `Settings.json` 或删掉其中任意一段，程序都能正常启动**，缺的部分用默认值。

## 保存是原子的

`SaveSettingsToFile()` 这段代码的注释记录了两个真实踩过的坑，值得完整看：

```csharp
// 全局 SaveSettingsToFile 串行化：419 个调用点跨 UI 线程、公告轮询线程、插件线程，
// 互相 File.WriteAllText 同路径写时部分抛 IOException 被 catch 吞掉只记日志，用户感知不到
// 设置已丢失。先到先写、后到排队。
private static readonly object _saveGate = new object();
```

写入用临时文件 + 原子替换：

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

替换失败会删掉临时文件并**回退到直接覆盖**，「保持旧行为仍可用」。

注意序列化在锁外，写文件在锁内：

```csharp
var text = JsonConvert.SerializeObject(Settings, Formatting.Indented);
lock (_saveGate) { ... }
```

::: warning 序列化在锁外意味着可能读到中间态
`JsonConvert.SerializeObject` 遍历对象树时如果别的线程正在改设置，序列化出来的可能是新旧混合的快照。锁只保证了「不会写出半截文件」，不保证「写出的是某一时刻的一致快照」。

实践中影响不大——设置项之间基本互相独立。但如果你新增了两个必须一起变更的设置项，别指望保存能保证它们的原子性。
:::

写完会同步更新内存缓存：

```csharp
App.UpdateCachedSettingsJson(text);
```

失败时明确记日志，注释写得很直白：「设置保存失败不能静默：用户感知不到 = 下次启动设置丢失」。

::: tip ProcessProtectionManager.WithWriteAccess
所有写操作都包在这个方法里。程序有进程保护/文件保护机制，直接 `File.WriteAllText` 可能被自己的保护逻辑挡掉。新增写配置文件的代码时照这个模式写。
:::

## 启动时的两次读取

设置在启动过程中被读两次，用途不同。

第一次在 `App_Startup` 很早的位置，`ReadSettingsJsonOnce()` 把原始 JSON 文本读进来，之后用 `JObject.SelectToken` 直接取零散的几个值：

```csharp
var obj = JObject.Parse(json);
return obj.SelectToken("startup.enableWindowChromeRendering")?.Value<bool>() ?? false;
```

这样做是因为窗口样式、语言、启动画面这几项必须在**主窗口构造之前**就确定，那时完整的 `Settings` 对象还没反序列化好。

第二次才是正常的完整反序列化，填充 `SettingsManager.Settings`。

## 设置迁移

改了设置结构要兼容老配置时，写迁移方法。现成的例子 `MigrateChickenSoupSettings()`：

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

单选的 `ChickenSoupSource`（int）改成了多选的 `EnabledPresetTipsSources`（`List<string>`）。迁移条件是「新字段为空且旧字段有值」，把旧的枚举值映射成新的字符串 id。

::: tip 迁移要幂等
迁移方法可能被调用多次。上面这个的判定条件保证了新字段一旦有值就不再覆盖，重复调用无副作用。写新迁移时保持这个性质。
:::

老字段没有删除，仍留在类里，否则老版本配置反序列化时会丢数据。

## 插件如何访问设置

插件走 `ISettingsService`，实现是 `Plugins\Services\SettingsService.cs`。用点分路径 + 反射逐级取值：

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

::: danger 路径用的是 C# 属性名，不是 JSON 键名
`GetProperty` 反射的是 CLR 属性名，`IgnoreCase` 只忽略大小写，**不认 `JsonProperty` 特性**。

所以 PPT 设置的路径是 `powerpointsettings.pptlinkmode`，**不是** `behavior.pptLinkMode`——尽管 JSON 文件里写的是 `behavior`。SDK 注释里「键用 `.` 分隔层级，如 `appearance.theme`」这个例子恰好两者同名，容易让人误以为用的是 JSON 路径。

拿不准的时候以 `Resources\Settings.cs` 里的 C# 属性名为准。
:::

取不到值时**一律静默返回 `default`**：路径写错、类型不匹配、中途为 null，都不报错。`Get<bool>("typo.path")` 返回 `false`，和「设置项确实是 false」无法区分。要区分就先用 `Has()`。

`Set` 会自动保存并触发事件：

```csharp
SetByReflection(settings, key, value);
SettingsManager.SaveSettingsToFile();
SettingChanged?.Invoke(key, value);
```

失败只记 Warning 日志，不抛异常。

::: warning 插件写设置直接改的是宿主全局对象
没有插件专属命名空间，`Set("canvas.inkWidth", 5)` 改的就是宿主的画笔粗细。插件想存自己的配置，用 `PluginConfigs\` 目录（`IPluginHost` 提供的配置 API），别往 `Settings.json` 里塞。
:::

## 设置界面

界面在 `Windows\SettingsViews\`，`SettingsManager` 本身也放在这个目录下的 `Helpers\` 里。

改设置项时的规范（来自 `community/rules/settings_pages.md`）：带开关的项必须用 `LabeledSettingsCard`，`Header` 走 i18n。完整规范见 [代码规范](./conventions)。

事件处理器里**必须显式保存**，没有自动持久化：

```csharp
private void CardEnableInkFade_Toggled(object sender, RoutedEventArgs e)
{
    if (!_isLoaded) return;
    SettingsManager.Settings.Canvas.EnableInkFade = CardEnableInkFade.IsOn;
    SettingsManager.SaveSettingsToFile();
}
```

改了设置需要让主窗口立刻响应时，走 `SettingsActionHub`（`Windows\SettingsViews\Helpers\SettingsActionHub.cs`）上的对应方法，例如 `SettingsActionHub.OnHardwareAccelerationChanged()`。不需要副作用的普通设置项直接读写 `SettingsManager.Settings` 即可。

## 下一步

- [代码规范](./conventions) — 设置页的完整 XAML 规范
- [宿主服务](../plugin/host-services) — `ISettingsService` 的插件侧签名
- [工具栏系统](./toolbar) — `ToolbarConfigName` 指向的布局文件
