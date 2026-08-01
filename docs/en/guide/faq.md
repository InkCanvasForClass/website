---
title: FAQ
description: The most common questions and fixes when using ICC-CE
---

# FAQ

## Installation and startup

**Nothing happens on double click / the window flashes and disappears**
The usual cause is a missing **.NET 6 Desktop Runtime**. Download ".NET Desktop Runtime 6.x" from Microsoft and
install the build matching your system architecture. If it still won't start, check the reports in `CrashLogs`.

**Antivirus flags it**
ICC-CE creates a transparent always-on-top window and reads touch input, which some security products
misidentify. Download from the official release page and add an exclusion.

**32-bit or 64-bit?**
Use 64-bit on any modern device. Pick 32-bit only if your OS itself is 32-bit.

## Drawing and display

**Noticeable lag while writing**
Try, in order: make sure you are on the vendor's official device driver, enable hardware-accelerated ink
rendering in settings, and close other GPU-heavy programs. On older hardware, lower the ink smoothing strength.

**Stroke width is uneven**
That is pressure sensitivity working. Turn off pressure response in settings for uniform strokes.

**My drawing snapped into a perfect shape**
Shape recognition kicked in. Disable it in settings, or configure it to require a long press.

**Multi-touch doesn't work**
Confirm the device supports multi-touch (a HID-compliant touch screen appears in Device Manager), then check
that gestures are not disabled in settings.

## Gestures and interaction

**Two-finger zoom does nothing**
Check the master gesture switch and the zoom gesture switch in settings. Some older panels have touch drivers
that swallow two-finger gestures; updating the driver fixes it.

**Too many accidental touches**
Enable palm rejection and increase the touch area threshold.

## PowerPoint integration

**No PowerPoint buttons during a slide show**
Make sure you use desktop PowerPoint and that COM calls are not blocked by security policy. See the
[PowerPoint Guide](/en/guide/ppt-guide).

**Ink is not saved**
Check the auto-save switch and write permissions on the target directory.

**The add-in is installed but inactive**
Office may have auto-disabled it. Re-enable it under File → Options → Add-ins → Manage: Disabled Items.

## Settings and data

**Settings reset after a restart**
Usually the app was killed rather than closed normally, so the config never reached disk. Exit properly.
If the directory is read-only (lab restore environments), move the data directory to a writable partition.

**Syncing settings to other machines**
Copy `Settings.json` to the same location on the target machine &mdash; see
[Files & Data Locations](/en/guide/files-and-data).

**I broke my config**
Delete `Settings.json`; defaults are regenerated on next start.

## Versions and updates

**Which channel should I use?**
**Beta** for daily use, **Stable** if you need maximum stability, and **never Nightly in a real classroom**.
See [Installation & Update Channels](/en/guide/installation).

**Downloads are slow or fail**
The download page picks the fastest route automatically. If it still fails, try another channel or download
manually from the GitHub releases page.

**Can I go back to an older version?**
Yes. Use the Newer / Older buttons on the download page to reach the version you want. If a downgrade behaves
oddly, back up and delete the settings file to regenerate it.

## Reporting problems

When opening an issue, please include: the ICC-CE version, your Windows version, reproduction steps, and the
matching files from `Logs` and `CrashLogs`. The more complete the report, the faster the fix.
