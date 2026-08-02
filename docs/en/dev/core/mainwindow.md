---
title: Main Window
description: The 42 partial files of MainWindow and how to find your way around them
---

# Main Window

<UnderConstruction />

`MainWindow` is a huge partial class whose code is spread across **42 `.cs` files** under `MainWindow_cs\`, roughly thirty thousand lines in total. The first obstacle to finding code is working out "which file is this feature in".

## Files do not need to be registered

`InkCanvasForClass.csproj` is an SDK-style project and has **no `<Compile Include>` entries** pointing at `MainWindow_cs`. The whole directory is picked up automatically by the SDK's default globbing.

::: tip Just drop new partial files in
No csproj edits, no "Add Existing Item" in VS. Save a file into `MainWindow_cs\` and it compiles. Likewise, deleting a file requires no csproj cleanup.
:::

There are **no subdirectories** under `MainWindow_cs` — all 42 files sit flat.

## File list

Sorted by line count (top 21):

| File | Lines | Responsibility |
| --- | --- | --- |
| `MW_FloatingBarIcons.cs` | 6162 | Floating bar icons and interaction |
| `MW_PPT.cs` | 3703 | PowerPoint integration |
| `MW_SimulatePressure&InkToShape.cs` | 3482 | Pressure simulation + ink-to-shape |
| `MW_ElementsControls.cs` | 3110 | Canvas element controls |
| `MW_ShapeDrawing.cs` | 3070 | Shape drawing |
| `MW_TouchEvents.cs` | 2825 | Touch events |
| `MW_VideoPresenter.cs` | 2750 | Video presenter |
| `MW_Timer.cs` | 1785 | Timer |
| `MW_Save&OpenStrokes.cs` | 1623 | Loading and saving ink |
| `MW_Settings.cs` | 1571 | Settings interaction |
| `MW_SelectionGestures.cs` | 1528 | Selection gestures |
| `MW_NativeWetInk.cs` | 1476 | Native wet ink |
| `MW_Colors.cs` | 1214 | Colors |
| `MW_ImageInsert.cs` | 1151 | Image insertion |
| `MW_CanvasComposition.cs` | 992 | Canvas composition |
| `MW_SettingsToLoad.cs` | 922 | Loading settings into the UI |
| `MW_BoardControls.cs` | 862 | Whiteboard controls |
| `MW_AutoFold.cs` | 756 | Auto-fold |
| `MW_BoardToolbarHost.cs` | 663 | Whiteboard toolbar host |
| `MW_TimeMachine.cs` | 663 | Undo/redo |
| `MW_TrayIcon.cs` | 655 | Tray icon |

The remaining 21 files are all under 600 lines.

::: warning Two file names contain &
The names `MW_SimulatePressure&InkToShape.cs` and `MW_Save&OpenStrokes.cs` contain `&`. Writing those paths bare in PowerShell makes it a command separator, so you must quote them:

```powershell
Get-Content "MainWindow_cs\MW_Save&OpenStrokes.cs"
```

Some shell scripts and build tools need escaping too.
:::

::: tip MW_Eraser.xaml is not a code-behind file
`MainWindow_cs\` also contains `MW_Eraser.xaml`, but it is a `ResourceDictionary` holding the eraser's `DrawingImage` resources and has **no matching `MW_Eraser.xaml.cs`**. Do not go looking for backing code the way you would for a XAML + code-behind pair.
:::

## How to find code

Every file name is prefixed with `MW_` followed by the functional area. The names mostly read straightforwardly, but a few mappings are less obvious:

- The floating toolbar's **button click logic** lives in `MW_FloatingBarIcons.cs` (6162 lines, the largest file), not in `MW_BoardToolbarHost.cs`
- **Undo/redo** is in `MW_TimeMachine.cs`
- **Loading settings into the UI** is in `MW_SettingsToLoad.cs`, while **responding to settings interaction** is in `MW_Settings.cs` — two different files
- Pressure simulation and ink-to-shape got crammed into the same file

When in doubt, a global search beats guessing file names. To find an event handler, just search for the handler name from the XAML:

```powershell
Get-ChildItem "MainWindow_cs" -Filter *.cs |
    Select-String -Pattern "private void ButtonName_Click"
```

## The cost of splitting files

A partial class does not isolate state. All 42 files share the same set of private fields, and any file can read or write fields defined in another.

::: danger Search globally before adding a field
`MainWindow`'s fields are scattered across 42 files. When you add a new field, a name collision may not surface in the file you are editing — the compile error can point at a file you have never opened.

Likewise, changing the meaning of a field means searching all 42 files to confirm nothing else depends on it. `Find All References` is essential.
:::

## A related split elsewhere

`MainWindow.xaml` itself is also large; the main canvas `inkCanvas` is at L217. For ink-related details see [Inking system](./inking).

The layouts of the floating bar and the whiteboard toolbar are not hardcoded in `MainWindow.xaml` — they come from configuration files, see [Toolbar system](./toolbar).

## Next steps

- [Inking system](./inking) — `inkCanvas` and editing modes
- [Toolbar system](./toolbar) — toolbar configuration and rendering
- [Code conventions](./conventions) — the mandatory rules for editing XAML and settings pages
