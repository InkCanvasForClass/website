---
date: 2026-05-05
author:
  - Makitoid
  - Qoder
title: Service Communication Patterns
description: Service Communication Patterns
---
# Service Communication Patterns

## Introduction
This document focuses on the communication mechanisms and collaboration patterns among global services in InkCanvasForClass, structured around the following topics:
- Event dispatching and state synchronization in the popup manager
- Management strategies and priority handling in the floating window interceptor
- Keyboard event capture and shortcut responses in global hotkey management
- Architectural design and focus management in window Z-order management
- Best practices for inter-service communication (event-driven, message passing, asynchronous processing)
- Suggestions for performance optimization and concurrency safety

## Project Structure
InkCanvasForClass utilizes a "Main Window + Multiple Global Services" architecture. The main window handles aggregation and orchestration, and each global service communicates via loosely coupled events and method calls.

```mermaid
graph TB
subgraph "MainWindow Layer"
MW["MainWindow<br/>MainWindow"]
end
subgraph "Global Service Layer"
GHKM["GlobalHotkeyManager<br/>Global Hotkey Management"]
PMH["PopupManagerHelper<br/>Popup Manager"]
FWIM["FloatingWindowInterceptorManager<br/>Floating Interceptor Manager"]
FWI["FloatingWindowInterceptor<br/>Floating Interceptor"]
WZM["WindowZOrderManager<br/>Window Z-Order Management"]
end
MW --> GHKM
MW --> FWIM
MW --> PMH
MW --> WZM
FWIM --> FWI
```

## Core Components
- Popup Manager (PopupManagerHelper)
  - Registers popups, handles open/close events, controls topmost Z-ordering, updates positions, and synchronizes child popups.
  - Key Points: Periodic rendering callback checks, HWND caching, and conditional topmost policies.
- Floating Window Interceptor (FloatingWindowInterceptor + Manager)
  - Manages interception rules, scanning threads, event dispatching (intercept/restore), statistics, and configuration applications.
  - Key Points: Parent-child rule interactions, scan intervals, and execution state maintenance.
- Global Hotkey Manager (GlobalHotkeyManager)
  - Implements global shortcut registrations, cross-screen support, smart enabling/disabling, and action scheduling based on NHotkey.
  - Key Points: Main thread dispatching, multi-screen and mouse tracking, and configuration persistence.
- Window Z-Order Manager (WindowZOrderManager)
  - Maintains the window stack, topmost strategies, focus and visibility evaluation, and force refreshes.
  - Key Points: Critical section locks, Win32 API invocations, and Z-ordering policies in no-focus modes.

## Architecture Overview
Global services are uniformly initialized and bridged via events in the main window, forming a collaborative pattern of "MainWindow Orchestration + Service Autonomy + Event-Driven".

```mermaid
sequenceDiagram
participant User as "User"
participant MW as "MainWindow"
participant GHKM as "GlobalHotkeyManager"
participant FWIM as "FloatingWindowInterceptorManager"
participant FWI as "FloatingWindowInterceptor"
participant PMH as "PopupManagerHelper"
participant WZM as "WindowZOrderManager"
User->>MW : Trigger hotkey/action
MW->>GHKM : Register/Update/Unregister hotkey
GHKM-->>MW : Callback execution Dispatcher.Invoke
MW->>FWIM : Start/stop/rule changes
FWIM->>FWI : Start()/Stop()/SetRule()
FWI-->>FWIM : WindowIntercepted/WindowRestored
FWIM-->>MW : Event forwarding
MW->>PMH : Register popup / topmost / update
MW->>WZM : Register window / topmost / refresh
```

## Detailed Component Analysis

### Popup Manager (PopupManagerHelper)
Responsibilities & Workflows
- Initialization & Registration: Binds to CompositionTarget.Rendering, registers popup Opened/Closed events, and caches HWNDs.
- State Synchronization: Periodically inspects and repairs Z-ordering; supports "conditional topmost" policies (ShouldBeTopmost).
- Event-Driven: Triggers synchronization when popups open/close, when the main window activates, or when topmost settings change.
- Position Updates: Triggers layout recalculation by fine-tuning offsets, guaranteeing visual consistency.

```mermaid
classDiagram
class PopupManagerHelper {
-PopupManagerHelper[] _activeInstances
-Popup[] _registeredPopups
-Dictionary~Popup,IntPtr~ _hwndCache
-HashSet~Popup~ _openPopups
-Window _ownerWindow
-IntPtr _ownerHwnd
-bool _isInitialized
-bool _needsUpdate
-bool _lastTopmostState
-int _topmostCheckCounter
+Func~bool~ ShouldBeTopmost
+Initialize(owner)
+RegisterPopup(popup)
+UnregisterPopup(popup)
+MarkNeedsUpdate()
+BringToFront(popup)
+BringToFrontLight(popup)
+UpdatePosition(popup)
+OnOwnerActivated()
+OnTopmostSettingChanged()
-OnRendering(sender,e)
-FixPopupZOrder(popup)
-FixChildPopups(root)
-GetPopupHwnd(popup)
+Cleanup()
+Dispose()
}
```

### Floating Window Interceptor (FloatingWindowInterceptor + Manager)
Responsibilities & Workflows
- Manager: Wraps interceptor lifecycles, event bridging, rule linkings, configuration applications, and statistics.
- Interceptor: Enumerates windows based on a scanning thread, hiding/restoring targets matching the rules, and publishing events.
- Priorities & Parent-Child Rules: Enabling/disabling parent rules affects child rules; enabling/disabling child rules affects parent rules.

```mermaid
sequenceDiagram
participant MW as "MainWindow"
participant FWIM as "FloatingWindowInterceptorManager"
participant FWI as "FloatingWindowInterceptor"
participant OS as "OS Windows"
MW->>FWIM : Initialize(settings)
FWIM->>FWI : Start(scanInterval)
loop Periodic Scan
FWI->>OS : EnumWindows / Match Rules
alt Match Success
FWI-->>FWIM : WindowIntercepted(args)
FWIM-->>MW : Event Forwarding
else No Match
FWI-->>FWIM : Idle
end
end
MW->>FWIM : Stop()/RestoreAllWindows()
FWIM->>FWI : Stop()
FWI-->>OS : Restore Intercepted Windows
```

### Global Hotkey Manager (GlobalHotkeyManager)
Responsibilities & Workflows
- Registration/Cancellation: Registers global shortcuts via NHotkey, avoiding conflicts and replacing duplicate registrations.
- Main Thread Dispatching: Executes business logic on the UI thread via Dispatcher.Invoke within callbacks.
- Multi-Screen & Smart Enabling: Dynamically refreshes hotkey registrations based on window locations, focus, and mouse positions.
- Configuration Persistence: Loads/saves configurations from JSON files, falling back to default shortcuts.

```mermaid
flowchart TD
Start(["Initialize"]) --> InitMS["Initialize multi-screen support"]
InitMS --> EnsureCfg["Ensure configuration file exists"]
EnsureCfg --> LoadCfg{"Configuration exists?"}
LoadCfg --> |No| Def["Create default configuration and register default hotkeys"]
LoadCfg --> |Yes| FromCfg["Load hotkeys from configuration"]
FromCfg --> Enable{"Registration allowed?"}
Def --> Enable
Enable --> |No| Disable["Unregister all hotkeys"]
Enable --> |Yes| Register["Register hotkeys"]
Register --> MultiScreen{"Multi-screen?"}
MultiScreen --> |Yes| FollowMouse["Follow mouse/window refresh"]
MultiScreen --> |No| Done(["Completed"])
FollowMouse --> Done
Disable --> Done
```

### Window Z-Order Manager (WindowZOrderManager)
Responsibilities & Workflows
- Registration/Cancellation: Maintains the window stack, tracking HWNDs, creation times, topmost settings, and no-focus flags.
- Topmost Strategy: Topmost and visible windows are grouped and set to top, correcting extended styles when necessary.
- Focus & Foreground: Detects child windows in the foreground, cleans invalid records, and forces refreshes.

```mermaid
classDiagram
class WindowZOrderManager {
<<static>>
-WindowInfo[] _windowStack
-object _lockObject
+RegisterWindow(window,isTopmost,isNoFocus)
+UnregisterWindow(window)
+SetWindowTopmost(window,isTopmost)
+BringToTop(window)
-ApplyZOrder()
+HasChildWindowInForeground() bool
+CleanupInvalidWindows()
+GetWindowCount() int
+ForceRefreshAllWindows()
}
class WindowInfo {
+IntPtr Handle
+Window Window
+DateTime CreatedTime
+bool IsTopmost
+bool IsNoFocusMode
}
WindowZOrderManager --> WindowInfo : "Manages"
```

### MainWindow Integration & Event Bridging
- Floating Interceptor Integration: The main window initializes the interceptor manager, subscribes to intercept/restore events, and controls start/stop operations and rule links through settings.
- Hotkey Event Bridging: The main window provides concrete UI actions (e.g., undo, redo, tool toggles) which are dispatched within callbacks by the hotkey manager.

## Dependency Analysis
- MainWindow Dependency on Global Services: MainWindow holds service instances, handling initialization and event bridging.
- Service Cohesion & Decoupling:
  - The popup manager and interceptor manager independently maintain states and events.
  - The hotkey manager and window Z-order manager interact indirectly through the main window.
- External Dependencies:
  - NHotkey (global hotkeys)
  - Win32 APIs (window Z-orders, styles, visibility)
  - WPF Dispatcher (UI thread scheduling)

```mermaid
graph LR
MW["MainWindow"] --> GHKM["GlobalHotkeyManager"]
MW --> FWIM["FloatingWindowInterceptorManager"]
MW --> PMH["PopupManagerHelper"]
MW --> WZM["WindowZOrderManager"]
FWIM --> FWI["FloatingWindowInterceptor"]
```

## Performance Considerations
- Rendering Callback Throttling: The popup manager reduces topmost overheads using counters and minimum update intervals.
- Scanning Thread & Interval: The interceptor scans via timers, with scan intervals balanced to avoid high loads.
- UI Thread Dispatching: Hotkey callbacks switch to the UI thread via Dispatcher.Invoke, preventing cross-thread access.
- HWND Caching: The popup manager caches HWNDs, lowering query and validation costs.
- Concurrency Safety: The window Z-order manager protects shared states using locks to prevent race conditions.

## Troubleshooting Guide
- Popup Topmost Anomaly
  - Verify ShouldBeTopmost return values and check if owner activation events trigger.
  - Confirm HWND cache validity and check IsWindow evaluations.
- Interceptor Not Working
  - Verify rule statuses and check parent-child rule links.
  - Confirm scan intervals, running statuses, and verify that Start() was called.
- Hotkey Not Responding
  - Verify if registrations are allowed (check multi-screen, focus, and mouse position policies).
  - Confirm the configuration file exists and is readable, falling back to default settings if necessary.
- Window Z-Ordering Confused
  - Invoke ForceRefreshAllWindows or CleanupInvalidWindows.
  - Verify topmost and no-focus mode settings.

## Conclusion
InkCanvasForClass implements loosely coupled collaborations among global services through centralized orchestration in the main window, combining event-driven notifications and method calls. The popup manager, floating interceptor, global hotkeys, and window Z-order manager each perform distinct duties, ensuring stability and maintainability via clear lifecycles and event bridges. It is recommended in production environments to further refine logging levels, isolate exceptions, implement resource recovery strategies, and optimize scan and dispatch frequencies to balance performance and real-time responsiveness.

## Appendix
- Legacy System Hotkeys (Win32) Sample: Included for understanding underlying mechanisms; the project primarily uses NHotkey.
