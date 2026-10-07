---
title: Plugin Manager Application
category: apps
tags: [plugin, application, installation, extension, store, upload, management, developer, manual]
aliases: [app manager, extension manager, plugin manager, application installer]
last_updated: 2025-01-20
---

# Plugin Manager Application

## Quick Summary
The Plugin Manager is the central application and extension management hub of the Racona system. Here you can install new applications, manage existing ones, and test local plugins in developer mode.

## Application Access
**Access Path:** Start Menu → Plugin Manager
**Icon:** Package
**Permissions:** Some functions require administrator rights

## Main Menu Structure

### 1. Available Apps (Store)
**Access Path:** Plugin Manager → Available Apps
**Status:** Under Development

#### Functions (planned)
- **Browse Applications**: Discover external applications
- **Easy Installation**: One-click installation process
- **Categories**: Organize applications by type
- **Search and Filter**: Quick application search

#### Current Status
- **"Coming Soon"** message
- **Alternative**: Use manual installation feature
- **Development Plan**: External application store implementation

### 2. Installed Apps
**Access Path:** Plugin Manager → Installed Apps

#### Application List
- **Columns**:
  - **Name**: Application display name
  - **Version**: Installed version number
  - **Author**: Application developer
  - **Status**: Active/Inactive
  - **Installed At**: Installation date and time

#### Filtering Options
- **Search**: Search by name
- **Status Filter**: Active/inactive applications
- **Reset Filters**: Clear all filters

#### Application Actions
- **View Details**: Complete application information
- **Uninstall**: Remove application from system

### 3. Manual Install
**Access Path:** Plugin Manager → Manual Install
**Permission:** `plugin.manual.install` permission required

#### Upload Process
1. **File Selection**: .raconapkg or .zip file
2. **Drag & Drop**: Drag file to upload area
3. **Browse**: Or click "Browse Files" button
4. **Validation**: Automatic file and content verification
5. **Installation**: Press "Upload App" button

#### Supported File Formats
- **.raconapkg**: Racona native package format
- **.zip**: Compressed application package
- **Size Limit**: Maximum set by administrator

#### Validation Checks
- **File Integrity**: ZIP structure verification
- **Manifest.json**: Required configuration file
- **Plugin ID Uniqueness**: Prevent duplication
- **Security Scan**: Search for dangerous code patterns
- **Dependencies**: Check allowed packages

### 4. Dev Plugins
**Access Path:** Plugin Manager → Dev Plugins
**Permission:** `plugin.manual.install` permission + developer mode
**Condition:** Only visible in developer mode

#### Development Plugin Loader
- **Purpose**: Test local development server
- **URL Input**: Development server address (e.g., http://localhost:5174)
- **Real-time Testing**: Immediate testing of code changes
- **Hot Reload**: Automatic refresh on code modifications

#### Usage Guide
1. **Plugin Build**: `npm run build` or similar
2. **Start Dev Server**: `npm run dev` or `yarn dev`
3. **Enter URL**: Input server address (e.g., localhost:5174)
4. **Load**: Press "Load" button
5. **Test**: Try plugin functions

#### Docker Environment
- **Host Mapping**: Use `host.docker.internal` instead of localhost
- **Port Forwarding**: Proper port configuration
- **Network Settings**: Consider Docker bridge network

## Application Details View

### Basic Information
- **Plugin ID**: Unique ID in system
- **Version**: Installed version number
- **Author**: Developer name/organization
- **Description**: Application functionality description
- **Category**: Application type/group
- **Minimum Racona Version**: Compatibility requirement

### System Information
- **Installation Date**: First installation time
- **Update Date**: Last modification time
- **Status**: Active or inactive
- **File Size**: Application package size

### Permissions
- **Used Permissions**: Permissions required by application
- **Permission Descriptions**: What each permission enables
- **Security Information**: Privacy implications

### Dependencies
- **External Packages**: Required third-party libraries
- **Version Requirements**: Minimum package versions
- **Compatibility**: System requirements

## Application Uninstallation

### Uninstallation Process
1. **Select Application**: From installed applications list
2. **Open Details**: Press "Details" button
3. **Uninstall Button**: "Uninstall App" option
4. **Confirmation**: Accept security question
5. **Execute Deletion**: Final removal

### Confirmation Dialog
- **Warning**: "This action cannot be undone"
- **Application Name**: Clear identification
- **Consequences**: Possible data loss
- **Buttons**: "Uninstall" or "Cancel"

## Troubleshooting

### Installation Errors

#### Invalid File Format
- **Cause**: Unsupported file type
- **Solution**: Only use .raconapkg or .zip files
- **Check**: File extension and MIME type

#### File Too Large
- **Cause**: Size limit exceeded
- **Solution**: Use smaller file or increase limit
- **Administrator**: Modify size limit setting

#### Missing manifest.json
- **Cause**: Required configuration file missing
- **Solution**: Add manifest file to package
- **Content**: Plugin metadata and settings

#### Duplicate Plugin ID
- **Cause**: Application with same ID already exists
- **Solution**: Modify plugin ID or remove existing
- **Uniqueness**: Every plugin must have unique identifier

#### Dangerous Code Pattern
- **Cause**: Security scan found problematic code
- **Solution**: Review and clean code
- **Examples**: eval(), innerHTML, external script loading

#### Invalid Dependency
- **Cause**: Use of prohibited external package
- **Solution**: Find allowed alternative
- **Whitelist**: Administrator-approved packages

### Developer Plugin Errors

#### Connection Error
- **Cause**: Development server not accessible
- **Check**: Is server running at specified address
- **Solution**: Restart server or fix URL

#### CORS Error
- **Cause**: Cross-Origin Resource Sharing blocking
- **Solution**: Enable CORS settings in dev server
- **Configuration**: Vite/Webpack CORS settings

#### Manifest Loading Error
- **Cause**: Incorrect or missing manifest.json
- **Solution**: Fix manifest file
- **Validation**: JSON syntax and required fields

## Security Considerations

### Application Installation
- **Trusted Sources Only**: Avoid unknown applications
- **Review Permissions**: What the application requests
- **Regular Updates**: Install security patches

### Developer Mode
- **Development Only**: Avoid in production systems
- **Local Network**: Use internal IP addresses only
- **Firewall Settings**: Restrict external access

### Privacy
- **Application Permissions**: What the application can access
- **Data Collection**: What information is stored
- **External Connections**: Monitor network communication

## Developer Information

### Plugin Package Structure
```
plugin.zip/
├── manifest.json          # Required metadata
├── index.html            # Main page (optional)
├── main.js              # Entry point
├── style.css            # Styles
├── assets/              # Static files
└── locales/             # Translations
```

### Manifest.json Example
```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "author": "Developer Name",
  "description": "Plugin description",
  "minRaconaVersion": "1.0.0",
  "permissions": ["storage", "notifications"],
  "dependencies": {
    "lodash": "^4.17.21"
  }
}
```

### Allowed Dependencies
- **Utility Libraries**: lodash, ramda, date-fns
- **UI Components**: Racona SDK components
- **Data Management**: Racona storage API
- **Prohibited**: eval, innerHTML, external script loading