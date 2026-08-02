---
title: PowerPoint Guide
description: A complete guide for ICC-CE integration with PowerPoint/WPS, including slideshow annotation, ink saving, time capsule, and more
---

# PowerPoint Guide

<KnownBugs />

## PPT Integration Mode

Automatically activates when PowerPoint enters slideshow mode — no manual operation needed. In this mode:

- Page navigation buttons appear on the toolbar for slideshow control
- Ink written on slides is automatically saved per page
- Annotations are restored automatically when returning to previously annotated pages
- After the slideshow ends, you can return to normal mode to continue editing

> Integration not working? Check: Is PowerPoint activated? Is it in protected view (read-only)? Is PowerPoint running as administrator while ICC-CE is not elevated?

## Basic Integration Settings

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable PPT Integration | Toggle | On | Auto-enable annotation when PowerPoint slideshow is detected |
| Integration Mode | Select | COM | COM / ROT / Agent |
| Enable WPS Support | Toggle | Off | Enable WPS Presentation integration |
| Close WPS Process | Toggle | On | Auto-close lingering WPS processes |
| Smart Mode | Toggle | Off | Intelligently detect and switch to optimal integration mode |

## Slideshow Control

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Show PPT Buttons | Toggle | On | Show page navigation controls during slideshow |
| Page Number Clickable | Toggle | On | Click page number to jump directly |
| Long Press for Page Navigation | Toggle | On | Long press to continuously flip pages |
| Enhanced Preview | Toggle | Off | Enable enhanced slide preview |
| Enhanced Preview Loading Animation | Toggle | On | Show loading animation during preview |
| Show Canvas on New Slide | Toggle | Off | Auto-show canvas when switching to a new slide |
| Two-Finger Gesture Control During Slideshow | Toggle | Off | Use two-finger gestures for page navigation during slideshow |

## Ink Saving

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Auto-Save Ink During Slideshow | Toggle | On | Auto-save all ink to file when slideshow ends |
| Auto-Screenshot During Slideshow | Toggle | Off | Auto-screenshot on clear screen or slide change |
| Auto-Save Time Capsule During Slideshow | Toggle | On | Auto-save ink timestamp data for playback |
| Auto-Append Extension on Save | Toggle | On | Auto-add file extension when saving |
| Auto-Rename on Save | Toggle | Off | Auto-generate file name to avoid overwriting |
| Save Location | Directory | Default | Custom ink file save path |
| Ink-Saving Mode | Toggle | Off | Save ink in more compact format to reduce file size |

## Slideshow Toolbar

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Auto-Hide Toolbar Delay | Time | 30 seconds | Auto-hide toolbar after inactivity during slideshow |
| Enable Rounded PPT Toolbar | Toggle | On | Use rounded style toolbar during slideshow |
| Show Toolbar During Slideshow | Toggle | On | Show floating toolbar during slideshow |
| Show Collapse Button During Slideshow | Toggle | On | Show collapse button in slideshow mode |

## Time Capsule

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Time Capsule Auto-Play | Toggle | Off | Auto-play when opening a time capsule |
| Time Capsule Auto-Export | Toggle | Off | Auto-export when closing a time capsule |
| Time Capsule Auto-Export Format | Select | PNG | PNG / GIF / MP4 |
| Time Capsule GIF Frame Rate | Number | 10 | Frame rate for GIF export |
| Time Capsule Timeline Scale | Slider | 1.0 | Timeline display zoom ratio |
| Time Capsule Auto-Play Speed | Slider | 1.0 | Auto-play speed multiplier |

## Other Settings

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable PPT End Detection | Toggle | On | Auto-detect slideshow end and exit annotation mode |
| Auto-Exit on Slideshow End | Toggle | Off | Auto-exit software when slideshow ends |

## Troubleshooting

1. Make sure PowerPoint is activated, not in protected view / read-only mode
2. Check that PPT integration is enabled in ICC-CE settings
3. Check if PowerPoint is running as administrator while ICC-CE is not elevated
4. If using WPS simultaneously, try disabling WPS support or enabling Smart Mode
5. Try switching integration modes (COM / ROT / Agent)