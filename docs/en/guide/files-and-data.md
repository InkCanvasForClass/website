---
title: Files & Data Locations
description: Where ICC-CE keeps settings, saved ink, logs and crash reports
---

# Files & Data Locations

## Directory layout

ICC-CE keeps user data together in its data directory:

```
data directory/
├── Settings.json          User settings (toolbar, gestures, everything)
├── Saves/                 Auto-saved ink
│   └── <presentation>/     One folder per presentation
├── Logs/                  Runtime logs
└── CrashLogs/             Crash reports
```

::: tip Finding it quickly
For portable builds the data directory usually lives inside the program folder; for installed builds it sits
under your user profile's application data folder. The most reliable way is to look for an
"open data folder" entry in the settings UI.
:::

## Settings.json

Every setting is serialised into this single JSON file, grouped by area (canvas, gestures, shape recognition,
PowerPoint, appearance, startup, advanced, automation, security and so on).

**If you edit it by hand:**

- Exit ICC-CE completely first, otherwise it will overwrite your changes with its in-memory state on exit
- Keep the file UTF-8 encoded
- Keys are case-sensitive; a mistyped key is ignored silently rather than reported
- If you break it, just delete the file &mdash; a fresh default config is generated on next start

## Saved ink

Auto-saved ink is written to `Saves`. The location is controlled by the automation settings and can point to a
network share or USB drive.

::: warning Path changes
Older documentation mentioned different save paths; everything is now unified under `Saves`. When upgrading
from an old version, archives in the old folder are not migrated automatically &mdash; copy them over yourself.
:::

## Logs and crash reports

- **Logs**: startup, integration and recognition activity &mdash; the first place to look when something breaks
- **CrashLogs**: generated when the app terminates abnormally, including the call stack

When reporting a bug, please attach the files matching the time the problem occurred; it speeds up diagnosis a
lot. Logs may contain presentation file names, so feel free to redact them before sending.

## Backup and mass deployment

**Backup**: copy `Settings.json` and the `Saves` folder.

**Mass deployment**: configure one machine, then distribute its `Settings.json` to the same location on the
others to give every device the same toolbar layout and behaviour. Combined with the portable build, you can
simply copy the whole folder.

::: warning Lab environments
Some labs use restore cards or make the install directory read-only. In that case point the data directory at
a partition that is not reset, otherwise settings and ink are lost on every reboot.
:::
