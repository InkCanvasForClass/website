---
title: Inking System
description: Logical tools vs editing modes, and the TimeMachine undo stack
---

# Inking System

<HelpUsImprove />

The main canvas is a WPF `InkCanvas` named `x:Name="inkCanvas"` at `MainWindow.xaml:217`, wrapped in a `<Grid Name="InkCanvasGridForInkReplay">`.

The key events wired up in XAML:

```xml
EditingModeChanged="inkCanvas_EditingModeChanged"
StrokeCollected="inkCanvas_StrokeCollected"
SelectionChanged="inkCanvas_SelectionChanged"
ForceCursor="True" UseCustomCursor="True"
```

::: warning EditingMode is not bound in XAML
The main canvas's `EditingMode` is **assigned entirely from C# code**, with 77 assignment sites across the project. To understand why the current mode has a given value, searching those assignments is your only option — there is no binding source to inspect.

The only place `EditingMode` is hardcoded in XAML is the replay canvas: `<InkCanvas Name="InkCanvasForInkReplay" ... EditingMode="None">` (`MainWindow.xaml:1094`).
:::

## Logical tools ≠ editing modes

The "tool" the user picks is not the same thing as WPF's `InkCanvasEditingMode`. The application has its own tool enum internally:

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

(`Ink\Native\NativeInkInputRouter.cs:5`)

`PointEraser` and `StrokeEraser` are two kinds of eraser, while `Shape` and `BoardRoam` have no corresponding WPF editing mode at all and need extra input handling. `NativeInkInputRouter` owns the mapping.

::: tip Changing tool behavior means changing the LogicalInkTool layer
Assigning to `inkCanvas.EditingMode` directly bypasses the routing logic, and the toolbar state, cursor, and gesture detection can all end up out of sync.
:::

`GridInkCanvasSelectionCover` is the overlay used for selection dragging, with a `#01FFFFFF` background and `Opacity="0.01"` — almost invisible but still able to receive hit tests. Its handling starts at `MW_SelectionGestures.cs:536`.

## TimeMachine: undo/redo

The undo stack is implemented in `Helpers\TimeMachine.cs` (270 lines), and its caller lives in `MainWindow_cs\MW_TimeMachine.cs` (663 lines).

The core state is just two fields:

```csharp
private readonly List<TimeMachineHistory> _currentStrokeHistory = new List<TimeMachineHistory>();
private int _currentIndex = -1;
```

A list plus a cursor. **Undo does not delete history entries**, it just moves the cursor back:

```csharp
public TimeMachineHistory Undo()
{
    ...
    var item = _currentStrokeHistory[_currentIndex];
    item.StrokeHasBeenCleared = !item.StrokeHasBeenCleared;
    _currentIndex--;
```

Note that `StrokeHasBeenCleared` is **inverted** rather than set to true. The flag means "is this history entry currently in effect or undone", and `Redo()` inverts it once more to flip it back.

::: danger Undo mutates the history entry itself
`Undo()` / `Redo()` modify `item.StrokeHasBeenCleared` directly, which means `TimeMachineHistory` is a mutable object and the same instance flips back and forth between undo and redo. Do not cache the state of these objects, and do not hold a reference elsewhere assuming it stays constant.
:::

### Committing a new operation truncates the redo chain

Every `Commit*` method starts with the same block:

```csharp
if (_currentIndex + 1 < _currentStrokeHistory.Count)
{
    _currentStrokeHistory.RemoveRange(_currentIndex + 1, (_currentStrokeHistory.Count - 1) - _currentIndex);
}
```

Undo a few steps and then draw a stroke, and those undone operations are gone for good. Standard undo stack semantics.

### Six history types

```csharp
public enum TimeMachineHistoryType
{
    UserInput,
    ShapeRecognition,
    Clear,
    Manipulation,
    DrawingAttributes,
    ElementInsert // newly added
}
```

They map to six commit methods:

| Type | Commit method | What it records |
| --- | --- | --- |
| `UserInput` | `CommitStrokeUserInputHistory` | Newly drawn strokes |
| `ShapeRecognition` | `CommitStrokeShapeHistory` | The generated shape + the original strokes it replaced |
| `Clear` | (constructor taking sourceStroke) | A clear operation |
| `Manipulation` | `CommitStrokeManipulationHistory` | The `StylusPointCollection` before and after each stroke transform |
| `DrawingAttributes` | — | The `DrawingAttributes` before and after the change |
| `ElementInsert` | `CommitElementInsertHistory` | The inserted `UIElement` |

`Manipulation` and `DrawingAttributes` store the old and new values in dictionaries, and a comment in the code spells out the order:

```csharp
//这里说一下 Tuple的 Value1 是初始值 ; Value 2 是改变值
public Dictionary<Stroke, Tuple<StylusPointCollection, StylusPointCollection>> StylusPointDictionary;
```

::: warning TimeMachineHistory uses fields, not properties, and has 5 constructors
The class is all public fields (`CommitType`, `CurrentStroke`, `ReplacedStroke`, and so on), and each of the 5 overloaded constructors fills in only some of them, **leaving the rest null**.

So when you get a `TimeMachineHistory` you must check `CommitType` first to decide which fields to read; reading the wrong one gives you a `NullReferenceException`. When adding a new history type, remember to update the switch in `MW_TimeMachine.cs` too.
:::

### One special method

```csharp
public bool TryReplaceLastUserInputHistory(StrokeCollection stroke)
```

It only succeeds when the last entry is a **`UserInput` that has not been undone**, otherwise it returns false. It exists for cases where a stroke gets corrected after being committed (pressure recalculation, for example) to avoid producing two history entries.

### State notifications

```csharp
public bool CanUndo => _currentIndex > -1;
public bool CanRedo => _currentStrokeHistory.Count > 0 && _currentStrokeHistory.Count - _currentIndex - 1 > 0;
```

Every change raises `OnUndoStateChanged` / `OnRedoStateChanged`, and the toolbar's undo/redo buttons use those two events to grey themselves out.

### Exporting discards the redo chain

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

::: danger Export has side effects
The name reads like a pure query, but it **permanently truncates** the redo chain past the current cursor. It is called when saving a file, so once you save you can no longer redo.
:::

`ImportTimeMachineHistory` does the reverse, replacing the entire history and moving the cursor to the end — which is why you can undo all the way back to the state before the file was saved after opening it.

## Related files

Ink-related logic is spread across several partial files:

- `MW_NativeWetInk.cs` (1476 lines) — native wet ink rendering
- `MW_TouchEvents.cs` (2825 lines) — touch events
- `MW_SelectionGestures.cs` (1528 lines) — selection and gestures
- `MW_ShapeDrawing.cs` (3070 lines) — shape drawing
- `MW_SimulatePressure&InkToShape.cs` (3482 lines) — pressure simulation and ink-to-shape
- `MW_Save&OpenStrokes.cs` (1623 lines) — `.icstk` loading and saving
- `MW_TimeMachine.cs` (663 lines) — the calling side of undo/redo

## Next steps

- [Main window](./mainwindow) — the full list of 42 partial files
- [Toolbar system](./toolbar) — where tool switching happens
- [Code conventions](./conventions) — the checklist before you submit
