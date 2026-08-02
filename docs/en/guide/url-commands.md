---
title: URL Commands
description: Control ICC-CE via icc:// protocol URLs, including toolbar, tools, ink, whiteboard, configuration profiles, and more
---

# URL Commands

ICC-CE supports controlling the software via URLs starting with `icc://`. You can create desktop shortcuts for common operations, or integrate them with classroom control systems and signage systems.

Typical use cases:

- Switch to your preferred configuration profile with one command before class
- Clear all ink and collapse the toolbar with one click after class
- Let physical buttons on the control panel switch pens and erasers directly

## Enable the Feature First

This feature is **disabled by default** — you need to enable it first:

1. Open Settings → **Startup**
2. Find **External Protocol Call (icc://)**, described as "Control the software externally via icc:// protocol"
3. Turn the toggle on

::: warning Commands are ignored when the toggle is off
The software won't show any prompt — the command simply does nothing. If you've been trying without success, first check that this toggle is enabled.
:::

::: warning If you moved the software folder, turn the toggle off and on again
ICC-CE is a portable application. If you move, rename, or change the drive of the entire folder, the commands will stop working — but **the toggle will still show as enabled**, with no visible indication of the issue.

The reason is that the recorded startup location still points to the old path. The fix is simple: turn the **External Protocol Call** toggle **off, then back on again** — the location will be updated.

Also, this setting only applies to the **current Windows user account**. If the classroom computer has multiple accounts, each account needs to enable it individually.
:::

## How to Use

### Run Directly

Press <kbd>Win</kbd> + <kbd>R</kbd>, enter the command and press Enter:

```
icc://fold
```

You can also enter it in the browser address bar — it will prompt you to confirm opening ICC-CE.

### Create a Desktop Shortcut

1. Right-click on the desktop → New → Shortcut
2. Enter the command as the location, e.g., `icc://clear`
3. Give it a name, e.g., "Clear Ink"

Double-click to use it. You can also right-click the shortcut → Properties → Shortcut key to assign a keyboard shortcut.

### Create a Batch Script

Create a new `.bat` file with multiple commands:

```bat
start icc://config-profile/switch?name=上课
timeout /t 1
start icc://unfold
```

::: tip Leave some time between consecutive commands
Each command will launch the software. If you send them too quickly, some may not be processed. Using `timeout /t 1` as shown above to add a one-second delay is safer.
:::

### For Classroom Control Systems

Most classroom control systems support "Execute Custom Command" or "Open Link". Enter the `icc://` command there. If the software isn't running, it will start automatically; if it's already running, the command will execute directly.

## Command Reference

### Toolbar

| URL | Effect |
| --- | --- |
| `icc://fold` | Collapse the toolbar |
| `icc://unfold` | Expand the toolbar |
| `icc://toggle` | Toggle between collapsed and expanded |
| `icc://thoroughhideon` | Enable "Thoroughly hide when collapsed" |
| `icc://thoroughhideoff` | Disable "Thoroughly hide when collapsed" |
| `icc://thoroughhidetoggle` | Toggle this option |

The `thoroughhide` commands will **modify and save the setting**, just like changing it manually in Settings.

### Pen & Tools

| URL | Effect |
| --- | --- |
| `icc://tool/pen` | Switch to pen |
| `icc://tool/cursor` | Switch to cursor (mouse mode) |
| `icc://tool/eraser` | Switch to area eraser |
| `icc://tool/eraserbystrokes` | Switch to stroke eraser |
| `icc://tool/select` | Switch to lasso selection |

### Ink

| URL | Effect |
| --- | --- |
| `icc://clear` | Clear current ink |
| `icc://clearall` | Clear ink and cannot be undone |
| `icc://undo` | Undo |
| `icc://redo` | Redo |

::: warning Content cleared with clearall cannot be recovered
Ink cleared with `icc://clear` can still be restored with `icc://undo`. `icc://clearall` clears the undo history as well — **cannot be restored**. Be careful not to confuse them when creating shortcuts.
:::

### Whiteboard Pages

| URL | Effect |
| --- | --- |
| `icc://nextpage` | Next page |
| `icc://previouspage` | Previous page |
| `icc://newpage` | New page |
| `icc://deletepage` | Delete current page |

### Functions

| URL | Effect |
| --- | --- |
| `icc://whiteboard` | Open/close whiteboard |
| `icc://rand` | Random name picker |
| `icc://randone` | Pick one person |
| `icc://timer` | Countdown timer |
| `icc://screenshot` | Take screenshot and insert onto canvas |

### Configuration Profiles

If you have created multiple configuration profiles (e.g., "Chinese Class", "Math Class"), you can switch between them directly:

```
icc://config-profile/switch?name=ProfileName
```

::: warning The profile name must match exactly
Case, spaces, and characters must match your profile name exactly. If wrong, there will be no prompt — it simply won't work. Spaces and Chinese characters in the name are generally fine, just write them directly.
:::

### Open Settings

```
icc://settings
```

You can also jump directly to a specific settings page, for example, to open Canvas settings:

```
icc://settings/CanvasPage
```

### Restart & Exit

| URL | Effect |
| --- | --- |
| `icc://restart` | Restart the software |
| `icc://exit` | Exit the software |
| `icc://restart/admin` | Restart as administrator |
| `icc://restart/normal` | Restart as normal user |

::: tip These commands are throttled to once per 3 seconds
This prevents control panel buttons from being double-pressed and causing repeated restarts. Duplicate commands within 3 seconds will be ignored — this is normal behavior.
:::

## Ink Freeze

For use with the ink freeze feature:

| URL | Effect |
| --- | --- |
| `icc://freeze` | Freeze current page |
| `icc://unfreeze` | Unfreeze current page |
| `icc://freeze/start` | Start lesson |
| `icc://freeze/end` | End lesson |
| `icc://freeze/cancel` | Cancel |

To target a specific page, add `?page=` (range 0 to 100):

```
icc://freeze?page=3
```

::: danger Using URL to unfreeze bypasses the password
If you have set a password for frozen pages, `icc://unfreeze` **will not prompt for the password** — it will unfreeze directly.

This is also why "External Protocol Call" is disabled by default. If you rely on the freeze password to prevent students from modifying content, do not enable this toggle, or at least don't create unfreeze shortcuts on the desktop.
:::

## Command Not Working?

Check in order:

1. **Is the toggle enabled?** — Settings → Startup → External Protocol Call (icc://). This is the most common cause
2. **Has the software folder been moved?** — After moving, the toggle needs to be turned off and on again
3. **Is the URL spelled correctly?** — Commands are case-insensitive, `icc://Fold` and `icc://fold` both work, but typos will not be recognized
4. **Does the configuration profile name match?** — Profile names are case-sensitive and must match exactly
5. **Is it a repeated restart/exit command within 3 seconds?** — This is an intentional limitation

If everything checks out and it still doesn't work, check the latest log file in the software's `Logs` folder. Search for `URI` to see what command the software received and why it didn't execute. Attaching this log when reporting issues will speed things up significantly.

## Related Content

- [Configuration & Data Directories](/en/guide/files-and-data) — Where configuration profiles are stored
- [Settings Guide](/en/guide/settings) — Explanation of all settings
- [URI Protocol](/en/dev/core/uri) — Complete command reference and implementation details for developers