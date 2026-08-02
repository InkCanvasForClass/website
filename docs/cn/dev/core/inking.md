---
title: 墨迹系统
description: 逻辑工具与编辑模式、TimeMachine 撤销栈
---

# 墨迹系统

<UnderConstruction />

主画布是一个 WPF `InkCanvas`，`x:Name="inkCanvas"`，在 `MainWindow.xaml:217`，外面套着 `<Grid Name="InkCanvasGridForInkReplay">`。

XAML 里接的关键事件：

```xml
EditingModeChanged="inkCanvas_EditingModeChanged"
StrokeCollected="inkCanvas_StrokeCollected"
SelectionChanged="inkCanvas_SelectionChanged"
ForceCursor="True" UseCustomCursor="True"
```

::: warning EditingMode 在 XAML 里没有绑定
主画布的 `EditingMode` **完全靠 C# 代码赋值**，全项目有 77 处赋值点。想知道当前模式为什么是这个值，只能靠搜索赋值点，没有一个绑定源可看。

唯一在 XAML 里硬编码 `EditingMode` 的是回放画布：`<InkCanvas Name="InkCanvasForInkReplay" ... EditingMode="None">`（`MainWindow.xaml:1094`）。
:::

## 逻辑工具 ≠ 编辑模式

用户选的「工具」和 WPF 的 `InkCanvasEditingMode` 不是一回事。程序内部有自己的一套工具枚举：

```csharp
internal enum LogicalInkTool
{
    Cursor,
    Pen,
    PointEraser,
    StrokeEraser,
    Select,
    Shape,
    BoardRoam
}
```

（`Ink\Native\NativeInkInputRouter.cs:5`）

`PointEraser` 和 `StrokeEraser` 是两种橡皮，`Shape` 和 `BoardRoam` 在 WPF 里根本没有对应的编辑模式，需要额外的输入处理。映射由 `NativeInkInputRouter` 负责。

::: tip 改工具行为改的是 LogicalInkTool 那一层
直接给 `inkCanvas.EditingMode` 赋值会绕过路由逻辑，工具栏状态、光标、手势判定可能对不上。
:::

`GridInkCanvasSelectionCover` 是选择拖动用的覆盖层，背景 `#01FFFFFF`、`Opacity="0.01"`——几乎透明但能接收命中测试，处理逻辑在 `MW_SelectionGestures.cs:536` 起。

## TimeMachine：撤销/重做

撤销栈的实现在 `Helpers\TimeMachine.cs`（270 行），调用方在 `MainWindow_cs\MW_TimeMachine.cs`（663 行）。

核心状态只有两个字段：

```csharp
private readonly List<TimeMachineHistory> _currentStrokeHistory = new List<TimeMachineHistory>();
private int _currentIndex = -1;
```

一个列表加一个游标。**撤销不删除历史项**，只是把游标往回挪：

```csharp
public TimeMachineHistory Undo()
{
    ...
    var item = _currentStrokeHistory[_currentIndex];
    item.StrokeHasBeenCleared = !item.StrokeHasBeenCleared;
    _currentIndex--;
```

注意 `StrokeHasBeenCleared` 是**取反**而不是置 true。这个标志表示「这条历史当前是生效还是被撤销」，`Redo()` 里同样取反一次翻回来。

::: danger Undo 会修改历史项本身
`Undo()` / `Redo()` 直接改了 `item.StrokeHasBeenCleared`。也就是说 `TimeMachineHistory` 是可变对象，同一个实例在撤销/重做之间来回翻转。不要缓存这些对象的状态，也不要在别处持有引用后假设它不变。
:::

### 提交新操作会截断重做链

每个 `Commit*` 方法开头都有同一段：

```csharp
if (_currentIndex + 1 < _currentStrokeHistory.Count)
{
    _currentStrokeHistory.RemoveRange(_currentIndex + 1, (_currentStrokeHistory.Count - 1) - _currentIndex);
}
```

撤销几步之后再画一笔，被撤销的那些操作就永久丢失了。标准的撤销栈语义。

### 六种历史类型

```csharp
public enum TimeMachineHistoryType
{
    UserInput,
    ShapeRecognition,
    Clear,
    Manipulation,
    DrawingAttributes,
    ElementInsert // 新增
}
```

对应六个提交方法：

| 类型 | 提交方法 | 记录内容 |
| --- | --- | --- |
| `UserInput` | `CommitStrokeUserInputHistory` | 新画的笔迹 |
| `ShapeRecognition` | `CommitStrokeShapeHistory` | 生成的形状 + 被替换的原笔迹 |
| `Clear` | （带 sourceStroke 的构造） | 清空 |
| `Manipulation` | `CommitStrokeManipulationHistory` | 每条笔迹变换前后的 `StylusPointCollection` |
| `DrawingAttributes` | — | 变换前后的 `DrawingAttributes` |
| `ElementInsert` | `CommitElementInsertHistory` | 插入的 `UIElement` |

`Manipulation` 和 `DrawingAttributes` 用字典存新旧两份值，代码里的注释说明了顺序：

```csharp
//这里说一下 Tuple的 Value1 是初始值 ; Value 2 是改变值
public Dictionary<Stroke, Tuple<StylusPointCollection, StylusPointCollection>> StylusPointDictionary;
```

::: warning TimeMachineHistory 是字段而非属性，且有 5 个构造函数
类里全是 public 字段（`CommitType`、`CurrentStroke`、`ReplacedStroke`…），5 个重载构造函数各自只填其中一部分，**其余字段保持 null**。

所以拿到一个 `TimeMachineHistory` 必须先看 `CommitType` 再决定读哪个字段，读错了就是 `NullReferenceException`。加新历史类型时记得同步 `MW_TimeMachine.cs` 里的 switch。
:::

### 一个特殊方法

```csharp
public bool TryReplaceLastUserInputHistory(StrokeCollection stroke)
```

只在最后一条是**未被撤销的 `UserInput`** 时才替换成功，否则返回 false。用于笔迹提交后又被修正的场景（比如压感重算），避免产生两条历史。

### 状态通知

```csharp
public bool CanUndo => _currentIndex > -1;
public bool CanRedo => _currentStrokeHistory.Count > 0 && _currentStrokeHistory.Count - _currentIndex - 1 > 0;
```

每次变更都会触发 `OnUndoStateChanged` / `OnRedoStateChanged`，工具栏的撤销/重做按钮靠这两个事件置灰。

### 导出会丢弃重做链

```csharp
public TimeMachineHistory[] ExportTimeMachineHistory()
{
    if (_currentIndex + 1 < _currentStrokeHistory.Count)
    {
        _currentStrokeHistory.RemoveRange(...);
    }
    return _currentStrokeHistory.ToArray();
}
```

::: danger Export 有副作用
方法名看着像纯查询，实际会**永久截断**当前游标之后的重做链。保存文件时调用它，保存完就不能再重做了。
:::

`ImportTimeMachineHistory` 反过来，整个替换历史并把游标移到末尾——所以打开文件后可以一路撤销回文件保存前的状态。

## 相关文件

墨迹相关逻辑分散在多个 partial 文件里：

- `MW_NativeWetInk.cs`（1476 行）— 原生湿墨迹渲染
- `MW_TouchEvents.cs`（2825 行）— 触摸事件
- `MW_SelectionGestures.cs`（1528 行）— 选择与手势
- `MW_ShapeDrawing.cs`（3070 行）— 形状绘制
- `MW_SimulatePressure&InkToShape.cs`（3482 行）— 压感模拟与墨迹转形状
- `MW_Save&OpenStrokes.cs`（1623 行）— `.icstk` 存取
- `MW_TimeMachine.cs`（663 行）— 撤销/重做调用侧

## 下一步

- [主窗口](./mainwindow) — 42 个 partial 文件的完整清单
- [工具栏系统](./toolbar) — 工具切换的入口
- [代码规范](./conventions) — 提交前的检查项
