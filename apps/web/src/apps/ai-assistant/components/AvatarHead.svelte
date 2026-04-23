<!--
  AvatarHead.svelte — Threlte alapú 3D animált avatar GLB modellből.

  Dinamikusan tölti be és animálja a kiválasztott avatar modellt érzelem-állapotok szerint.
  Requirements: 13.1, 13.2, 13.3, 13.6, 13.7, 13.8, 13.10, 13.11, 13.12
-->
<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import * as THREE from 'three';
	import type { AvatarRendererProps } from './AvatarRenderer.js';
	import AvatarScene from './AvatarScene.svelte';

	let {
		emotionState = 'neutral',
		theme = 'light',
		enableMouseTracking = true,
		panelRef,
		headAnimationMode = 'idle',
		filename = 'ai_head_01.glb',
		modelUrl
	}: AvatarRendererProps & { filename?: string } = $props();

	// Modell URL: ha modelUrl meg van adva, azt használjuk; különben az API endpoint-ot használjuk
	const resolvedModelUrl = $derived(modelUrl ?? `/api/ai-avatar/default/default_sd.glb`);

	// GLB modell állapot
	let gltfScene: THREE.Group | null = $state(null);
	let loadError = $state(false);
	let canvasWrapper: HTMLDivElement | undefined = $state();

	// Téma alapú világítás - megnövelt intenzitás a jobb láthatóságért
	const ambientIntensity = $derived(theme === 'dark' ? 1.5 : 2.0);
	const dirIntensity = $derived(theme === 'dark' ? 2.0 : 2.5);

	// GLB betöltése - reaktív effect, újratölt amikor a resolvedModelUrl változik
	$effect(() => {
		console.log('[AvatarHead] Model URL változott, betöltés:', resolvedModelUrl);
		async function load() {
			try {
				gltfScene = null; // Töröljük a régi modellt
				loadError = false;

				const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
				const loader = new GLTFLoader();
				const gltf = await loader.loadAsync(resolvedModelUrl);
				gltfScene = gltf.scene;

				console.log('[AvatarHead] Model betöltve:', resolvedModelUrl);

				// Ellenőrizzük, hogy vannak-e morph targets
				gltf.scene.traverse((child) => {
					if ((child as any).isMesh && (child as any).morphTargetInfluences) {
						console.log(
							'🎭 Morph targets found:',
							child.name,
							(child as any).morphTargetDictionary
						);
					}
				});
			} catch (e) {
				console.error('[AvatarHead] GLB load error:', e);
				loadError = true;
			}
		}
		load();
	});
</script>

<div
	bind:this={canvasWrapper}
	class="canvas-wrapper"
	aria-hidden="true"
	style="width: 240px; height: 240px;"
>
	<Canvas>
		<T.PerspectiveCamera makeDefault position={[0, 0, 1.2]} fov={55} />

		<T.AmbientLight intensity={ambientIntensity} />
		<T.DirectionalLight position={[3, 5, 4]} intensity={dirIntensity} />
		<T.DirectionalLight position={[-2, -1, 3]} intensity={dirIntensity * 0.5} />
		<!-- Hátsó világítás a sziluett kiemelésére -->
		<T.DirectionalLight position={[0, -2, -3]} intensity={dirIntensity * 0.4} />
		<!-- Hemisphere light természetesebb megvilágításhoz -->
		<T.HemisphereLight args={['#ffffff', '#444444', 1.0]} />

		{#if gltfScene}
			<AvatarScene
				model={gltfScene}
				{emotionState}
				{canvasWrapper}
				{enableMouseTracking}
				{panelRef}
				{headAnimationMode}
			/>
		{:else if loadError}
			<!-- Fallback gömb ha a GLB nem töltődik be -->
			<T.Mesh>
				<T.SphereGeometry args={[0.8, 32, 24]} />
				<T.MeshStandardMaterial color={theme === 'dark' ? '#a78bfa' : '#7c3aed'} roughness={0.4} />
			</T.Mesh>
		{/if}
	</Canvas>
</div>

<style>
	.canvas-wrapper {
		border-radius: 0.5rem;
		width: 100%;
		height: 100%;
		min-height: 112px;
		overflow: hidden;
	}

	.canvas-wrapper :global(canvas) {
		display: block;
		width: 100% !important;
		height: 100% !important;
	}
</style>
