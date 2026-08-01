# Getting Started

## System Requirements

- <badge type="tip" text="OS" /> Windows 10 1809 (build 17763) or later / Windows 11
- <badge type="warning" text="Runtime" /> **.NET 6 Desktop Runtime** (not .NET Framework 4.x)
- <badge type="tip" text="Memory" /> 4GB RAM or more recommended
- <badge type="info" text="Hardware" /> Touch-input supported device (recommended, but not required)

See [Installation & Update Channels](/en/guide/installation) for the full requirements and channel comparison.

## Installation

Pick an update channel on the [download page](/en/download), then choose one of two forms:

- **Installer (`.exe`)**: runs a setup wizard and creates shortcuts &mdash; best for devices that stay put
- **Portable (`.zip`)**: extract anywhere and run `InkCanvasForClass.exe`; writes nothing to the system,
  ideal for USB sticks and lab deployments

On the first run, the software guides you through the initial setup.

::: warning Won't start?
If double-clicking does nothing or the window flashes and disappears, you are most likely missing the
.NET 6 Desktop Runtime. Download ".NET Desktop Runtime 6.x" for your architecture from Microsoft.
:::

## Basic Operations

### Floating Toolbar

Once started, you will see a floating toolbar for switching drawing tools and opening settings.

![Floating Toolbar](https://github.com/user-attachments/assets/f47e80a8-05b8-44ab-8c70-6771e97375ea)

The toolbar provides these core functions:

- Pen tool: free-hand drawing with pressure support
- Highlighter: semi-transparent annotations
- Eraser: erase by stroke or by lasso
- Color palette: change pen and highlighter colors
- Undo / Redo
- Settings: access application configuration
- Fold / Unfold: minimize or expand the toolbar

### Two Drawing Modes

1. **Transparent mode**: draw over any application or the desktop &mdash; ideal for screen annotation
2. **Whiteboard mode**: a dedicated drawing space, perfect for board work and math

Click the mode button on the toolbar to switch.

### Gestures

Touch devices support two-finger zoom, two-finger pan, two-finger tap to undo and more.
See [Gestures & Shortcuts](/en/guide/gestures-shortcuts) for the full list and palm rejection settings.

### Saving

- Screenshot: saves the current view together with your ink as an image
- Auto-save: periodically saves ink; see [Files & Data Locations](/en/guide/files-and-data) for paths

## Integration with PowerPoint

ICC-CE lets you annotate slides while presenting and remembers ink per slide:

1. Start PowerPoint and open your presentation
2. Enter slide show mode
3. ICC-CE detects the slide show and the toolbar gains slide navigation buttons
4. Ink is stored per slide and switches automatically as you navigate

See the [PowerPoint Guide](/en/guide/ppt-guide) for how the integration works, add-in setup and troubleshooting.

## Next Steps

- [Settings Guide](/en/guide/settings) &mdash; common configuration options
- [Advanced Tips](/en/guide/advanced-tips) &mdash; get more out of ICC-CE
- [FAQ](/en/guide/faq) &mdash; start here when something goes wrong
