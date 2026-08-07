---
title: Smart Ink Processing
description: Intelligent line straightening, shape recognition, endpoint snapping, and brush tools in ICC-CE
---

# Smart Ink Processing

ICC-CE provides advanced ink rendering and hand-drawing assistance features that automatically smooth, straighten, and optimize shapes while drawing or writing.

## Smart Drawing Assistance

### Line Straightening

When drawing strokes close to a straight line, ICC-CE automatically recognizes and converts them into perfect straight lines. You can adjust sensitivity and threshold in settings:

| Option | Description | Range |
| --- | --- | --- |
| **Sensitivity** | Controls the threshold for determining stroke straightness | 0.05 - 2.0 |
| **Length Threshold** | Only strokes exceeding the specified length will be straightened | Adjustable pixels |

::: tip Recommendation
When drawing geometric diagrams or aligned annotation lines, increasing sensitivity helps achieve cleaner results.
:::

### Shape Recognition

Automatically recognizes and optimizes hand-drawn shapes into standard geometry:

- **Rectangles & Squares**
- **Triangles**
- **Circles & Ellipses**

### Endpoint Snapping

Endpoints automatically snap to nearby endpoints while drawing, making it easy to create well-connected geometric shapes.

---

## Diverse Drawing Tools

### Pens and Highlighters

- **Thickness & Transparency**: Supports dynamic adjustments of pen size and opacity
- **Color Presets**: Built-in color palettes for quick selection
- **Pressure Sensitivity**: Automatically responds to writing pressure on supported touch pens or tablets

### Touch Modes

| Mode | Feature |
| --- | --- |
| **Fingertip Drawing** | Optimized for standard touchscreens, allowing direct finger drawing |
| **Pen Mode** | Precision drawing mode designed for active styluses with palm rejection |
| **Simulated Pressure** | Dynamically simulates pressure variations based on stroke speed on non-pressure devices |

### Eraser Tools

- **Point Eraser**: Precisely erases specific parts of a stroke
- **Stroke Eraser**: Removes the entire stroke with a single tap
- **Eraser Size & Shape**: Adjustable erasing radius and target shape
