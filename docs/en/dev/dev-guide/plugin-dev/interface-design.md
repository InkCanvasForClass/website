---
date: 2026-05-05
author:
  - Makitoid
  - Qoder
title: Plugin Interface Design
description: Plugin Interface Design
---
# Plugin Interface Design

## Introduction

This document details the interface design and implementation specifications of the Ink Canvas plugin system. The plugin system adopts an interface-based extension architecture, defining plugin behavior contracts through the standardized `IPlugin` interface, providing host service injection mechanisms through `IPluginHost`, and simplifying the plugin development process through the `PluginBase` abstract base class. The system supports dynamically loading and unloading plugins, and provides infrastructure functions like logging and service registration.

## Project Structure

The plugin system is mainly distributed in the following directories:

```mermaid
graph TB
subgraph "Plugin SDK Layer"
SDK[IPlugin.cs]
HOST[IPluginHost.cs]
BASE[PluginBase.cs]
INFO[PluginInfo.cs]
ISVC[IInkCanvasService.cs]
RSVC[IAppRestartService.cs]
end
subgraph "Plugin Manager"
PMGR[PluginManager.cs]
end
subgraph "Service Implementation"
ICAN[InkCanvasService.cs]
ARST[AppRestartService.cs]
end
subgraph "UI Integration"
PPG[PluginPage.xaml.cs]
PSP[PluginSettingsPage.xaml.cs]
PST[PluginStrings.Designer.cs]
end
SDK --> PMGR
HOST --> PMGR
BASE --> PMGR
PMGR --> ICAN
PMGR --> ARST
PMGR --> PPG
PMGR --> PSP
```

## Core Components

### IPlugin Interface Definition

The `IPlugin` interface is the core contract of the plugin system, defining the basic capabilities that plugins must implement:

| Property/Method | Type | Required | Description |
|-----------------|------|----------|-------------|
| Id | string | Yes | Unique identifier of the plugin, used to distinguish different plugin instances |
| Name | string | Yes | Display name of the plugin, used in the user interface |
| Version | string | Yes | Version number of the plugin, following Semantic Versioning |
| Description | string | No | Functional description of the plugin |
| Author | string | No | Author information of the plugin |
| Order | int | Yes | Load order of the plugin, where smaller values represent higher priority |
| Initialize | Method | Yes | Plugin initialization method, receiving the `IPluginHost` parameter |
| Shutdown | Method | Yes | Plugin cleanup method, responsible for resource release |
| GetMainView | Method | No | Returns the main interface view object of the plugin |
| GetSettingsView | Method | No | Returns the settings interface view object of the plugin |

### IPluginHost Interface Features

Serving as the host service container, `IPluginHost` provides plugins with runtime-essential services:

```mermaid
classDiagram
class IPluginHost {
+void Log(message)
+void LogError(message, ex)
+T GetService~T~()
+void RegisterService~T~(service)
}
class PluginManager {
-Dictionary~Type,object~ services
+T GetService~T~()
+void RegisterService~T~(service)
+void Log(message)
+void LogError(message, ex)
}
IPluginHost <|.. PluginManager : Implements
```

## Architecture Overview

The plugin system is designed with a layered architecture, implementing a loosely coupled plugin management mechanism:

```mermaid
sequenceDiagram
participant App as Application
participant PM as Plugin Manager
participant AC as Assembly Context
participant PL as Plugin Instance
participant HS as Host Service
App->>PM : LoadAllAsync()
PM->>PM : Scan plugin directory
PM->>AC : Create assembly load context
AC->>AC : Load plugin assembly
AC->>PM : Return plugin type list
PM->>PL : Create plugin instance
PM->>PL : Initialize(this)
PL->>HS : Inject IPluginHost
PM->>PM : Sort by Order
PM-->>App : Plugin loading completed
Note over App,PM : Plugin lifecycle management
App->>PM : UnloadPlugin()
PM->>PL : Shutdown()
PM->>AC : Unload assembly context
PM-->>App : Plugin unloading completed
```

## Detailed Component Analysis

### PluginBase Abstract Base Class

`PluginBase` provides the basic framework for plugin development, simplifying the implementation of common features:

```mermaid
classDiagram
class IPlugin {
<<interface>>
+string Id
+string Name
+string Version
+string Description
+string Author
+int Order
+void Initialize(host)
+void Shutdown()
+object GetMainView()
+object GetSettingsView()
}
class PluginBase {
#IPluginHost Host
+abstract string Id
+abstract string Name
+abstract string Version
+abstract string Description
+abstract string Author
+abstract int Order
+virtual void Initialize(host)
+virtual void Shutdown()
+virtual object GetMainView()
+virtual object GetSettingsView()
#void Log(message)
#void LogError(message, ex)
#T GetService~T~()
}
class InkCanvasService {
-MainWindow mainWindow
+void OpenWhiteboard()
+void CloseWhiteboard()
+Task OpenWhiteboardAsync(delay)
}
class AppRestartService {
+bool IsRunningAsAdmin
+void RestartApp(asAdmin)
+void RestartWithCurrentPrivileges()
+void RestartAsAdmin()
+void RestartAsNormal()
+void SwitchToUIATopMostAndRestart()
+void SwitchToNormalTopMostAndRestart()
}
IPlugin <|.. PluginBase : Implements
PluginBase --> InkCanvasService : Uses
PluginBase --> AppRestartService : Uses
```

## Dependency Analysis

The internal dependencies of the plugin system are as follows:

```mermaid
graph TB
subgraph "External Dependencies"
WPF[WPF Framework]
NET[.NET Runtime]
end
subgraph "Core Interfaces"
IPlugin[IPlugin Interface]
IPluginHost[IPluginHost Interface]
IInkCanvasService[IInkCanvasService Interface]
IAppRestartService[IAppRestartService Interface]
end
subgraph "Implementation Classes"
PluginBase[PluginBase Base Class]
PluginManager[PluginManager Manager]
InkCanvasService[InkCanvasService Implementation]
AppRestartService[AppRestartService Implementation]
end
subgraph "UI Layer"
PluginPage[PluginPage Page]
PluginSettingsPage[PluginSettingsPage Page]
end
WPF --> PluginPage
WPF --> PluginSettingsPage
NET --> PluginManager
NET --> PluginBase
IPluginHost --> PluginManager
IPluginHost --> PluginBase
IInkCanvasService --> InkCanvasService
IAppRestartService --> AppRestartService
PluginBase --> IPlugin
PluginManager --> IPluginHost
PluginPage --> PluginManager
PluginSettingsPage --> PluginManager
```

## Performance Considerations

### Assembly Load Optimization

The plugin system uses an independent assembly loading context, where each plugin has a separate `AssemblyLoadContext`. This provides:

- **Memory Isolation**: Plugin assemblies can be unloaded independently.
- **Dependency Resolution**: Uses `AssemblyDependencyResolver` to resolve dependencies precisely.
- **Garbage Collection**: Supports memory reclamation after plugins are unloaded.

### Async Loading Mechanism

```mermaid
flowchart TD
Start([Start Loading]) --> ScanDir["Scan plugin directory"]
ScanDir --> CreateContext["Create load context"]
CreateContext --> LoadAssembly["Load assembly"]
LoadAssembly --> FindTypes["Find IPlugin types"]
FindTypes --> CreateInstance["Create plugin instance"]
CreateInstance --> InitPlugin["Call Initialize"]
InitPlugin --> SortPlugins["Sort by Order"]
SortPlugins --> Complete([Loading completed])
CreateContext -.-> UnloadContext["Unload context on exception"]
UnloadContext -.-> Complete
```

## Troubleshooting Guide

### Common Issues and Solutions

| Problem Type | Symptom | Solution |
|--------------|---------|----------|
| Plugin cannot be loaded | Assembly not found or type mismatch | Check plugin DLL file integrity and verify that it implements the `IPlugin` interface |
| Initialization failed | `Initialize` throws an exception | Check host service reachability and review log outputs |
| UI display abnormal | Settings interface does not show or has layout errors | Make sure `GetSettingsView` returns a valid `UIElement` |
| Memory leak | Application memory grows continuously | Check whether the `Shutdown` method correctly releases resources |

### Logging Mechanism

The plugin system provides two-level logging:

```mermaid
flowchart TD
CallLog["Plugin calls Log()"] --> CheckHost{"Is Host present?"}
CheckHost --> |No| Skip["Skip logging"]
CheckHost --> |Yes| CallHost["Call Host.Log()"]
CallHost --> EmitEvent["Trigger LogMessage event"]
EmitEvent --> DebugWrite["Write debug output"]
DebugWrite --> UserInterface["Update user interface"]
CallError["Plugin calls LogError()"] --> CheckError{"Has exception?"}
CheckError --> |Yes| FormatError["Format error message"]
CheckError --> |No| SimpleError["Log message directly"]
FormatError --> CallHostError["Call Host.LogError()"]
SimpleError --> CallHostError
CallHostError --> EmitErrorEvent["Trigger error event"]
EmitErrorEvent --> DebugErrorWrite["Write error debug output"]
```

## Conclusion

The Ink Canvas plugin system provides powerful extension capabilities for the application through clear interface design and complete lifecycle management. The `IPlugin` interface defines the core behavior of plugins, `IPluginHost` provides a flexible service injection mechanism, and the `PluginBase` base class simplifies the development process. The system supports modern plugin management features like dynamic loading and unloading, memory isolation, and asynchronous processing, providing a robust extension platform for developers.

## Appendix

### Plugin Development Best Practices

1. **Interface Implementation**: Ensure complete implementation of all required members of the `IPlugin` interface.
2. **Resource Management**: Correctly release all resources in `Shutdown`.
3. **Error Handling**: Avoid throwing unhandled exceptions in `Initialize`.
4. **Thread Safety**: Pay attention to status synchronization in multi-threaded environments.
5. **Version Compatibility**: Adhere to semantic versioning strategies.

### Example Code Path
