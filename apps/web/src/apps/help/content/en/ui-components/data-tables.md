---
title: Data Tables
description: Using data tables (lists) in Racona
sidebar:
  order: 1
---

Data tables are one of the most commonly used components in Racona. They display structured data in tabular format with sorting, filtering, and pagination features.

## Where You'll Find Data Tables

Data tables appear in many applications:

- **Users application**: Lists of users, groups, roles, permissions
- **Notifications application**: List of notifications
- **Log application**: Error logs and system events list

## Data Table Structure

A data table consists of the following parts:

![Placeholder: Data table structure](../../../../../assets/ui/datatable-en.webp)
_Data table structure and elements_

### 1. Header

The header row at the top of the table contains column names. A sort icon often appears next to column names, indicating whether the column is sortable.

**Sorting**: Click a column name to sort:

- First click: Ascending order
- Second click: Descending order
- Third click: Clear sorting

### 2. Data Rows

Table rows contain the actual data. Each row represents one item (e.g., a user, a notification).

### 3. Actions Column

The actions column on the right side of the table contains actions for that row.

#### Single Action

If only one action is available, a simple button appears:

```
[ Open ]
```

#### Multiple Actions - Primary Button + Dropdown

If multiple actions are available, the most important (primary) action appears as a separate button, with other actions in a dropdown menu:

```
[ Open ] [⋮]
```

- **Primary button** (left): Most frequently used action (e.g., "Open", "Edit")
- **Dropdown button** (right, 3 vertical dots): Additional actions menu

**Usage**:

1. Click the primary button to execute the main action
2. Click the 3-dot button to display additional options
3. Select an action from the dropdown menu

**Example actions**:

- Open / Edit (primary)
- Activate / Deactivate
- Delete (usually marked in red)

### 4. Filters and Search

Many data tables have filtering options above the header:

- **Search field**: Text search through data
- **Filter buttons**: Predefined filters (e.g., "Active", "Inactive", "Critical")
- **Custom filters**: Application-specific filtering options

### 5. Column Visibility

The "Columns" button in the top right corner of the table allows customizing column visibility:

1. Click the "Columns" button (gear icon)
2. Check or uncheck columns
3. The table automatically updates

**Note**: Some columns (e.g., name, actions) cannot be hidden as they're essential for table usage.

### 6. Pagination

The pagination bar at the bottom of the table allows browsing large datasets:

- **Total row count**: Visible on the left showing total items
- **Rows per page**: Selectable (usually 10, 20, 50, 100)
- **Page numbers**: Clickable page numbers for quick navigation
- **Previous/Next buttons**: Step through pages

## Common Operations

### Opening an Item

1. Find the desired item in the table
2. Click the "Open" or "Edit" button in the actions column
3. Item details appear

### Deleting an Item

1. Find the item to delete
2. Click the 3-dot button in the actions column
3. Select the "Delete" option (usually marked in red)
4. Confirm deletion in the confirmation window

**Warning**: Deletion is usually permanent and cannot be undone!

### Sorting Data

1. Click the column name in the header
2. The table automatically sorts
3. Sort direction (ascending/descending) is indicated by an arrow icon in the header

### Filtering Data

1. Use the search field for text search
2. Click filter buttons to apply predefined filters
3. The table automatically updates based on filter criteria
4. Use the "Clear filters" button to restore the original state

## Tips and Tricks

- **Quick search**: Start typing in the search field - the table filters immediately
- **Combine multiple filters**: Use search and filter buttons together for more precise results
- **Customize columns**: Hide unused columns for a cleaner appearance
- **Increase page size**: If you want to see many items at once, increase rows per page

## Related Topics

- [Modal Windows](../dialogs) - Confirmation windows for delete operations
- [Toast Messages](../notifications) - Feedback on performed actions
