---
title: Overview
description: Using Racona built-in applications
sidebar:
  order: 0
  label: Overview
---

## Racona Application Philosophy

Racona is a modern webOS system that includes by default the essential applications necessary for a functional operating system. These core applications provide the system's main functions: user management, communication (messages), notification system, system settings, logging, and help.

This starting point provides a stable, ready-to-use foundation that can later be extended with applications installed through the App Store according to specific user needs. It's also possible to manually extend the system with custom-developed applications - these applications access core functions through the SDK provided by the webOS and integrate perfectly into the system. This makes Racona flexibly adaptable to different use cases - whether for corporate environments, medical offices or hospital systems, or individual projects.

## Application Structure

Racona built-in system applications (Settings, Users, Log, etc.) follow a unified structure: left navigation menu, right content area, and optional function bar with action buttons. This consistent structure makes system applications easier to use.

It's important to note that Racona is a modular system - installable applications and plugins can have completely custom structures with their own user interfaces and operational logic.

[Detailed guide on general application structure →](./structure)

## Launching Applications

You can launch applications in several ways:

- **Desktop shortcuts**: Click the application icon on the desktop (single or double click, depending on settings)
- **Start Menu**: Open the Start Menu on the taskbar and select the desired application
- **Search**: Start typing the application name in the Start Menu
- **GUID link**: Use the Application Opener function on the taskbar to open shared links

## Application Categories

Racona applications are organized into categories for easier navigation:

- **System**: Core system applications (Settings, Users, Log, App Store)
- **Communication**: Communication tools (Messages)
- **Utilities**: Useful utilities (Help, Notifications)

## Multi-Instance Applications

Some applications can run in multi-instance mode, meaning you can open multiple windows of the same application simultaneously:

- **Help**: You can open multiple help windows for different topics
- **Log**: You can open multiple log windows with different filters

Most applications, however, are single-instance, meaning only one window can be open. If you try to reopen an already running single-instance application, the existing window comes to the foreground.

## Application Permissions

Application access is flexibly controlled:

- **Public applications**: Available to all logged-in users
- **Restricted applications**: Can be arbitrarily assigned to groups and roles as needed

By default, the Users and App Store applications are assigned to the administrator group and role. Users only see applications they have permission to access.

More information on permission management: [Users Application - Permissions](/en/user/applications/users/#permissions)

## System Applications

### Settings

**Category**: System | **Multi-Instance**: No

The Settings application is the system's central configuration hub. Here you can customize Racona appearance, behavior, and features.

**Main features:**

- **Account**: Edit profile (name, username, profile picture), view groups and roles
- **Security**: Set up two-factor authentication (2FA), change password, backup codes
- **Appearance**: Theme presets, desktop and taskbar theme (light/dark/auto), color scheme, font size
- **Desktop**: Desktop shortcut opening mode (single/double click)
- **Background**: Set background image, video, or color
- **Taskbar**: Position, taskbar element visibility (clock, application buttons, etc.)
- **Start Menu**: View (grid/list), search settings
- **Performance**: Optimize system performance
- **Language**: Interface language (if multiple languages available)
- **AI Assistant**: Avatar and TTS (Text-to-Speech) settings
- **Authentication**: Registration, social login, AI Agent and TTS Provider configuration (admin only)
- **System Information**: Version and system data

[Detailed usage guide →](/en/user/applications/settings/)

### Users

**Category**: System | **Multi-Instance**: No | **Permission**: Admin

The Users application allows management and administration of user accounts and setting various permissions.

**Main features:**

- View and edit user accounts
- Create new users
- Manage user permissions, groups, and roles
- Activate/deactivate accounts
- Modify user data

**Note**: This application is only available to users with administrator privileges.

[Detailed usage guide →](/en/user/applications/users/)

### Log

**Category**: System | **Multi-Instance**: No

The Log application displays system logs and error messages.

**Main features:**

- View system logs
- Error messages and warnings
- Activity log
- Filtering and search options
- Export logs

**Tip**: If you experience problems with the system, first check the Log application for detailed error messages.

[Detailed usage guide →](/en/user/applications/log/)

### App Store

**Category**: System | **Multi-Instance**: No | **Permission**: Admin

The App Store (Plugin Manager) allows uploading and installing new applications into the Racona system.

**Main features:**

- Upload applications
- Install applications
- Manage installed applications
- Application updates
- Remove applications

**Note**: This application is only available to users with administrator privileges.

## Communication Applications

### Messages (Chat)

**Category**: Communication | **Multi-Instance**: No

The Messages application is an internal messaging system that enables communication with other users.

**Main features:**

- Real-time messaging
- Conversation management

**Tip**: The Messages application is ideal for quick teamwork and collaboration.

[Detailed usage guide →](/en/user/applications/chat/)

## Utility Applications

### AI Assistant

**Category**: Utilities | **Multi-Instance**: No

The AI Assistant is an intelligent virtual assistant that helps with daily tasks, answering questions, and using the system.

**Main features:**

- Real-time conversation with the AI
- Context understanding and multilingual support
- Avatar customization
- TTS (Text-to-Speech) voice output
- Quick access from the taskbar

**Tip**: The AI Assistant chat panel can be opened by clicking the icon on the taskbar for quick access.

[Detailed usage guide →](/en/user/applications/ai-assistant/)

### Map

**Category**: Utilities | **Multi-Instance**: Yes

The Map application is an interactive map viewer and route planner based on OpenStreetMap data.

**Main features:**

- Search for places on the map
- Plan routes by car, on foot, or by bicycle
- Use current location as starting point
- Avoid toll roads, highways, and ferries
- Display distance and travel time

[Detailed usage guide →](/en/user/applications/map/)

### Help

**Category**: Utilities | **Multi-Instance**: Yes

The Help application contains system documentation and user guides.

**Main features:**

- Browse system documentation
- User guides
- Application-specific help
- Search function
- Context-sensitive help

[Detailed usage guide →](/en/user/applications/help/)

### Notifications

**Category**: Utilities | **Multi-Instance**: No

The Notifications application displays all your notifications in one place.

**Main features:**

- View all notifications
- Filter notifications (read/unread, critical)
- Delete notifications
- Notification history
- Quick access to notification settings

[Detailed usage guide →](/en/user/applications/notifications/)

## Application Sharing

Racona allows sharing applications with other users using GUID links:

1. Open the application in the desired state (e.g., on a specific settings page)
2. Click the Link button in the window title bar (turquoise button)
3. The link is automatically copied to the clipboard
4. Send the link to another user
5. The other user can open the application in the same state using the Application Opener function (bottom right corner of taskbar)

More information: [Using the Interface - Link Button](/en/user/desktop-basics/windows/#link-button-application-sharing)

## Application Help

Some applications have built-in help functionality. If you see the help button in the window title bar (blue button, ? icon), click it to open context-sensitive help. The Help application automatically opens with documentation for that application.

## Next Steps

- [Using the Interface](/en/user/desktop-basics/) - Window management, taskbar, start menu
- [System Customization](/en/user/applications/settings/#appearance) - Themes, background, language settings
- [FAQ](/en/user/faq/) - Answers to frequently asked questions
