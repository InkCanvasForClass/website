---
title: Gestures & Shortcuts
description: Touch gestures, pen buttons and common shortcut operations in ICC-CE
---

# Gestures & Shortcuts

## Touch gestures

The gesture system can be switched off entirely or enabled item by item in settings.

| Gesture | Effect |
| --- | --- |
| One-finger drag | Draw (in pen mode) |
| Two-finger pinch / spread | Zoom the canvas |
| Two-finger drag | Pan the canvas |
| Two-finger rotate | Rotate the canvas (enable in settings) |
| Two-finger tap | Undo |
| Three-finger tap | Redo |
| Multi-finger long press | Open the quick menu |

::: tip Gestures not working
First confirm the device really supports multi-touch: Device Manager → Human Interface Devices should list a
"HID-compliant touch screen". Some older all-in-one panels have touch drivers that swallow two-finger gestures
entirely &mdash; update to the vendor's official driver.
:::

## Palm rejection

Resting your hand on the screen while writing easily produces stray strokes. ICC-CE offers palm rejection:

- When enabled, contact points with an excessive contact area are ignored
- The threshold is adjustable &mdash; the larger the screen, the looser it can be
- On devices with an active stylus you can enable pen-only input to ignore finger input completely

## Pen buttons

Supported digital pens usually have one or two barrel buttons that can be mapped to eraser, select, undo and
other actions in settings. Many pens also have an eraser tip &mdash; just flip the pen over.

## Common operations

| Action | Notes |
| --- | --- |
| Undo / Redo | Toolbar buttons, or two-/three-finger tap |
| Clear canvas | Toolbar button; goes on the undo stack, so it can be undone |
| Screenshot | Saves the current screen together with the ink as an image |
| Toggle transparent / whiteboard mode | Toolbar mode button |
| Collapse the toolbar | Toolbar collapse button; drawing is unaffected |
| Exit | Toolbar exit button; triggers one auto-save |

::: warning Clear and undo
Clearing the canvas can be undone, but the undo stack is not kept after the app exits. Take a screenshot or
wait for auto-save to finish before quitting if the content matters.
:::

## Working with a PowerPoint slide show

During a slide show the toolbar gains slide navigation buttons, and changing slides switches the corresponding
ink automatically. Slide changes are not part of the undo stack &mdash; see the
[PowerPoint Guide](/en/guide/ppt-guide).
