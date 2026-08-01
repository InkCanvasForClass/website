---
title: PowerPoint Guide
description: The three integration paths, add-in setup, and how ink behaves during a slide show
---

# PowerPoint Guide

ICC-CE lets you annotate slides while presenting and remembers the ink of each slide separately.

## Three integration paths

ICC-CE does not rely on a single mechanism to talk to PowerPoint. It tries them in order of availability:

| Path | How it works | When it applies |
| --- | --- | --- |
| **COM automation** | Creates the PowerPoint application object directly | The normal case &mdash; PowerPoint just needs to be running |
| **ROT / OLE** | Grabs an existing PowerPoint instance from the Running Object Table | When COM creation fails, or PowerPoint was launched by another program first |
| **VSTO add-in** | The add-in pushes slide show events to ICC-CE | When the first two are blocked by security policy, or you want more responsive slide change events |

The app picks whichever works; no manual switching is needed. If none are available, the PowerPoint-related
toolbar buttons simply don't appear.

## Installing the VSTO add-in

The add-in is optional but makes slide change events noticeably more responsive:

1. Fully exit both PowerPoint and ICC-CE
2. In ICC-CE settings, find the PowerPoint section and enable add-in support
3. Restart PowerPoint and confirm the ICC add-in is enabled under File → Options → Add-ins

::: warning Add-in gets disabled
Office sometimes disables add-ins automatically when startup is slow. If integration stops working, go to
File → Options → Add-ins → Manage: Disabled Items and re-enable the ICC add-in.
:::

## Behaviour during a slide show

Once you enter presentation mode:

- The toolbar gains PowerPoint-specific buttons such as previous / next slide and the slide number
- Ink drawn on a slide is kept in memory **per slide number**
- Changing slides hides the current slide's ink and restores the target slide's ink
- On exit, the whole deck's ink can be written to disk depending on your settings

::: tip Slide changes and undo
Changing slides is not part of the undo stack. If you flip by accident, use the toolbar buttons to go back &mdash;
the ink is restored automatically.
:::

## Where the ink is stored

Ink produced during a slide show goes to the `Saves` folder in the data directory, in a sub-folder named after
the presentation. The path can be changed via the auto-save settings; see
[Files & Data Locations](/en/guide/files-and-data).

::: warning Renaming a presentation
Ink is associated with the presentation's name. After renaming the pptx file, previously saved ink will no
longer be matched to it automatically.
:::

## Troubleshooting

**No PowerPoint buttons appear during a slide show**
None of the three paths connected. Make sure you are using desktop PowerPoint (not UWP or the web version),
and check whether antivirus software is blocking COM calls.

**Ink appears on the wrong slide**
Usually happens with several presentations open at once. Present only one, or exit and re-enter the slide show.

**Ink is not saved automatically**
Check that auto-save is enabled and that the target directory is writable &mdash; some labs make the install
directory read-only.
