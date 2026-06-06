---
date: 2026-05-05
author:
  - Makitoid
  - Qoder
title: Core Functional Modules
description: Core Functional Modules
---
# Core Functional Modules

## Introduction
This document focuses on the core functional modules of InkCanvasForClass, revolving around the following topics: working principles of the whiteboard writing system, ink rendering technology, and real-time interaction mechanisms; architectural design of the toolbar system (configurable items, drag-and-drop sorting, custom extensions); page management (multiple pages, switching, properties); color and brush management (color picker, brush presets, custom brushes); PowerPoint integration (presentation mode, slide navigation synchronization, ink transmission); gesture recognition, shape drawing, and erasing functions. The document provides flowcharts, sequence diagrams, and class diagrams to help with understanding, as well as usage examples, key configuration points, and performance optimization suggestions.

## Project Structure
- The main window and core logic are concentrated in MainWindow and its partial files (such as MW_Toolbar, MW_PageListView, etc.).
- The toolbar system is located in Controls/Toolbar, using a registry + configuration file + runtime assembly approach.
- Ink processing and rendering involve modules under Helpers such as smoothing, recognition, and multi-touch.
- PowerPoint integration manages memory and persistence of ink per slide via PPTInkManager.

```mermaid
graph TB
subgraph "Main Program"
MW["MainWindow<br/>Main Window"]
MWTB["MW_Toolbar<br/>Toolbar Assembly"]
MWPLV["MW_PageListView<br/>Page List"]
end
subgraph "Toolbar System"
TR["ToolbarRegistry<br/>Registry/Assembly"]
TH["ToolbarHost<br/>Host"]
TI["IToolbarItem<br/>Interface"]
CFG["ToolbarItemConfig<br/>Rules/Layout/Settings"]
PEN["PenToolItem"]
ER["EraserToolItem"]
SD["ShapeDrawToolItem"]
end
subgraph "Rendering and Processing"
HWP["HardwareAcceleratedInkProcessor<br/>GPU Smoothing"]
ISM["InkSmoothingManager<br/>Unified Smoothing Management"]
IRM["InkRecognitionManager<br/>Shape/Handwriting Recognition"]
MTI["MultiTouchInput<br/>Touch/Visualization"]
end
subgraph "PowerPoint Integration"
PIM["PPTInkManager<br/>Presentation Ink Management"]
end
MW --- MWTB
MW --- MWPLV
MWTB --- TR
TR --- TH
TR --- TI
TR --- CFG
TI --> PEN
TI --> ER
TI --> SD
MW --- ISM
ISM --- HWP
MW --- IRM
MW --- MTI
MW --- PIM
```

## Core Components
- Toolbar System: Discovers IToolbarItem implementations via ToolbarRegistry, assembles them into ToolbarHost based on configuration files, and supports rule-driven visibility control and extensible custom items.
- Page Management: Maintains multiple Canvas pages, provides thumbnail lists, touch/mouse switching, and saving/restoring of ink.
- Ink Smoothing and Rendering: InkSmoothingManager uniformly dispatches asynchronous, hardware-accelerated, and traditional smoothing paths; HardwareAcceleratedInkProcessor uses the GPU for Bezier curve smoothing; MultiTouchInput provides touch visualization.
- PowerPoint Integration: PPTInkManager manages per-page ink memory, auto-save/load, switching protection, and memory cleanup.
- Shape Recognition and Handwriting Recognition: InkRecognitionManager abstracts WinRT/IACore recognition paths, supporting shape recognition and handwriting beautification.

## Architecture Overview
The toolbar system uses a three-tier architecture: "Discovery - Assembly - Rule Evaluation":
- Discovery Layer: Scans assemblies and instantiates IToolbarItem implementations.
- Assembly Layer: Builds items into views according to configuration files (JSON) and injects them into ToolbarHost.
- Rule Layer: Dynamically determines visibility based on context (annotation mode, PPT mode, user collapsed state).

```mermaid
classDiagram
class IToolbarItem {
+string Id
+string DisplayName
+string Description
+ToolbarRuleset DefaultHidingRuleset
+bool DefaultShowSeparateBorder
+bool DefaultPreventHideOnDragClick
+BuildView(host) FrameworkElement
}
class ToolbarRegistry {
+Discover() IToolbarItem[]
+Populate(host, root, layout)
+LoadActiveConfig() ToolbarLayoutSettings
+UpdateVisibilityByMode(root, isAnnotating, isPptMode)
}
class ToolbarHost {
+MainWindow Window
+RegisterView(id, view)
+FindView(id) FrameworkElement
}
class ToolbarRuleset {
+Mode
+IsReversed
+Groups
+State
+Clone()
+WithHideOnCollapsed()
+WithPreventHideOnCollapsed()
}
class ToolbarComponentEntry {
+string Id
+string InstanceId
+ToolbarHidingRule HidingRule
+bool ShowSeparateBorder
+bool PreventHideOnDragClick
+Dictionary~string,object~ Settings
+ToolbarComponentEntry[] Children
+ToolbarRuleset HidingRuleset
+GetSetting*(key) value
}
IToolbarItem <|.. PenToolItem
IToolbarItem <|.. EraserToolItem
IToolbarItem <|.. ShapeDrawToolItem
ToolbarRegistry --> IToolbarItem : "Discover/Assemble"
ToolbarRegistry --> ToolbarHost : "Inject View"
ToolbarRegistry --> ToolbarRuleset : "Rule Evaluation"
ToolbarRegistry --> ToolbarComponentEntry : "Layout Config"
```

## Detailed Component Analysis

### Whiteboard Writing System and Ink Rendering
- Input Events and Ink Collection: MainWindow registers events like StylusDown/MouseRightButtonUp, combined with InkCanvas's EditingMode to control writing/erasing/selection.
- Smoothing and Rendering: InkSmoothingManager chooses asynchronous, hardware-accelerated, or traditional paths based on configurations; HardwareAcceleratedInkProcessor uses RenderTargetBitmap + PathGeometry for GPU-accelerated smoothing; MultiTouchInput provides StrokeVisual and VisualCanvas, drawing lines based on pressure.
- Performance Monitoring: InkSmoothingManager has a built-in performance monitor to record processing time and provide statistics.

```mermaid
sequenceDiagram
participant User as "User"
participant MW as "MainWindow"
participant IC as "InkCanvas"
participant ISM as "InkSmoothingManager"
participant HWP as "HardwareAcceleratedInkProcessor"
User->>IC : "Pen Down/Move/Pen Up"
IC-->>MW : "StylusDown/MouseRightButtonUp"
MW->>ISM : "Request Smoothing (Stroke)"
alt "Hardware Acceleration Enabled"
ISM->>HWP : "SmoothStrokeWithGPU(Stroke)"
HWP-->>ISM : "Smoothed Stroke"
else "Asynchronous Processing"
ISM-->>ISM : "AsyncAdvancedBezierSmoothing"
ISM-->>MW : "Smoothed Stroke"
else "Traditional Synchronous"
ISM-->>ISM : "AdvancedBezierSmoothing"
ISM-->>MW : "Smoothed Stroke"
end
MW->>IC : "Update Ink/Render"
```

### Toolbar System: Configurable, Extensible, and Sortable
- Discovery and Assembly: ToolbarRegistry.Discover scans IToolbarItem implementations, and Populate builds views according to layout configurations and injects them into ToolbarHost.
- Rules and Visibility: ToolbarRuleset/Group/Rule support And/Or/Inverse combinations, dynamically hiding/showing based on context (annotation/PPT/collapsed).
- Custom Extensions: The IToolbarItem interface defines BuildView(host); built-in items like Pen/Erase/ShapeDraw are easily implemented via ToolbarImageButtonItemBase.
- Configuration File: Supports default.json and multiple layout JSON files, including component settings (width, height, alignment, margins, opacity, styles, etc.).

```mermaid
flowchart TD
Start(["Startup"]) --> EnsureCfg["EnsureDefaultConfigExists()"]
EnsureCfg --> LoadCfg["LoadActiveConfig()"]
LoadCfg --> Discover["Discover() Scan IToolbarItem"]
Discover --> Populate["Populate(host, root, layout)"]
Populate --> BuildView["BuildView(host) Build View"]
BuildView --> Inject["ToolbarHost.RegisterView(id, view)"]
Inject --> Eval["EvaluateRuleset(context)"]
Eval --> Visible{"Visible?"}
Visible --> |Yes| Show["Show and Participate in Layout"]
Visible --> |No| Hide["Hide"]
Show --> End(["Complete"])
Hide --> End
```

### Page Management: Multiple Pages, Switching, and Properties
- Page Container: MainWindow maintains the whiteboardPages list, one Canvas per page; ShowPage switches the current Canvas.
- Thumbnail List: RefreshBlackBoardSidePageListView generates thumbnails of historical and current pages; TrySwitchWhiteboardPageByTouchPoint supports touch hit testing and switching.
- Save/Restore: SaveStrokes before switching, and RestoreStrokes after switching, keeping independent ink for each page.

```mermaid
sequenceDiagram
participant User as "User"
participant MW as "MainWindow"
participant LV as "PageListView"
participant Hist as "TimeMachineHistories"
User->>LV : "Click Thumbnail"
LV-->>MW : "TrySwitchWhiteboardPageByTouchPoint(...)"
MW->>MW : "SaveStrokes()"
MW->>MW : "ClearStrokes(true)"
MW->>MW : "CurrentWhiteboardIndex = target"
MW->>MW : "RestoreStrokes()"
MW->>MW : "UpdateIndexInfoDisplay()"
MW->>LV : "Sync SelectedIndex"
Hist-->>MW : "ApplyHistoriesToNewStrokeCollection(index)"
```

### Color and Brush Management: Picker, Presets, and Customization
- Brush Popup Layer: PenPalette/BoardPenPalette provide pen type, pen tip mode, pressure overlay, laser pen fade-in/fade-out, opacity/width, etc.
- Color Themes: Supports theme switching buttons to quickly switch between default/highlight/laser pen colors.
- Quick Color Palette: QuickColorPaletteControl finds and links the current brush color via ToolbarHost.

### PowerPoint Integration: Presentation Mode, Navigation Sync, and Ink Transmission
- Presentation Initialization: InitializePresentation allocates memory stream arrays, expanding according to the number of slides.
- Save/Load Ink: SaveCurrentSlideStrokes/LoadSlideStrokes/SwitchToSlide; supports forced save and auto-save.
- Switch Protection: LockInkForSlide/CanWriteInk prevents conflicts when turning pages; fast switching protection avoids jitter.
- Memory Management: CheckAndPerformMemoryCleanup/CleanupInactiveSlideStrokes controls memory limits.
- Auto Save: SaveAllStrokesToFile/LoadSavedStrokes supports disk persistence and position recording.

```mermaid
sequenceDiagram
participant PPT as "PowerPoint"
participant PIM as "PPTInkManager"
participant FS as "File System"
PPT->>PIM : "InitializePresentation(presentation)"
Note right of PIM : "Allocate memory stream arrays/Reset lock states"
PPT->>PIM : "SaveCurrentSlideStrokes(idx, strokes)"
PIM->>PIM : "ReplaceSlideStream(idx, strokes)"
PIM->>PIM : "CheckAndPerformMemoryCleanup()"
PPT->>PIM : "SwitchToSlide(idx, current?)"
PIM->>PIM : "LockInkForSlide(idx)"
PIM-->>PPT : "LoadSlideStrokes(idx)"
PPT->>PIM : "SaveAllStrokesToFile(pres, pos)"
PIM->>FS : "Write *.icstk/Position"
```

### Gesture Recognition, Shape Drawing, and Erasing
- Gesture Recognition: InkRecognitionManager abstracts WinRT/IACore paths, providing shape recognition and handwriting beautification.
- Shape Drawing: ShapeDrawToolItem forwards click events to MainWindow's shape drawing entry, cooperating with the ShapeDraw popup layer.
- Erasing: EraserToolItem forwards click events to MainWindow's erase entry, supporting full page/by stroke erasing.

## Dependency Analysis
- Component Coupling
  - MainWindow depends on ToolbarHost/Registry for toolbar assembly and visibility control.
  - InkSmoothingManager depends on HardwareAcceleratedInkProcessor or traditional smoothing algorithms.
  - PPTInkManager depends on memory streams and file systems, affected by auto-save configuration.
- Rules and Configuration
  - ToolbarRuleset/ComponentEntry determines visibility and layout of items.
  - InkSmoothingConfig determines smoothing strategies and concurrent task count.
- External Dependencies
  - Windows Ink/WinRT API for shape recognition and handwriting recognition.
  - PowerPoint Interop for presentation control.

```mermaid
graph LR
MW["MainWindow"] --> TB["ToolbarRegistry/Host"]
MW --> ISM["InkSmoothingManager"]
ISM --> HWP["HardwareAcceleratedInkProcessor"]
MW --> PIM["PPTInkManager"]
MW --> IRM["InkRecognitionManager"]
MW --> MTI["MultiTouchInput"]
```

## Performance Considerations
- Ink Smoothing
  - Recommended configuration: Enable high quality and concurrent tasks when there are more than four cores and hardware acceleration is supported; degrade to high performance mode on low-performance devices.
  - Asynchronous processing: Avoid blocking the UI thread; timeout protection and cancellation tokens.
- Rendering and Caching
  - Use RenderTargetBitmap + DrawingVisual + BitmapCache to improve GPU rendering efficiency.
  - StrokeVisual is submitted in batches to reduce frequent creation of visual objects.
- Memory Management
  - PPTInkManager sets a 100MB memory limit and regularly cleans up inactive pages.
  - Memory stream arrays expand according to the number of slides to avoid out-of-bounds access.
- Touch and Interaction
  - MultiTouchInput linearly maps pressure, balancing visual consistency.
  - Page switching incorporates fast switching protection to avoid frequent IO.

## Troubleshooting Guide
- Toolbar Not Displayed/Misaligned
  - Check if configuration file exists and is readable; verify ToolbarRegistry.LoadActiveConfig returns a valid layout.
  - Use UpdateVisibilityByMode to check if context (annotation/PPT/collapsed) causes it to hide.
- Smoothing Fails or Stutters
  - Check InkSmoothingConfig settings; verify hardware acceleration availability.
  - View performance statistics and logs to locate time-consuming bottlenecks.
- PowerPoint Ink Lost/Corrupted
  - Verify no cross-page writing occurred during LockInkForSlide/CanWriteInk.
  - Check auto-save path permissions and disk space.
- Touch Drawing Abnormalities
  - Check MultiTouchInput pressure mapping and StrokeVisual submission thresholds.
  - Ensure VisualCanvas cache and rendering options are correct.

## Conclusion
The core functionality of InkCanvasForClass is designed around modularity and configurability: the toolbar system achieves flexible visibility through rules and configurations; page management ensures stable switching under multi-page scenarios; rendering and smoothing combine hardware acceleration with asynchronous processing to boost performance; PowerPoint integration offers reliable ink persistence and switching protection; gesture recognition and shape drawing complete the writing experience. It is recommended to adjust smoothing strategies and concurrent task counts based on device performance during deployment, and to provide complete configuration files and fallback mechanisms for toolbar and page management.

## Appendix
- Usage Examples (Step-by-step)
  - Toolbar Customization: Implement IToolbarItem, providing Id/DisplayName/Description/BuildView; add items to layout via configuration files.
  - Page Switching: Click thumbnails in PageListView, triggering TrySwitchWhiteboardPageByTouchPoint to save, switch, and restore.
  - PowerPoint Ink: After initializing the presentation, call SaveCurrentSlideStrokes page by page; call SaveAllStrokesToFile when the slideshow ends.
  - Smoothing Optimization: Enable hardware acceleration and asynchronous smoothing in settings, or choose recommended configurations based on device performance.
- Configuration Options
  - Toolbar: Component settings (width/height/alignment/margins/opacity/styles), rules (And/Or/Inverse), grouping, and separate borders.
  - Smoothing: Quality levels, interpolation steps, resampling intervals, concurrent tasks, hardware acceleration.
  - PPT: Auto-save switch, save path, max slide count, memory limit.
- Performance Optimization Suggestions
  - Prioritize hardware acceleration and asynchronous processing.
  - Set concurrent task counts reasonably to avoid CPU/GPU overload.
  - Periodically clean up memory cache of inactive pages.
  - Use the batch submission threshold of StrokeVisual to reduce visual object creation.
