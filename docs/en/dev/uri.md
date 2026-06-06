# Ink Canvas External Protocol (URI Scheme) Specification Document

Ink Canvas supports external calls via a custom protocol `icc://`. With this feature, other applications, webpage scripts, or system shortcuts can remotely control the running state of Ink Canvas.

## Activation Method

Before using the external protocol, it must be enabled in the software settings:
1. Open **Settings**.
2. Go to the **Advanced Options** panel.
3. Find the **External Protocol Call** area.
4. Enable the **"Enable External Protocol (icc://)"** switch.

> **Note**: This action automatically registers the protocol in the system registry for the current user. If you manually turn off this feature, the protocol will be unregistered.

---

## Command List

### 1. Basic Control Commands

| Command | Full URI | Description |
| :--- | :--- | :--- |
| **Fold** | `icc://fold` | Enters **collapse mode**. If currently expanded, it clears ink and collapses to the sidebar. |
| **Unfold** | `icc://unfold` | Exits **collapse mode**. If currently collapsed, it expands the floating toolbar. |
| **Toggle** | `icc://toggle` | **Toggles** state. Collapses if expanded, expands if collapsed. |
| **Show** | `icc://show` | Functions identically to `unfold`, used for compatibility with older commands. |

### 2. Sidebar Tool Commands

The following commands correspond to the quick tools provided in the sidebar under collapse mode.

| Command | Full URI | Description |
| :--- | :--- | :--- |
| **Pick One** | `icc://randone` | Opens the random roll-call window and executes a **single pick**. |
| **Random Pick** | `icc://rand` | Opens the random roll-call window and executes a **random pick**. |
| **Timer** | `icc://timer` | Opens the **timer/countdown** tool. |
| **Whiteboard** | `icc://whiteboard` | Switches to **whiteboard mode** (can also use `icc://board`). |

### 3. Tool State Commands

Used to switch the current annotation tool or query the current tool state. The URI is case-insensitive.

| Command | Full URI | Description |
| :--- | :--- | :--- |
| **Pen** | `icc://tool/pen` or `icc://tool/color` | Switches to **Pen** (`color` corresponds to the pen/highlighter entry). |
| **Mouse** | `icc://tool/cursor` | Switches to **Mouse/Cursor** mode. |
| **Area Eraser** | `icc://tool/eraser` | Enters annotation mode first, then switches to the **Area Eraser**. |
| **Stroke Eraser** | `icc://tool/eraserbystrokes` or `icc://tool/eraserstroke` | Enters annotation mode first, then switches to the **Stroke Eraser**. |
| **Get Current Tool** | `icc://tool/state` | Writes the current tool state to a temporary file for third-party reading. See details below. |

#### `icc://tool/state` Return Value Explanation

Calling this will not return content directly in the protocol layer. Instead, it writes the current tool name to a file:

- **File Path**: `%TEMP%\InkCanvasToolState.txt` (e.g., `C:\Users\<Username>\AppData\Local\Temp\InkCanvasToolState.txt`)
- **Encoding**: UTF-8, single-line plain text.

Possible values: `cursor` (Mouse), `pen` (Pen), `color` (Highlighter), `eraser` (Area Eraser), `eraserByStrokes` (Stroke Eraser), `select` (Select), `shape` (Shape). Defaults to `cursor` if unrecognized.

### 4. Configuration Profile Commands

Used to obtain the list of current configuration profiles or switch the active configuration profile via URI. The URI is case-insensitive.

| Command | Full URI | Description |
| :--- | :--- | :--- |
| **Get Profile List** | `icc://config-profile/list` | Writes the names of all current configuration profiles and the active profile to a temporary JSON file for third-party reading. |
| **Switch Profile** | `icc://config-profile/switch?name=ProfileName` | Switches to the specified configuration profile and hot-reloads it, writing the result to a temporary file. |

#### `icc://config-profile/list` Return Value Explanation

Calling this will not return content directly in the protocol layer. Instead, it writes the list to a file:

- **File Path**: `%TEMP%\InkCanvasConfigProfileList.json`
- **Encoding**: UTF-8, JSON format.

Example Content:

```json
{
  "list": [ "ProfileA", "ProfileB", "Classroom1" ],
  "current": "ProfileA"
}
```

- `list`: Names of all currently saved configuration profiles (string array).
- `current`: The currently active profile name; empty string if never switched via profiles.

#### `icc://config-profile/switch` Explanation

- **Query Parameter**: `name` (required), the name of the profile to switch to. If the profile name contains Chinese characters or special symbols, it must be URL-encoded (e.g., `name=%E6%95%99%E5%AE%A41`).
- **Result File Path**: `%TEMP%\InkCanvasConfigProfileSwitchResult.txt`
- **Encoding**: UTF-8, single-line plain text.
- **Possible Content**:
  - `ok`: Switched successfully, hot-reloaded.
  - `error: 缺少参数 name` (Missing parameter name): The `name` parameter was not provided.
  - `error: 方案不存在或应用失败` (Profile does not exist or application failed): The specified profile does not exist or application failed.

Examples:

- Switch to the profile named "Classroom1": `icc://config-profile/switch?name=Classroom1`
- Use encoding when the profile name contains special characters: `icc://config-profile/switch?name=%E6%96%B9%E6%A1%88A`

### 5. Advanced Feature Commands (Hidden Features)

The following features are specifically designed to resolve compatibility issues with third-party sidebar or floating window programs, and are not displayed in the standard settings interface. URIs are case-insensitive; the table below shows lowercase forms.

| Command | Full URI | Description |
| :--- | :--- | :--- |
| **ThoroughHideOn** | `icc://thoroughhideon` | **Enables** "Thorough hide when collapsed". Once enabled, the main window will be completely invisible when entering collapse mode. |
| **ThoroughHideOff** | `icc://thoroughhideoff` | **Disables** "Thorough hide when collapsed". Restores the default sidebar edge-tracing mode. |
| **ThoroughHideToggle** | `icc://thoroughhidetoggle` | **Toggles** the enabled/disabled state of the "Thorough hide when collapsed" feature. |

---

## Usage Examples

### A. Calling in a Browser
You can type the URI directly into the browser's address bar and press Enter, or use hyperlinks in HTML:
```html
<a href="icc://fold">Collapse Ink Canvas immediately</a>
```

### B. Calling in the Windows "Run" Dialog
Press `Win + R`, enter `icc://toggle`, and press Enter.

### C. Calling in a Batch File or Command Line
```cmd
start icc://unfold
```

### D. Third-Party Reading of Current Tool State
After calling `icc://tool/state`, read `%TEMP%\InkCanvasToolState.txt` to get the current tool name (e.g., `pen`, `cursor`, `eraser`).

### E. Third-Party Getting and Switching Profiles
1. After calling `icc://config-profile/list`, read `%TEMP%\InkCanvasConfigProfileList.json` to obtain `list` and `current`.
2. Call `icc://config-profile/switch?name=ProfileName` to switch profiles, then read `%TEMP%\InkCanvasConfigProfileSwitchResult.txt` to determine success (successful if the content is `ok`).

---

## Developer Notes

### Running Mechanism
1. **Wake-up Startup**: If Ink Canvas is not yet running, calling the URI will directly start the application and execute the command.
2. **Inter-Process Communication (IPC)**: If the application is already running, external calls will send instructions to the running instance via system events and temporary files, achieving seamless control.

### Compatibility
* Supports Windows 7 and higher.
* Registry Location: `HKEY_CURRENT_USER\Software\Classes\icc` (does not require administrator privileges).
