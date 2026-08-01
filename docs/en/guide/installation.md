---
title: Installation & Update Channels
description: System requirements, installer vs portable, and what each update channel means
---

# Installation & Update Channels

## System requirements

| Item | Requirement |
| --- | --- |
| OS | Windows 10 1809 (build 17763) or later, Windows 11 |
| Runtime | **.NET 6 Desktop Runtime** (`net6.0-windows10.0.19041.0`) |
| Memory | 4GB or more recommended |
| GPU | A Direct3D 11 capable GPU enables hardware-accelerated ink rendering |
| Input | Touch screen, pen tablet or mouse; touch devices give the best experience |

::: warning About the .NET version
The main application runs on **.NET 6**, not .NET Framework 4.x. The installer prompts for the runtime when needed.
If the portable build won't start, you are most likely missing the .NET 6 Desktop Runtime &mdash; download
".NET Desktop Runtime 6.x" (x64 or x86) from Microsoft.

Exception: the IACore component used for handwriting recognition is 32-bit only, so the app spawns a small
.NET Framework 4.7.2 helper process to talk to it. The installer handles this; no manual action is normally required.
:::

## Installer or portable

Both forms are published for every release and are functionally identical:

| | Installer (`.exe`) | Portable (`.zip`) |
| --- | --- | --- |
| Setup | Run the install wizard | Extract anywhere |
| Start menu / desktop shortcuts | Created automatically | Create manually |
| Uninstall | Via Windows Settings | Delete the folder |
| Writes to the system | Yes (install dir, uninstall registry entry) | No |
| Best for | Personal PCs, long-term use | USB sticks, lab deployments, multiple versions side by side |

::: tip Recommendation
Use the **installer** on classroom PCs that stay put. Use the **portable** build when you need to carry it
between machines or keep several versions at once.
:::

## 32-bit or 64-bit

- On any modern device, pick **64-bit (x64)**
- Pick **32-bit (x86)** only if your OS is 32-bit, or you need tight integration with 32-bit Office

Press <kbd>Win</kbd> + <kbd>Pause</kbd> and check "System type" if you are unsure.

## The four channels

The channel switcher on the download page maps to four different build sources:

| Channel | Source | Includes pre-releases | Notes |
| --- | --- | --- | --- |
| **Beta** (recommended) | `community-beta` repo | ✅ | Fastest updates and fixes; best choice for daily use |
| **Preview** | `community-beta` repo | ❌ | More conservative than Beta |
| **Stable** | `community` main repo | ❌ | Lowest release frequency; maximum stability |
| **Nightly** | GitHub Actions artifacts | — | **Untested Debug builds** |

::: danger Nightly builds
Nightly is a **Debug** build produced automatically by CI from the latest commit on the `net6` branch.
It is completely untested and may contain severe defects, crashes or risk of data loss.
**Do not use it in a real classroom.** The download page forces you to read the warning and tick a
confirmation box before the download is allowed.
:::

### Why Beta installers come from the main repository

The `community-beta` repository only publishes portable zip files. When the download page finds no installer
on that channel, it falls back to the main `community` repository using the **same version tag** and marks the
button with "Main repo". The versions match, so it is safe to use.

## Download acceleration

On load, the download page probes two kinds of routes in parallel and shows the result at the top:

- **Smart-Teach mirror**: good direct-connect speed in mainland China, portable zip only. Before the download
  actually starts, the page re-checks that the file exists and silently falls back if it doesn't
- **GitHub proxies**: six candidate nodes race each other; the fastest one serves installers and API requests.
  If none respond, it falls back to a direct GitHub connection

Nightly artifacts are hosted on `nightly.link` and can only use the proxy nodes listed on the page.
You can switch nodes manually and your choice is remembered.

## Upgrading

ICC-CE has a built-in update check; the frequency and channel are configurable in settings. To upgrade manually:

- **Installer**: just run the new installer over the old version; settings and ink are preserved
- **Portable**: extract the new version into a new folder, then copy your settings file and the `Saves`
  folder over from the old one

See [Files & Data Locations](/en/guide/files-and-data) for exact paths.

::: warning Switching channels
Downgrading from Beta to Stable may leave settings keys that the older build doesn't understand.
If you hit strange behaviour, back up and delete the settings file so it regenerates.
:::

## Uninstalling

- **Installer**: Settings → Apps → Installed apps → InkCanvasForClass CE → Uninstall
- **Portable**: delete the folder

Uninstalling does not remove your settings or saved ink. Delete the data directory manually for a clean wipe.
