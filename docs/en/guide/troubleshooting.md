# Troubleshooting

> Encountered an issue? Here are the solutions to common problems:

## Startup Issues

### The application cannot start

**Symptom**: Double-clicking the application icon has no response, or an error message appears.

**Solutions**:

1. Ensure you have installed the required version of .NET Framework.
2. Run the application as an administrator.
3. Check the Windows Event Viewer for error logs.
4. Try extracting the zip archive to a different path (avoid using protected system folders).

### No interface visible after startup

**Symptom**: The application seems to have launched (visible in Task Manager), but there is no visible interface.

**Solutions**:

1. Check if there is an ICC-CE icon in the system tray.
2. Try pressing Alt+Tab to switch to the application.
3. Right-click the application icon in the taskbar and select "Maximize".
4. Reset application settings (delete the `%AppData%\ICC-CE` folder).

## Drawing Issues

### Ink is not showing

**Symptom**: Drawing on the screen but no strokes appear.

**Solutions**:

1. Make sure you haven't accidentally selected a transparent color.
2. Check if the current layer is set to visible.
3. Try switching drawing modes.
4. Restart the application.

### Line straightening is not working

**Symptom**: The line straightening function does not work or behaves inconsistently.

**Solutions**:

1. Verify that auto-straightening is enabled in Settings.
2. Adjust the sensitivity setting - try a higher value (0.5-1.5).
3. Ensure the length of the drawn line exceeds the set threshold.
4. Keep the drawing speed relatively steady.
5. Check if other drawing configurations are conflicting.

### Touch input issues

**Symptom**: Touchscreen inputs are imprecise or not recognized.

**Solutions**:

1. Adjust the touch multiplier setting.
2. Enable or disable nib mode.
3. Increase the finger mode boundary width.
4. Ensure Windows Touch Settings are functioning normally.
5. Check Device Manager to ensure your touchscreen drivers are up-to-date.

## PowerPoint Integration Issues

### Cannot detect PowerPoint

**Symptom**: No ICC-CE integration features appear during PowerPoint slideshows.

**Solutions**:

1. Confirm that PowerPoint support is enabled in Settings.
2. Use a compatible version of PowerPoint (2016 or higher).
3. Start ICC-CE before starting PowerPoint.
4. Check if other software is blocking the PowerPoint COM integration.

### Drawing lag in PowerPoint

**Symptom**: Obvious delay when drawing in PowerPoint slideshow mode.

**Solutions**:

1. Lower the transparency of the ICC-CE toolbar in PowerPoint.
2. Turn off unnecessary PowerPoint slide transition animations.
3. Ensure the computer meets the system requirements.
4. Close other resource-intensive applications.

## Performance Issues

### The application runs slowly

**Symptom**: Laggy interface response or delay when drawing.

**Solutions**:

1. Clear old ink files and auto-saved screenshots.
2. Disable unnecessary automation features.
3. Reduce UI transparency.
4. Enable performance optimization options in Settings.

### High memory usage

**Symptom**: The application consumes a large amount of memory or increases over time.

**Solutions**:

1. Periodically clear the canvas.
2. Reduce the number of active ink strokes.
3. Enable automatic cleanup of old files.
4. Restart the application to release memory.

## Resetting the Application

If you encounter persistent issues, you can try resetting the application:

1. Close the ICC-CE application.
2. Navigate to the `%AppData%\ICC-CE` folder.
3. Back up the `settings.json` file (if you wish to preserve your settings).
4. Delete all files in the folder.
5. Restart ICC-CE.

::: warning Warning
Resetting the application will delete all custom settings and preferences.
:::

## Contact Support

If the above methods do not resolve your issue:

1. Submit an issue on [GitHub Issues](https://github.com/InkCanvasForClass/community/issues).
2. Provide a detailed description of the problem and steps to reproduce.
3. Attach log files (if logging is enabled).
4. State your system configuration and ICC-CE version.
