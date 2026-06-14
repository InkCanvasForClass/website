# Ink Canvas External Protocol (URI Scheme) Documentation

Ink Canvas supports external control via the custom `icc://` protocol. This feature allows other applications, web scripts, or system shortcuts to remotely control Ink Canvas.

## Enabling the Protocol

Before using the external protocol, you must enable it in the application settings:
1. Open **Settings**.
2. Go to the **Advanced Options** panel.
3. Find the **External Protocol** section.
4. Turn on the **"Enable External Protocol (icc://)"** toggle.

> **Note**: This automatically registers the protocol in the Windows Registry for the current user. Disabling the feature will unregister the protocol.

---

## Command Reference

### 1. Basic Control Commands

| Command | URI | Description |
| :--- | :--- | :--- |
| **Fold** | `icc://fold` | Enter **fold mode**. If currently unfolded, clears ink and collapses to the sidebar. |
| **Unfold** | `icc://unfold` | Exit **fold mode**. If currently folded, expands the floating toolbar. |
| **Toggle** | `icc://toggle` | **Toggle** between folded and unfolded states. |
| **Show** | `icc://show` | Same as `unfold`. Kept for backward compatibility. |

### 2. Sidebar Tool Commands

These commands correspond to the quick tools available in the sidebar during fold mode.

| Command | URI | Description |
| :--- | :--- | :--- |
| **Single Draw** | `icc://randone` | Open the random name picker and perform a **single draw**. |
| **Random Draw** | `icc://rand` | Open the random name picker and perform a **random draw**. |
| **Timer** | `icc://timer` | Open the **countdown timer** tool. |
| **Whiteboard** | `icc://whiteboard` | Switch to **whiteboard mode** (also available as `icc://board`). |

### 3. Application Lifecycle Commands

Control restarting and exiting the Ink Canvas application. A notification is displayed before execution, with a 300ms delay to ensure the user sees the notification.

| Command | URI | Description |
| :--- | :--- | :--- |
| **Restart** | `icc://restart` | Restart the application with **current privileges**. |
| **Restart as Admin** | `icc://restart/admin` | Restart the application as **administrator** (triggers a UAC elevation prompt). |
| **Restart as Normal** | `icc://restart/normal` | Restart the application as a **normal user** (drops privileges even if currently running as admin). |
| **Exit** | `icc://exit` | Exit the application (also available as `icc://quit`). |

### 4. Canvas Operation Commands

Used for clearing ink, undo/redo operations, and whiteboard page navigation and management.

| Command | URI | Description |
| :--- | :--- | :--- |
| **Clear Ink** | `icc://clear` | Clear ink on the current page (also available as `icc://clearink`). |
| **Clear Ink and History** | `icc://clearall` | Clear ink on the current page and purge the undo history (also available as `icc://clearinkandhistory`). |
| **Undo** | `icc://undo` | Perform a single undo operation. |
| **Redo** | `icc://redo` | Perform a single redo operation. |
| **Next Page** | `icc://nextpage` | Switch to the **next** whiteboard page (also available as `icc://page/next`). |
| **Previous Page** | `icc://previouspage` | Switch to the **previous** whiteboard page (also available as `icc://prevpage` or `icc://page/previous`). |
| **New Page** | `icc://newpage` | Add a new whiteboard page (also available as `icc://page/add`). |
| **Delete Page** | `icc://deletepage` | Delete the current whiteboard page (only effective when there is more than one page; also available as `icc://page/delete`). |
| **Screenshot** | `icc://screenshot` | Capture a screen region and insert it into the canvas. A 300ms delay is applied to avoid the notification obscuring the capture area. |

### 5. Tool State Commands

Used to switch the current annotation tool or query the current tool state. URIs are case-insensitive.

| Command | URI | Description |
| :--- | :--- | :--- |
| **Pen** | `icc://tool/pen` or `icc://tool/color` | Switch to the **pen** tool (`color` also routes to pen/highlighter). |
| **Cursor** | `icc://tool/cursor` | Switch to **cursor/mouse** mode. |
| **Area Eraser** | `icc://tool/eraser` | Enter annotation mode and switch to the **area eraser**. |
| **Stroke Eraser** | `icc://tool/eraserbystrokes` or `icc://tool/eraserstroke` | Enter annotation mode and switch to the **stroke eraser**. |
| **Select / Lasso** | `icc://tool/select` or `icc://tool/lasso` | Enter annotation mode and switch to the **lasso selection** tool. |
| **Get Current Tool** | `icc://tool/state` | Write the current tool state to a temp file for third-party consumption. See below. |

#### `icc://tool/state` Return Value

This command does not return data via the protocol. Instead, it writes the current tool name to a file:

- **File path**: `%TEMP%\InkCanvasToolState.txt` (e.g., `C:\Users\<username>\AppData\Local\Temp\InkCanvasToolState.txt`)
- **Encoding**: UTF-8, single-line plain text.

Possible values: `cursor` (mouse), `pen` (pen), `color` (highlighter), `eraser` (area eraser), `eraserByStrokes` (stroke eraser), `select` (selection), `shape` (shapes). Defaults to `cursor` if unrecognizable.

### 6. Configuration Profile Commands

Used to retrieve the list of configuration profiles or switch the active profile via URI. URIs are case-insensitive.

| Command | URI | Description |
| :--- | :--- | :--- |
| **List Profiles** | `icc://config-profile/list` | Write all saved profile names and the currently active profile to a temp JSON file for third-party consumption. |
| **Switch Profile** | `icc://config-profile/switch?name=<profile>` | Switch to the specified profile and hot-reload settings. Result is written to a temp file. |

#### `icc://config-profile/list` Return Value

This command writes the profile list to a file instead of returning data via the protocol:

- **File path**: `%TEMP%\InkCanvasConfigProfileList.json`
- **Encoding**: UTF-8, JSON format.

Example content:

```json
{
  "list": [ "ProfileA", "ProfileB", "Classroom1" ],
  "current": "ProfileA"
}
```

- `list`: Array of all saved configuration profile names.
- `current`: The currently active profile name; empty string if no profile has been switched to.

#### `icc://config-profile/switch` Details

- **Query parameter**: `name` (required) — the profile name to switch to. If the name contains non-ASCII characters or special characters, URL-encode it (e.g., `name=Classroom%201`).
- **Result file path**: `%TEMP%\InkCanvasConfigProfileSwitchResult.txt`
- **Encoding**: UTF-8, single-line plain text.
- **Possible contents**:
  - `ok` — Switch successful, settings hot-reloaded.
  - `error: 缺少参数 name` — `name` parameter not provided.
  - `error: 方案不存在或应用失败` — Specified profile does not exist or failed to apply.

Examples:

- Switch to profile "Classroom1": `icc://config-profile/switch?name=Classroom1`
- URL-encoded profile name: `icc://config-profile/switch?name=Profile%20A`

### 7. Advanced Commands (Hidden Features)

These features are specifically designed for compatibility with third-party sidebar or floating window applications and are not shown in the standard settings UI. URIs are case-insensitive; the table shows lowercase forms.

| Command | URI | Description |
| :--- | :--- | :--- |
| **ThoroughHideOn** | `icc://thoroughhideon` | **Enable** "Hide completely when folded". When enabled, the main window becomes fully invisible in fold mode. |
| **ThoroughHideOff** | `icc://thoroughhideoff` | **Disable** "Hide completely when folded". Restores the default sidebar edge peek behavior. |
| **ThoroughHideToggle** | `icc://thoroughhidetoggle` | **Toggle** the "Hide completely when folded" feature on or off. |

### 8. Ink Freeze Commands

Used to control the ink freeze feature. URIs are case-insensitive and support multiple equivalent forms.

| Command | URI | Description |
| :--- | :--- | :--- |
| **Freeze Page** | `icc://freeze` | Freeze ink on the current page (also available as `icc://lock`, `icc://ink-freeze`, `icc://ink/lock`). Supports `?page=N` to specify a page number. |
| **Unfreeze Page** | `icc://unfreeze` | Unfreeze ink on the current page (also available as `icc://unlock`, `icc://ink-unfreeze`, `icc://ink/unlock`). |
| **Start Freeze Course** | `icc://freeze/start` | Start ink freeze course mode (records the page, freezes it automatically when the course ends). |
| **End Freeze Course** | `icc://freeze/end` | End the ink freeze course and freeze the recorded pages. |
| **Cancel Freeze Course** | `icc://freeze/cancel` | Cancel an ongoing freeze course countdown. |

> In the commands above, `freeze` can be replaced with `lock`, `ink-freeze`, or `ink/lock` — all have the same effect.

---

## Usage Examples

### A. Calling from a Web Browser
Type the URI directly in the browser address bar and press Enter, or use a hyperlink in HTML:
```html
<a href="icc://fold">Fold Ink Canvas</a>
```

### B. Using the Windows "Run" Dialog
Press `Win + R`, type `icc://toggle`, and press Enter.

### C. Using from Batch Scripts or Command Line
```cmd
start icc://unfold
```

### D. Third-Party: Reading the Current Tool State
After calling `icc://tool/state`, read `%TEMP%\InkCanvasToolState.txt` to get the current tool name (e.g., `pen`, `cursor`, `eraser`).

### E. Third-Party: Listing and Switching Configuration Profiles
1. Call `icc://config-profile/list`, then read `%TEMP%\InkCanvasConfigProfileList.json` for `list` and `current`.
2. Call `icc://config-profile/switch?name=<profile>` to switch profiles, then read `%TEMP%\InkCanvasConfigProfileSwitchResult.txt` to check the result (content is `ok` on success).

### F. Automation Script Example
The following batch script demonstrates how to control Ink Canvas programmatically:

```cmd
@echo off
:: Clear ink and take a screenshot
start icc://clear
timeout /t 1
start icc://screenshot
timeout /t 2

:: Switch to whiteboard mode, add a new page, then take a screenshot
start icc://whiteboard
timeout /t 1
start icc://newpage
timeout /t 1
start icc://screenshot
```

### G. Quick Restart via Desktop Shortcut
Create a desktop shortcut with the target set to:
```
icc://restart
```
Double-click to restart Ink Canvas. Use `icc://restart/admin` for an administrator restart.

---

## Developer Notes

### How It Works
1. **Cold Start**: If Ink Canvas is not running, invoking the URI will launch the application and execute the command.
2. **Inter-Process Communication (IPC)**: If the application is already running, the external call sends the command to the running instance via system events and temporary files, enabling seamless control.

### Compatibility
* Supports Windows 7 and later.
* Registry location: `HKEY_CURRENT_USER\Software\Classes\icc` (no administrator privileges required).
