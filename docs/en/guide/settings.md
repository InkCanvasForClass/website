---
title: Settings Guide
description: Detailed explanation of all ICC-CE settings, covering Startup, Canvas & Ink, Gestures, Appearance, PowerPoint Integration, Automation, Advanced, Window, Storage, and more
---

# Settings Guide

<KnownBugs />

Open the settings panel via Toolbar → Toolbox → Settings. All settings are stored in `Settings.json`, organized by functional category.

## 1. Startup Settings

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Launch on Startup | Toggle | Off | Automatically start ICC-CE after Windows login |
| Start Minimized | Toggle | Off | Auto-hide the floating toolbar to the screen edge after launch |
| Fast Startup | Toggle | Off | Optimize startup process to reduce launch time |
| Startup Animation | Toggle | Off | Show a full-screen welcome page on first launch |
| Auto Update | Toggle | On | Enable background automatic update checking |
| Silent Update | Toggle | Off | Silently download and install updates during specified time period |
| Silent Update Period | Time Range | 06:00–22:00 | Time window for silent updates |
| Update Channel | Select | Release | Release / Preview / Beta |
| Update Package Architecture | Select | Follow System | 32-bit / 64-bit |
| Smart Update | Toggle | On | Intelligently choose update timing to avoid interruptions during teaching |
| Crash Handling | Select | Show Dialog | Silent Restart / Log Only / Show Crash Details Dialog |
| Telemetry Level | Select | Disabled | Disabled / Basic / Extended |
| Window Chrome Rendering | Toggle | Off | Enable Window Chrome rendering (experimental, requires restart) |

## 2. Canvas & Ink

### Basic Strokes

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Pen Width | Slider | 2.5 | Default pen thickness, range 1–30 px |
| Highlighter Width | Slider | 20 | Default highlighter thickness |
| Pen Opacity | Slider | 255 (opaque) | Ink opacity |
| Highlighter Opacity | Slider | 255 (opaque) | Highlighter opacity |
| Highlighter Overlay | Toggle | Off | Whether overlapping highlighter areas darken |
| Pen Tip Mode | Select | Real-time | Real-time / Point Set / Velocity / Off |
| Show Cursor | Toggle | Off | Show cursor at pen tip position while drawing |
| Cursor Type | Select | Built-in | System Cursor / Built-in Cursor / Custom Cursor |
| Disable Pressure Sensitivity | Toggle | Off | All strokes use uniform thickness, unaffected by pressure |
| Pressure-Sensitive Touch Mode | Toggle | Off | Simulate pressure sensitivity for touch input |
| Hide Ink on Exit | Toggle | On | Hide ink on non-annotation PPT slides when exiting canvas mode |
| Clear Canvas Also Clears Images | Toggle | On | Also clear inserted images when clearing screen |

### Advanced Strokes

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Bezier Curve Smoothing | Toggle | Off | Use legacy Bezier curve smoothing (less effective than advanced Bezier) |
| Advanced Bezier Smoothing | Toggle | On | Default advanced Bezier smoothing for smoother strokes |
| Merge Smoothing with Undo | Toggle | Off | Merge ink smoothing into undo/redo |
| Async Ink Smoothing | Toggle | On | Process ink smoothing on async thread without affecting UI responsiveness |
| Hardware Acceleration | Toggle | On | Use Direct3D 11 hardware acceleration for ink rendering |
| Ink Smoothing Quality | Select | High Quality | Low Quality High Performance / Balanced / High Quality Low Performance |
| Max Concurrent Smoothing Tasks | Number | 0 (Auto) | 0 = auto-detect CPU core count |
| Native Ink Prediction | Toggle | On | Use native wet ink prediction for stroke tails, real-time preview only |
| Legacy Wet Ink System | Toggle | On | Use legacy WPF wet ink input system (takes effect on next launch) |

### Laser Pointer

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Laser Pointer Width | Slider | 5 | Laser pointer stroke thickness |
| Laser Pointer Opacity | Slider | 128 | Laser pointer semi-transparency |

### Auto-Restore Pen

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Auto-Restore Pen | Toggle | Off | Automatically restore a specified pen after a set time |
| Restore Delay (seconds) | Number | 30 | Wait time before auto-restoring the pen |
| Restore Period | Text | Empty | Time-based auto-restore (24-hour format, e.g. "08:00-12:00,14:00-17:00") |
| Restore Color | Color | Red | Pen color to switch to on auto-restore |
| Restore Width | Number | 5 | Pen width to switch to on auto-restore |
| Restore Opacity | Number | 255 | Pen opacity to switch to on auto-restore |

### Eraser Auto-Switch

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Eraser Auto-Switch Back | Toggle | Off | Auto-switch back to pen after using eraser with delay |
| Switch Back Delay (seconds) | Number | 10 | Wait time before switching back to pen |

### Ink Fade-Out

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Ink Fade-Out | Toggle | Off | Ink gradually fades out after writing |
| Fade-Out Time (ms) | Number | 3000 | Display duration before fade-out begins |
| Fade-Out Speed Multiplier | Slider | 1.0 | Fade-out animation speed |

### Line Straightening

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Auto Straighten Lines | Toggle | On | Automatically straighten near-straight strokes |
| High-Precision Line Straightening | Toggle | On | Enable higher-precision straightening algorithm |
| Length Threshold (px) | Number | 80 | Minimum line length to consider for straightening |
| Sensitivity | Slider | 0.20 | 0.05–2.0. Lower values require lines to be nearly perfect; higher values are more lenient |
| Pause Straightening | Toggle | Off | Auto-straighten strokes when pausing during writing |
| Pause Delay (ms) | Number | 300 | Wait time before triggering straightening on pause |

### Endpoint Snapping

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Endpoint Snapping | Toggle | On | Endpoints auto-snap to nearby line endpoints when drawing lines |
| Snap Distance (px) | Number | 15 | Range for endpoint snapping, 5–50 px |

### Shape Recognition

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Shape Recognition | Toggle | On | Auto-recognize hand-drawn shapes as standard shapes |
| Recognize Rectangle | Toggle | On | Individual toggle for rectangle recognition |
| Recognize Triangle | Toggle | On | Individual toggle for triangle recognition |
| Recognize Circle/Ellipse | Toggle | On | Individual toggle for circle recognition |
| Rectangle/Triangle No Pressure | Toggle | Off | Whether recognized shapes retain pressure effects |
| Shape Recognition Engine | Select | Default | Switch recognition algorithm |
| Handwriting Beautification | Toggle | Off | Enable WinRT handwriting recognition to beautify strokes |
| Beautification Font | Text | Default | Font used for beautification (default "Ink Free,KaiTi,Segoe Script") |
| Beautification Debounce Delay (ms) | Number | 2000 | Delay after pen lift before triggering recognition |

### Extended Canvas

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Extended Canvas Prompt | Toggle | Off | Show "Extend Canvas" button when writing near edge |
| Edge Threshold (px) | Number | 80 | Distance threshold to trigger extension prompt |
| Pan Step (px) | Number | 220 | Distance panned per extension click |
| Auto-Hide Delay (ms) | Number | 5000 | Display duration of extension button when inactive |

### Palm Rejection Eraser

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Palm Rejection Eraser | Toggle | On | Auto-switch to area eraser on large contact area (e.g., palm) |
| Sensitivity | Select | Low | Low / Medium / High |

### Velocity Tapering

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Velocity Tapering | Toggle | Off | Create tapered strokes based on writing speed variation |
| Taper Blend Ratio | Slider | 0.45 | Blend ratio between speed and base width |
| Min Distance Ratio | Slider | 0.5 | Minimum distance ratio between adjacent sampling points |

## 3. Ink to Shape

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Ink to Shape | Toggle | On | Master switch; shape recognition is disabled when off |
| Line Straightening Sensitivity | Slider | 0.20 | 0.05–1.0, lower values require higher precision |
| Line Normalization Threshold | Slider | 0.5 | Line detection threshold |
| Recognition Engine | Select | Default | Shape recognition engine selection |
| Recognize Rectangle (Independent) | Toggle | On | Synchronized with Canvas settings rectangle recognition |
| Recognize Triangle (Independent) | Toggle | On | Synchronized with Canvas settings triangle recognition |
| Handwriting Beautification | Toggle | Off | Auto-beautify handwritten text when enabled |

## 4. Gesture Settings

### Screen Annotation Mode Gestures

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Multi-Touch Mode | Toggle | Off | Global gesture toggle; all gestures disabled when off |
| Two-Finger Zoom | Toggle | On | Pinch to zoom canvas content |
| Two-Finger Pan | Toggle | On | Two-finger drag to move canvas viewport |
| Two-Finger Rotate | Toggle | Off | Two-finger rotation of canvas |
| Selection Two-Finger Rotate | Toggle | Off | Two-finger rotate selected ink |

### Whiteboard Mode Gestures

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Whiteboard Multi-Touch Mode | Toggle | Off | Whiteboard mode gesture master toggle |
| Whiteboard Two-Finger Zoom | Toggle | On | Two-finger zoom in whiteboard mode |
| Whiteboard Two-Finger Pan | Toggle | On | Two-finger pan in whiteboard mode |
| Whiteboard Two-Finger Rotate | Toggle | Off | Two-finger rotate in whiteboard mode |

## 5. Appearance

### Theme

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Theme | Select | Follow System | Light / Dark / Follow System |
| Window Background | Select | Mica | None / Acrylic / Mica / MicaAlt |
| Language | Select | System Language | Interface language, supports Chinese, English, etc. |

### Toolbar Appearance

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Toolbar Icon Set | Select | Default | Choose different icon style packs |
| Toolbar Scale | Slider | 1.0 | 0.5–1.25x scaling |
| Toolbar Opacity | Slider | 1.0 | 0.3–1.0 |
| PPT Mode Toolbar Opacity | Slider | 0.5 | Toolbar opacity during slideshow |
| Toolbar Menu Opacity | Slider | 1.0 | Opacity of toolbar popup menus |
| Toolbar Position | Select | Right | Right / Left / Top / Bottom |
| Reverse Toolbar Content | Toggle | Off | Reverse toolbar button order |
| Auto-Flip on Insufficient Space | Toggle | On | Auto-adjust toolbar position when screen space is limited |
| Flip Content on Auto-Flip | Toggle | Off | Also reverse button order during auto-flip |
| Disable Toolbar Animations | Toggle | Off | Remove toolbar transition animations |
| Enable Idle Mini Bar | Toggle | Off | Show compact rounded mini toolbar when idle |
| Mini Bar Opacity | Slider | 0.5 | Mini bar opacity |
| Mini Bar Restore Time (seconds) | Number | 60 | Idle time before auto-collapsing to mini bar |
| Colorful Toolbar | Toggle | Off | Enable colorful toolbar icons |
| Legacy Toolbar UI | Toggle | Off | Use legacy WPF floating toolbar style |
| Compact Toolbar | Toggle | Off | More compact toolbar layout |
| Hide Toolbar Border | Toggle | Off | Hide toolbar border line |
| Toolbar Border Color | Color | Empty | Custom toolbar border color |
| Toolbar Border Color Mode | Select | 0 | Border color mode selection |
| Show Pen Color on Toolbar Icon | Toggle | Off | Display current pen color on toolbar icon |
| Simplified Drag Handle | Toggle | On | Use simpler drag handle |
| Show Drag Handle Arrow | Toggle | Off | Show direction arrow on drag handle |

### Whiteboard Toolbar

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Whiteboard UI Scale | Slider | 1.0 | Toolbar scale in whiteboard mode |
| Left Whiteboard Toolbar Scale | Slider | 1.0 | Left toolbar scale in whiteboard mode |
| Right Whiteboard Toolbar Scale | Slider | 1.0 | Right toolbar scale in whiteboard mode |
| Left Toolbar Opacity | Slider | 0.77 | Left whiteboard toolbar opacity |
| Center Toolbar Opacity | Slider | 0.77 | Center whiteboard toolbar opacity |
| Right Toolbar Opacity | Slider | 0.77 | Right whiteboard toolbar opacity |
| Transparent Button Background | Toggle | On | Toolbar button background transparent |
| Show Exit Button | Toggle | On | Show exit button on whiteboard toolbar |
| Show Eraser Button | Toggle | On | Show eraser button on whiteboard toolbar |
| Show Pen Color on Whiteboard Icon | Toggle | Off | Show current pen color on whiteboard toolbar icon |

### Tray Icon

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Tray Icon | Toggle | On | Show icon in system notification area |
| Left Click Action | Select | Show Menu | Action on left-clicking tray icon |
| Right Click Action | Select | Show Menu | Action on right-clicking tray icon |

Available actions include: Show Menu, Show/Hide Main Window, Temporarily Show Main Window, Open Settings, Disable All Shortcuts, Force Fullscreen, Toggle Collapsed Toolbar, Reset Toolbar Position, Restart App, Close App, No Operation.

### Quick Panel

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Quick Panel | Toggle | On | Quick access to common tools in collapsed mode |
| Quick Panel Opacity | Slider | 1.0 | Quick panel opacity |
| Quick Panel Bottom Offset | Number | -150 | Bottom position offset of quick panel |
| Auto-Hide Quick Panel | Toggle | Off | Auto-hide quick panel when idle |
| Auto-Hide Delay (seconds) | Number | 3 | Wait time before auto-hide |
| Floating Quick Panel | Toggle | On | Use floating style quick panel |

### Quick Color Palette

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Show Quick Color Palette | Toggle | Off | Show quick color selector on toolbar |
| Palette Display Mode | Select | Double Row | Single Row (6 colors) or Double Row (8 colors) |

### Whiteboard Display

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Show Time and Date | Toggle | On | Show current time in whiteboard mode |
| Use 24-Hour Format | Toggle | Off | Time display format |
| Whiteboard Quote | Toggle | On | Show quotes/mottos in whiteboard mode |
| Quote Source | Select | Default | Quote source selection |
| Quote Position | Select | Top Right | Quote display position |
| Auto-Rotate Quotes | Toggle | Off | Automatically switch between different quotes |
| Quote Rotation Interval (seconds) | Number | 60 | Quote switching interval |

### Side Panel

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Allow Dragging Side Panel | Toggle | On | Side panel can be dragged to adjust position |

### Feature Buttons

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Show Mode/Finger Toggle Switch | Toggle | On | Show mode switch button on toolbar |
| Show Hidden Control Button | Toggle | Off | Show hidden control button |
| Expand Button Icon Type | Select | Default | Icon style for expand button |
| Show Left/Right Toggle Button | Toggle | Off | Show toolbar left/right position toggle button |
| Eraser Display Option | Select | Default | Eraser button display style |
| Mouse Mode Scroll Wheel Passthrough | Toggle | Off | Mouse wheel passes through to underlying app in draw mode |

### Shortcuts

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Mouse Mode Global Shortcuts | Toggle | Off | Also respond to global shortcuts in mouse mode |

## 6. PowerPoint Settings

### Basic Integration

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable PPT Integration | Toggle | On | Auto-enable annotation when PowerPoint slideshow is detected |
| Integration Mode | Select | COM | COM / ROT / Agent |
| Enable WPS Support | Toggle | Off | Enable WPS Presentation integration |
| Close WPS Process | Toggle | On | Auto-close lingering WPS processes |
| Smart Mode | Toggle | Off | Intelligently detect and switch to optimal integration mode |

### Slideshow Control

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Show PPT Buttons | Toggle | On | Show page navigation controls during slideshow |
| Page Number Clickable | Toggle | On | Click page number to jump directly |
| Long Press for Page Navigation | Toggle | On | Long press to continuously flip pages |
| Enhanced Preview | Toggle | Off | Enable enhanced slide preview |
| Enhanced Preview Loading Animation | Toggle | On | Show loading animation during preview |
| Show Canvas on New Slide | Toggle | Off | Auto-show canvas when switching to a new slide |
| Two-Finger Gesture Control During Slideshow | Toggle | Off | Use two-finger gestures for page navigation during slideshow |

### Ink Saving

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Auto-Save Ink During Slideshow | Toggle | On | Auto-save all ink to file when slideshow ends |
| Auto-Screenshot During Slideshow | Toggle | Off | Auto-screenshot on clear screen or slide change |
| Auto-Save Time Capsule During Slideshow | Toggle | On | Auto-save ink timestamp data for playback |
| Auto-Append Extension on Save | Toggle | On | Auto-add file extension when saving |
| Auto-Rename on Save | Toggle | Off | Auto-generate file name to avoid overwriting |
| Save Location | Directory | Default | Custom ink file save path |
| Ink-Saving Mode | Toggle | Off | Save ink in more compact format to reduce file size |

### Slideshow Toolbar

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Auto-Hide Toolbar Delay | Time | 30 seconds | Auto-hide toolbar after inactivity during slideshow |
| Enable Rounded PPT Toolbar | Toggle | On | Use rounded style toolbar during slideshow |
| Show Toolbar During Slideshow | Toggle | On | Show floating toolbar during slideshow |
| Show Collapse Button During Slideshow | Toggle | On | Show collapse button in slideshow mode |

### Time Capsule

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Time Capsule Auto-Play | Toggle | Off | Auto-play when opening a time capsule |
| Time Capsule Auto-Export | Toggle | Off | Auto-export when closing a time capsule |
| Time Capsule Auto-Export Format | Select | PNG | PNG / GIF / MP4 |
| Time Capsule GIF Frame Rate | Number | 10 | Frame rate for GIF export |
| Time Capsule Timeline Scale | Slider | 1.0 | Timeline display zoom ratio |
| Time Capsule Auto-Play Speed | Slider | 1.0 | Auto-play speed multiplier |

### Other

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable PPT End Detection | Toggle | On | Auto-detect slideshow end and exit annotation mode |
| Auto-Exit on Slideshow End | Toggle | Off | Auto-exit software when slideshow ends |

## 7. Automation Settings

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Auto-Collapse Toolbar on PPT Slideshow | Toggle | Off | Auto-collapse floating toolbar when slideshow starts |
| Enable Auto-Save Ink | Toggle | Off | Periodically auto-save current ink file |
| Auto-Save Interval (seconds) | Number | 60 | Interval between auto-saves |
| Max Auto-Save Files | Number | 50 | Maximum number of auto-save files retained |
| Floating Window Blocking | Toggle | Off | Block floating windows from teaching software (Seewo, Hitevision, etc.) |
| Auto-Switch Color | Toggle | Off | Periodically auto-switch ink color |
| Auto-Switch Color Interval (seconds) | Number | 30 | Color switching interval |
| Color List | Text | Red,Blue,Green | Comma-separated list of colors to cycle through |
| Color Switch Order | Select | Sequential | Sequential / Random |
| Auto-Open File on Startup | Toggle | Off | Auto-open last saved ink file on startup |
| Auto-Load Last File | Toggle | Off | Auto-restore last unsaved ink on startup |
| Auto-Save Screenshots | Toggle | Off | Auto-save screen captures |
| Auto-Save Screenshot Location | Directory | Default | Screenshot save directory |
| Screenshot Pixel Ratio | Number | 1 | Screenshot resolution multiplier, 1 = original resolution |

## 8. Advanced Settings

### Logging

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Logging | Toggle | On | Record runtime logs to file |
| Log Level | Select | Info | Debug / Info / Warn / Error |
| Max Log File Size (MB) | Number | 512 | Maximum log file size |
| Max Log File Count | Number | 20 | Number of log files retained |

### Maintenance

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Clean Update Cache on Startup | Toggle | On | Auto-clean installed update cache on startup |
| Clean Auto-Save on Startup | Toggle | Off | Clean expired auto-save files on startup |
| Auto-Save Retention Days | Number | 3 | Retention period for auto-save files |
| Enable SQLite Database | Toggle | Off | Use SQLite for settings storage (experimental, requires restart) |

### Developer Options

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Developer Mode | Toggle | Off | Show developer options, debugging only |
| Enable Plugin System | Toggle | Off | Load plugin extensions |
| Plugin Directory | Directory | Default | Plugin storage directory |
| Add Plugin | Button | — | Open plugin installation dialog |
| Uninstall Plugin | Button | — | Remove installed plugin |

### Miscellaneous

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Check URL Association on Startup | Toggle | On | Check and register file associations (.icc, etc.) |
| Enable Multi-Instance | Toggle | Off | Allow multiple ICC-CE instances to run simultaneously |
| Enable Multi-Monitor Support | Toggle | On | Enable extended features in multi-monitor environments |
| Enable Multi-Monitor Canvas Fix | Toggle | Off | Fix canvas display issues on multi-monitor setups |
| Run with Administrator Privileges | Toggle | Off | Run as administrator (requires restart) |
| Enable Context Menu | Toggle | On | Show ICC-CE right-click menu in File Explorer |

## 9. Window Settings

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Canvas Mode | Select | Overlay | Overlay / Window / Fullscreen |
| Default Window Opacity | Slider | 1.0 | Window mode opacity |
| Default Window Size | Rectangle | 0,0,0,0 | Default window position and size |
| Default Window Mode | Select | Screen Annotation | Default mode on startup |
| Window Always on Top | Toggle | On | Always stay on top |
| Temporary Window Always on Top | Toggle | Off | Temporarily keep window on top |
| Window Rounded Corners | Toggle | On | Use rounded corners for window |
| Enable Window Shadow | Toggle | On | Show window shadow effect |
| Borderless Window | Toggle | Off | Use borderless window style |
| Window Title Color | Color | System Default | Window title bar color |
| Borderless Window Resize Mode | Select | Rounded | Resize mode for borderless window |
| Window Always on Top Voting | Toggle | Off | Whether to reject other windows' topmost requests |
| Window Always on Top Voting Mode | Select | Always Top | Always Top / Button Voting / Auto Voting |

## 10. Other Settings

### Storage

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Default Save Location | Directory | Documents | Default ink file save directory |
| Save File Name Prefix | Text | Empty | Prefix for auto-saved file names |
| Screenshot Pixel Ratio | Number | 1 | Configurable screenshot resolution |

### Notifications

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Show Notifications | Toggle | On | Show system notifications |
| Notification Desktop Badge | Toggle | Off | Show notification icon in desktop corner |
| Notification Auto-Dismiss Time (seconds) | Number | 5 | Auto-dismiss delay for notifications |
| Notification Sound | Toggle | Off | Play notification sound |

### Updates

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Auto Update | Toggle | On | Auto-check for updates |
| Update Channel | Select | Release | Release / Preview / Beta |
| Update Package Architecture | Select | Follow System | 32-bit / 64-bit |
| Silent Update | Toggle | Off | Silently update during specified time period |
| Silent Update Period | Time Range | 06:00–22:00 | Time window for silent updates |
| Update Source | Select | Default | Update check server source |
| Download Timeout (seconds) | Number | 60 | Update download timeout |
| Download Retry Count | Number | 3 | Number of download retries on failure |

### Feedback

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| Enable Crash Reporting | Toggle | On | Auto-send error report on crash |
| Crash Report Includes Logs | Toggle | On | Report includes runtime logs |
| Crash Report Includes Screenshots | Toggle | Off | Report includes screenshot at time of crash |
| Crash Report Includes System Info | Toggle | On | Report includes system configuration information |