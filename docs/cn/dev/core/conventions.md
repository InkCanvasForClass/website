---
title: 代码规范
description: rules 目录的强制规范、WPF 陷阱与提交前检查
---

# 代码规范

规范的权威来源是 `community/rules/` 目录下的 10 个 Markdown 文件，共约 1900 行。本页把最常踩到的部分整理出来，细节以原文为准。

| 文件 | 行数 | 内容 |
| --- | --- | --- |
| `Ink Canvas 设置完整目录.md` | 537 | 全部设置项的清单 |
| `settings_pages.md` | 378 | 设置页面的开发流程 |
| `xaml_controls.md` | 282 | 控件选型的强制规范 |
| `toolbar.md` | 199 | 工具栏 |
| `general.md` | 164 | 通用规范与 WPF 陷阱 |
| `chat_log_board_toolbar.md` | 153 | 白板工具栏 |
| `popups_menus.md` | 73 | 弹窗与菜单 |
| `build.md` | 57 | 构建 |
| `project_rules.md` | 33 | 索引，指向其余文件 |
| `消息去重说明.md` | 11 | 消息去重 |

## 硬性规定

### 带开关的设置项必须用 LabeledSettingsCard

> 所有需要展示 ToggleSwitch 开关的设置项，**必须**使用 `controls:LabeledSettingsCard` 控件，而不要手动用 `ui:SettingsCard` 内嵌 `ui:ToggleSwitch`。

```xml
<controls:LabeledSettingsCard x:Name="CardShowCursor"
    Header="显示画笔光标"
    Description="绘制时显示光标位置。"
    Icon="{x:Static ui:SegoeFluentIcons.TouchPointer}"
    SwitchName="ToggleSwitchShowCursor" />
```

可用属性：`Header`、`Description`、`Icon`（`FontIconData?`）、`IconSource`、`HeaderIcon`、`IsOn`、`SwitchName`、`ShowWhen`、`Toggled`。

`ShowWhen` 为 false 时卡片折叠，用来做联动显示：

```xml
<controls:LabeledSettingsCard x:Name="CardSomeOption"
    Header="某选项"
    ShowWhen="{Binding IsOn, ElementName=CardParentOption}" />
```

非开关类的设置项才用 `ui:SettingsCard`，右侧可以放 ComboBox、Slider、Button。跳转型卡片设 `IsClickEnabled="True"` 加 `Click`，并且**不要在右侧内容区放控件**。

### ComboBox 不能设宽度

> 所有 `<ComboBox>` 控件不得设置 `Width`、`MinWidth` 或 `MaxWidth` 属性

让它按内容自适应。看到已有的宽度属性应当删掉。

::: tip Slider 可以设 Width
限制只针对 ComboBox。规范里的 Slider 示例就写着 `Width="200"`。
:::

### 用户可见文本必须走 i18n

```xml
<Label Content="{i18n:I18n Key=Some_Text_Key}" />
```

> 不要在 XAML 或代码中直接写死中文/英文文本。

导航栏文字**必须**用 `NavStrings` 资源文件里的字符串，不得自行编写。

### 命名

- 方法名 PascalCase，变量名 camelCase
- 私有字段加 `_` 前缀，如 `_stylusDownTimestamp`
- XAML 控件名和资源键都用 PascalCase，如 `CardEnableInkFade`、`PivotHeaderItemFontSize`

## 设置页的固定写法

事件处理器有固定结构，`_isLoaded` 守卫不能省：

```csharp
private void CardEnableInkFade_Toggled(object sender, RoutedEventArgs e)
{
    if (!_isLoaded) return;
    SettingsManager.Settings.Canvas.EnableInkFade = CardEnableInkFade.IsOn;
    SettingsManager.SaveSettingsToFile();
}
```

`_isLoaded` 防止页面初始化期间把默认值当成用户操作写回配置。

Slider 多一步文本同步，且**顺序有讲究**：

```csharp
private void SomeSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
{
    UpdateSliderText(SomeSlider, SomeSliderText, "{0:0}");
    if (!_isLoaded) return;
    SettingsManager.Settings.SomeSection.SomeProperty = (int)e.NewValue;
    SettingsManager.SaveSettingsToFile();
}
```

> `UpdateSliderText` 必须在 `_isLoaded` 检查之前调用，确保初始值显示

写反了页面加载时 TextBlock 会是空的。`UpdateSliderText` 这个辅助方法**每个设置页都要自己写一份**。

新增设置项的完整流程：加 XAML 卡片 → 加事件处理器 → 在 `LoadSettings()` 里回填控件状态 → 在使用处读 `Settings`。纯数据设置（无 UI）只需在 `Settings.cs` 加属性。

::: danger 新增设置页要注册到两个字典
`SettingsWindow.xaml.cs` 里有**两个**页面类型字典，加新页面时必须同时注册到两个。漏一个的表现是导航静默失败——`NavigateToPage()` 找不到类型时直接 `return`，不抛异常也没有提示。

规范建议加日志：

```csharp
if (!_pageTypes.TryGetValue(pageTag, out Type pageType))
{
    LogHelper.WriteLogToFile($"NavigateToPage 找不到页面类型 [{pageTag}]", LogHelper.LogType.Warning);
    return;
}
```
:::

## WPF 陷阱

`general.md` 里记录的几个，都是踩过的。

### Geometry 是冻结的

`Geometry.Parse()` 返回只读对象，直接改属性会抛 `InvalidOperationException`：

```csharp
// ❌ 错误
drawing.Geometry.Transform = new ScaleTransform(1.5, 1.5);

// ✅ 正确：先 Clone() 再修改
var geo = drawing.Geometry.Clone();
geo.Transform = new ScaleTransform(1.5, 1.5);
drawing.Geometry = geo;
```

### AfterBuild 里控件还没初始化

工具栏按钮的 `AfterBuild` 回调里视觉树可能还不完整，`FindVisualChild` 返回 null。**异常会被 try-catch 吞掉**，表现为「样式没生效但没报错」。要操作视觉树就推迟到 `Loaded`：

```csharp
protected override void AfterBuild(IBoardToolbarHost host, BoardToolbarButton view)
{
    view.Loaded += (s, e) =>
    {
        // 此时控件已完全初始化
    };
}
```

### Page 命名空间冲突

`iNKORE.UI.WPF.Modern.Controls.Page` 和 `System.Windows.Controls.Page` 有歧义，需要显式 using：

```csharp
using Page = iNKORE.UI.WPF.Modern.Controls.Page;
using SimpleStackPanel = iNKORE.UI.WPF.Controls.SimpleStackPanel;
```

### Thickness 没有双参数构造

.NET 6 SDK 下 `new Thickness(4, 2)` 编译报错，必须写四个参数 `new Thickness(4, 2, 4, 2)`。

### SegoeFluentIcons 的键不一定存在

不是所有枚举值都可用。规范里点名 `SegoeFluentIcons.Whiteboard` **不存在**，要用 `SegoeFluentIcons.Edit` 代替。用之前先确认。

## 墨迹相关的两条约定

激光笔渐隐的时长构成：

- 显示时长 = `InkFadeTime` 滑块的固定值
- 渐隐动画时长 = `书写时长 / 倍速`
- 总时长 = 两者之和

`DrawingAttributes.IsHighlighter` 的取值规则：

| 笔类型 | `IsHighlighter` |
| --- | --- |
| 普通笔 | `false` |
| 荧光笔 | `!HighlighterOverlapEnabled` |
| 激光笔 | `false` |

::: warning 荧光笔的取值是反的
开启「重叠加深」时 `IsHighlighter` 反而是 `false`。因为 WPF 的荧光笔模式本身不叠加，要实现叠加效果必须用正常绘制模式。
:::

## 构建配置

`Directory.Build.props` 在仓库根目录，统一注入版本号工具：

```xml
<PackageReference Include="Nerdbank.GitVersioning" Condition="!Exists('packages.config')">
  <PrivateAssets>all</PrivateAssets>
  <Version>3.9.50</Version>
</PackageReference>
```

条件 `!Exists('packages.config')` 排除了老式项目（VSTO 加载项用的是 packages.config）。

另外定义了一个标记属性：

```xml
<NBGVProvidedByDirectoryBuildProps>true</NBGVProvidedByDirectoryBuildProps>
```

::: tip 这个属性是给 PluginSdk 用的
注释说明了用途：`InkCanvas.PluginSdk` 需要能独立构建，所以自己也引用了 NBGV。在仓库树内构建时靠这个属性避免重复引用产生 `NU1504` 警告。

单独拿 PluginSdk 出去构建时没有 `Directory.Build.props`，属性不存在，它自己的引用就生效了。
:::

`NBGV_CacheMode` 设为 `None`。

## 代码组织

- 主窗口代码按功能拆到 `MainWindow_cs/`，见 [主窗口](./mainwindow)
- 新功能放进对应的功能文件，或者新建一个功能文件

## 提交前

参照 [参与贡献](../getting-started/contributing)：跑一遍 `dotnet build`，确认没有引入新的警告，改动涉及 UI 的话截图对比。CI 会跑 `prcheck.yml`，包括 VSTO 加载项的产物检查。

## 下一步

- [参与贡献](../getting-started/contributing) — PR 流程
- [设置系统](./settings) — `Settings` 对象结构
- [工具栏系统](./toolbar) — 工具栏专属规范
