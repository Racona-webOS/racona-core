<script lang="ts">
	const sdk = window.webOS;
	const maplibre = sdk?.libs.maplibre;

	// Extract MapLibre components from shared library
	const { MapLibre, Marker } = maplibre || {};

	// Budapest coordinates
	const center: [number, number] = [19.0402, 47.4979];
</script>

<div class="map-container">
	<h1 class="mb-4 text-2xl font-bold">
		{sdk?.i18n.t('title') ?? 'Map Example'}
	</h1>

	{#if MapLibre}
		<MapLibre
			zoom={12}
			{center}
			class="h-[600px] rounded-lg border border-gray-300"
			style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
		>
			{#if Marker}
				<Marker lnglat={center}>
					<div class="marker-popup">
						<p class="font-semibold">Budapest</p>
						<p class="text-sm text-gray-600">Hungary</p>
					</div>
				</Marker>
			{/if}
		</MapLibre>

		<div class="mt-4 rounded border border-green-200 bg-green-50 p-4">
			<p class="text-sm text-green-800">✅ MapLibre GL loaded from ElyOS shared libraries</p>
			<p class="mt-1 text-xs text-green-600">Bundle size saved: ~2MB</p>
		</div>
	{:else}
		<div
			class="flex h-[600px] items-center justify-center rounded-lg border border-gray-300 bg-gray-100"
		>
			<div class="text-center">
				<p class="mb-2 text-gray-600">Map library not available</p>
				<p class="text-sm text-gray-500">svelte-maplibre-gl is not loaded in shared libraries</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.map-container {
		margin: 0 auto;
		padding: 1rem;
		max-width: 1200px;
	}

	.marker-popup {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border-radius: 0.25rem;
		background: white;
		padding: 0.5rem;
	}
</style>
