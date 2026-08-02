---
title: Toolbar System
description: Two independent toolbar systems, item discovery, and layout persistence
---

# Toolbar System

<HelpUsImprove />

What lives under `Ink Canvas\Controls\Toolbar\` is really **two unrelated systems** with no shared interface or base class:

```
Controls\Toolbar\
├── FloatingToolbar\      the main window's floating toolbar
├── BoardToolbar\         the whiteboard toolbar
└── ToolsMenuRegistry.cs  the tools menu
```

`FloatingToolbar` uses `IToolbarItem` and `BoardToolbar` uses `IBoardToolbarItem`. The two interfaces have different signatures and their implementations are written separately. Adding a button to both means writing it twice. Plugins can only register with `FloatingToolbar`.

::: warning Do not try to unify them
Judging by the names these two "ought to" be abstracted into one system, but they are not. Changing one side does not affect the other, so when reading the code, first confirm which directory you are in.
:::

## IToolbarItem

The item interface for the floating toolbar is only 44 lines in total (`FloatingToolbar\IToolbarItem.cs`):

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

The last four members use C# 8 default interface members, so implementations can ignore them.

There are two routes for icons: `IconGeometry` is Path vector data, while `IconKey` refers to the host's built-in font icon set. Built-in items can use either, but **a plugin item's `IconKey` is always `null`** and can only use `IconGeometry`.

The type of `CustomSettings`, `PluginToolbarSettingInfo`, comes from the PluginSdk. Built-in host items and plugin items share the same description type, so the toolbar settings UI only needs one rendering implementation. `CustomSettingsPanelFactory` takes precedence: provide it and it fully takes over the settings panel, and `CustomSettings` is ignored.

## How items get discovered

`ToolbarRegistry.Discover()` scans the current assembly with reflection:

```csharp
var items = typeof(ToolbarRegistry).Assembly.GetTypes()
    .Where(t => typeof(IToolbarItem).IsAssignableFrom(t)
                && !t.IsInterface && !t.IsAbstract)
    .Select(t => Activator.CreateInstance(t) as IToolbarItem)
```

Anything that implements `IToolbarItem`, is not abstract, and has a public parameterless constructor gets discovered automatically. **Adding a built-in button requires no registration anywhere** — just create the class.

The result is cached in the `_items` field and only scanned once.

Plugin items take a different route: `RegisterPluginItem()` wraps a `PluginToolbarItemInfo` in a `PluginToolbarItemWrapper` and adds it to the same collection. They can still be added after the cache has been built. Deduplication is by `Id` (`OrdinalIgnoreCase`), and **a later duplicate is silently discarded without an error**.

## Layout persistence

Toolbar layouts the user has adjusted are stored in:

```
<application directory>\Configs\ToolbarConfigs\<name>.json
```

`<name>` comes from `Settings.ToolbarConfigName` (default `"default"`). The whiteboard toolbar uses a different key, `Settings.BoardToolbarConfigName`, and a separate configuration file.

A `.json.bak` backup is written before saving, so a corrupted configuration file can be rolled back.

Each entry in a layout is a `ToolbarComponentEntry`:

```csharp
layout.Components.Add(new ToolbarComponentEntry
{
    Id = itemId,
    HidingRuleset = ToolbarRuleset.AlwaysShow().WithHideOnCollapsed()
});
```

`Id` corresponds to `IToolbarItem.Id`. **This is why a plugin item's `Id` must never change** — once it does, entries in old configurations can no longer find their implementation and the button disappears from the user's interface.

The `Settings` field is a `Dictionary<string, object>` holding that item's custom setting values. After a Newtonsoft.Json round trip the numeric type is not guaranteed (it may be `long`/`int`/`double`), so built-in host items use methods like `GetSettingDouble()` to parse them tolerantly.

## Visibility rules

`ToolbarRuleset` decides when an item is shown. It is built fluently:

```csharp
ToolbarRuleset.AlwaysShow().WithHideOnCollapsed()
```

That is the default for plugin items — always shown, but hidden when the toolbar is collapsed.

`IToolbarItem.DefaultHidingRuleset` is only a **default**. Once the user changes it in settings, the `HidingRuleset` in the configuration file wins.

## Interacting with the host window

The `IToolbarHost` passed to `BuildView` has only three members (`FloatingToolbar\IToolbarHost.cs`):

```csharp
/// 工具栏按钮插件与宿主之间的桥梁。Phase 1 粗粒度暴露 MainWindow，后续收窄。
public interface IToolbarHost
{
    MainWindow Window { get; }
    void RegisterView(string id, FrameworkElement view);
    FrameworkElement FindView(string id);
}
```

The interface comment says outright that this is a temporary design: it exposes the entire `MainWindow`, so built-in items can do whatever they like.

::: warning Plugins do not get an IToolbarHost
`IToolbarHost` only appears in the signature of `BuildView(IToolbarHost host)`. Plugins register through `PluginToolbarItemInfo.ViewFactory`, a parameterless `Func<FrameworkElement>` with **no host parameter**.

To affect window state, a plugin must go through the formal service interfaces such as `IWindowService` and `IEventService`. See [Host services](../plugin/host-services).
:::

`RegisterView` / `FindView` exist so items can locate each other's views, stored and retrieved by string id.

## Size conventions

The toolbar content area is fixed at 58 DIP. Horizontally that is the height; vertically it is the width. Design custom views to that size — anything larger gets clipped.

Orientation changes are announced through `ApplyOrientation`. The default implementation is empty, so you can skip overriding it, but the layout may look distorted in the vertical arrangement.

## The plugin item adapter layer

`PluginToolbarItemWrapper` (inside `ToolbarRegistry.cs`, `internal`) translates a plugin's declarative description into an `IToolbarItem`:

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

All three `Default*` properties are hardcoded constants that plugins cannot change. As a result, plugin buttons always share the rounded border with their neighbors (`DefaultShowSeparateBorder = false`).

The wrapper also handles popups: when `PopupContentFactory` is non-null it automatically creates the `Popup`, wires up the button click, registers with `PopupManager`, and handles positioning and animation. See [UI integration — Popups](../plugin/ui-integration#popups) for details.

## Next steps

- [UI integration](../plugin/ui-integration) — how the plugin side registers toolbar items
- [Main window](./mainwindow) — which layer of the main window the toolbar attaches to
- [Code conventions](./conventions) — toolbar-related XAML rules
