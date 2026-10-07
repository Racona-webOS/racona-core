---
title: Users
description: Detailed usage of the Users application
sidebar:
  order: 3
---

The Users application allows you to manage user accounts, administration, and set various permissions in the Racona system.

## Basic Information

- **Category**: System
- **Multi-instance**: No
- **Permission**: By default administrator group and role (can be modified as desired)

## Access

This application is by default only accessible to users assigned to the administrator group and role. This setting can be modified as desired in the permission management system, so it can be assigned to other groups and roles as well.

## Users

In the Users menu item, you can manage user accounts registered in the system.

### Users List

The main screen shows a list of all registered users in table format. The list contains the following information:

- **Full name**: The user's full name
- **Email address**: The user's email address
- **Username**: Unique username (if set)
- **Email verified**: Indicates whether the email address has been verified
- **Registration date**: When the user registered
- **Status**: Active or inactive
- **Provider**: Login method (Email/password, Google, Facebook, GitHub...etc)

### Search and Filter

Quickly find the desired user:

- **Search**: Search by name or email address in the search field
- **Filter by status**: Filter the list to active or inactive users
- **Clear filters**: Reset all filters to default state

For more information on managing tables: [Using tables](/en/user/ui-components/data-tables/) _(TODO: This documentation has not been created yet)_

### User Details

Click the "Details" button at the end of the user's row to view and edit detailed information.

**Viewable information:**

- Personal data (name, email, username)
- Account type (Email/password or OAuth)
- Account status (active/inactive)
- Registration date
- Assigned groups
- Assigned roles

**Edit mode**: To edit data, click the "Edit" button on the bottom function bar. For more information on application structure: [Application structure](/en/user/applications/structure/) _(TODO: This documentation has not been created yet)_

### Managing Groups

On the user details page, you can view and manage the user's group memberships in edit mode:

- **View groups**: You can always see which groups the user belongs to
- **Add group** (in edit mode): Click the "Add" button, search for the group, and add it
- **Remove group** (in edit mode): Click the delete button next to the group to remove it

### Managing Roles

On the user details page, you can view and manage the user's roles in edit mode:

- **View roles**: You can always see which roles the user has
- **Add role** (in edit mode): Click the "Add" button, search for the role, and assign it
- **Remove role** (in edit mode): Click the delete button next to the role to remove it

### Activate/Deactivate User

Temporarily disable or reactivate a user account:

1. Open the user details
2. Click the "Deactivate user" or "Activate user" button
3. Confirm the action in the dialog that appears

**Note**: Deactivated users cannot log into the system, but their data remains. After activation, they can log in again.

## Groups

In the Groups menu item, you can manage user groups.

### Groups List

The groups list displays all defined groups in table format:

- **Group name**: The name of the group
- **Description**: Brief description of the group
- **Creation date**: When the group was created

For more information on managing tables: [Using tables](/en/user/ui-components/data-tables/) _(TODO: This documentation has not been created yet)_

### Create New Group

To add a new group:

1. Click the "New group" button on the bottom function bar
2. Enter the group name (required)
3. Optionally provide a description
4. Click the "Create" button

The new group immediately appears in the list, and you can start assigning users, permissions, and applications.

### Group Details

Click the "Details" button at the end of the group's row to view detailed information.

**Viewable information:**

- Group name and description (editable in edit mode)
- Group members (list of users)
- Permissions assigned to the group
- Applications available to the group

**Edit mode**: To edit the group's basic data (name, description), click the "Edit" button on the bottom function bar. Managing users, permissions, and applications is accessible without edit mode.

### Managing Users in Group

On the group details page, you can manage the group's members:

- **Add user**: Click the "Add user" button on the bottom function bar, select a user from the dropdown list, and click the "Add" button
- **Remove user**: Click the "Remove from group" button next to the user in the table

In the users table, you can see all members of the group, including their name, email address, and other data.

### Managing Permissions in Group

On the group details page, you can manage permissions assigned to the group:

- **Add permission**: Click the "Add permission" button on the bottom function bar, select a permission from the dropdown list, and click the "Add" button
- **Remove permission**: Click the "Remove from group" button next to the permission in the table

In the permissions table, you can see all permissions assigned to the group, including their name, description, and the resource they apply to.

### Managing Applications in Group

On the group details page, you can manage applications available to the group:

- **Add application**: Click the "Add application" button on the bottom function bar, select an application from the dropdown list, and click the "Add" button
- **Remove application**: Click the "Remove from group" button next to the application in the table
- **Open application**: Click the 3 vertical dots icon at the end of the row, then select the "Open" option to launch the application

For more information on table action buttons: [Table actions](/en/user/ui-components/data-tables/#3-actions-column) _(TODO: This documentation has not been created yet)_

In the applications table, you can see all applications available to the group. Only applications that are assigned to their groups or roles appear in the Start Panel for group members.

**Important**: Application access is based on the combination of groups and roles. A user can access an application if at least one of their groups or roles has access.

## Roles

In the Roles menu item, you can manage user roles.

### Roles List

The roles list displays all defined roles in table format:

- **Role name**: The name of the role
- **Description**: Brief description of the role
- **Creation date**: When the role was created

For more information on managing tables: [Using tables](/en/user/ui-components/data-tables/) _(TODO: This documentation has not been created yet)_

### Create New Role

To add a new role:

1. Click the "New role" button on the bottom function bar
2. Enter the role name (required)
3. Optionally provide a description
4. Click the "Create" button

The new role immediately appears in the list, and you can start assigning permissions, users, and applications.

### Role Details

Click the "Details" button at the end of the role's row to view detailed information.

**Viewable information:**

- Role name and description (editable in edit mode)
- Permissions assigned to the role
- Users with the role (members)
- Applications available to the role

**Edit mode**: To edit the role's basic data (name, description), click the "Edit" button on the bottom function bar. Managing permissions, users, and applications is accessible without edit mode.

### Managing Permissions in Role

On the role details page, you can manage permissions assigned to the role:

- **Add permission**: Click the "Add permission" button on the bottom function bar, select a permission from the dropdown list, and click the "Add" button
- **Remove permission**: Click the "Remove from role" button next to the permission in the table

In the permissions table, you can see all permissions assigned to the role, including their name, description, and the resource they apply to.

### Managing Users in Role

On the role details page, you can manage users with the role:

- **Add user**: Click the "Add user" button on the bottom function bar, select a user from the dropdown list, and click the "Add" button
- **Remove user**: Click the "Remove from role" button next to the user in the table

In the users table, you can see all users with the role, including their name, email address, and other data.

### Managing Applications in Role

On the role details page, you can manage applications available to the role:

- **Add application**: Click the "Add application" button on the bottom function bar, select an application from the dropdown list, and click the "Add" button
- **Remove application**: Click the "Remove from role" button next to the application in the table
- **Open application**: Click the 3 vertical dots icon at the end of the row, then select the "Open" option to launch the application

For more information on table action buttons: [Table actions](/en/user/ui-components/data-tables/#3-actions-column) _(TODO: This documentation has not been created yet)_

In the applications table, you can see all applications available to the role. Only applications that are assigned to their groups or roles appear in the Start Panel for users with the role.

**Important**: Application access is based on the combination of groups and roles. A user can access an application if at least one of their groups or roles has access.

## Permission Management System

Racona uses a flexible permission management system that operates on three levels:

### Groups

- Logical grouping of users (e.g., Administrators, Editors, Readers)
- A user can belong to multiple groups
- Permissions can be assigned to groups

### Roles

- Defining functional roles (e.g., System Administrator, Content Manager)
- A user can have multiple roles
- Permissions can be assigned to roles

### Permissions

- Authorizing specific actions (e.g., view users, manage applications)
- Permissions can be assigned to groups and roles
- A user's permissions are the sum of their groups' and roles' permissions

**Example**: A user is in the "Administrators" group and has the "System Administrator" role. Both have different permissions, and the user has permissions from both sources.

## Security Considerations

- Only give administrator permission to trusted individuals
- Regularly check inactive accounts
- Use groups and roles to manage permissions efficiently
- Monitor user activity in the log application
- Deactivate unused user accounts instead of deleting them

## Tips and Tricks

- **Quick search**: Use the search field for quick filtering by name or email
- **Bulk management**: Using groups and roles, you can manage multiple users' permissions at once
- **Transparency**: On the user details page, you can see all groups and roles in one place
- **Security**: Instead of deactivation, remove the user from critical groups and roles

## Frequently Asked Questions

**Who can access the Users application?**
By default, only users assigned to the administrator group and role, but this can be modified as desired.

**What is the difference between a group and a role?**
Groups generally represent organizational units (e.g., departments), while roles represent functional responsibilities (e.g., editor, approver). Permissions can be assigned to both.

**Can I delete users?**
Currently, users can be deactivated, which prevents login but preserves data. The permanent deletion feature is under development.

**How do I add a new group or role?**
In the Groups or Roles menu item, click the "New group" or "New role" button on the bottom function bar. Enter the name (required) and optionally the description, then click the "Create" button. The new group or role immediately appears in the list.

## Related Topics

- [Settings](../settings) - Managing system settings
- [Log](../log) - Tracking system events and user activities
- [Applications overview](../) - Overview of Racona applications
