---
title: Map
description: Detailed usage of the Map application
sidebar:
  order: 6
---

The Map application is an interactive map viewer and route planner based on OpenStreetMap data.

## Basic Information

- **Category**: Utilities
- **Multi-Instance**: Yes
- **Permission**: Public (all users)

## Interface Overview

The Map application consists of two main parts:

- **Left panel**: Search and route planning tools
- **Right area**: Interactive map

The left panel is divided into two tabs: **Search** and **Route**.

## Search Tab

The Search tab allows you to search for places, cities, streets, and other points on the map.

### Searching for a Place

1. Click the **Search** tab
2. Type the place you're looking for in the input field (e.g., "Parliament, Budapest")
3. Press Enter or click the magnifier icon
4. Results appear in a list
5. Click a result to jump to it on the map, marked with a purple marker

### Clearing a Result

To clear the selected place, click the **Clear** button below the result.

## Route Tab

The Route tab allows you to plan a route between two points using different travel modes.

### Planning a Route

1. Click the **Route** tab
2. Enter the **From** location (e.g., "Budapest, Keleti")
3. Enter the **To** location (e.g., "Debrecen, Main Station")
4. Select the **Travel mode**
5. Click the **Plan route** button
6. The route appears as a blue line on the map, with A and B markers at the endpoints

The map automatically zooms to fit the route so both endpoints are visible.

### Using Current Location as Starting Point

The crosshair icon next to the From field lets you automatically set your current location as the starting point:

1. Click the crosshair icon next to the From field
2. The browser will request location permission – allow it
3. Your current location coordinates and name are automatically filled into the From field

### Travel Modes

Choose from three travel modes:

| Mode | Description |
|------|-------------|
| **Car** | Vehicle route, respects roads and traffic rules |
| **Walking** | Pedestrian route, using footpaths and sidewalks |
| **Bicycle** | Cycling route, using bike paths and suitable roads |

### Route Options

Click the **Options** button to access additional route planning settings:

- **Avoid toll roads** – Car mode: avoids toll roads and motorway vignette sections *(car mode only)*
- **Avoid highways** – Car mode: avoids motorways and expressways *(car mode only)*
- **Avoid ferries** – All modes: avoids ferry connections

### Route Result

After successful planning, the application displays:

- **Distance**: Total route length in kilometers
- **Duration**: Estimated travel time

### Clearing the Route

To clear the route and markers, click the **Clear** button.

## Map Controls

Controls on the right side of the map:

- **+ / –**: Zoom in and out
- **Compass**: Rotates the map to face north
- **Crosshair icon**: Show current location on the map (GeoLocate)
- **Scale bar**: Visible in the bottom right corner of the map

You can also navigate the map with the mouse: drag to pan, scroll to zoom in/out.

## Tab Switching

When switching between the Search and Route tabs, the previous tab's state is automatically cleared – markers and routes disappear from the map.

## Data Sources

The Map application uses open-source data and services:

- **Map data**: [OpenStreetMap](https://www.openstreetmap.org) contributors
- **Map style**: CARTO Voyager
- **Geocoding** (place search): Nominatim / OpenStreetMap
- **Route planning**: Valhalla / OpenStreetMap.de

## Related Topics

- [Notifications](/en/user/applications/notifications/) – Managing system notifications
- [Settings](/en/user/applications/settings/) – Customizing system settings
