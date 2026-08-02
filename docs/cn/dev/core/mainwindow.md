---
title: 主窗口
description: MainWindow 的 42 个 partial 文件与查找方法
---

# 主窗口

<UnderConstruction />

`MainWindow` 是一个巨型 partial 类，代码分散在 `MainWindow_cs\` 下的 **42 个 `.cs` 文件**里，总量约三万行。找代码的第一个障碍就是「这功能在哪个文件」。

## 文件不需要注册

`InkCanvasForClass.csproj` 是 SDK 风格项目，**没有任何 `<Compile Include>` 条目**指向 `MainWindow_cs`。整个目录靠 SDK 默认通配符自动纳入编译。

::: tip 新增 partial 文件直接放进去就行
不用改 csproj，不用在 VS 里「添加现有项」。文件丢进 `MainWindow_cs\` 保存即可参与编译。同理，删文件也不用清理 csproj。
:::

`MainWindow_cs` 下**没有子目录**，42 个文件全部平铺。

## 文件清单

按行数排序（前 21 个）：

| 文件 | 行数 | 负责 |
| --- | --- | --- |
| `MW_FloatingBarIcons.cs` | 6162 | 浮动栏图标与交互 |
| `MW_PPT.cs` | 3703 | PPT 联动 |
| `MW_SimulatePressure&InkToShape.cs` | 3482 | 压感模拟 + 墨迹转形状 |
| `MW_ElementsControls.cs` | 3110 | 画布元素控件 |
| `MW_ShapeDrawing.cs` | 3070 | 形状绘制 |
| `MW_TouchEvents.cs` | 2825 | 触摸事件 |
| `MW_VideoPresenter.cs` | 2750 | 视频展台 |
| `MW_Timer.cs` | 1785 | 计时器 |
| `MW_Save&OpenStrokes.cs` | 1623 | 墨迹存取 |
| `MW_Settings.cs` | 1571 | 设置交互 |
| `MW_SelectionGestures.cs` | 1528 | 选择手势 |
| `MW_NativeWetInk.cs` | 1476 | 原生湿墨迹 |
| `MW_Colors.cs` | 1214 | 颜色 |
| `MW_ImageInsert.cs` | 1151 | 图片插入 |
| `MW_CanvasComposition.cs` | 992 | 画布合成 |
| `MW_SettingsToLoad.cs` | 922 | 设置加载到界面 |
| `MW_BoardControls.cs` | 862 | 白板控件 |
| `MW_AutoFold.cs` | 756 | 自动折叠 |
| `MW_BoardToolbarHost.cs` | 663 | 白板工具栏宿主 |
| `MW_TimeMachine.cs` | 663 | 撤销/重做 |
| `MW_TrayIcon.cs` | 655 | 托盘图标 |

余下 21 个文件都在 600 行以下。

::: warning 两个文件名里带 &
`MW_SimulatePressure&InkToShape.cs` 和 `MW_Save&OpenStrokes.cs` 的文件名含 `&`。在 PowerShell 里直接写路径会被当成命令分隔符，必须加引号：

```powershell
Get-Content "MainWindow_cs\MW_Save&OpenStrokes.cs"
```

某些 shell 脚本和构建工具里也需要转义。
:::

::: tip MW_Eraser.xaml 不是代码后置文件
`MainWindow_cs\` 里还有一个 `MW_Eraser.xaml`，但它是一个 `ResourceDictionary`，装的是橡皮擦的 `DrawingImage` 资源，**没有对应的 `MW_Eraser.xaml.cs`**。别按 XAML + code-behind 配对的思路去找它的后台代码。
:::

## 怎么找代码

文件名前缀统一是 `MW_`，后面是功能域。命名基本可以直接读，但有几个不那么直观的对应关系：

- 浮动工具栏的**按钮点击逻辑**在 `MW_FloatingBarIcons.cs`（6162 行，最大的文件），不在 `MW_BoardToolbarHost.cs`
- **撤销/重做**在 `MW_TimeMachine.cs`
- **设置项加载到界面**在 `MW_SettingsToLoad.cs`，**设置项的交互响应**在 `MW_Settings.cs`——两个不同的文件
- 压感和墨迹转形状被塞进了同一个文件

拿不准的时候用全局搜索比猜文件名快。找事件处理器就直接搜 XAML 里的处理器名：

```powershell
Get-ChildItem "MainWindow_cs" -Filter *.cs |
    Select-String -Pattern "private void ButtonName_Click"
```

## 分文件的代价

partial 类不隔离状态。42 个文件共享同一批私有字段，任何一个文件都能读写其他文件定义的字段。

::: danger 加字段前先全局搜一遍
`MainWindow` 的字段散落在 42 个文件里。加新字段时同名冲突不一定马上暴露在你正在编辑的文件里，编译错误可能指向另一个你没打开过的文件。

同样，改一个字段的语义要搜遍所有 42 个文件确认没有别处依赖，`Find All References` 是刚需。
:::

## 相关的另一处拆分

`MainWindow.xaml` 本身也很大，主画布 `inkCanvas` 在 L217。墨迹相关的细节见 [墨迹系统](./inking)。

浮动栏和白板工具栏的布局不在 `MainWindow.xaml` 里硬编码，走配置文件，见 [工具栏系统](./toolbar)。

## 下一步

- [墨迹系统](./inking) — `inkCanvas` 与编辑模式
- [工具栏系统](./toolbar) — 工具栏配置与渲染
- [代码规范](./conventions) — 改 XAML 和设置页时的强制规范
