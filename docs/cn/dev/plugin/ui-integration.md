---
title: UI 集成
description: 工具栏项、弹窗、自定义设置项与插件视图
---

# UI 集成

<HelpUsImprove />

插件往界面里塞东西只有两条正规途径：往浮动工具栏注册一个按钮，或者提供 `GetMainView()` / `GetSettingsView()` 两个视图。前者是绝大多数插件的做法。

## 注册工具栏项

`IPluginHost.RegisterToolbarItem()` 接收一个 `PluginToolbarItemInfo`。这个类的全部字段（`InkCanvas.PluginSdk/IPluginHost.cs`）：

```csharp
public class PluginToolbarItemInfo
{
    public string Id { get; set; }
    public string DisplayName { get; set; }
    public string Description { get; set; }
    public string IconGeometry { get; set; }
    public Func<FrameworkElement> ViewFactory { get; set; }
    public Action<FrameworkElement, Orientation> ApplyOrientation { get; set; }
    public Action<FrameworkElement, Dictionary<string, object>> ApplySettings { get; set; }
    public List<PluginToolbarSettingInfo> CustomSettings { get; set; }
    public Func<FrameworkElement> PopupContentFactory { get; set; }
}
```

最小可用的注册长这样：

```csharp
public override void Initialize(IPluginHost host, IServiceCollection services)
{
    base.Initialize(host, services);

    host.RegisterToolbarItem(new PluginToolbarItemInfo
    {
        Id = "myplugin.button",
        DisplayName = "我的按钮",
        Description = "点一下做点什么",
        IconGeometry = "M 0,0 L 10,0 L 10,10 Z",
        ViewFactory = () => new ToolbarImageButton { /* ... */ }
    });
}
```

::: warning Id 必须全局唯一且不能改
`ToolbarRegistry.RegisterPluginItem()` 会按 `Id` 做去重（`OrdinalIgnoreCase`），重复注册的**后一个直接被丢弃，不报错**。同时 `Id` 会被写进用户的工具栏布局配置，改 `Id` 等于用户界面上的按钮凭空消失。建议用 `插件id.组件名` 的形式。
:::

### 注册后会自动出现在工具栏

`RegisterPluginItem` 的第二个参数 `autoAddToActiveConfig` 默认为 `true`，宿主会把这个组件写进当前激活的工具栏配置：

```csharp
layout.Components.Add(new ToolbarComponentEntry
{
    Id = itemId,
    HidingRuleset = ToolbarRuleset.AlwaysShow().WithHideOnCollapsed()
});
SaveConfigFile(configName, layout);
```

也就是说插件按钮默认「总是显示，但工具栏收起时隐藏」。用户之后可以在设置里自己调整位置和显示规则，配置存在 `Configs/ToolbarConfigs/<name>.json`。

::: tip 注册时机
`RegisterToolbarItem` 必须在 `Initialize` 里调用。`ToolbarRegistry.Discover()` 有缓存（`_items` 字段），但 `RegisterPluginItem` 会在缓存已建立时补一个 `PluginToolbarItemWrapper` 进去，所以晚一点注册也能生效——不过工具栏可能已经渲染完了，按钮要等下次重建才出现。别赌这个，老实在 `Initialize` 里注册。
:::

## 插件项是怎么变成内置项的

宿主内部所有工具栏项都是 `IToolbarItem`。插件给的是 `PluginToolbarItemInfo`，两者靠 `PluginToolbarItemWrapper` 适配（`Ink Canvas/Controls/Toolbar/FloatingToolbar/ToolbarRegistry.cs`）：

```csharp
internal class PluginToolbarItemWrapper : IToolbarItem
{
    public string Id => _info.Id;
    public FontIconData? IconKey => null;
    public ToolbarRuleset DefaultHidingRuleset
        => ToolbarRuleset.AlwaysShow().WithHideOnCollapsed();
    public bool DefaultShowSeparateBorder => false;
    public bool DefaultPreventHideOnDragClick => false;
}
```

有两点值得注意：`IconKey` 恒为 `null`，插件**只能用 `IconGeometry` 提供矢量路径图标**，用不了宿主内置的字体图标集；`DefaultShowSeparateBorder` 恒为 `false`，插件按钮总是和相邻按钮共用一个圆角边框。

## 弹窗

只要给 `PopupContentFactory` 赋值，包装器就会自动建一个 `Popup`、绑好按钮点击、注册到宿主的 Popup 管理器，还会处理好定位（在按钮正上方，间距 8px）。你不需要自己写 Popup。

```csharp
host.RegisterToolbarItem(new PluginToolbarItemInfo
{
    Id = "myplugin.panel",
    DisplayName = "面板",
    IconGeometry = "...",
    ViewFactory = () => new ToolbarImageButton { /* ... */ },
    PopupContentFactory = () => new MyPopupContent()
});
```

包装器做的事情，按顺序：

1. 建 `Popup`，`AllowsTransparency = true`、`StaysOpen = true`、`Focusable = true`
2. 在按钮 `Loaded` 时调 `mw.GetPopupManager()?.RegisterPopup(popup)`
3. 按钮点击时先 `mw.CloseAllPopups()` 关掉其他弹窗，再带滑入淡入动画打开自己
4. 打开后把焦点移进弹窗内容的第一个可聚焦元素

::: warning 关闭按钮的接线有个坑
如果你返回的是 `PopupShellContent` / `PopupTabShellContent`，标题栏关闭按钮会被直接接上。但插件通常返回的是外层 `UserControl`，里面才嵌着 Shell（PdfReader 的 `ReaderPopupContent` 就是这样）。

这种情况下包装器会在视觉树里递归找 Shell 再接线，并且**在 `popup.Opened` 之后重试一次**——因为 Popup 没打开时子元素的视觉树可能还没展开。源码注释写得很直白：「否则标题栏关闭按钮点了没反应」。

结论：嵌套返回是支持的，但你的 Shell 必须真的在视觉树里能被找到。用 `x:Name` 藏在模板里、或者延迟到别的时机才创建，都会让关闭按钮失效。
:::

## 声明式自定义设置

插件按钮可以有自己的设置项，出现在宿主的工具栏设置界面里。用 `CustomSettings` 声明：

```csharp
public class PluginToolbarSettingInfo
{
    public string Key { get; set; }
    public string DisplayName { get; set; }
    public string Description { get; set; }
    public PluginToolbarSettingType Type { get; set; }
    public List<string> Options { get; set; }
    public List<string> OptionValues { get; set; }
    public string DefaultValue { get; set; }
}

public enum PluginToolbarSettingType { ComboBox, Slider, Toggle }
```

只有三种控件类型，没有别的。`Options` 与 `OptionValues` 的关系在 SDK 注释里写明了：

> ComboBox 选项的保存值。若数量与 Options 一致，则 Options 用作显示文本、OptionValues 用作保存值；否则 Options 同时用作显示文本和保存值。

用户改动设置后，宿主通过 `ApplySettings` 回调通知你：

```csharp
ApplySettings = (view, settings) =>
{
    if (settings.TryGetValue("mode", out var mode))
        ((MyView)view).Mode = mode?.ToString();
}
```

::: tip settings 字典的值类型不可靠
这个字典来自 `ToolbarComponentEntry.Settings`（`Dictionary<string, object>`），经 Newtonsoft.Json 反序列化。数字可能是 `long`、`int` 或 `double`，取决于 JSON 里怎么写的。宿主内置项用 `GetSettingDouble()` 这类方法做兼容解析，插件侧要自己判类型或者直接 `ToString()` 再 parse。
:::

`PluginToolbarSettingInfo` 定义在 PluginSdk 里，而宿主的 `IToolbarItem` 接口也用同一个类型：

```csharp
IReadOnlyList<PluginToolbarSettingInfo> CustomSettings => System.Array.Empty<PluginToolbarSettingInfo>();
```

这就是内置项和插件项能共用一套设置描述与同一个设置界面的原因。

## 横竖方向适配

工具栏可以停靠在屏幕不同边，方向会变。宿主通过 `ApplyOrientation` 通知：

```csharp
ApplyOrientation = (view, orientation) =>
{
    if (view is StackPanel sp) sp.Orientation = orientation;
}
```

不实现也能跑，但工具栏竖排时你的组件可能被压变形。宿主给的内容区固定是 58 DIP（横排时是高度，竖排时是宽度），按这个尺寸设计。

## 插件视图

`PluginBase` 提供两个可重写方法，默认都返回 `null`：

```csharp
public virtual object GetMainView()
{
    return null;
}

public virtual object GetSettingsView()
{
    return null;
}
```

返回类型是 `object` 而不是 `FrameworkElement`，这是为了让 SDK 不强制依赖 WPF 类型。实际返回 WPF 控件即可。

::: warning 这两个方法的宿主消费点未确认
`GetSettingsView()` 按命名应当被宿主的插件管理界面用于渲染插件专属设置页，但本轮没有在主程序里核实到具体调用点。想给插件做设置界面，更稳妥的做法是用上面的 `CustomSettings` 声明式设置，那条路径的代码链路是完整可查的。
:::

## 与宿主窗口交互

`IToolbarHost` 只有三个成员（`FloatingToolbar/IToolbarHost.cs`），接口注释坦承这是临时设计：

```csharp
/// 工具栏按钮插件与宿主之间的桥梁。Phase 1 粗粒度暴露 MainWindow，后续收窄。
public interface IToolbarHost
{
    MainWindow Window { get; }
    void RegisterView(string id, FrameworkElement view);
    FrameworkElement FindView(string id);
}
```

但 `IToolbarHost` 只出现在 `IToolbarItem.BuildView(IToolbarHost host)` 的签名里——插件走的是 `ViewFactory`，**拿不到 `host` 参数**。所以插件想影响窗口状态，得用 [宿主服务](./host-services) 里的 `IWindowService`、`IEventService` 那些接口，而不是 `IToolbarHost`。

## 下一步

- [宿主服务](./host-services) — 13 个可用的服务接口
- [打包与分发](./packaging) — `.icpx` 结构与 CI 校验
- [工具栏系统](../core/toolbar) — 宿主侧工具栏的完整实现
