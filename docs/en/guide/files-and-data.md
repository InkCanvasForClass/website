---
title: Configuration & Data Directories
description: Storage locations and structure of ICC-CE configuration files, ink archives, screenshots, logs, and other data files
---

# Configuration & Data Directories

<UnderConstruction />

ICC-CE user data is stored by default in `%AppData%\InkCanvasForClass CE\`.

## Configuration Files

All settings are saved in `%AppData%\InkCanvasForClass CE\Configs\`:

- **Settings.json** — Main configuration file, contains all settings
- **CustomColors.json** — Custom color configuration
- **Toolbar.json** — Toolbar layout configuration

## Ink & Screenshots

- **Auto-saved ink**: `%AppData%\InkCanvasForClass CE\Saves\`
- **Screenshot location**: `%USERPROFILE%\Pictures\Ink Canvas Screenshots\` (can be changed in settings)
- **Organized by date**: Screenshots can be organized by date (optional in settings)

## Log Files

- **Log directory**: `%AppData%\InkCanvasForClass CE\Logs\`
- **Log files**: Rotated by date; log level and file size limits can be adjusted in settings

## Other Data

- **Plugin directory**: Customizable plugin storage location in settings
- **Update cache**: `%AppData%\InkCanvasForClass CE\Updates\`, auto-cleaned on startup
- **Crash reports**: `%AppData%\InkCanvasForClass CE\CrashReports\`

## Quick Access

Press <kbd>Win</kbd> + <kbd>R</kbd> and enter `%AppData%\InkCanvasForClass CE` to quickly open the data directory.

## Backup & Migration

| Scenario | Action |
| --- | --- |
| Backup before system reinstall | Back up the entire `%AppData%\InkCanvasForClass CE\` directory |
| Migrate to a new computer | Copy backup data to the same path on the new computer |
| Reset configuration | Delete `Settings.json`; the program will generate a default config on next launch |
| Complete cleanup | Delete the entire `%AppData%\InkCanvasForClass CE\` directory |