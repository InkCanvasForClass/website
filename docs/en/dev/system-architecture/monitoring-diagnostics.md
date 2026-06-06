---
date: 2026-05-05
author:
  - Makitoid
  - Qoder
title: Monitoring and Diagnostics System
description: Monitoring and Diagnostics System
---
# Monitoring and Diagnostics System

## Introduction
This document focuses on the monitoring and diagnostics system of InkCanvasForClass, systematically reviewing its overall architecture and implementation key points, covering the following aspects:
- Performance monitoring and memory usage tracking
- Error log collection and system health checks
- Logging implementation mechanisms (levels, format, rotation, remote transmission)
- Telemetry data collection and analysis (user behavior stats, performance metrics, crash data analysis)
- Integration of diagnostics tools (debug console, performance analysis, memory leak detection helper)
- Monitoring alarm mechanisms (thresholds, rules, and notification policies)
- Extension and customization guide (custom metrics, monitoring panels, and reports)
- Privacy protection and compliance of monitoring data

## Project Structure
Monitoring and diagnostics code is mainly located in the following modules under `Ink Canvas/Helpers` and `Ink Canvas/Windows`:
- Logging & Exception Handling: LogHelper, ExceptionHandler, DebugConsoleManager
- Telemetry & Crash Reporting: TelemetryUploader, DeviceIdentifier
- System Health & Crash Window: App (Startup and Watchdog), CrashWindow
- Notification Center & Announcement: NotificationCenterService, AnnouncementService
- Performance Transparent Window: PerformanceTransparentWin (Rendering and Hit Testing)

```mermaid
graph TB
subgraph "Logging & Diagnostics"
LH["LogHelper<br/>Log Writing/Rotation"]
EH["ExceptionHandler<br/>Exception Handling"]
DC["DebugConsoleManager<br/>Debug Console"]
PW["PerformanceTransparentWin<br/>Transparent Window Hit Testing"]
end
subgraph "Telemetry & Crash"
DU["TelemetryUploader<br/>Telemetry Upload/Sentry"]
DI["DeviceIdentifier<br/>Device ID/Usage Stats"]
CW["CrashWindow<br/>Crash Detail Display"]
end
subgraph "Notification & Announcement"
NS["NotificationCenterService<br/>Notification Queue/History"]
AS["AnnouncementService<br/>Announcement Pull/WebSocket"]
end
subgraph "System Entry"
APP["App<br/>Startup/Daemon/Restart Policy"]
PP["PrivacyPage<br/>Telemetry Privacy Settings"]
end
APP --> LH
APP --> EH
APP --> DU
APP --> DI
DU --> LH
DI --> LH
EH --> LH
DC --> LH
NS --> LH
AS --> LH
PP --> DU
PP --> DI
```

## Core Components
- Logging System (LogHelper)
  - Supports archiving by startup time or fixed file mode, automatically cleaning up log folders that exceed the size limit to prevent disk expansion.
  - Provides a unified log writing interface, including timestamps, thread IDs, log levels, and caller information.
- Exception Handling (ExceptionHandler)
  - Unifies exception capture and log recording, distinguishing between fatal exceptions (such as out-of-memory, access violations) and recoverable ones.
  - Provides synchronous and asynchronous execution wrappers, supporting context strings and continue-execution strategies.
- Telemetry Upload (TelemetryUploader)
  - Reports telemetry events based on Sentry, including metadata like device ID, update channel, application version, and OS version.
  - Supports two levels: Basic / Extended. Extended will attach anonymized execution logs.
  - Automatically anonymizes sensitive information such as emails, phone numbers, IPs, paths, keys, and URL parameters.
- Device Identifier & Usage Statistics (DeviceIdentifier)
  - Generates a stable 25-character device ID, combining hardware fingerprints and check digits, with tolerance for cross-hardware changes.
  - Maintains usage statistics (launches, total duration, weekly stats, average session duration), and calculates usage frequency and update priorities.
- Debug Console (DebugConsoleManager)
  - Dynamically allocates/shows/hides the console window, removing the close menu to prevent users from accidentally closing the process.
- Crash Window (CrashWindow)
  - Displays crash details, supporting copy and close actions, coordinating with telemetry and logs to locate issues.
- Notification Center & Announcement (NotificationCenterService, AnnouncementService)
  - Unifies notification queues and histories, supporting real-time announcement push and HTTP fallback.

## Architecture Overview
The monitoring and diagnostics system is built around the closed loop of "Logs—Exceptions—Telemetry—Crash—Notifications—System Health". The key interactions are:

```mermaid
sequenceDiagram
participant App as "App"
participant EH as "ExceptionHandler"
participant LH as "LogHelper"
participant DI as "DeviceIdentifier"
participant DU as "TelemetryUploader"
participant Sentry as "Sentry"
participant CW as "CrashWindow"
App->>EH : "TryExecute/Async Wrappers"
EH->>LH : "HandleException -> Write Log"
App->>DI : "RecordAppLaunch/RecordAppExit"
App->>DU : "UploadTelemetryIfNeededAsync"
DU->>Sentry : "CaptureEvent (including anonymized log)"
App->>CW : "Show Details on Exception/Crash"
CW->>LH : "Copy Crash Details -> Write Log"
```

## Detailed Component Analysis

### Logging System (LogHelper)
- Log Levels: Info, Trace, Error, Event, Warning
- Log Format: Includes timestamp, thread ID, level, caller info, and message body.
- Archive Policy: Names log files by startup time, automatically cleaning up directory contents when date archiving is enabled (default limit is 5MB).
- Concurrency Safety: Uses atomic flags to avoid deadlocks caused by recursive writing.
- Output Location: Supports fixed file and startup time archive modes.

```mermaid
flowchart TD
Start(["Write Log Entry"]) --> CheckFlag["Check Write Flag (Mutex)"]
CheckFlag --> |Occupied| Return["Return (Avoid Recursion)"]
CheckFlag --> |Available| LoadSettings["Read Settings: Enable Log / Date Archiving"]
LoadSettings --> DateArchive{"Date Archiving Enabled?"}
DateArchive --> |Yes| EnsureDir["Ensure Logs Directory Exists & Clean Size Limit"]
DateArchive --> |No| UseFixed["Use Fixed Log File"]
EnsureDir --> BuildPath["Concat Log_{AppStartTime}.txt"]
UseFixed --> BuildPath
BuildPath --> WriteLine["Write Formatted Log Line"]
WriteLine --> Done(["Finished"])
```

### Exception Handling (ExceptionHandler)
- Unifies exception capture, logging context, and inner exception chains.
- Decides whether to continue execution for fatal exceptions (out-of-memory, access violation).
- Provides synchronous and asynchronous TryExecute / TryExecuteAsync wrappers to simplify caller logic.

```mermaid
flowchart TD
TryStart(["TryExecute/Async Start"]) --> TryBlock["Execute Incoming Delegate"]
TryBlock --> |Success| Done["Return true"]
TryBlock --> |Exception ex| Handle["HandleException"]
Handle --> Log["Write Log (Configurable Level)"]
Log --> Decide{"Is Fatal Exception?"}
Decide --> |Yes| Continue{"Continue Execution?"}
Continue --> |No| Throw["Throw Exception"]
Continue --> |Yes| ReturnFalse["Return false"]
Decide --> |No| ReturnTrue["Return true"]
```

### Telemetry Upload (TelemetryUploader)
- Telemetry Level: None, Basic, Extended
- Data Content: Device ID, update channel, app version, OS version, and presence of crash/running logs.
- Anonymization Policy: Emails, phone numbers, IPv4, Windows paths, UNC paths, secret keys, JSON fields, URL parameters.
- Transmission Channel: Sentry event reporting, attached with user information and extra data.
- Trigger Conditions: Satisfies privacy consent, valid device ID, and upload level is not None.

```mermaid
sequenceDiagram
participant UI as "Privacy Settings Page"
participant DU as "TelemetryUploader"
participant FS as "File System"
participant SEN as "Sentry"
UI->>DU : "Setting Change Triggers Upload"
DU->>DU : "Check Privacy Consent & Device ID Validity"
DU->>FS : "Find Latest Crash/Running Log (Anonymized)"
DU->>SEN : "CaptureEvent (including telemetry data + anonymized file)"
SEN-->>DU : "Reporting Result"
DU->>DU : "Log Event Action"
```

### Device Identifier & Usage Statistics (DeviceIdentifier)
- Device ID Generation: Based on hardware fingerprints (CPU/motherboard/BIOS/disk/MachineGuid etc.) + SHA256 + check digits to ensure stability and uniqueness.
- Usage Statistics: Startup counts, total usage duration, average session duration, weekly statistics (launch counts and duration).
- Frequency and Priority: Groups into High/Medium/Low frequency based on a comprehensive score (activity, weekly startup counts, weekly usage duration, historical duration), mapped to update priorities.
- File Persistence: Device ID and usage statistics are persisted separately, featuring master files and backup files with automatic degradation upon anomalies.

```mermaid
classDiagram
class DeviceIdentifier {
+GetDeviceId() string
+RecordAppLaunch() void
+RecordAppExit() void
+GetUsageFrequency() UsageFrequency
+GetUpdatePriority() UpdatePriority
+GetSystemVersion() string
}
class UsageStats {
+LastLaunchTime DateTime
+LaunchCount int
+SystemVersion string
+TotalUsageSeconds long
+AverageSessionSeconds double
+WeeklyLaunchCount int
+WeeklyUsageSeconds long
+LastWeekLaunchCount int
+LastWeekUsageSeconds long
+RecordWeeklyLaunch() void
+RecordWeeklyUsage(seconds) void
+CheckAndResetWeeklyStats() void
}
DeviceIdentifier --> UsageStats : "Maintain / Persist"
```

### Debug Console (DebugConsoleManager)
- Dynamically allocates console window, setting title and encoding, and disabling the close menu.
- Provides show/hide/write interfaces to avoid duplicate allocations and exceptions.

```mermaid
flowchart TD
Show(["Show Console"]) --> CheckAlloc{"Is Allocated?"}
CheckAlloc --> |No| Alloc["AllocConsole()"]
CheckAlloc --> |Yes| Exists{"Does Window Handle Exist?"}
Alloc --> SetTitle["Set Title/Encoding"]
Exists --> |No| Alloc
Exists --> |Yes| ShowWin["ShowWindow(SW_SHOW)"]
SetTitle --> SetMenu["Remove Close Menu"]
SetMenu --> Visible["Mark Visible"]
ShowWin --> Visible
```

### Crash Window (CrashWindow)
- Shows crash details text box, supporting copy and close actions.
- Adapts theme to system settings and logs errors on exceptions.

```mermaid
sequenceDiagram
participant App as "App"
participant CW as "CrashWindow"
participant LH as "LogHelper"
App->>CW : "Construct & Display"
CW->>CW : "Apply Theme / Topmost / Focus"
CW->>LH : "Copy Failed / Theme Exception -> Write Log"
CW-->>App : "User Clicks Close"
```

### Notification Center & Announcement (NotificationCenterService, AnnouncementService)
- Notification Center: Queues notifications, sorting by level/priority/creation time, and limiting history counts.
- Announcement Service: Supports HTTP pull and WebSocket real-time push, filtering expired/not started/version/channel mismatch items, supporting marking as read and unread counts.

```mermaid
sequenceDiagram
participant AS as "AnnouncementService"
participant NS as "NotificationCenterService"
participant LH as "LogHelper"
AS->>AS : "FetchAnnouncements (HTTP)"
AS->>NS : "Enqueue (ToNotificationMessage)"
NS->>NS : "Sort / Deduplicate / Limit History"
NS-->>AS : "TryShowNext()"
AS->>LH : "Connection / Parsing Exception -> Write Log"
```

## Dependency Analysis
- Logging & Exceptions: ExceptionHandler depends on LogHelper. App makes heavy use of logging and exception handling during startup, shutdown, and watchdog processes.
- Telemetry & Device: TelemetryUploader depends on DeviceIdentifier to retrieve the device ID; it checks privacy consent and device ID validity before uploading.
- Crash & Telemetry: Crash details can be copied via CrashWindow, which is subsequently logged by the logging system for later telemetry analysis.
- Notifications & Announcement: AnnouncementService coordinates with NotificationCenterService to form a unified message distribution and history management system.
- Performance & Hit Testing: PerformanceTransparentWin combines transparent hit testing with DWM/WindowChrome, reducing unnecessary drawing areas and indirectly boosting rendering performance.

```mermaid
graph LR
EH["ExceptionHandler"] --> LH["LogHelper"]
DU["TelemetryUploader"] --> DI["DeviceIdentifier"]
DU --> LH
CW["CrashWindow"] --> LH
AS["AnnouncementService"] --> NS["NotificationCenterService"]
NS --> LH
APP["App"] --> LH
APP --> EH
PW["PerformanceTransparentWin"] -.-> APP
```

## Performance Considerations
- Log writing uses a mutex flag to avoid recursion and concurrency conflicts, while date archiving and size limits lower IO and disk pressures.
- Telemetry upload executes on a background thread, and anonymization mitigates the risk of sensitive data leaks.
- Device ID and usage statistics caching (2 minutes) reduces frequent IO and computing overhead.
- Transparent window hit testing combined with DWM/WindowChrome reduces unnecessary drawing areas, improving rendering performance.
- Startup watchdog and silent restart strategies attempt recovery when the main thread freezes, safeguarding the user experience.

## Troubleshooting Guide
- Inspecting Logs
  - Fixed files or startup-time archived files are located in the application root directory or the Logs subdirectory. Pay attention to the 5MB size limit cleanup records.
  - Focus on Error / Warning / Event level logs to locate the exception context and caller details.
- Exception Handling
  - Wrap error-prone logic with TryExecute / TryExecuteAsync to ensure exceptions are caught and logged.
  - Terminate execution and report for fatal exceptions (out-of-memory, access violations).
- Telemetry & Crash
  - Confirm privacy consent and device ID validity. Extended level will attach anonymized running logs.
  - Crash details can be copied via CrashWindow, combined with logs to locate the issue.
- Notifications & Announcement
  - If real-time push fails, the service falls back to HTTP poll; check the network and announcement source URL.
- Debug Console
  - Display the console via DebugConsoleManager to view real-time output and interactions.

## Conclusion
The monitoring and diagnostics system, centered around logs, integrates exception handling, telemetry uploads, device identification statistics, crash windows, and notification centers to form a complete observability loop. The system prioritizes privacy protection (anonymization and minimal collection), performance optimization (size limits, caching, and transparent window hit testing), and user experience (silent restart, theme adaptation, real-time announcements). Through reasonable extension points and custom guides, custom metrics and reports can be introduced without disrupting existing mechanisms.

## Appendix

### Monitoring Alarm Mechanism (Recommended)
- Threshold Configuration
  - Log Level Threshold: Error/Warning high-frequency alarms; Event important events alarms.
  - Crash Rate Threshold: Crash count / total startups within a unit time.
  - Performance Threshold: Decrease in average session duration, abnormal fluctuations in weekly startup counts.
- Alarm Rules
  - Dynamically adjust alarm strategies based on DeviceIdentifier usage frequency and update priorities.
  - Telemetry event tags (device ID, update channel, OS version) are used for aggregation and comparison.
- Notification Policies
  - Notification center priority sorting, with Critical/Urgent notifications forcing popup windows.
  - Announcement service supports filtering by version/channel to avoid irrelevant alerts.

### Extension and Customization Guide
- Custom Metrics
  - Extend UsageStats fields in DeviceIdentifier, or add a standalone statistical module.
  - Extend telemetry data structures and anonymization rules in TelemetryUploader.
- Monitoring Panel
  - Build visualization panels based on log files and telemetry event tags (external tools recommended).
- Report Generation
  - Export weekly/monthly usage statistics and crash reports, processed with anonymization in compliance with privacy policies.

### Privacy Protection and Compliance
- Privacy Consent: User consent must be obtained prior to uploading telemetry.
- Data Minimization: Only upload anonymous device IDs, version, and system information.
- Anonymization: Replace emails, phone numbers, IPs, paths, keys, and URL parameters.
- File Cleanup: Automatically clean up when the log folder exceeds limits, keeping cleanup logs.
- Sync & Storage: Device ID and usage statistics files are stored using encrypted/secure paths.
