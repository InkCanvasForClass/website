---
title: Code Conventions
description: The mandatory rules in the rules directory, WPF pitfalls, and the pre-commit checklist
---

# Code Conventions

<UnderConstruction />

The authoritative source for the conventions is the 10 Markdown files under `community/rules/`, roughly 1,900 lines in total. This page collects the parts you are most likely to trip over; for details, defer to the originals.

| File | Lines | Contents |
| --- | --- | --- |
| `Ink Canvas 设置完整目录.md` | 537 | A catalogue of every settings item |
| `settings_pages.md` | 378 | The workflow for developing settings pages |
| `xaml_controls.md` | 282 | Mandatory rules for choosing controls |
| `toolbar.md` | 199 | The toolbar |
| `general.md` | 164 | General conventions and WPF pitfalls |
| `chat_log_board_toolbar.md` | 153 | The whiteboard toolbar |
| `popups_menus.md` | 73 | Popups and menus |
| `build.md` | 57 | Building |
| `project_rules.md` | 33 | An index pointing at the other files |
| `消息去重说明.md` | 11 | Message deduplication |

## Hard requirements

### Settings items with a switch must use LabeledSettingsCard

> Every settings item that needs to show a ToggleSwitch **must** use the `controls:LabeledSettingsCard` control, rather than hand-rolling a `ui:SettingsCard` with a nested `ui:ToggleSwitch`.

```xml
<controls:LabeledSettingsCard x:Name="CardShowCursor"
    Header="显示画笔光标"
    Description="绘制时显示光标位置。"
    Icon="{x:Static ui:SegoeFluentIcons.TouchPointer}"
    SwitchName="ToggleSwitchShowCursor" />
```

Available properties: `Header`, `Description`, `Icon` (`FontIconData?`), `IconSource`, `HeaderIcon`, `IsOn`, `SwitchName`, `ShowWhen`, `Toggled`.

When `ShowWhen` is false the card collapses, which is how dependent visibility is done:

```xml
<controls:LabeledSettingsCard x:Name="CardSomeOption"
    Header="某选项"
    ShowWhen="{Binding IsOn, ElementName=CardParentOption}" />
```

Only non-switch settings items use `ui:SettingsCard`, which can host a ComboBox, Slider, or Button on the right. Navigation-style cards set `IsClickEnabled="True"` plus a `Click` handler, and must **not** put controls in the right-hand content area.

### ComboBox must not have a width

> No `<ComboBox>` control may set the `Width`, `MinWidth`, or `MaxWidth` property

Let it size itself to its content. Any existing width property you come across should be deleted.

::: tip Sliders may set Width
The restriction applies only to ComboBox. The Slider example in the rules explicitly uses `Width="200"`.
:::

### User-visible text must go through i18n

```xml
<Label Content="{i18n:I18n Key=Some_Text_Key}" />
```

> Do not hardcode Chinese/English text in XAML or in code.

Navigation-bar text **must** come from the strings in the `NavStrings` resource file and may not be written by hand.

### Naming

- Method names in PascalCase, variable names in camelCase
- Private fields get a `_` prefix, e.g. `_stylusDownTimestamp`
- XAML control names and resource keys both use PascalCase, e.g. `CardEnableInkFade`, `PivotHeaderItemFontSize`

## The fixed shape of a settings page

Event handlers have a fixed structure, and the `_isLoaded` guard cannot be omitted:

```csharp
private void CardEnableInkFade_Toggled(object sender, RoutedEventArgs e)
{
    if (!_isLoaded) return;
    SettingsManager.Settings.Canvas.EnableInkFade = CardEnableInkFade.IsOn;
    SettingsManager.SaveSettingsToFile();
}
```

`_isLoaded` prevents default values from being mistaken for user input and written back to the configuration while the page is initializing.

Sliders need one extra step to sync their text, and **the order matters**:

```csharp
private void SomeSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
{
    UpdateSliderText(SomeSlider, SomeSliderText, "{0:0}");
    if (!_isLoaded) return;
    SettingsManager.Settings.SomeSection.SomeProperty = (int)e.NewValue;
    SettingsManager.SaveSettingsToFile();
}
```

> `UpdateSliderText` must be called before the `_isLoaded` check, so that the initial value is displayed

Get it the wrong way round and the TextBlock will be empty when the page loads. `UpdateSliderText` is a helper that **each settings page has to write for itself**.

The full flow for adding a settings item: add the XAML card → add the event handler → restore the control state in `LoadSettings()` → read `Settings` at the point of use. A pure data setting (with no UI) only needs a property in `Settings.cs`.

::: danger A new settings page must be registered in two dictionaries
`SettingsWindow.xaml.cs` contains **two** page-type dictionaries, and a new page must be registered in both. Missing one shows up as navigation failing silently — when `NavigateToPage()` cannot find the type it just `return`s, without throwing and without any message.

The rules recommend adding a log line:

```csharp
if (!_pageTypes.TryGetValue(pageTag, out Type pageType))
{
    LogHelper.WriteLogToFile($"NavigateToPage 找不到页面类型 [{pageTag}]", LogHelper.LogType.Warning);
    return;
}
```
:::

## WPF pitfalls

The ones recorded in `general.md` — all learned the hard way.

### Geometry is frozen

`Geometry.Parse()` returns a read-only object; assigning to its properties throws `InvalidOperationException`:

```csharp
// ❌ 错误
drawing.Geometry.Transform = new ScaleTransform(1.5, 1.5);

// ✅ 正确：先 Clone() 再修改
var geo = drawing.Geometry.Clone();
geo.Transform = new ScaleTransform(1.5, 1.5);
drawing.Geometry = geo;
```

### Controls are not yet initialized in AfterBuild

Inside a toolbar button's `AfterBuild` callback the visual tree may still be incomplete and `FindVisualChild` returns null. **The exception gets swallowed by a try-catch**, which shows up as "the style didn't apply but there's no error". If you need to touch the visual tree, defer to `Loaded`:

```csharp
protected override void AfterBuild(IBoardToolbarHost host, BoardToolbarButton view)
{
    view.Loaded += (s, e) =>
    {
        // 此时控件已完全初始化
    };
}
```

### Page namespace conflict

`iNKORE.UI.WPF.Modern.Controls.Page` and `System.Windows.Controls.Page` are ambiguous, so an explicit using is required:

```csharp
using Page = iNKORE.UI.WPF.Modern.Controls.Page;
using SimpleStackPanel = iNKORE.UI.WPF.Controls.SimpleStackPanel;
```

### Thickness has no two-argument constructor

Under the .NET 6 SDK, `new Thickness(4, 2)` fails to compile; you must write all four arguments: `new Thickness(4, 2, 4, 2)`.

### SegoeFluentIcons keys do not always exist

Not every enum value is available. The rules call out that `SegoeFluentIcons.Whiteboard` **does not exist** and that `SegoeFluentIcons.Edit` should be used instead. Verify before using one.

## Two ink-related conventions

How the laser pointer's fade duration is composed:

- Display duration = the fixed value of the `InkFadeTime` slider
- Fade animation duration = `writing duration / speed multiplier`
- Total duration = the sum of the two

The rules for the value of `DrawingAttributes.IsHighlighter`:

| Pen type | `IsHighlighter` |
| --- | --- |
| Normal pen | `false` |
| Highlighter | `!HighlighterOverlapEnabled` |
| Laser pointer | `false` |

::: warning The highlighter's value is inverted
With "darken on overlap" enabled, `IsHighlighter` is actually `false`. That's because WPF's highlighter mode does not accumulate by itself, so achieving the overlap effect requires the normal drawing mode.
:::

## Build configuration

`Directory.Build.props` sits at the repository root and injects the versioning tool uniformly:

```xml
<PackageReference Include="Nerdbank.GitVersioning" Condition="!Exists('packages.config')">
  <PrivateAssets>all</PrivateAssets>
  <Version>3.9.50</Version>
</PackageReference>
```

The `!Exists('packages.config')` condition excludes legacy-style projects (the VSTO add-in uses packages.config).

There is also a marker property:

```xml
<NBGVProvidedByDirectoryBuildProps>true</NBGVProvidedByDirectoryBuildProps>
```

::: tip This property exists for the PluginSdk
The comment explains why: `InkCanvas.PluginSdk` has to be buildable on its own, so it references NBGV itself. When building inside the repository tree, this property is what prevents the duplicate reference from producing an `NU1504` warning.

When you take PluginSdk out and build it standalone, there is no `Directory.Build.props`, the property does not exist, and its own reference kicks in.
:::

`NBGV_CacheMode` is set to `None`.

## Code organization

- Main-window code is split by feature into `MainWindow_cs/` — see [Main Window](./mainwindow)
- Put new functionality into the matching feature file, or create a new feature file

## Before committing

Follow [Contributing](../getting-started/contributing): run `dotnet build`, confirm no new warnings were introduced, and if the change touches the UI, attach before/after screenshots. CI runs `prcheck.yml`, which includes the output check for the VSTO add-in.

## Next steps

- [Contributing](../getting-started/contributing) — the PR process
- [Settings System](./settings) — the structure of the `Settings` object
- [Toolbar System](./toolbar) — toolbar-specific conventions
