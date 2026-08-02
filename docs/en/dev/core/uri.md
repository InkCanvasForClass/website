---
title: URI Protocol
description: Registration, dispatch, and the full command list for the icc:// protocol
---

# URI Protocol

<UnderConstruction />

The program registers the `icc://` protocol so that it can be controlled from the outside with a single URL — folding the toolbar, switching tools, clearing ink, opening a settings page, and so on.

Two key files:

- `Helpers\UriSchemeHelper.cs` (118 lines) — registers, unregisters, and detects the protocol
- `MainWindow_cs\MW_UriHandler.cs` (506 lines) — parses and executes the commands

::: tip Just want to know how to use it?
This page covers the implementation. If all you need is the command list and usage, jump straight to [All commands](#all-commands).
:::

## The scheme is icc, not inkcanvas

```csharp
private const string SchemeName = "icc";
private const string FriendlyName = "URL:Ink Canvas Protocol";
```

Every URL begins with `icc://`.

## Registration goes into HKCU — no administrator needed

```csharp
// 使用 CurrentUser\Software\Classes 代替 ClassesRoot，无需管理员权限
using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Classes\" + SchemeName))
{
    key.SetValue("", FriendlyName);
    key.SetValue("URL Protocol", "");
    ...
    commandKey.SetValue("", "\"" + exePath + "\" \"%1\"");
}
```

::: tip Two consequences of writing to HKCU
The upside is that a standard user can register it. The price is that it **only applies to the current user** — log into a different account in the classroom and it has to be registered again.

Also, a protocol of the same name under `HKEY_CLASSES_ROOT` takes precedence: if some other program on the system has registered `icc` into HKLM, the per-user registration gets shadowed.
:::

`IsUriSchemeRegistered()` does more than check that the key exists — it also normalizes the registered exe path and compares it against the current process path:

```csharp
string normalizedRegisteredPath = System.IO.Path.GetFullPath(registeredExePath);
string normalizedCurrentPath = System.IO.Path.GetFullPath(currentExePath);
return string.Equals(normalizedRegisteredPath, normalizedCurrentPath, StringComparison.OrdinalIgnoreCase);
```

::: danger Moving the folder breaks it silently, and the toggle won't show it
Portable apps get copied around wholesale all the time. Once the path changes, `IsUriSchemeRegistered()` returns false — but the old path in the registry is **still there**, so `icc://` still points at the exe in the old location.

What makes it worse is that the settings page shows nothing wrong. `LoadSettings()` only reads the setting value:

```csharp
ToggleSwitchExternalProtocol.IsOn = settings.Advanced.IsEnableUriScheme;
```

It **does not call** `IsUriSchemeRegistered()`. So after moving the directory the toggle still shows as on, the user assumes the feature works, and in reality the commands no longer reach the new location.

The fix is to turn the toggle off and back on. When turning it off, `IsUriSchemeRegistered()` returns false and the code takes the `success = true` branch — **it does not actually delete the stale key**; then turning it back on makes `RegisterUriScheme()` overwrite it with the new path, which is what restores things.
:::

## Off by default; must be enabled manually

```csharp
[JsonProperty("isEnableUriScheme")]
public bool IsEnableUriScheme { get; set; } = false;
```

The toggle is on the "Startup" page of the settings (`ToggleSwitchExternalProtocol`). When switched on, the registry entries are created first and the setting is only written if that succeeded:

```csharp
if (newState)
{
    if (!UriSchemeHelper.IsUriSchemeRegistered())
        success = UriSchemeHelper.RegisterUriScheme();
}
...
if (success)
{
    SettingsManager.Settings.Advanced.IsEnableUriScheme = newState;
    SettingsManager.SaveSettingsToFile();
}
```

::: danger With the toggle off, URLs are silently ignored
The very first thing `HandleUriCommand` does is check this switch:

```csharp
if (!Settings.Advanced.IsEnableUriScheme)
{
    LogHelper.WriteLogToFile($"URI 协议已禁用，忽略请求: {uri}", LogHelper.LogType.Warning);
    return;
}
```

It writes a single warning to the log and **shows nothing in the UI**. When investigating "clicking the URL does nothing", confirm this toggle is on first.
:::

## How a command reaches the program

There are two paths, depending on whether the program is already running.

**Program not running**: Windows launches the exe and passes the URL as a command-line argument, which is handled at the end of `App_Startup`:

```csharp
string startupUriArg = e.Args.FirstOrDefault(a => a.StartsWith("icc:", StringComparison.OrdinalIgnoreCase));
if (!string.IsNullOrEmpty(startupUriArg))
{
    ...
    mainWindow.Dispatcher.Invoke(() => mainWindow.HandleUriCommand(startupUriArg));
}
```

**Program already running**: the new process detects the existing instance and forwards the URL over IPC; the `FileAssociationManager` side receives it and calls:

```csharp
// 获取主窗口并处理URI命令
if (Application.Current.MainWindow is MainWindow mainWindow)
{
    mainWindow.HandleUriCommand(uri);
}
```

Starting up with a URL argument also affects the startup strategy — there is a check at `App.xaml.cs:772` where an argument beginning with `icc:` counts as an "external request", just like an `.icstk` file, and changes which single-instance branch is taken.

## Parsing rules

```csharp
private static string ParseUriCommand(string uri)
{
    if (... !uri.Trim().StartsWith("icc:", ...)) return "";

    if (Uri.TryCreate(uri, UriKind.Absolute, out Uri uriObj))
    {
        string host = (uriObj.Host ?? "").Trim().ToLowerInvariant();
        string path = (uriObj.AbsolutePath ?? "").Trim('/').ToLowerInvariant();
        if (!string.IsNullOrEmpty(host))
            return string.IsNullOrEmpty(path) ? host : host + "/" + path;
        ...
    }

    string raw = uri.Trim().Substring(4).TrimStart('/').ToLowerInvariant();
    return raw;
}
```

`host` and `path` are joined into a single command string and lowercased entirely, so `icc://Fold` and `icc://fold` are equivalent.

::: tip Commands are case-insensitive; profile names are not
The command itself goes through `ToLowerInvariant()`. Query-parameter values, however, are **kept verbatim** after `Uri.UnescapeDataString`, so the profile name in `config-profile/switch?name=Default` is case-sensitive.
:::

There is also a fallback branch for when `Uri.TryCreate` fails: it simply strips the `icc:` prefix and uses the remaining string.

## Dangerous commands are debounced for 3 seconds

```csharp
private static readonly HashSet<string> _uriNonRepeatableCommands = new HashSet<string>
{
    "restart", "restart/admin", "restart/normal", "exit", "quit"
};
private static readonly TimeSpan _uriCommandDebounceWindow = TimeSpan.FromSeconds(3);
```

These 5 restart/exit commands are discarded if invoked again within 3 seconds. This prevents a central-control system from click-spamming its way into a restart loop. Other commands are not debounced.

## All commands

The same action often has several aliases; they are grouped by function below.

### Toolbar visibility

| Command | Behavior |
| --- | --- |
| `fold` | Fold the toolbar |
| `unfold` / `show` | Unfold the toolbar |
| `toggle` | Toggle between folded and unfolded |
| `thoroughhideon` | Enable "hide completely when folded" |
| `thoroughhideoff` | Disable it and restore visibility immediately |
| `thoroughhidetoggle` | Toggle that setting |

The three `thoroughhide*` commands **write and persist the setting**, not just a transient state.

### Lifecycle

| Command | Behavior |
| --- | --- |
| `restart` | Restart with the current privileges |
| `restart/admin` | Restart elevated |
| `restart/normal` | Restart de-elevated as a standard user |
| `exit` / `quit` | Exit the program |

All four groups run a `Task.Delay(300)` before executing, to leave time for the notification to appear.

### Ink and history

| Command | Behavior |
| --- | --- |
| `clear` / `clearink` | Clear the ink |
| `clearall` / `clearinkandhistory` | Clear the ink and the undo history |
| `undo` | Undo |
| `redo` | Redo |

### Whiteboard pages

| Command | Behavior |
| --- | --- |
| `nextpage` / `page/next` | Next page |
| `previouspage` / `prevpage` / `page/previous` | Previous page |
| `newpage` / `page/add` | New page |
| `deletepage` / `page/delete` | Delete the current page |

### Feature entry points

| Command | Behavior |
| --- | --- |
| `rand` | Random name picker |
| `randone` | Pick a single person |
| `timer` | Countdown timer |
| `whiteboard` / `board` | Whiteboard mode |
| `screenshot` | Take a screenshot and insert it |

### Tool switching

With the `tool/` prefix:

| Command | Tool |
| --- | --- |
| `tool/pen` / `tool/color` | Pen |
| `tool/cursor` | Cursor |
| `tool/eraser` | Area eraser |
| `tool/eraserbystrokes` / `tool/eraserstroke` | Stroke eraser |
| `tool/select` / `tool/lasso` | Lasso selection |

::: warning Switching to the eraser switches to the pen first
```csharp
case "eraser":
    PenIcon_Click(null, null);
    EraserIcon_Click(null, null);
    break;
```
The eraser is a sub-tool under the pen panel, so the pen panel has to be activated first. Don't assume `tool/eraser` is an atomic operation when writing automation scripts.
:::

### Ink freezing

Each group has four aliases with identical behavior:

| Command | Behavior |
| --- | --- |
| `freeze` / `lock` / `ink-freeze` / `ink/lock` | Freeze the page |
| `unfreeze` / `unlock` / `ink-unfreeze` / `ink/unlock` | Unfreeze (skips verification) |
| `freeze/start` / `lock/start` / … | Lesson start |
| `freeze/end` / `lock/end` / … | Lesson end |
| `freeze/cancel` / `lock/cancel` / … | Cancel |

A page number can be given with `?page=`, in the range **0–100**:

```csharp
string pageText = GetUriQueryValue(uri, "page");
if (int.TryParse(pageText, out int page) && page >= 0 && page <= 100)
    return page;

return allowMissing ? -1 : GetCurrentFreezePageIndex();
```

If omitted or out of range, the current page is used. Only `freeze/end` uses `allowMissing: true`, returning -1 when the parameter is missing.

::: warning unfreeze skips verification
`UnfreezePageAsync(..., skipVerification: true)`. If the page has an unfreeze password set, going through the URI **bypasses the password check**. The protocol being off by default is, to some extent, the compensation for this behavior.
:::

### Configuration profiles

```
icc://config-profile/list
icc://config-profile/switch?name=ProfileName
```

These two commands **return their results through temporary files**, because the URL protocol itself is one-way:

| Command | Output file |
| --- | --- |
| `config-profile/list` | `%TEMP%\InkCanvasConfigProfileList.json` |
| `config-profile/switch` | `%TEMP%\InkCanvasConfigProfileSwitchResult.txt` |
| `tool/state` | `%TEMP%\InkCanvasToolState.txt` |

The JSON structure produced by list:

```csharp
var payload = new { list = names, current = current };
```

The switch result file contains one of three values: `ok`, `error: 缺少参数 name`, or `error: 方案不存在或应用失败`.

`tool/state` writes the current tool name, falling back to `"cursor"` when it cannot be determined.

::: danger You have to handle the timing of reading result files yourself
The program writes these files asynchronously, and the caller gets **no completion signal at all** after firing the URL. Your script has to poll the file's modification time, or delete the old file first and wait for it to reappear. Reading it straight away may return leftover content from the previous call.

These files are also never cleaned up; they stay in `%TEMP%` forever.
:::

### Settings page navigation

```
icc://settings[/<PageTag>][?key=<SettingsJsonKey>]
```

An example (taken from a code comment):

```
icc://settings/CanvasPage?key=inkFadeSpeedMultiplier
```

Without a PageTag it defaults to `HomePage`. `key` highlights the corresponding setting item.

A few implementation details are worth noting:

An already-open settings window is reused rather than opening a second one:

```csharp
foreach (Window w in Application.Current.Windows)
{
    if (w is Windows.SettingsViews.SettingsWindow sw) { window = sw; break; }
}
```

When creating a new window, the default navigation is suppressed:

```csharp
// 跳过 Loaded 中默认导航到 HomePage 的行为，由本方法指定目标页
window.SuppressInitialNavigation = true;
```

Highlighting is deferred:

```csharp
// 设置挂起的高亮 key，等页面 Loaded 后再触发，避免可视树尚未构建导致高亮失效
window.SetPendingHighlightKey(settingKey);
```

The static `_settingsWindow` field is also kept in sync, so that the settings button on the toolbar reuses the same window.

::: warning key uses the JSON key name
`?key=inkFadeSpeedMultiplier` is the key name from `Settings.json` (the value of `JsonProperty`), which is **exactly the opposite** of the plugin `ISettingsService` rule of using C# property names. See [Settings System](./settings) for details.
:::

::: warning A misspelled PageTag fails silently
When `NavigateToPage()` cannot find the page type it simply returns; the window opens but stays blank or on the previous page. See [Code Conventions](./conventions).
:::

## Errors are only logged

The whole of `HandleUriCommand` is wrapped in a single try-catch:

```csharp
catch (Exception ex)
{
    LogHelper.WriteLogToFile($"处理 URI 命令时出错: {ex.Message}", LogHelper.LogType.Error);
}
```

The same goes for unknown commands:

```csharp
LogHelper.WriteLogToFile($"未知的 URI 命令: {command}", LogHelper.LogType.Warning);
```

::: tip To debug URIs, read the log
Every branch logs: which command was received, whether it was disabled, whether it was debounced, and whether the command was recognized. Look under `<program directory>\Logs\` by timestamp.
:::

## Adding a new command

Add a case to the switch in `HandleUriCommand`, or add another `pathLower.StartsWith(...)` branch after it. Note that:

- The command string is already lowercase, so case labels must be lowercase too, otherwise they will never match
- Remember to add destructive commands to `_uriNonRepeatableCommands`
- If you need to return a result, write a `%TEMP%` file following the naming of the three existing ones
- Read parameters with `GetUriQueryValue(uri, "key")`, which already handles URL decoding

## Next steps

- [Startup Flow](./startup) — single instance and IPC forwarding
- [Settings System](./settings) — `IsEnableUriScheme` and the settings key-name rules
- [Code Conventions](./conventions) — registering settings page tags
