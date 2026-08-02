---
title: UI Integration
description: Toolbar items, popups, custom settings, and plugin views
---

# UI Integration

<UnderConstruction />

There are only two legitimate ways for a plugin to put something on screen: register a button on the floating toolbar, or provide the two views `GetMainView()` / `GetSettingsView()`. The former is what the vast majority of plugins do.

## Registering a toolbar item

`IPluginHost.RegisterToolbarItem()` takes a `PluginToolbarItemInfo`. Every field of that class (`InkCanvas.PluginSdk/IPluginHost.cs`):

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

The smallest usable registration looks like this:

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

::: warning The Id must be globally unique and must never change
`ToolbarRegistry.RegisterPluginItem()` deduplicates by `Id` (`OrdinalIgnoreCase`), and on a duplicate registration **the second one is simply discarded without an error**. The `Id` also gets written into the user's toolbar layout configuration, so changing it makes the button vanish from the user's interface. A form like `pluginid.componentname` is recommended.
:::

### It appears on the toolbar automatically after registration

The second parameter of `RegisterPluginItem`, `autoAddToActiveConfig`, defaults to `true`, so the host writes the component into the currently active toolbar configuration:

```csharp
layout.Components.Add(new ToolbarComponentEntry
{
    Id = itemId,
    HidingRuleset = ToolbarRuleset.AlwaysShow().WithHideOnCollapsed()
});
SaveConfigFile(configName, layout);
```

In other words, a plugin button defaults to "always shown, but hidden when the toolbar is folded". The user can adjust its position and visibility rules later in the settings; the configuration lives in `Configs/ToolbarConfigs/<name>.json`.

::: tip When to register
`RegisterToolbarItem` must be called inside `Initialize`. `ToolbarRegistry.Discover()` caches its results (the `_items` field), but `RegisterPluginItem` appends a `PluginToolbarItemWrapper` even when the cache is already built, so registering later does take effect — except the toolbar may already have been rendered, in which case the button only appears on the next rebuild. Don't gamble on that; register in `Initialize` like you're supposed to.
:::

## How a plugin item becomes a built-in item

Internally, every toolbar item in the host is an `IToolbarItem`. A plugin supplies a `PluginToolbarItemInfo`, and the two are bridged by `PluginToolbarItemWrapper` (`Ink Canvas/Controls/Toolbar/FloatingToolbar/ToolbarRegistry.cs`):

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

Two things worth noting: `IconKey` is always `null`, so plugins **can only supply a vector path icon via `IconGeometry`** and cannot use the host's built-in font icon set; and `DefaultShowSeparateBorder` is always `false`, so a plugin button always shares a rounded border with its neighbors.

## Popups

Just assign `PopupContentFactory` and the wrapper creates a `Popup` for you, wires up the button click, registers it with the host's popup manager, and handles positioning (directly above the button, with 8px of spacing). You do not need to write the Popup yourself.

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

What the wrapper does, in order:

1. Creates a `Popup` with `AllowsTransparency = true`, `StaysOpen = true`, `Focusable = true`
2. Calls `mw.GetPopupManager()?.RegisterPopup(popup)` when the button is `Loaded`
3. On click, first calls `mw.CloseAllPopups()` to dismiss other popups, then opens its own with a slide-and-fade animation
4. Once open, moves focus to the first focusable element inside the popup content

::: warning There's a catch in wiring up the close button
If what you return is a `PopupShellContent` / `PopupTabShellContent`, the title bar's close button is wired up directly. But plugins usually return an outer `UserControl` with the shell nested inside (PdfReader's `ReaderPopupContent` is exactly that shape).

In that case the wrapper searches the visual tree recursively for the shell before wiring it, and **retries once after `popup.Opened`** — because the child visual tree may not have been expanded while the popup was closed. The source comment puts it bluntly: otherwise clicking the title bar's close button does nothing.

The conclusion: nesting is supported, but your shell must genuinely be findable in the visual tree. Hiding it inside a template behind an `x:Name`, or creating it later at some other moment, will break the close button.
:::

## Declarative custom settings

A plugin button can have its own settings that show up in the host's toolbar settings UI. Declare them with `CustomSettings`:

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

There are only three control types, and no others. The relationship between `Options` and `OptionValues` is spelled out in the SDK comments:

> The stored values for ComboBox options. If the count matches `Options`, then `Options` is used as the display text and `OptionValues` as the stored values; otherwise `Options` serves as both display text and stored value.

Once the user changes a setting, the host notifies you through the `ApplySettings` callback:

```csharp
ApplySettings = (view, settings) =>
{
    if (settings.TryGetValue("mode", out var mode))
        ((MyView)view).Mode = mode?.ToString();
}
```

::: tip The value types in the settings dictionary are unreliable
This dictionary comes from `ToolbarComponentEntry.Settings` (a `Dictionary<string, object>`) deserialized by Newtonsoft.Json. A number may arrive as a `long`, an `int`, or a `double` depending on how it was written in the JSON. Built-in items use helpers like `GetSettingDouble()` for tolerant parsing; on the plugin side you have to check the type yourself, or just `ToString()` and parse.
:::

`PluginToolbarSettingInfo` is defined in the PluginSdk, and the host's `IToolbarItem` interface uses the very same type:

```csharp
IReadOnlyList<PluginToolbarSettingInfo> CustomSettings => System.Array.Empty<PluginToolbarSettingInfo>();
```

That's why built-in items and plugin items can share one settings description model and the same settings UI.

## Adapting to horizontal and vertical orientation

The toolbar can dock to different screen edges, which changes its orientation. The host notifies you through `ApplyOrientation`:

```csharp
ApplyOrientation = (view, orientation) =>
{
    if (view is StackPanel sp) sp.Orientation = orientation;
}
```

Things still work without implementing it, but your component may end up squashed when the toolbar is vertical. The content area the host gives you is fixed at 58 DIP (the height when horizontal, the width when vertical); design to that size.

## Plugin views

`PluginBase` provides two overridable methods, both returning `null` by default:

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

The return type is `object` rather than `FrameworkElement`, so that the SDK doesn't force a dependency on WPF types. Returning a WPF control is fine in practice.

::: warning The host's consumption point for these two methods is unconfirmed
Judging by its name, `GetSettingsView()` ought to be used by the host's plugin management UI to render a plugin-specific settings page, but this pass did not verify a concrete call site in the main program. If you want a settings UI for your plugin, the safer route is the declarative `CustomSettings` above — that code path is complete and traceable.
:::

## Interacting with the host window

`IToolbarHost` has just three members (`FloatingToolbar/IToolbarHost.cs`), and the interface comment admits the design is provisional:

```csharp
/// 工具栏按钮插件与宿主之间的桥梁。Phase 1 粗粒度暴露 MainWindow，后续收窄。
public interface IToolbarHost
{
    MainWindow Window { get; }
    void RegisterView(string id, FrameworkElement view);
    FrameworkElement FindView(string id);
}
```

But `IToolbarHost` only ever appears in the signature of `IToolbarItem.BuildView(IToolbarHost host)` — plugins go through `ViewFactory` and **never receive the `host` parameter**. So a plugin that wants to affect window state has to use interfaces like `IWindowService` and `IEventService` from [Host Services](./host-services), not `IToolbarHost`.

## Next steps

- [Host Services](./host-services) — the 13 available service interfaces
- [Packaging](./packaging) — the `.icpx` layout and CI validation
- [Toolbar System](../core/toolbar) — the full host-side toolbar implementation
