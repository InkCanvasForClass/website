---
title: FAQ
description: Frequently asked questions about ICC-CE, covering installation, runtime, PPT integration, ink, performance, and more
---

# FAQ

<KnownBugs />

## Installation & Runtime

### Program won't start, missing .NET runtime

ICC-CE requires .NET 6 Desktop Runtime. Search for ".NET Desktop Runtime 6.x" on Microsoft's official website and download the appropriate architecture (x64 / x86). The installer will prompt you to download it automatically when needed.

### Portable version won't start

Most likely due to missing .NET 6 Desktop Runtime — install it as described above. If the runtime is already installed, check if the downloaded archive is intact and try extracting again.

### Installer says "Cannot install"

Your system version may be too old. Make sure Windows 10 version ≥ 1809 (build 17763). It could also be antivirus software falsely flagging the installer — add ICC-CE to the whitelist.

### "Has stopped working" error during runtime

1. Check if the system version meets requirements
2. Try running as administrator
3. Check the log file (`%AppData%\InkCanvasForClass CE\Logs\`) for detailed error information
4. If crashes persist, submit a GitHub Issue with the logs attached

## PPT Integration

### Doesn't auto-enter annotation mode when entering PPT slideshow

1. Make sure PowerPoint is activated, not in protected view / read-only mode
2. Check that PPT integration is enabled in ICC-CE settings (enabled by default)
3. Check if PowerPoint is running as administrator while ICC-CE is not elevated — mismatched permissions prevent integration
4. Try switching integration modes (COM / ROT / Agent)

### Annotated ink can't be found after saving

Default save location: `%AppData%\InkCanvasForClass CE\Saves\`. You can customize the save path in settings, or enable auto-rename on save to avoid overwriting.

### Ink lost when switching slides

Make sure "Show Canvas on New Slide" is enabled, and "Hide Ink on Exit" is enabled. When you return to an annotated page, the ink should be restored automatically.

### WPS integration not working

Enable "WPS Support" in settings, and make sure WPS is not running as administrator.

## Ink & Handwriting

### Ink latency / lag

1. Disable hardware acceleration (Settings → Canvas & Ink → Advanced Strokes → Hardware Acceleration)
2. Lower ink smoothing quality (Settings → Canvas & Ink → Advanced Strokes → Ink Smoothing Quality)
3. Disable async ink smoothing
4. Check if the graphics driver is up to date

### Ink not smooth / jagged

1. Make sure Advanced Bezier Smoothing is enabled
2. Check if Pen Tip Mode is set to "Off" — disabling it can make strokes more uniform
3. Set ink smoothing quality to "High Quality"

### Gestures not working

1. Make sure the gesture master toggle in settings is enabled
2. Check if you're using gestures in the correct mode (screen annotation mode and whiteboard mode gestures are configured independently)
3. Check if "Pen Only" mode is enabled — finger input is ignored in this mode
4. Check if other software (e.g., Windows Ink Workspace) is intercepting gestures

### Shape recognition inaccurate

1. Make sure "Enable Shape Recognition" is enabled
2. Make sure the specific shape (rectangle/triangle/circle) recognition toggle is enabled
3. Adjust line straightening sensitivity — try lowering the sensitivity value for higher precision
4. Try to draw shapes in one continuous stroke, avoid breaks

## Performance & Compatibility

### High CPU / memory usage

1. Disable hardware acceleration
2. Lower ink smoothing quality
3. Disable async ink smoothing
4. Reduce log level (e.g., from "Debug" to "Info")
5. Disable the floating window blocking feature (this feature adds performance overhead)
6. Check if other processes are conflicting with ICC-CE

### Conflicts with certain software

ICC-CE's floating window blocking feature can block floating windows from teaching software such as Seewo and Hitevision. If you encounter conflicts with other software, try disabling this feature or adjusting related settings.

### Multi-monitor support

ICC-CE supports multi-monitor environments. Enable multi-monitor related options in settings. If you experience canvas display issues, try enabling "Multi-Monitor Canvas Fix".

## Files & Data

### How to back up configuration and data

Back up the entire `%AppData%\InkCanvasForClass CE\` directory. When reinstalling the system or migrating to a new computer, copy the backup data to the same path.

### How to completely uninstall

- **Installer**: Settings → Apps → Installed apps → InkCanvasForClass CE → Uninstall
- **Portable**: Simply delete the entire folder

Uninstallation does not automatically clear user configuration and ink archives. For complete cleanup, manually delete the `%AppData%\InkCanvasForClass CE\` directory.

### How to restore default settings

Delete `%AppData%\InkCanvasForClass CE\Configs\Settings.json`, and the program will generate a default configuration on next launch. It's recommended to back up the original file first.

## Updates

### How to switch update channels

Change the "Update Channel" in settings. The Beta channel provides the fastest updates, while Release is the most stable.

### Issues after cross-channel switching

When downgrading from Beta to Release, configuration entries written by the newer version may not be recognized by the older version. If issues occur, back up and delete the configuration file to let the program regenerate it.

### Update failed

1. Check network connection
2. Try manually downloading the latest version installer
3. Check if the update channel setting is correct
4. Check the log file for detailed error information

## How to Get Help

- **GitHub Issues**: Submit issues on the project repository
- **Log files**: `%AppData%\InkCanvasForClass CE\Logs\`, please attach logs when submitting issues
- **Configuration export**: If you need help troubleshooting, export your settings and share them with the developer