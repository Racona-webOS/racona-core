---
title: Log
description: Detailed usage of the log application
sidebar:
  order: 7
---

The Log application displays system logs, error messages, and activity history.

## Basic Information

- **Category**: System
- **Multi-Instance**: Yes (you can open multiple log windows)
- **Permission**: Public (all users, but some features are permission-restricted)

## Log Types

The Log application has two main menu items:

### Error Log

List of errors logged in the system. Displays error messages logged by applications and the system.

**Permission**: `log.error.view` permission is required to view the error log.

### Activity Log

The Activity Log menu item displays user and administrator actions performed in the system.

**Permission**: `log.activity.view` permission is required to view the activity log.

## Using Error Log

### Log List

The error log displays logged errors in tabular format:

**Table columns:**

- **Level**: Error severity level (DEBUG, INFO, WARN, ERROR, FATAL)
- **Message**: Error message text
- **Source**: Which application or component logged the error
- **Time**: When the error occurred
- **URL**: The URL where the error occurred (if relevant)

**Table features:**

- **Sorting**: Can be sorted by any column (default: descending by time)
- **Pagination**: 20 errors per page
- **Striped display**: For better readability

More information on using tables: [Using Tables](../components/tables.md) _(TODO: This documentation is not yet created)_

### Filtering

The error log offers advanced filtering options:

**Source filtering:**

- Enter the source name in the search field
- Filtering automatically activates with 300 ms delay
- Placeholder text: "Filter source..."

**Level filtering:**

- Click the "Level" filter button
- Select one or more levels:
  - DEBUG
  - INFO
  - WARN
  - ERROR
  - FATAL
- Multiple levels can be selected simultaneously

**Reset filters:**

- If there's an active filter, the "Reset" button appears
- Click it to clear all filters

## Activity Log

The Activity Log displays user and administrator actions performed in the system in tabular format.

### Table Columns

- **Action**: Description of the action performed (e.g. "Login", "Plugin installed")
- **User**: ID of the user who performed the action
- **Resource**: Type and ID of the affected resource (e.g. `plugin:chat-plugin`)
- **Time**: When the action occurred

### Filtering

- **User filter**: Filter by user ID
- **Action filter**: Filter by action key (e.g. `user.login`, `plugin.installed`)

### Logged Actions

The activity log records the following events:

- User login / logout
- Profile updates
- User activation / deactivation
- Group and role assignments
- Plugin installation / uninstallation
- Role and permission management

## Tips and Tricks

- **Combine filters**: Source and level filters can be used together for precise results
- **Sorting**: Click column headers to change sorting
- **Pagination**: Use pagination buttons to view older errors
- **Permissions**: If you don't see the Error Log menu item, request `log.error.view` permission

## Related Topics

- [Users](../users) - Managing permissions
