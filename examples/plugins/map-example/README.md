# Map Example Plugin

Example plugin demonstrating how to use `svelte-maplibre-gl` from ElyOS shared libraries.

## Features

- Uses `svelte-maplibre-gl` from shared libraries (not bundled)
- Shows a map centered on Budapest, Hungary
- Includes a marker on the map
- Demonstrates proper fallback handling

## Usage in Plugin

```svelte
<script lang="ts">
	const sdk = window.webOS;
	const maplibre = sdk?.libs.maplibre;

	// Extract MapLibre components
	const { MapLibre, Marker } = maplibre || {};
</script>

{#if MapLibre}
	<MapLibre
		zoom={12}
		center={[19.0402, 47.4979]}
		class="h-[600px]"
		style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
	>
		{#if Marker}
			<Marker lnglat={[19.0402, 47.4979]} />
		{/if}
	</MapLibre>
{:else}
	<div class="flex h-[600px] items-center justify-center bg-gray-200">
		<p>Map library not available</p>
	</div>
{/if}
```

## Vite Configuration

The `svelte-maplibre-gl` library is marked as external in `vite.config.ts`:

```typescript
export default defineConfig({
	build: {
		rollupOptions: {
			external: ['svelte-maplibre-gl'],
			output: {
				globals: {
					'svelte-maplibre-gl': 'window.webOS.libs.maplibre'
				}
			}
		}
	}
});
```

## Benefits

- **~2MB smaller bundle** — MapLibre GL JS is not bundled
- **Faster loading** — Library already loaded in ElyOS core
- **Version consistency** — All plugins use the same MapLibre version

## Development

For standalone development, install `svelte-maplibre-gl` locally:

```bash
npm install -D svelte-maplibre-gl
```

Then provide it as a mock library:

```typescript
// src/main.ts
import { MockWebOSSDK } from '@elyos-dev/sdk/dev';
import * as svelteMaplibreGl from 'svelte-maplibre-gl';

if (!window.webOS) {
	MockWebOSSDK.initialize({
		libs: {
			mockLibraries: {
				'svelte-maplibre-gl': svelteMaplibreGl
			}
		}
	});
}
```
