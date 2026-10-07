---
title: Toast Messages
description: Toast notifications in Racona
sidebar:
  order: 3
next:
  link: /en/user/applications/
  label: Applications
---

Toast messages are brief, temporary notifications that appear in the top right corner of the screen. They provide immediate feedback on performed actions without interrupting the workflow.

## What is a Toast Message?

The "toast" name refers to toast popping up from a toaster - similarly, these messages "pop up" on the screen and then automatically disappear after a few seconds.

**Characteristics**:

- Brief, concise messages
- Automatically disappear (usually after 3-5 seconds)
- Don't block the user interface
- Color-coded by type
- Appear in the top right corner of the screen

## Types of Toast Messages

Racona uses four types of toast messages:

### 1. Success - Green

**When does it appear?**

- Successful save
- Successful creation
- Successful deletion
- Successful update

**Examples**:

- "User successfully created"
- "Settings saved"
- "Notification deleted"
- "Profile updated"

**Visual indicator**: Green background, checkmark icon

### 2. Error - Red

**When does it appear?**

- Failed operation
- Network error
- Validation error
- Permission error

**Examples**:

- "Error occurred during save"
- "Failed to load data"
- "You don't have permission for this action"
- "Password is too short"

**Visual indicator**: Red background, X icon

### 3. Warning - Yellow/Orange

**When does it appear?**

- Important information
- Potential problem
- Warning about consequences

**Examples**:

- "Operation may take longer"
- "Some fields are not filled"
- "Session will expire soon"

**Visual indicator**: Yellow/orange background, warning icon

### 4. Information - Blue

**When does it appear?**

- General information
- Process status
- Informational messages

**Examples**:

- "Loading data in progress"
- "Link copied to clipboard"
- "Application opened"

**Visual indicator**: Blue background, information icon

## Using Toast Messages

### Automatic Appearance

Toast messages automatically appear when you perform an action:

1. Execute an action (e.g., press save button)
2. Toast message appears in the top right corner
3. Message automatically disappears after a few seconds

### Manual Close

If you want to dismiss the message faster:

1. Hover your mouse over the toast message
2. Click the X button in the top right corner
3. The message immediately disappears

### Multiple Toast Messages

If multiple actions occur in succession, multiple toast messages may appear simultaneously:

- Messages stack on top of each other
- The newest message appears at the top
- Each message disappears separately according to its own timing

## Tips and Tricks

- **Don't panic**: Toast messages automatically disappear, no need to close them
- **Read quickly**: Messages are visible for a short time, but usually enough time to read them
- **Color codes**: Background color immediately indicates message type
- **Multiple actions**: If you perform multiple actions quickly, wait for the previous toast message to disappear so they don't get mixed up

## Toast vs. Modal Window

**Toast message characteristics:**

- Provide quick feedback on already executed actions
- Automatically appear and disappear
- Don't require user interaction
- Don't block the workflow

**Modal window characteristics:**

- Request confirmation before executing action
- Indicate important decision points
- Display detailed information
- Require user response (confirmation or rejection)

## Related Topics

- [Modal Windows](../dialogs) - Confirmation windows before important actions
- [Data Tables](../data-tables) - Toast messages often appear after data table operations
- [Notifications Application](../../applications/notifications) - Managing system notifications
