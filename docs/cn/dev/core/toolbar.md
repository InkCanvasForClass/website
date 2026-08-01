---
title: 工具栏系统
description: 两套独立工具栏体系、项发现机制与布局持久化
---

# 工具栏系统

`Ink Canvas\Controls\Toolbar\` 下其实是**两套互不相干的体系**，没有共享接口或基类：

```
Controls\Toolbar\
├── FloatingToolbar\      主窗口悬浮工具栏
├── BoardToolbar\         白板工具栏
└── ToolsMenuRegistry.cs  工具菜单
```

`FloatingToolbar` 用 `IToolbarItem`，`BoardToolbar` 用 `IBoardToolbarItem`，两个接口签名不同，实现类也各写一套。想给两边都加按钮，得写两遍。插件能注册的只有 `FloatingToolbar`。

::: warning 别试图统一它们
从命名看这两套「应该」抽象成一套，但实际上没有。改动其中一边不会影响另一边，读代码时先确认自己在哪个目录下。
:::

## IToolbarItem

悬浮工具栏的项接口全文只有 44 行（`FloatingToolbar\IToolbarItem.cs`）：

```csharp
public interface IToolbarItem
{
    string Id { get; }
    string DisplayName { get; }
    string Description { get; }
    string IconGeometry { get; }
    FontIconData? IconKey { get; }
    ToolbarRuleset DefaultHidingRuleset { get; }
    bool DefaultShowSeparateBorder { get; }
    bool DefaultPreventHideOnDragClick { get; }
    IReadOnlyList<PluginToolbarSettingInfo> CustomSettings
        => System.Array.Empty<PluginToolbarSettingInfo>();
    Func<FrameworkElement> CustomSettingsPanelFactory => null;
    FrameworkElement BuildView(IToolbarHost host);
    void ApplyOrientation(FrameworkElement view, Orientation orientation) { }
}
```

后四个成员用了 C# 8 默认接口成员，实现类可以不管。

图标有两条路：`IconGeometry` 是 Path 矢量数据，`IconKey` 是宿主内置字体图标集。内置项两者都能用，**插件项的 `IconKey` 恒为 `null`**，只能走 `IconGeometry`。

`CustomSettings` 的类型 `PluginToolbarSettingInfo` 来自 PluginSdk。宿主内置项和插件项共用同一个描述类型，所以工具栏设置界面只需要写一套渲染逻辑。`CustomSettingsPanelFactory` 优先级更高，给了它就完全接管设置面板，`CustomSettings` 被忽略。

## 项是怎么被发现的

`ToolbarRegistry.Discover()` 用反射扫当前程序集：

```csharp
var items = typeof(ToolbarRegistry).Assembly.GetTypes()
    .Where(t => typeof(IToolbarItem).IsAssignableFrom(t)
                && !t.IsInterface && !t.IsAbstract)
    .Select(t => Activator.CreateInstance(t) as IToolbarItem)
```

实现 `IToolbarItem`、非抽象、有公共无参构造函数，就会被自动发现。**加一个内置按钮不需要在任何地方登记**，建个类就行。

结果缓存在 `_items` 字段里，只扫一次。

插件项走另一条路，`RegisterPluginItem()` 把 `PluginToolbarItemInfo` 包装成 `PluginToolbarItemWrapper` 塞进同一个集合。缓存已建立时也能补进去。去重按 `Id`（`OrdinalIgnoreCase`），**重复的后一个静默丢弃，不报错**。

## 布局持久化

用户调整过的工具栏布局存在：

```
<程序目录>\Configs\ToolbarConfigs\<name>.json
```

`<name>` 来自 `Settings.ToolbarConfigName`（默认 `"default"`）。白板工具栏用的是另一个键 `Settings.BoardToolbarConfigName`，配置文件也是分开的。

保存时会先写 `.json.bak` 备份。配置文件损坏时能回退。

布局里的每一项是 `ToolbarComponentEntry`：

```csharp
layout.Components.Add(new ToolbarComponentEntry
{
    Id = itemId,
    HidingRuleset = ToolbarRuleset.AlwaysShow().WithHideOnCollapsed()
});
```

`Id` 对应 `IToolbarItem.Id`。**这就是插件项的 `Id` 不能改的原因**——改了以后旧配置里的条目找不到对应实现，按钮从用户界面上消失。

`Settings` 字段是 `Dictionary<string, object>`，存该项的自定义设置值。经 Newtonsoft.Json 往返后数字类型不确定（可能是 `long`/`int`/`double`），宿主内置项用 `GetSettingDouble()` 这类方法做兼容解析。

## 显示规则

`ToolbarRuleset` 决定一个项什么时候显示。链式构造：

```csharp
ToolbarRuleset.AlwaysShow().WithHideOnCollapsed()
```

这是插件项的默认值——总是显示，但工具栏收起时隐藏。

`IToolbarItem.DefaultHidingRuleset` 只是**默认值**，用户在设置里改过之后以配置文件里的 `HidingRuleset` 为准。

## 与宿主窗口交互

`BuildView` 收到的 `IToolbarHost` 只有三个成员（`FloatingToolbar\IToolbarHost.cs`）：

```csharp
/// 工具栏按钮插件与宿主之间的桥梁。Phase 1 粗粒度暴露 MainWindow，后续收窄。
public interface IToolbarHost
{
    MainWindow Window { get; }
    void RegisterView(string id, FrameworkElement view);
    FrameworkElement FindView(string id);
}
```

接口注释直说了这是临时设计：直接把整个 `MainWindow` 暴露出去，内置项想干什么都行。

::: warning 插件拿不到 IToolbarHost
`IToolbarHost` 只出现在 `BuildView(IToolbarHost host)` 的签名里。插件注册用的是 `PluginToolbarItemInfo.ViewFactory`，是个无参 `Func<FrameworkElement>`，**没有 host 参数**。

插件要影响窗口状态得走 `IWindowService`、`IEventService` 这些正式服务接口。见 [宿主服务](../plugin/host-services)。
:::

`RegisterView` / `FindView` 是给项之间互相找视图用的，按字符串 id 存取。

## 尺寸约定

工具栏内容区固定 58 DIP。横排时这是高度，竖排时是宽度。自定义视图按这个尺寸设计，超出会被裁切。

方向变化通过 `ApplyOrientation` 通知。默认实现是空的，不重写也能跑，但竖排时布局可能变形。

## 插件项的适配层

`PluginToolbarItemWrapper`（在 `ToolbarRegistry.cs` 里，`internal`）负责把插件的声明式描述翻译成 `IToolbarItem`：

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

三个 `Default*` 属性都是写死的常量，插件改不了。所以插件按钮永远和相邻按钮共用圆角边框（`DefaultShowSeparateBorder = false`）。

包装器还负责弹窗：`PopupContentFactory` 非空时自动建 `Popup`、接线按钮点击、注册到 `PopupManager`、处理定位与动画。细节见 [UI 集成 — 弹窗](../plugin/ui-integration#弹窗)。

## 下一步

- [UI 集成](../plugin/ui-integration) — 插件侧如何注册工具栏项
- [主窗口](./mainwindow) — 工具栏挂在主窗口的哪一层
- [代码规范](./conventions) — 工具栏相关的 XAML 规范
