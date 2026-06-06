# User Guide

## Getting Started
Hello! Welcome to the ICC CE user guide. This tutorial is designed for beginners who have never used the ICC CE annotation software series, or for users who are still using older versions. This guide details how to use ICC CE correctly to avoid common issues. The content is divided into specific sections for your convenience. Here are some quick tips:

1. This software runs on Windows 7 and above, and requires `.NET Framework 4.7.2`. If you encounter issues installing `.NET Framework 4.7.2` on Windows 7, please install update `Windows6.1-KB3033929-x64` (requires Windows 7 SP1).

> Windows6.1-KB3033929-x64:  
> https://www.microsoft.com/en-US/download/details.aspx?id=46078  
>
> .NET Framework 4.7.2:  
> https://dotnet.microsoft.com/en-us/download/dotnet-framework/net472  

<img src="https://github.com/user-attachments/assets/acdbddd6-7380-439b-a95e-1bdb156d9a4e" alt="Detailed Operation 2" style="width: 75%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">

> If the download fails, you can try the offline installer:  
> https://dotnet.microsoft.com/en-us/download/dotnet-framework/thank-you/net472-offline-installer  

<img src="https://github.com/user-attachments/assets/1d2011be-4e1f-4b6e-af3d-db59aa81b90f" alt="Detailed Operation 1" style="width: 75%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">   

2. If you encounter any problems, please submit an issue on the ICC CE GitHub issues page:  
https://github.com/InkCanvasForClass/community/issues  
3. Since you are already reading this tutorial, we trust that you have the ability to locate resources and find other relevant links. Therefore, they will not be listed individually here.


## Settings Section:
First, click on the `Tools` option on the software main page, then click `Settings`. You will see the settings interface as shown below:

<img src="https://github.com/user-attachments/assets/abd32bf2-508a-4011-8ca5-4f77b89910a0" alt="Settings Interface" style="width: 50%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">

:::success
In this area, you will find buttons for mode switching and new settings. These two features are currently **under development!**  
:::

### Startup Settings
In the `Startup` section, you can configure options related to automatic updates, no-focus window mode, run at startup, and launch behavior.
> The software provides two update channels: Stable and Beta. The Stable channel offers reliable updates, while the Beta channel provides early access to new features. You can choose based on your needs.

::: info
If you encounter problems during updates, try using the **Fix Version** function. If the current version has issues, you can use the **Rollback to historical version** feature. Before rolling back, you will be asked whether to pause automatic updates.
::: 

::: info
**No-focus mode** might cause some **always-on-top issues**. It works best when combined with the **Window Topmost** setting.
::: 

::: info
The **Borderless** window feature can resolve wallpaper pausing issues under certain conditions.
::: 

### Canvas and Ink Settings
In the `Canvas and Ink` section, you can configure drawing canvas preferences:
> 1. If you use a touch device or stylus and notice the cursor is hidden, please turn on the `Show cursor` feature;  
> 2. If your device has pressure sensitivity issues, try turning on `Disable pressure sensitivity`;  
> 3. The `Touch pressure mode` is used to simulate pressure sensitivity on devices that lack hardware pressure support;  
> 4. We recommend enabling `Hide ink after exiting canvas mode` to improve the overall experience;  
> 5. You can toggle `Show center when drawing a circle` to view the origin while drawing;  
> 6. The new `Ink Fadeout` option can be quickly toggled in the annotation sub-panel. This is useful when you want drawings to display on the canvas only temporarily.

::: info
Unless you are sure of what you are doing, it is **not recommended** to modify settings in this section other than `Eraser Size` and the **recommended settings above**, as it might affect application stability.
::: 
::: warning
~~The **Insert Image** feature currently has some known issues~~. Please adjust your settings accordingly.
::: 

### Gesture Settings
In the `Gesture` section, you will find options for touch gestures:
> 1. The `Two-finger drag` function is enabled by default. If you do not need it, you can disable it;  
> 2. If you encounter an issue where touch inputs cause the annotator to lock into the eraser tool without being able to switch back, please disable palm erase.

### Ink Correction Settings
In the `Ink Correction` section, you will find options for shape recognition and auto-straightening:
> If you find that the auto-straightening detection is too strict, you can **adjust the sensitivity higher**.  

:::info
If you do not need **Ink Correction**, please turn it off, as it may introduce extra CPU overhead to your computer.
:::

### Crash Handling Settings
In the `Crash Handling` section, you can configure the steps the software takes when it encounters an unexpected crash.

::: tip
We recommend enabling this feature to minimize the impact of **accidental crashes** during your usage.
:::

### PowerPoint Integration Settings
In the `PPT Integration` (PPT Linkage) section, you will find settings for presentation integration:
> 1. Here, you can adjust the position, color, and page number visibility of the page-turning control buttons;  
> 2. You can configure gestures used during slideshow presentations;  
> 3. You can set up screen capture and ink saving behaviors under slideshow mode;  
> 4. You can manage slideshow notification options. These features mostly **take effect after entering slideshow mode**;  
> 5. The new `PowerPoint integration enhancement` pre-loads the PowerPoint process. Although it disables animations when launching PowerPoint, it speeds up startup times and stabilizes the integration;  
> 6. **WPS Support** affects the **WPP process termination** feature. Both must be enabled simultaneously to achieve stable slideshow integration with WPS Office;  
> 7. Enable **Long Press Page Turning** for a more convenient page-switching experience;  
> 8. Enable **Skip Slide Animation** to skip slide transition animations instantly when clicking.

:::danger
It is not recommended to use **WPS** and **PowerPoint** simultaneously, as it may cause software instability. If you encounter slideshow connection issues, please refer to the tips below.
:::
:::info
If you cannot link to WPS while only enabling `WPS Support`, please try enabling both `PowerPoint Support` and `WPP process termination` at the same time.
:::
:::info
If you find that PowerPoint COM components are damaged, preventing PowerPoint linkage, please refer to this guide: [【Click here to open】](https://www.inkeys.top/tutorial/ppt-com.html).  
:::
:::warning
The current PowerPoint ink management supports opening multiple slideshows, but it may cause unexpected **ink tracking issues**. Additionally, enabling **show page number button** may cause a slight layout shift of the PPT control buttons towards the center.
:::

### Advanced Settings
In the `Advanced Settings` section, you can configure screen touch parameters, logging, exit confirmations, and experimental features. Feel free to modify them as needed.
> 1. If screen DPI adjustments occur during use, try enabling the `ForceFullScreen` option. If the resolution changes, try enabling the `ResolutionChangeDetection` function;  
> 2. You can calibrate the touch multiplier if the circular eraser shows up too large when drawing with fingers or palms. Clicking the corresponding rectangular area with a pen tip will help estimate the touch multiplier;  
> 3. If your device uses infrared touch and experiences touch issues, try enabling the `Four-side Infrared Mode`;  
> 4. The `AvoidFullScreenHelper` option forces the canvas to compress into non-taskbar screen regions.

:::info
We do not recommend modifying logging and backup settings unless requested.
:::

### Automation Settings
In the `Automation` section, you will find settings for automated workflows:
> 1. Configure the toolbar to automatically dock or hide when other specific software is running;  
> 2. Set the software to automatically terminate certain background processes;  
> 3. Manage auto-saving of ink drawings and dock-mode automation;  
> 4. The new floating window interception feature consumes more CPU resources, so enable it only if needed;  
> 5. The new file association feature helps you quickly open saved ink files by double-clicking them.

:::info
You can configure automation settings freely based on your personal workflow.
:::

### Random Call Settings
In the `Random Call` (Name Picker) section, you will find options for the random name picker feature:
> 1. Set the display duration for chosen names and import student/name lists;  
> 2. Configure the program to call external third-party name picking software directly;  
> 3. Customize name picker background options;  
> 4. Manage your timer and countdown configurations.

---

## Features Section
This section guides you through using the primary features of the software.

### Initial State
Upon launching the software, you will see the floating toolbar. Below is how to use its main functions:

<img src="https://github.com/user-attachments/assets/3d2f9a4c-3eba-410a-a7cd-c6c3574240f9" alt="Floating Toolbar" style="width: 60%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">

1. If you need to use a whiteboard, click the `Whiteboard` button.  
2. Clicking the `Annotation` button expands the toolbar and enters `Canvas Mode`, as shown below:  

![Canvas Mode](https://github.com/user-attachments/assets/f47e80a8-05b8-44ab-8c70-6771e97375ea)  

3. Click the `Tools` button to access more utilities.

<img src="https://github.com/user-attachments/assets/6f68b54d-4729-47f6-8064-b66baf1d1714" alt="More Utilities" style="width: 60%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">


### Canvas Mode
**Under Canvas Mode, you can perform writing, erasing, selection, geometric shapes drawing, and more.**  
Here are the basic operations:  
1. Single-click the active annotation icon to adjust parameters like brush color and thickness.  

<img src="https://github.com/user-attachments/assets/737a9cd5-c63e-4da7-a015-2a7b31137404" alt="Annotation brush settings" style="width: 80%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">

2. The software supports two eraser types: `Area Eraser` (erases everything inside the eraser boundaries) and `Stroke Eraser` (deletes entire ink strokes upon touch). Additionally, you can erase using your palm while in drawing mode (similar to Seewo Whiteboard). If you run into palm-erasing issues, please check the [Advanced Settings](#advanced-settings) section.  
3. The lasso select tool allows you to move, resize, or style selected ink strokes. (Note: Cloning ink is only supported under touch input).  
![Lasso Select Tool](https://github.com/user-attachments/assets/0acc309d-b181-46bf-b300-2f2a441651c5)  
4. The clear canvas button offers options to clear all annotations, or clear and return immediately to selection mode.  
5. Click the "Geometry" button to insert various geometric shape presets.  
![Geometric Shapes](https://github.com/user-attachments/assets/1692ff60-e75a-406a-b7e1-c3fc6e873e0e)

:::info
The software supports a **quick color palette**. Read [here](#personalization-settings) to see how to enable it.
:::

### Whiteboard Mode
**Under Whiteboard Mode, you can access dedicated drawing and lecturing tools.**  
Here are the basic operations:  

![Whiteboard Mode](https://github.com/user-attachments/assets/dd1f2b45-ae4e-416f-8539-e063fd1fd86e)

1. Upon entering Whiteboard mode, you can customize the whiteboard background color.  

![Background Settings](https://github.com/user-attachments/assets/323eb5f6-c95b-47c9-af82-d5fa415a0fb4)

2. In Whiteboard mode, you can use touch gestures to pan and zoom the canvas. You can also enable multi-finger drawing to allow multiple users to write simultaneously.  
![Gestures](https://github.com/user-attachments/assets/f64b8fe5-2561-41aa-af10-592f17f747da)

3. Use the insert image feature to place images on the whiteboard. This supports inserting local files or pasting screenshots.  
![Insert Image](https://github.com/user-attachments/assets/7d930879-fe78-47e8-b6ca-50b04f682880)

:::warning
~~This feature has some known issues. Please use with caution.~~ (Actually, it has already been fixed!)
:::

4. You can add new whiteboard pages, delete pages, or navigate between pages using the whiteboard page manager.  
![Whiteboard Page Manager](https://github.com/user-attachments/assets/4f497449-c23f-4b2d-98d0-05b67a53afe5)

**Other operations are identical to Canvas Mode and will not be repeated here.**  


### PPT Slideshow Mode
**This mode extends Canvas Mode, specifically designed for PowerPoint slide presentation controls.**  
![PPT Slideshow Mode](https://github.com/user-attachments/assets/e0d614b9-54b4-4532-8312-c48549ef2f66)

1. You will see page-switching control buttons on both sides of the screen. The position and layout of these buttons can be customized. Refer to the [PPT Settings](#powerpoint-integration-settings) section.  

2. During slideshow presentations, click the exit icon to terminate the slide show.


### Additional Tools

#### Dlass Settings
<img src="https://github.com/user-attachments/assets/4d1e6c93-a881-43ac-a452-6e9f70297e9b" alt="Dlass 1" style="width: 80%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">
<img src="https://github.com/user-attachments/assets/6cec8dfe-7c24-4547-be75-4d8fb2404aa6" alt="Dlass 2" style="width: 80%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">

1. This feature allows you to view uploaded whiteboard notes on the Dlass web platform.  
2. Supports automatic note uploading.  

:::danger
This service is provided by a third party, not by this software. Please comply with their terms of service!
:::


#### Timer
<img src="https://github.com/user-attachments/assets/82a09de3-a961-4139-ad52-94f6c1daff4b" alt="Timer" style="width: 80%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">

1. If you have used `Seewo Whiteboard (EasiNote)` or similar software, the timer controls will feel completely familiar.  
2. The timer configuration window provides common presets. Click the presets to quickly configure the duration.  
3. Adjusting the target time to zero configures the timer to act as a stopwatch (counting upwards).  

:::info
The time can only be edited before starting. If the input fields are locked, click the `Reset` button first.  
:::


#### Random Call
<img src="https://github.com/user-attachments/assets/24df9dc7-900d-4497-b086-e1d6a2f38bdf" alt="Random Call 1" style="width: 80%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">
<img src="https://github.com/user-attachments/assets/14371cf6-b97a-4832-a72f-acf1c49c7f85" alt="Random Call 2" style="width: 80%; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">

1. **Random mode**: Pick names using a randomized algorithm.
2. **Sequential mode**: Picks names starting from the first selected name, following a fixed sequence.
3. **Group mode**: Groups names together and draws from each group in sequence.
4. The software supports linking to external third-party name picking apps. Click the `External Call` button to replace the standard pick button with your external app.  

:::info
The `External Call` feature requires the user to install the third-party name picking software and configure its **Url** and **Plugin** beforehand.
:::
