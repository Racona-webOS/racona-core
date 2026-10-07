---
title: Modal Windows
description: Using modal windows in Racona
sidebar:
  order: 2
---

Modal windows are temporary pop-up windows that display important information or request confirmation from the user. When modal windows appear, the background darkens and the user can only interact with the modal window.

![Placeholder: Modal window example](../../../../../assets/ui/modal-en.webp)
_Example modal window_

## Types of Modal Windows

Racona uses two main types of modal windows:

### 1. Confirmation Window

The confirmation window is a simple, two-button window that requests user confirmation before executing an important action.

**Structure**:

- **Title**: Brief description of the action (e.g., "Delete User")
- **Description**: More detailed information about the action and its consequences
- **Cancel button**: Cancels the action and closes the window
- **Confirm button**: Executes the action

**When does it appear?**

- Before delete operations (deleting user, group, role)
- Before irreversible actions
- Before modifying important settings

**Example usage**:

1. Click the "Delete" button next to an item
2. The confirmation window appears
3. Read the description and warning
4. Choose:
   - **Cancel**: Cancels the action, nothing happens
   - **Delete/Confirm**: Executes the action

**Visual indicators**:

- **Dangerous actions**: Confirm button is red (e.g., delete)
- **Normal actions**: Confirm button is blue or gray

### 2. Custom Window

The custom window displays more complex content, such as forms, detailed information, or multi-step processes.

**Structure**:

- **Title**: Window title
- **Description** (optional): Brief explanation
- **Content area**: Custom content (forms, lists, etc.)
- **Action buttons**: One or more buttons to execute actions

**When does it appear?**

- Creating new items (e.g., new user, new group)
- Complex editing operations
- Multi-step processes
- Displaying detailed information

**Example usage**:

1. Click "Create New" or similar button
2. The custom window appears with the form
3. Fill in required fields
4. Click "Save" or "Create" button
5. The window closes and the action is executed

## Using Modal Windows

### Opening a Window

Modal windows automatically open when you initiate a specific action:

- Pressing delete button
- Pressing create new item button
- Pressing edit button (in some cases)

### Closing a Window

You can close modal windows in several ways:

1. **Cancel/Close button**: Cancels the action
2. **X button** (top right corner): Cancels the action
3. **Escape key**: Cancels the action
4. **Click on background**: Cancels the action in some windows
5. **Execute action**: After pressing the confirm button, the window automatically closes

**Important**: If you close the window without executing the action, changes will not be saved!

## Tips and Tricks

- **Quick close**: Press the Escape key to quickly close the modal window (if enabled)
- **Read carefully**: Red button actions are usually irreversible
- **Form completion**: Required fields are usually marked with an asterisk (\*)

## Related Topics

- [Toast Messages](/en/user/ui-components/notifications/) - Feedback on actions performed in modal windows
- [Data Tables](/en/user/ui-components/data-tables/) - Modal windows often open from data tables
- [Users Application](/en/user/applications/users/) - Example of modal window usage
