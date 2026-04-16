<!--
  RaccoonScene.svelte — A GLB modell animációs logikája Threlte Canvas-on belül.
-->
<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import type { EmotionState } from '../types/index.js';

	interface Props {
		model: THREE.Group;
		emotionState: EmotionState;
		canvasWrapper?: HTMLDivElement;
		enableMouseTracking?: boolean;
		panelRef?: HTMLDivElement;
		headAnimationMode?: 'idle' | 'idle2' | 'typing' | 'breathing'; // Fej animáció mód
	}

	let {
		model,
		emotionState,
		canvasWrapper,
		enableMouseTracking = true,
		panelRef,
		headAnimationMode = 'idle'
	}: Props = $props();

	// Wrapper group referencia — ezen fut az animáció
	let groupRef: THREE.Group | undefined = $state();

	let lastEmotion: EmotionState = 'neutral';
	let animStartTime = 0;

	// Egér követés
	let targetRotX = 0;
	let targetRotY = 0;
	let currentMouseRotX = 0;
	let currentMouseRotY = 0;
	let isMouseOverPanel = false;

	let curRotX = 0,
		curRotY = 0,
		curRotZ = 0,
		curPosY = 0,
		curPosX = 0,
		curPosZ = 0,
		curScale = 1;
	let tgtRotX = 0,
		tgtRotY = 0,
		tgtRotZ = 0,
		tgtPosY = 0,
		tgtPosX = 0,
		tgtPosZ = 0,
		tgtScale = 1;

	// Gépelés/lélegzés animáció smooth átmenethez
	let currentTypingRotY = 0;
	let currentTypingRotX = 0;
	let breathingStartTime = 0; // Mikor kezdődött a breathing mode
	let lastHeadAnimationMode: 'idle' | 'idle2' | 'typing' | 'breathing' = 'idle'; // Előző mód követése

	function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * Math.min(t, 1);
	}

	// Egér mozgás követése
	function handleMouseMove(event: MouseEvent) {
		if (!enableMouseTracking) return;

		// A panel referenciát használjuk (ha van), különben a canvas wrappet
		const trackingElement = panelRef || canvasWrapper;
		if (!trackingElement) return;

		// Panel/Canvas pozíciója és mérete
		const rect = trackingElement.getBoundingClientRect();

		// Ellenőrizzük, hogy az egér a panel felett van-e
		const isOver =
			event.clientX >= rect.left &&
			event.clientX <= rect.right &&
			event.clientY >= rect.top &&
			event.clientY <= rect.bottom;

		isMouseOverPanel = isOver;

		if (!isOver) {
			// Ha az egér nincs a panel felett, lassan térjen vissza a semleges pozícióba
			// A targetRotX/Y értékek fokozatosan 0-ra állnak a useTask lerp-je miatt
			targetRotX = 0;
			targetRotY = 0;
			return;
		}

		// Canvas középpontja a képernyőn (a 3D modell pozíciója)
		const canvasRect = canvasWrapper?.getBoundingClientRect();
		if (!canvasRect) return;

		const canvasCenterX = canvasRect.left + canvasRect.width / 2;
		const canvasCenterY = canvasRect.top + canvasRect.height / 2;

		// Egér távolsága a canvas középpontjától pixelben
		const deltaX = event.clientX - canvasCenterX;
		const deltaY = event.clientY - canvasCenterY;

		// Normalizáljuk a canvas méretéhez képest
		const normalizedX = Math.max(-1.5, Math.min(1.5, deltaX / (canvasRect.width / 2)));
		const normalizedY = Math.max(-1.5, Math.min(1.5, deltaY / (canvasRect.height / 2)));

		// Korlátozzuk a rotációt
		targetRotY = normalizedX * 0.8; // Jobbra-balra
		targetRotX = normalizedY * 0.6 - 0.15; // Fel-le (kis offset hogy feljebb nézzen)
	}

	// Egér követés bekapcsolása
	$effect(() => {
		if (!enableMouseTracking) {
			// Ha ki van kapcsolva, nullázzuk a target értékeket
			targetRotX = 0;
			targetRotY = 0;
			return;
		}

		window.addEventListener('mousemove', handleMouseMove);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});

	function applyEmotionTarget(emotion: EmotionState) {
		animStartTime = performance.now();
		switch (emotion) {
			case 'happy':
				// Helyeslő bólogatás alaphelyzete (előre dől kicsit)
				tgtRotX = -0.2;
				tgtRotY = 0;
				tgtRotZ = 0;
				tgtPosY = 0;
				tgtPosX = 0;
				tgtPosZ = 0;
				tgtScale = 1.0;
				break;
			case 'confused':
				// Fejrázás alaphelyzete (semleges)
				tgtRotX = 0;
				tgtRotY = 0;
				tgtRotZ = 0;
				tgtPosY = 0;
				tgtPosX = 0;
				tgtPosZ = 0;
				tgtScale = 1.0;
				break;
			case 'thinking':
				// Oldalra billentett fej (elgondolkodik)
				tgtRotX = 0;
				tgtRotY = 0;
				tgtRotZ = 0.4;
				tgtPosY = 0;
				tgtPosX = 0;
				tgtPosZ = 0;
				tgtScale = 1.0;
				break;
			case 'surprised':
				// Hirtelen hátraugrás
				tgtRotX = 0.1;
				tgtRotY = 0;
				tgtRotZ = 0;
				tgtPosY = 0.1;
				tgtPosX = 0;
				tgtPosZ = -0.2;
				tgtScale = 1.05;
				break;
			default:
				// Neutral - alaphelyzet
				tgtRotX = 0;
				tgtRotY = 0;
				tgtRotZ = 0;
				tgtPosY = 0;
				tgtPosX = 0;
				tgtPosZ = 0;
				tgtScale = 1.0;
		}
	}

	useTask(() => {
		if (!groupRef) return;

		if (emotionState !== lastEmotion) {
			applyEmotionTarget(emotionState);
			lastEmotion = emotionState;
		}

		const now = performance.now();
		const elapsed = now - animStartTime;
		const t = Math.min(elapsed / 3000, 1); // 3000ms = 3 másodperc az átmenethez

		// Smooth lerp az alapértékekhez - nagyon lassú átmenet
		curRotX = lerp(curRotX, tgtRotX, 0.01);
		curRotY = lerp(curRotY, tgtRotY, 0.01);
		curRotZ = lerp(curRotZ, tgtRotZ, 0.01);
		curPosY = lerp(curPosY, tgtPosY, 0.01);
		curPosX = lerp(curPosX, tgtPosX, 0.01);
		curPosZ = lerp(curPosZ, tgtPosZ, 0.01);
		curScale = lerp(curScale, tgtScale, 0.01);

		const time = now * 0.001;
		// Extra animációs értékek - minden frame-ben újrainicializáljuk
		let extraRotX = 0;
		let extraRotY = 0;
		let extraRotZ = 0;
		let extraPosY = 0;
		let extraPosX = 0;
		let extraPosZ = 0;
		let extraScale = 1;

		// Animáció mód alapú target értékek
		let targetTypingRotY = 0;
		let targetTypingRotX = 0;

		// Breathing mode kezdési idő követése
		if (headAnimationMode === 'breathing') {
			// Ha most váltottunk breathing módba, nullázzuk az időt
			if (lastHeadAnimationMode !== 'breathing') {
				breathingStartTime = now;
			}
		} else {
			breathingStartTime = 0;
		}

		// Előző mód mentése
		lastHeadAnimationMode = headAnimationMode;

		switch (headAnimationMode) {
			case 'idle':
				// Nézelődős animáció - aktív, természetes mozgás
				// Semmi extra target, az idle animáció a switch-ben lesz
				break;

			case 'idle2':
				// Természetes várakozó animáció - breathing-ből indul
				// Semmi extra target, az idle2 animáció a switch-ben lesz
				break;

			case 'typing':
				// Gépelés közben: balra és lejjebb néz az input mezőre
				targetTypingRotY = -0.6;
				targetTypingRotX = 0.0; // -0.1-ről -0.2-re: jobban lefelé néz
				break;

			case 'breathing':
				// Semleges pozíció (0, 0) - visszatér középre
				// A lélegzés animáció a switch-ben lesz, de csak 0.5-1mp után
				targetTypingRotY = 0;
				targetTypingRotX = 0;
				break;
		}

		// Smooth lerp a target rotációhoz
		// FONTOS: typing módban gyorsabb lerp, hogy ne legyen animáció küldéskor
		const typingLerpSpeed = headAnimationMode === 'typing' ? 0.3 : 0.05;
		currentTypingRotY = lerp(currentTypingRotY, targetTypingRotY, typingLerpSpeed);
		currentTypingRotX = lerp(currentTypingRotX, targetTypingRotX, typingLerpSpeed);

		switch (lastEmotion) {
			case 'neutral':
				if (headAnimationMode === 'idle') {
					// Idle animáció: aktív nézelődés - semleges pozícióból (0,0) indul
					// Phase offset-tel indítjuk, hogy a hullámok 0 körül kezdjenek
					const slowWave1 = Math.sin(time * 0.5 + Math.PI / 2) * 0.3; // +PI/2 offset: 1-ről indul, 0 felé tart
					const slowWave2 = Math.sin(time * 0.6 + 1.5 + Math.PI / 2) * 0.2;
					const slowWave3 = Math.sin(time * 0.55 + 3 + Math.PI / 2) * 0.15;
					const slowWave4 = Math.sin(time * 0.4 + 2 + Math.PI / 2) * 0.1;

					// Y rotáció: jobbra-balra, kis negatív offset (-0.02) hogy kicsit balrább nézzen
					extraRotY = slowWave1 + slowWave2 * 0.5 - 0.03;

					// X rotáció: fel-le, középpontja 0 (mint breathing)
					extraRotX = (slowWave3 + slowWave4) * 0.6;
					extraRotZ = 0; // Nincs Z rotáció idle módban

					// Finom lélegzés idle módban is
					extraScale = 1 + Math.sin(time * 1.5) * 0.005;
				} else if (headAnimationMode === 'idle2') {
					// Idle2 animáció: természetes várakozás - breathing-ből (0,0) indul
					// Lassú, finom lélegzés + látványosabb, természetes nézelődés

					// Lélegzés (mint breathing, de folyamatos)
					extraScale = 1 + Math.sin(time * 1.5) * 0.013; // 1.3% mint breathing

					// Lassú, természetes fejmozgás - mintha várakozna és nézelődne
					const verySlowWave1 = Math.sin(time * 0.25) * 0.18; // Látványosabb jobbra-balra
					const verySlowWave2 = Math.sin(time * 0.2 + 2) * 0.12; // Látványosabb fel-le
					const verySlowWave3 = Math.sin(time * 0.3 + 1) * 0.14; // Harmadik dimenzió

					// Y rotáció: látványosabb jobbra-balra lengés
					extraRotY = verySlowWave1 + verySlowWave3 * 0.5;

					// X rotáció: látványosabb fel-le mozgás, 0 körül
					extraRotX = verySlowWave2 * 0.8;

					// Z rotáció: időnként egy kis fej billentés
					const thinkCycle = Math.sin(time * 0.08) * 0.5 + 0.5; // 0..1
					if (thinkCycle > 0.8) {
						const thinkAmount = (thinkCycle - 0.8) / 0.2;
						extraRotZ = Math.sin(thinkAmount * Math.PI) * 0.15;
					} else {
						extraRotZ = 0;
					}
				} else if (headAnimationMode === 'typing') {
					// Gépelés közben: csak finom lélegzés, SEMMI más mozgás
					extraRotX = 0;
					extraRotY = 0;
					extraRotZ = 0;
					extraScale = 1 + Math.sin(time * 1.5) * 0.005;
				} else if (headAnimationMode === 'breathing') {
					// Breathing mode: 0.7mp várakozás után kezdődik a lélegzés
					const breathingElapsed = now - breathingStartTime;
					const breathingDelay = 700; // 0.7 másodperc várakozás

					if (breathingElapsed > breathingDelay) {
						// Lélegzés animáció: scale + nagyon minimális jobbra-balra mozgás
						const breathingTime = (breathingElapsed - breathingDelay) * 0.001;
						extraScale = 1 + Math.sin(breathingTime * 1.5) * 0.013; // 1.3%

						// Nagyon finom jobbra-balra mozgás (gyorsabb frekvencia: 0.4)
						extraRotY = Math.sin(breathingTime * 0.4) * 0.05;
						extraRotX = 0;
						extraRotZ = 0;
					} else {
						// Várakozás közben semmi animáció
						extraScale = 1;
						extraRotX = 0;
						extraRotY = 0;
						extraRotZ = 0;
					}
				}
				break;

			case 'happy':
				// Helyeslő bólogatás (fel-le)
				const nodSpeed = 2.5;
				extraRotX = Math.sin(time * nodSpeed) * 0.3;
				extraPosY = Math.sin(time * nodSpeed) * 0.05;
				break;

			case 'confused':
				// Tagadó fejrázás (jobbra-balra)
				const shakeSpeed = 3;
				extraRotY = Math.sin(time * shakeSpeed) * 0.4;
				break;

			case 'thinking':
				// Oldalra billentett fej + finom pulzálás
				extraRotZ = 0.4 + Math.sin(time * 0.8) * 0.1;
				extraPosY = Math.sin(time * 1.0) * 0.02;
				break;

			case 'surprised':
				// Hirtelen hátraugrás után remegés
				if (t < 1) {
					extraPosZ = -0.15 * (1 - t);
					extraRotX = 0.15 * (1 - t);
				} else {
					const trembleSpeed = 12;
					extraRotX = Math.sin(time * trembleSpeed) * 0.02;
					extraRotY = Math.sin(time * trembleSpeed * 1.3) * 0.015;
				}
				break;
		}

		// Alkalmazzuk az összes transzformációt
		// Egér követés smooth lerp
		const mouseLerpSpeed = isMouseOverPanel ? 0.15 : 0.08;
		currentMouseRotX = lerp(currentMouseRotX, targetRotX, mouseLerpSpeed);
		currentMouseRotY = lerp(currentMouseRotY, targetRotY, mouseLerpSpeed);

		const mouseInfluence = 0.5;
		const smoothMouseRotX = currentMouseRotX * mouseInfluence;
		const smoothMouseRotY = currentMouseRotY * mouseInfluence;

		// Alkalmazzuk a gépelés rotációt (már lerp-elve van fentebb)
		groupRef.rotation.x = smoothMouseRotX + extraRotX + currentTypingRotX;
		groupRef.rotation.y = smoothMouseRotY + extraRotY + currentTypingRotY;
		groupRef.rotation.z = curRotZ + extraRotZ;
		groupRef.position.x = curPosX + extraPosX;
		groupRef.position.y = curPosY + extraPosY;
		groupRef.position.z = curPosZ + extraPosZ;

		// Scale egyszerűen
		groupRef.scale.setScalar(curScale * extraScale);
	});
</script>

<!-- Wrapper group az animációhoz, benne a modell fix Y rotációval -->
<T.Group bind:ref={groupRef}>
	<T is={model} rotation.y={-Math.PI / 2} />
</T.Group>
