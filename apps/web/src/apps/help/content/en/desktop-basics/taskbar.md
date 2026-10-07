---
title: Taskbar
description: Using the taskbar and its features
sidebar:
  order: 3
---

The taskbar is located at the bottom of the desktop (or at the top if configured), providing quick access to applications and system functions.

![Placeholder: Taskbar elements labeled - Start menu button, application buttons, clock, theme switcher, notification icon](../../../../../assets/desktop/taskbar-en.webp)
_Main elements and features of the taskbar_

## Application Buttons

Running application buttons appear on the taskbar:

- **Active application**: Colored glowing shadow appears under the button
- **Inactive application**: Normal appearance without shadow
- **Minimized application**: Dimmer appearance with grayed icon

### Using Application Buttons

Click on an application button:

- If the application is active: minimizes it (hides from desktop)
- If the application is inactive: brings to foreground and activates
- If the application is minimized: restores to desktop and activates

## Window Previews on Taskbar

If enabled in the Settings application (Performance section), inactive or minimized windows have preview images:

1. Hover your mouse over an application button on the taskbar
2. The window preview image appears
3. Click the button to bring the window to foreground or restore it

## Clock

The clock is located on the right side of the taskbar:

- Displays the current time
- Clock display can be toggled on/off in Settings

## Theme Switcher Button

The theme switcher button allows quick switching between light and dark modes:

1. Click the theme switcher button (sun/moon icon)
2. The theme switches immediately
3. The setting is automatically saved

For more customization options, see: [System Customization](/en/user/applications/settings/#appearance)

## Notification Icon

The notification icon indicates new notifications:

![Placeholder: Notification icon in different states - critical (yellow exclamation), unread (red number), normal](../../../../../assets/desktop/notification.webp)
_Notification icon in different states_

### Notification States

- **Critical notification**: Yellow exclamation mark in circle pulsing above icon
- **Unread notifications**: Red number in circle showing count of unread notifications
- **No notifications**: Only the notification icon (bell) is visible
- **Click**: Opens the Notification Center

> **Note:** If there are both critical and normal unread notifications, both indicators appear on the icon.

More information: [Notifications Application](/en/user/applications/notifications/)

## Application Opener (GUID Link)

The Application Opener feature allows you to open applications based on GUID links:

![Placeholder: Application opener icon in bottom right corner of taskbar and the opening dialog](../../../../../assets/desktop/guid-link-en.webp)
_GUID link-based application opening from the taskbar_

### How Does It Work?

1. Click the "Application Opener" icon in the bottom right corner of the taskbar (CopyPlus icon)
2. Paste the received GUID link into the appearing field
3. Click the "Open" button or use the quick paste button (clipboard icon)
4. The application opens exactly in the state it was shared with you

### Generating GUID Links

GUID links are generated with the window's [Link button](/en/user/desktop-basics/windows/#link-button-application-sharing), which automatically copies the link to the clipboard.

### Important Information

- If the application is not yet open, the GUID link opens it in the specified state
- If the application is already running, the link updates its state (e.g., navigates to the appropriate menu item)
- The link contains the application name and parameters (e.g., current menu item)
- Ideal for teamwork, education, and bug reports

## Customizing the Taskbar

You can customize the taskbar's appearance and behavior in the Settings application:

- **Position**: Bottom or top
- **Show clock**: Toggle on/off
- **Application buttons**: Style and behavior

[Taskbar settings →](/en/user/applications/settings/)

## Related Topics

- [Window Management](/en/user/desktop-basics/windows/) - Managing windows
- [Notifications](/en/user/applications/notifications/) - Managing notifications
- [Settings](/en/user/applications/settings/) - Customizing the taskbar
