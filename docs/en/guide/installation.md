---
title: Installation & Update Channels
description: ICC-CE system requirements, differences between installer and portable versions, and the meaning of four update channels
---

# Installation & Update Channels

<KnownBugs />

## System Requirements

Before you begin, please ensure your device meets the following requirements:

| Item | Requirement |
| --- | --- |
| **Operating System** | Windows 10 version 1809 (build 17763) or later, or Windows 11 |
| **Runtime** | .NET 6 Desktop Runtime (x64 or x86) |
| **Memory** | 4 GB or more recommended |
| **Graphics** | Direct3D 11 capable GPU for hardware-accelerated ink rendering |
| **Input Device** | Mouse works; touchscreen / digitizer / active stylus recommended for best experience |

::: tip How to check your system version?
Press <kbd>Win</kbd> + <kbd>Pause</kbd> to open System Information, where you can check your Windows version and system type (64-bit / 32-bit).
:::

::: warning About .NET Runtime
ICC-CE runs on .NET 6, **not** .NET Framework. The installer will automatically prompt you to download the runtime when needed. If the portable version fails to start, it's most likely due to a missing .NET 6 Desktop Runtime — search for ".NET Desktop Runtime 6.x" on Microsoft's official site and install the appropriate architecture (x64 / x86).
:::

## Getting the Installer

Visit the [Download Center](/en/download) to choose your preferred version. The page will automatically select the optimal download route.

### The Four Update Channels

| Channel | Description | Use Case |
| --- | --- | --- |
| **Beta (Recommended)** | Fastest updates, most timely fixes, passes CI auto-build and basic verification | Best for daily use |
| **Preview** | Pre-release builds without pre-release tags, more stable than Beta | For those who want early access with more stability |
| **Release** | Lowest release frequency, fully tested | For production environments with high stability requirements |
| **Nightly** | Untested debug builds, built directly from the latest net6 branch code | **For testing only, never use in actual classrooms** |

> Nightly builds require reading a risk disclaimer and checking a confirmation box before downloading. Updating to the next Nightly version requires manual download and replacement; auto-update is not supported.

## Installer vs Portable

| Comparison | Installer (.exe) | Portable (.zip) |
| --- | --- | --- |
| Installation | Run the setup wizard, completes automatically | Extract to any directory |
| Shortcuts | Automatically creates Start Menu and desktop shortcuts | Must be created manually |
| System Impact | Writes to installation directory and registry uninstall entry | No system writes at all |
| Uninstallation | Settings → Apps → Installed apps → Uninstall | Delete the folder directly |
| Use Case | Personal computers, classroom all-in-ones for long-term use | USB flash drives, batch deployment in computer labs, multiple versions |

## 32-bit or 64-bit?

- Modern devices should always choose **64-bit (x64)**
- Only choose **32-bit (x86)** if your system is 32-bit, or if you need deep integration with 32-bit Office

## Directory Structure After Installation

After installation, the main program and data directories are located at:

- **Installer**: `C:\Program Files\InkCanvasForClass CE\` (or custom installation directory)
- **Portable**: The directory you extracted to

User configuration and ink data are stored at:

- **Configuration**: `%AppData%\InkCanvasForClass CE\Configs\Settings.json`
- **Auto-saved ink**: `%AppData%\InkCanvasForClass CE\Saves\`
- **Screenshots**: `%USERPROFILE%\Pictures\Ink Canvas Screenshots\`
- **Log files**: `%AppData%\InkCanvasForClass CE\Logs\`

## Upgrading

ICC-CE has a built-in online update checker. For manual upgrades:

- **Installer**: Run the new version installer to overwrite the existing installation; configuration and ink data are preserved
- **Portable**: Extract the new version over the old program directory to overwrite

::: warning Cross-channel Switching
When downgrading from Beta to Release, configuration entries written by the newer version may not be recognized by the older version. If issues occur, back up and delete the configuration file to let the program regenerate it.
:::
