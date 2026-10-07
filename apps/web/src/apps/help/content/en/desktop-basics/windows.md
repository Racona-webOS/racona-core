---
title: Window Management
description: Managing and controlling windows in Racona
sidebar:
  order: 2
---

Window management is one of the core features of Racona. This guide shows you how to manage windows efficiently.

## What is a Window?

A window is a rectangular area on the desktop that displays a running application's interface. Each application runs in its own window, allowing you to use multiple applications simultaneously.

## Window Structure

A window consists of the following parts:

![Placeholder: Window structure - header, control buttons, content area, and resize handles highlighted](../../../../../assets/desktop/window-en.webp)
_Window structure and main parts_

- **Header (1)**: The bar at the top of the window showing the application name. You can move the window by grabbing the header.
- **Control buttons (2)**: Buttons on the right side of the title bar for managing the window (minimize, maximize, close, etc.)
- **Content area (3)**: The main part of the window where the application interface appears
- **Resize handles (4)**: Invisible areas on the edges and corners of the window for resizing

## Dragging Windows

You can freely move windows on the desktop:

1. Click on the window header
2. Hold down the mouse button
3. Drag the window to the desired location
4. Release the mouse button

**Important:** Windows always stay within the desktop area - they cannot be dragged outside the visible area. The system automatically limits movement to keep the window fully visible.

**Window shake feature:** If you quickly shake a window left-right (3 direction changes within 1 second), all other windows automatically minimize, leaving only the active window on the desktop.

## Resizing Windows

You can modify window sizes as needed:

1. Move the mouse to the window edge or corner
2. The cursor changes to a resize cursor
3. Click and drag the edge in the desired direction
4. Release the mouse button

### Resize Constraints

Application developers can define window resize constraints:

- **Minimum size**: Window cannot be made smaller than a specified size
- **Maximum size**: Window cannot be made larger than a specified size
- **Resize disabled**: Resizing can be completely disabled for some applications
- **Maximize disabled**: Window cannot be maximized to full screen

These constraints ensure the application interface always displays properly and remains usable.

### Quick Resize with Double Click

Double-clicking on window edges or corners quickly fills the window in that direction:

- **Top edge**: Window fills upward to the top of the desktop
- **Bottom edge**: Window fills downward to the bottom of the desktop
- **Left edge**: Window fills left to the left edge of the desktop
- **Right edge**: Window fills right to the right edge of the desktop
- **Corners**: Window fills in both directions (e.g., top right corner: right and up)

**Automatic maximization:** If the window size reaches 99% of the desktop in both width AND height, it automatically switches to maximized state.

## Window Control Buttons

Control buttons in the top right corner of the window:

![Placeholder: Window control buttons in top right corner - help, link, minimize, maximize, close](../../../../../assets/desktop/window-functions.webp)
_Window control buttons with colors and functions_

- **Help button (?)** - Blue: Opens application help (if available)
- **Link button** - Turquoise: Copies link to open the application to clipboard
- **Minimize (-)** - Yellow: Hides the window but the application continues running
- **Maximize/Restore** - Green: Enlarges to full screen or restores to original size
- **Close (X)** - Red: Closes the window and stops the application

**Note:** For inactive windows, button icons only appear when you hover the mouse over the button.

## Minimizing

Minimizing a window hides it from the desktop, but the application continues running:

1. Click the minimize button in the top right corner of the window (yellow button, minus icon)
2. The window disappears from the desktop
3. The application button remains visible on the taskbar

**Restore:** Click the application button on the taskbar to restore the minimized window.

![Placeholder: Minimized window on taskbar, application button highlighted](../../../../../assets/desktop/min-en.webp)
_Minimized application button on the taskbar_

## Maximizing

Maximizing a window fills the entire screen:

1. Click the maximize button in the top right corner of the window (green button, square icon)
2. The window fills the entire screen
3. To restore, click the button again (now two square icons appear)
4. The window returns to its original size

**Quick maximize:** Double-click on the window header.

## Closing

Closing a window stops the application:

1. Click the close button in the top right corner of the window (red button, X icon)
2. The window closes
3. The application stops
4. The application button disappears from the taskbar

## Help Button

Some applications have a built-in help function:

- The help button appears in the window title bar, first among function buttons (blue button, ? icon)
- This is an optional button - only visible if help documentation exists for the application
- Clicking the help button opens a separate Help application
- The Help application contains detailed description and usage guide for the application
- This provides quick access to context-sensitive help without leaving the application

## Link Button (Application Sharing)

The Link button allows you to share an application with its current state with other users:

### How Does It Work?

1. Click the Link button in the window title bar (turquoise button, link icon)
2. The system automatically generates a unique GUID link
3. The link contains the application name and current state (e.g., which menu item you're on)
4. The link is automatically copied to the clipboard
5. You receive a notification of successful copying

### What Can It Be Used For?

- Sharing specific settings with colleagues - no need to explain "open the Settings app, find the XY menu item", just send the link
- Clarifying bug reports - if you find a bug in a specific menu item, you can share the exact location
- Educational purposes - quickly navigate others to a specific function
- Team collaboration support - simplifies communication about application usage

> **Note:** The GUID link stores information in compressed format, so it's safe to share and doesn't contain sensitive data. For more about opening links, see [Taskbar - Application Opener](./taskbar/#application-opener-guid-link).

## Window Previews

Each open application appears with its own button on the taskbar, even if multiple instances of the same application are running.

### Preview Image Feature

If enabled in the Settings application (Performance section), inactive windows have preview images:

1. Hover your mouse over an application button on the taskbar
2. The window preview image appears
3. Click the button to bring the window to foreground

**Important:** Preview images are resource-intensive and can slow down application minimization time. If you want faster performance, disable this feature in Settings > Performance.

![Placeholder: Window preview displayed above taskbar](../../../../../assets/desktop/preview-en.webp)
_Window preview image displayed on the taskbar_

## Related Topics

- [Taskbar](./taskbar/) - Application buttons and system functions
- [Applications](../applications/) - Using applications
- [Settings](../applications/settings/) - Configuring window previews
