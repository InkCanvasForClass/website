---
date: 2026-05-05
author:
  - Makitoid
  - Qoder
title: Telemetry Service
description: Telemetry Service
---
# Telemetry Service

## Introduction
This document focuses on the implementation and usage of the "Telemetry Service", centering on the architectural design and implementation details of TelemetryUploader. It covers telemetry data collection, anonymization, formatting, and reporting workflows; design and implementation of upload queue systems (BaseUploadQueue abstraction and WebDavUploadQueue/DlassUploadQueue concrete implementations); classification and priority management of telemetry data (handling policies and batch uploading mechanisms for different levels of data); security guarantees for data transmission (encrypted transmission, authentication, and data integrity checks); configuration management (upload frequency, data retention policies, and network status detection); and data analysis, visualization methods, performance optimization strategies, and fault recovery mechanisms.

## Project Structure
Telemetry-related code is primarily located in Ink Canvas\Helpers, which, in coordination with the settings pages and resource definitions, forms a complete telemetry system:
- Telemetry Upload Entry & Anonymization Logic: TelemetryUploader
- Upload Queue Abstraction & General Implementation: BaseUploadQueue
- Concrete Upload Providers & Queues: WebDavUploadQueue, DlassUploadQueue
- Upload Provider Interfaces & Consolidated Dispatching: UploadHelper, UploadQueueHelper
- Upload Clients & WebDAV Uploaders: DlassApiClient, WebDavUploader
- Device Identification & Logging Tools: DeviceIdentifier, LogHelper
- Configurations & Settings Pages: PrivacyPage, CloudStoragePage, Settings

```mermaid
graph TB
subgraph "Telemetry & Upload"
TU["TelemetryUploader<br/>Telemetry Upload Entry"]
BQ["BaseUploadQueue<br/>Upload Queue Abstraction"]
WUQ["WebDavUploadQueue<br/>WebDAV Upload Queue"]
DUQ["DlassUploadQueue<br/>Dlass Upload Queue"]
UH["UploadHelper<br/>Upload Provider Interface & Scheduling"]
UQH["UploadQueueHelper<br/>Queue Registration & Initialization"]
WDU["WebDavUploader<br/>WebDAV Uploader"]
DAC["DlassApiClient<br/>Dlass API Client"]
end
subgraph "Configuration & Tools"
DP["PrivacyPage<br/>Privacy & Telemetry Settings Page"]
CSP["CloudStoragePage<br/>Cloud Storage Settings Page"]
DEV["DeviceIdentifier<br/>Device ID Generation & Validation"]
LOG["LogHelper<br/>Logging Tool"]
SET["Settings<br/>Configuration Model"]
MW["MainWindow<br/>Application Entry"]
end
TU --> DEV
TU --> LOG
UH --> WUQ
UH --> DUQ
UQH --> WUQ
UQH --> DUQ
DUQ --> DAC
WUQ --> WDU
DP --> SET
CSP --> SET
MW --> UQH
MW --> TU
```

## Core Components
- TelemetryUploader: Collects, anonymizes, and reports telemetry data. It supports Basic/Extended levels to upload crash logs and running logs respectively, reporting events via Sentry.
- BaseUploadQueue: The abstract base class for upload queues, defining general queue behaviors (initialization, enqueueing, batch processing, retries, persistence, expired cleanup, file validation, etc.).
- WebDavUploadQueue/DlassUploadQueue: Concrete upload queue implementations interfacing with WebDAV and Dlass services, wrapping upload logic and conditions checks.
- UploadHelper/UploadQueueHelper: Provides upload provider interfaces and unified dispatching, registering and initializing upload queues, and supporting delayed and concurrent uploads.
- WebDavUploader/DlassApiClient: Underlying uploaders and API clients handling network transmissions, authentications, and error handling.
- DeviceIdentifier/LogHelper: Device identifier generation and logging utilities, ensuring observability and traceability in telemetry and upload processes.
- Configurations & Settings Pages: PrivacyPage/CloudStoragePage and the Settings model, providing configurations for telemetry levels, privacy agreements, upload providers, and WebDAV/Dlass parameters.

## Architecture Overview
The telemetry service adopts a pipelined "Collection - Anonymization - Queue - Upload - Reporting" architecture. Upon application startup, MainWindow initializes the upload queues and triggers TelemetryUploader to execute telemetry reporting. The upload queues are uniformly dispatched via UploadHelper/UploadQueueHelper, supporting multiple upload providers, batch uploading, retries, and persistence.

```mermaid
sequenceDiagram
participant App as "Application Startup"
participant MW as "MainWindow"
participant UQH as "UploadQueueHelper"
participant TU as "TelemetryUploader"
participant UH as "UploadHelper"
participant WUQ as "WebDavUploadQueue"
participant DUQ as "DlassUploadQueue"
participant WDU as "WebDavUploader"
participant DAC as "DlassApiClient"
App->>MW : Start Application
MW->>UQH : InitializeAllQueues()
MW->>TU : UploadTelemetryIfNeededAsync()
TU->>TU : Collect & Anonymize Logs
TU->>UH : Report via Upload Providers
UH->>WUQ : UploadFileAsync()
UH->>DUQ : UploadFileAsync()
WUQ->>WDU : UploadFileAsync()
DUQ->>DAC : UploadNoteAsync()
WDU-->>WUQ : Result
DAC-->>DUQ : Result
WUQ-->>UH : Success/Failure
DUQ-->>UH : Success/Failure
UH-->>TU : Summarize Results
TU-->>MW : Log Recording
```

## Detailed Component Analysis

### TelemetryUploader: Telemetry Data Collection, Anonymization & Reporting
- Data Collection & Level Control
  - Determines whether to collect and report based on TelemetryUploadLevel (None/Basic/Extended) in settings.
  - Basic Level: Collects the latest crash logs (anonymized).
  - Extended Level: Additionally collects running logs (anonymized).
- Anonymization Policy
  - Uses regular expressions to replace sensitive information in emails, phone numbers, IPv4, Windows paths, UNC paths, URL parameters, key-value pairs, and JSON fields.
- Device & Environment Information
  - Fetches the device ID via DeviceIdentifier, appending metadata like application version, OS version, and update channels.
- Reporting Channels
  - Reports events via the Sentry SDK, containing user details, telemetry data tags, and extra attachments.

```mermaid
flowchart TD
Start(["Start"]) --> CheckSettings["Read settings and privacy agreement"]
CheckSettings --> LevelCheck{"Level is None?"}
LevelCheck --> |Yes| End(["End"])
LevelCheck --> |No| GetDevice["Get Device ID"]
GetDevice --> DeviceValid{"Device ID Valid?"}
DeviceValid --> |No| End
DeviceValid --> CollectCrash["Collect latest crash log and anonymize"]
CollectCrash --> LevelExt{"Level is Extended?"}
LevelExt --> |Yes| CollectRuntime["Collect running log and anonymize"]
LevelExt --> |No| BuildData["Build telemetry data object"]
CollectRuntime --> BuildData
BuildData --> SentryReport["Report event via Sentry"]
SentryReport --> End
```

### BaseUploadQueue: Upload Queue Abstraction & General Implementation
- Queues & Persistence
  - Uses concurrent queues to store pending uploads, supporting serialization to JSON files under the Configs directory to prevent loss across restarts.
- Batch Uploads & Concurrency
  - Defaults to a batch size of 10, executing asynchronous concurrent uploads and saving queue states upon completion.
- Retries & Error Handling
  - Max retry limit is 3; determines whether to retry based on error types (timeouts, network errors, specific HTTP status codes).
- File Validation & Expired Cleanup
  - Validates file extensions and sizes; prunes expired items older than 72 hours regularly.
- Concurrency Control
  - Uses semaphores to manage queue processing and saving concurrency, preventing race conditions and deadlocks.

```mermaid
classDiagram
class BaseUploadQueue {
+InitializeQueue()
+UploadFileAsync(filePath)
#IsUploadEnabled() bool
#UploadFileInternalAsync(filePath) Task~bool~
#IsValidFile(filePath) bool
-EnqueueFile(filePath, retryCount)
-ProcessUploadQueueAsync()
-SaveQueueToFileAsync()
-CleanupExpiredItems() int
}
class WebDavUploadQueue {
+QueueFileName
+IsUploadEnabled() bool
+UploadFileInternalAsync(filePath) Task~bool~
}
class DlassUploadQueue {
+QueueFileName
+IsUploadEnabled() bool
+UploadFileInternalAsync(filePath) Task~bool~
}
BaseUploadQueue <|-- WebDavUploadQueue
BaseUploadQueue <|-- DlassUploadQueue
```

### WebDavUploadQueue & WebDavUploader: WebDAV Upload Implementation
- WebDavUploadQueue
  - Queue filename is WebDavUploadQueue.json; upload enabling is evaluated via WebDavUploader.IsWebDavEnabled().
  - UploadFileInternalAsync invokes WebDavUploader.UploadFileAsync to complete the upload.
- WebDavUploader
  - Reads the WebDAV address, username, password, and root directory settings to construct target paths.
  - Attempts directory creation if the first upload fails, and retries the upload; supports cancellation tokens and exception handling.

```mermaid
sequenceDiagram
participant Q as "WebDavUploadQueue"
participant U as "WebDavUploader"
participant S as "WebDAV Server"
Q->>U : UploadFileAsync(filePath)
U->>U : Validate Settings & File
U->>S : PutFile(TargetPath, FileStream)
alt Upload Failed
U->>S : Mkcol (Create directory step-by-step)
U->>S : PutFile (Retry)
end
S-->>U : Result
U-->>Q : Success/Failure
```

### DlassUploadQueue & DlassApiClient: Dlass Upload Implementation
- DlassUploadQueue
  - Queue filename is DlassUploadQueue.json; upload is enabled if auto-upload is toggled on in settings.
  - UploadFileInternalAsync retrieves whiteboard info and user tokens, prepares upload parameters (title, description, tags), and calls DlassApiClient.UploadNoteAsync to upload.
- DlassApiClient
  - Supports OAuth to fetch access tokens or uses user tokens; handles GET/POST/PUT/DELETE requests and file uploads.
  - Injects whiteboard authentication headers (X-Board-ID, X-Secret-Key) and file contents during uploads.

```mermaid
sequenceDiagram
participant Q as "DlassUploadQueue"
participant C as "DlassApiClient"
participant S as "Dlass Service"
Q->>Q : Get Whiteboard Info & User Token
Q->>C : UploadNoteAsync(File, BoardID, Key, Title, Description, Tag)
C->>S : POST /api/whiteboard/upload_note
S-->>C : Response (Success/Failure)
C-->>Q : Result
```

### UploadHelper & UploadQueueHelper: Upload Provider & Queue Management
- UploadHelper
  - Defines the IUploadProvider interface, providing WebDavUploadProvider and DlassUploadProvider registered and bound to corresponding queues by default.
  - UploadFileAsync supports upload delay (minutes), file accessibility checks, concurrent uploads to multiple providers, and error logging.
- UploadQueueHelper
  - Registers and initializes all upload queues uniformly, ensuring queues are ready upon application startup.

```mermaid
classDiagram
class IUploadProvider {
<<interface>>
+Name string
+IsEnabled bool
+UploadAsync(filePath) Task~bool~
}
class DlassUploadProvider {
+Name
+IsEnabled
+UploadAsync(filePath)
}
class WebDavUploadProvider {
+Name
+IsEnabled
+UploadAsync(filePath)
}
class UploadHelper {
+Initialize()
+UploadFileAsync(filePath) Task~bool~
+GetProviders() IUploadProvider[]
+GetEnabledProviders() IUploadProvider[]
}
class UploadQueueHelper {
+RegisterQueue(queue)
+InitializeAllQueues()
+GetAllQueues() IReadOnlyList~BaseUploadQueue~
}
IUploadProvider <|.. DlassUploadProvider
IUploadProvider <|.. WebDavUploadProvider
UploadHelper --> DlassUploadProvider
UploadHelper --> WebDavUploadProvider
UploadHelper --> UploadQueueHelper
UploadQueueHelper --> BaseUploadQueue
```

## Dependency Analysis
- Component Coupling
  - TelemetryUploader depends on DeviceIdentifier and LogHelper to report telemetry events via Sentry.
  - Upload queues depend on UploadHelper/UploadQueueHelper for registration and initialization.
  - WebDavUploadQueue depends on WebDavUploader; DlassUploadQueue depends on DlassApiClient.
- External Dependencies
  - Sentry SDK for telemetry event reporting.
  - WebDav client library for WebDAV uploads.
  - HttpClient for Dlass API communications.
- Configuration Dependencies
  - The Settings model provides Dlass/WebDAV parameters and upload delays; PrivacyPage/CloudStoragePage provide user interaction interfaces.

```mermaid
graph TB
TU["TelemetryUploader"] --> DEV["DeviceIdentifier"]
TU --> LOG["LogHelper"]
UH["UploadHelper"] --> WUQ["WebDavUploadQueue"]
UH --> DUQ["DlassUploadQueue"]
UQH["UploadQueueHelper"] --> WUQ
UQH --> DUQ
DUQ --> DAC["DlassApiClient"]
WUQ --> WDU["WebDavUploader"]
SET["Settings"] --> WUQ
SET --> DUQ
DP["PrivacyPage"] --> SET
CSP["CloudStoragePage"] --> SET
```

## Performance Considerations
- Batch Uploads & Concurrency
  - Default batch size is 10 to reduce network connection overheads; concurrent uploading improves throughput.
- Queue Persistence & Recovery
  - Queue states are persisted to JSON files, automatically recovering upon restart to avoid duplicate uploads.
- Expired Cleanup & Capacity Controls
  - Limits maximum queue length and enforces a 72-hour expiration policy to prevent memory and disk expansion.
- Retry Strategies
  - Limits retries to 3 times, matching with retryable errors (timeouts, network issues, select HTTP codes) to lower failure rates.
- Upload Delays
  - UploadHelper supports minute-level upload delays to smooth out network loads.

## Troubleshooting Guide
- Telemetry Upload Fails
  - Verify if privacy agreements are accepted and check if TelemetryUploadLevel is set to None.
  - Confirm if the device ID is valid.
  - Review Warning / Error entries in log files.
- Upload Queue Anomaly
  - Verify if queue JSON files under Configs are corrupted or have permission issues.
  - Inspect queue recovery logs and expired cleanup records.
- WebDAV Upload Fails
  - Check WebDAV address, username, password, and root directory configurations.
  - Verify network connectivity and directory creation privileges.
- Dlass Upload Fails
  - Check user tokens, whiteboard info, and authentication header settings.
  - Inspect API base URLs and network states.

## Conclusion
The telemetry service implements telemetry data collection and anonymized reporting via TelemetryUploader, utilizing BaseUploadQueue abstractions and WebDavUploadQueue/DlassUploadQueue implementations to deliver robust batch uploading and retry mechanisms. UploadHelper/UploadQueueHelper provide unified upload providers and queue management, cooperating with Settings and settings pages to supply flexible controls and user experiences. The overall architecture exhibits excellent extensibility, observability, and fault tolerance.

## Appendix
- Configuration References
  - Telemetry levels and privacy agreements: PrivacyPage
  - Dlass/WebDAV parameters and auto uploads: CloudStoragePage
  - Upload delays and provider toggles: relevant fields for Upload/Dlass/WebDav in Settings
- Data Retention Policy
  - Clears log directories when size exceeds 5MB to prevent infinite disk growth.
- Network Status Detection
  - Uploaders identify network errors and timeouts via exceptions and HTTP status codes, combining with retry strategies to boost success rates.
