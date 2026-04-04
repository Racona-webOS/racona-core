<!--
 Ablak komponens.
 Ez a komponens felel az egyes ablakok felépítésért, műveletekért.
 -->
<script lang="ts">
	import { getAppByName } from '$lib/services/client/appRegistry';
	import { setContext, getContext } from 'svelte';
	import { type AppContext, APP_CONTEXT_KEY } from '$lib/services/client/appContext';
	import { getWindowManager, type WindowState, RESTORE_SIZE_THRESHOLD } from '$lib/stores';
	import WindowControlButton from './WindowControlButton.svelte';
	import LZString from 'lz-string';
	import { toast } from 'svelte-sonner';
	import { takeWindowScreenshot } from '$lib/services/client/screenshot';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	let { windowState }: { windowState: WindowState } = $props();
	const windowManager = getWindowManager();

	// Settings elérése a kontextusból
	const settings = getContext<{
		windowPreview: boolean;
		screenshotThumbnailHeight: number;
		preferPerformance: boolean;
	}>('settings');

	// App kontextus beállítás a gyerek komponensekhez.
	// Context values should be stable, but we can use a getter pattern
	const appContext: AppContext = {
		get parameters() {
			return windowState.parameters || {};
		},
		get windowId() {
			return windowState.id;
		}
	};
	setContext(APP_CONTEXT_KEY, appContext);

	// Minimum és maximum ablak méretek - use $derived for proper reactivity
	const MIN_WINDOW_WIDTH = $derived(windowState.minSize.width);
	const MIN_WINDOW_HEIGHT = $derived(windowState.minSize.height);
	const MAX_WINDOW_WIDTH = $derived(windowState.maxSize.width);
	const MAX_WINDOW_HEIGHT = $derived(windowState.maxSize.height);
	const WORKSPACE_PADDING = 0;
	const SCREENSHOT_THUMBNAIL_HEIGHT = $derived(settings.screenshotThumbnailHeight); // Screenshot thumbnail fix magassága pixelben

	// Teljesítmény vs Vizuális élmény - reaktív érték
	let preferPerformance = $derived(settings.preferPerformance);

	let dragStartX = 0;
	let dragStartY = 0;
	let mouseStartX = 0; // Kezdő egér pozíció X
	let mouseStartY = 0; // Kezdő egér pozíció Y
	let isDragging = $state(false);
	let isVisuallyDragging = $state(false); // Vizuális effekt csak mozgatás után
	const DRAG_THRESHOLD = 5; // pixel - ennyi mozgás után aktiválódik a vizuális effekt

	// Window Shake funkció (rázás detektálása)
	let shakeDetectionActive = false;
	let shakeDirectionChanges = 0;
	let lastShakeDirection = 0; // -1: balra, 1: jobbra, 0: nincs
	let lastShakeX = 0;
	let shakeStartTime = 0; // Rázás kezdési időpont
	const SHAKE_THRESHOLD = 20; // pixel - ennyi mozgás szükséges irányváltáshoz
	const SHAKE_COUNT = 3; // hány irányváltás kell a rázáshoz
	const SHAKE_TIME_LIMIT = 1000; // milliszekundum - ennyi időn belül kell elvégezni a rázást

	let isResizing = $state(false);
	let resizeDirection = '';
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeStartWidth = 0;
	let resizeStartHeight = 0;
	let resizeStartLeft = 0;
	let resizeStartTop = 0;

	let windowElement: HTMLDivElement | null = $state(null);
	let lastActiveState = false;

	// Screenshot készítés amikor ablak inaktívvá válik
	$effect(() => {
		const currentActive = windowState.isActive;
		const wasActive = lastActiveState;
		lastActiveState = currentActive;

		// Ellenőrizzük, hogy aktívból inaktívvá vált-e
		if (
			wasActive &&
			!currentActive &&
			!windowState.isMinimized &&
			settings.windowPreview &&
			!settings.preferPerformance
		) {
			console.log('Window became inactive, scheduling screenshot for:', windowState.id);
			const timeout = setTimeout(() => {
				if (!windowState.isActive) {
					// Screenshot készítés (felülírja a régit ha van)
					takeScreenshot();
					console.log('Screenshot taken for window:', windowState.id);
				}
			}, 3000);

			return () => {
				console.log('Cleanup timeout for:', windowState.id);
				clearTimeout(timeout);
			};
		}

		// Cleanup függvény - frissítjük a lastActiveState-et
		return () => {
			lastActiveState = currentActive;
		};
	});

	/**
	 * Ablak mozgatás kezelése (gomb lenyomás)
	 * @param e Egér esemény
	 */
	function handleMouseDown(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.window-controls')) return;

		e.preventDefault();
		windowManager.activateWindow(windowState.id);
		isDragging = true;
		dragStartX = e.clientX - windowState.position.x;
		dragStartY = e.clientY - windowState.position.y;
		mouseStartX = e.clientX;
		mouseStartY = e.clientY;

		// Shake detektálás inicializálása
		shakeDetectionActive = true;
		shakeDirectionChanges = 0;
		lastShakeDirection = 0;
		lastShakeX = e.clientX;
		shakeStartTime = Date.now();

		// Szövegkijeölés tiltása mozgatás közben
		document.body.style.userSelect = 'none';

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	/**
	 * Ablak mozgás kezelése (mozgatás)
	 * @param e Egér esemény
	 */
	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || windowState.isMaximized) return;

		// Ellenőrizzük, hogy elértük-e a küszöbértéket a vizuális effekthez
		if (!isVisuallyDragging) {
			const deltaX = Math.abs(e.clientX - mouseStartX);
			const deltaY = Math.abs(e.clientY - mouseStartY);
			if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
				isVisuallyDragging = true;
			}
		}

		// Shake detektálás (rázás)
		if (shakeDetectionActive) {
			const currentTime = Date.now();
			const elapsedTime = currentTime - shakeStartTime;

			// Ellenőrizzük, hogy nem túlléptük-e az időkorlátot
			if (elapsedTime > SHAKE_TIME_LIMIT) {
				// Túl lassú volt, újraindítjuk a detektálást
				shakeDirectionChanges = 0;
				lastShakeDirection = 0;
				shakeStartTime = currentTime;
				lastShakeX = e.clientX;
			} else {
				const deltaX = e.clientX - lastShakeX;

				if (Math.abs(deltaX) > SHAKE_THRESHOLD) {
					const currentDirection = deltaX > 0 ? 1 : -1;

					if (lastShakeDirection !== 0 && currentDirection !== lastShakeDirection) {
						shakeDirectionChanges++;

						if (shakeDirectionChanges >= SHAKE_COUNT) {
							// Rázás detektálva! Minimalizáljuk a többi ablakot
							windowManager.windows.forEach((w) => {
								if (w.id !== windowState.id && !w.isMinimized) {
									windowManager.minimizeWindow(w.id);
								}
							});
							shakeDetectionActive = false; // Csak egyszer hajtsa végre
						}
					}

					lastShakeDirection = currentDirection;
					lastShakeX = e.clientX;
				}
			}
		}

		// Workspace méretek
		const workspace = document.getElementById('workspace');
		if (!workspace) return;

		const workspaceRect = workspace.getBoundingClientRect();
		const workspaceWidth = workspaceRect.width;
		const workspaceHeight = workspaceRect.height;

		// Új pozíció számítása
		let newX = e.clientX - dragStartX;
		let newY = e.clientY - dragStartY;

		// Korlátozás a workspace határain belülre (padding figyelembevételével)
		newX = Math.max(
			WORKSPACE_PADDING,
			Math.min(newX, workspaceWidth - windowState.size.width - WORKSPACE_PADDING)
		);
		newY = Math.max(
			WORKSPACE_PADDING,
			Math.min(newY, workspaceHeight - windowState.size.height - WORKSPACE_PADDING)
		);

		windowManager.updatePosition(windowState.id, {
			x: newX,
			y: newY
		});
	}

	/**
	 * Ablak mozgás befejezése (gomb elengedés)
	 */
	function handleMouseUp() {
		isDragging = false;
		isVisuallyDragging = false;
		shakeDetectionActive = false;

		// Visszaállítjuk a szövegkijelölést
		document.body.style.userSelect = '';

		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}

	/**
	 * Dupla klikkelés az ablak fejlécén
	 * @param e
	 */
	function handleDoubleClick(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.window-controls')) return;
		if (!windowState.maximizable) return;
		maximize();
	}

	/**
	 * Ablak bezárás gomb esemény
	 */
	function close() {
		windowManager.closeWindow(windowState.id);
	}

	/**
	 * Ablak lekicsinyítés gomb esemény
	 */
	async function minimize() {
		await windowManager.minimizeWindow(windowState.id, async () => {
			if (settings.windowPreview && !settings.preferPerformance) {
				await takeScreenshot();
			}
		});
	}

	/**
	 * Ablak maximalizálás esemény
	 */
	function maximize() {
		windowManager.maximizeWindow(windowState.id);
	}

	/**
	 * Súgó gomb esemény
	 * @param helpId Súgó azonosító
	 */
	async function help(helpId: number | undefined) {
		/*const helpApp = {
			title: 'Súgó',
			appName: 'help',
			icon: 'icon.svg',
			minSize: { width: 300, height: 300 },
			defaultSize: { width: 500, height: 500, maximized: false },
			allowMultiple: true
		};*/
		const helpApp = await getAppByName('help');
		if (helpApp) {
			windowManager.openWindow(helpApp.appName, helpApp.title, helpApp, {
				helpId
			});
		}
	}

	async function link(): Promise<boolean | string> {
		const linkData = {
			appName: windowState.appName,
			parameters: $state.snapshot(windowState.parameters)
		};
		const jsonString = JSON.stringify(linkData);
		const compressed = LZString.compressToEncodedURIComponent(jsonString);
		try {
			await navigator.clipboard.writeText(compressed);
			toast.success(t('desktop.window.guidCopySuccess'));
			return true;
		} catch (err) {
			toast.error(t('desktop.window.guidCopyError'));
			return false;
		}
		return compressed;
	}

	/**
	 * Ablak méretezés kezdet
	 * @param e Egér esemény
	 * @param direction Méretezés irány
	 */
	function handleResizeStart(e: MouseEvent, direction: string) {
		if (windowState.isMaximized || isResizing) return;

		e.preventDefault();
		e.stopPropagation();
		windowManager.activateWindow(windowState.id);

		isResizing = true;
		resizeDirection = direction;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizeStartWidth = windowState.size.width;
		resizeStartHeight = windowState.size.height;
		resizeStartLeft = windowState.position.x;
		resizeStartTop = windowState.position.y;

		// Letiltjuk a szövegkijelölést méretezés közben
		document.body.style.userSelect = 'none';
		// Letiltjuk a kurzor változását méretezés közben
		document.body.style.cursor = getCursorForDirection(direction);

		document.addEventListener('mousemove', handleResizeMove);
		document.addEventListener('mouseup', handleResizeEnd);
	}

	/**
	 * Kurzor változása méretezés során
	 * @param direction Méretezés irány
	 */
	function getCursorForDirection(direction: string): string {
		if (direction === 'n' || direction === 's') return 'ns-resize';
		if (direction === 'e' || direction === 'w') return 'ew-resize';
		if (direction === 'ne' || direction === 'sw') return 'nesw-resize';
		if (direction === 'nw' || direction === 'se') return 'nwse-resize';
		return 'default';
	}

	/**
	 * Ablak méretezés folyamatban
	 * @param e Egér esemény
	 */
	function handleResizeMove(e: MouseEvent) {
		if (!isResizing) return;

		const deltaX = e.clientX - resizeStartX;
		const deltaY = e.clientY - resizeStartY;

		let newWidth = resizeStartWidth;
		let newHeight = resizeStartHeight;
		let newLeft = resizeStartLeft;
		let newTop = resizeStartTop;

		// Workspace méretek (a taskbar nélküli terület)
		const workspace = document.getElementById('workspace');
		if (!workspace) return;

		const workspaceRect = workspace.getBoundingClientRect();
		const workspaceWidth = workspaceRect.width;
		const workspaceHeight = workspaceRect.height;

		// Vízszintes méretezés
		if (resizeDirection.includes('e')) {
			// Jobb oldal: ne menjen túl a workspace jobb szélén és a max méreten (padding figyelembevételével)
			const maxWidth = Math.min(
				workspaceWidth - resizeStartLeft - WORKSPACE_PADDING,
				MAX_WINDOW_WIDTH
			);
			newWidth = Math.max(MIN_WINDOW_WIDTH, Math.min(maxWidth, resizeStartWidth + deltaX));
		} else if (resizeDirection.includes('w')) {
			// Bal oldal: ne menjen túl a workspace bal szélén és a max méreten (padding figyelembevételével)
			const potentialWidth = resizeStartWidth - deltaX;
			const potentialLeft = resizeStartLeft + deltaX;

			if (potentialLeft < WORKSPACE_PADDING) {
				// Ha túlmenne a bal szélen, állítsuk be a maximális méretet (de max méret alatt)
				newWidth = Math.min(
					resizeStartLeft + resizeStartWidth - WORKSPACE_PADDING,
					MAX_WINDOW_WIDTH
				);
				newLeft = WORKSPACE_PADDING;
			} else if (potentialWidth >= MIN_WINDOW_WIDTH && potentialWidth <= MAX_WINDOW_WIDTH) {
				// Normál méretezés, ha a minimum és maximum méret között vagyunk
				newWidth = potentialWidth;
				newLeft = potentialLeft;
			} else if (potentialWidth > MAX_WINDOW_WIDTH) {
				// Ha túllépnénk a maximum méretet, rögzítsük azt
				newWidth = MAX_WINDOW_WIDTH;
				newLeft = resizeStartLeft + resizeStartWidth - MAX_WINDOW_WIDTH;
			} else {
				// Ha elérnénk a minimum méretet, rögzítsük azt és a pozíciót
				newWidth = MIN_WINDOW_WIDTH;
				newLeft = resizeStartLeft + resizeStartWidth - MIN_WINDOW_WIDTH;
			}
		}

		// Függőleges méretezés
		if (resizeDirection.includes('s')) {
			// Alsó oldal: ne menjen túl a workspace alján és a max méreten (padding figyelembevételével)
			const maxHeight = Math.min(
				workspaceHeight - resizeStartTop - WORKSPACE_PADDING,
				MAX_WINDOW_HEIGHT
			);
			newHeight = Math.max(MIN_WINDOW_HEIGHT, Math.min(maxHeight, resizeStartHeight + deltaY));
		} else if (resizeDirection.includes('n')) {
			// Felső oldal: ne menjen túl a workspace tetején és a max méreten (padding figyelembevételével)
			const potentialHeight = resizeStartHeight - deltaY;
			const potentialTop = resizeStartTop + deltaY;

			if (potentialTop < WORKSPACE_PADDING) {
				// Ha túlmenne a felső szélen, állítsuk be a maximális méretet (de max méret alatt)
				newHeight = Math.min(
					resizeStartTop + resizeStartHeight - WORKSPACE_PADDING,
					MAX_WINDOW_HEIGHT
				);
				newTop = WORKSPACE_PADDING;
			} else if (potentialHeight >= MIN_WINDOW_HEIGHT && potentialHeight <= MAX_WINDOW_HEIGHT) {
				// Normál méretezés, ha a minimum és maximum méret között vagyunk
				newHeight = potentialHeight;
				newTop = potentialTop;
			} else if (potentialHeight > MAX_WINDOW_HEIGHT) {
				// Ha túllépnénk a maximum méretet, rögzítsük azt
				newHeight = MAX_WINDOW_HEIGHT;
				newTop = resizeStartTop + resizeStartHeight - MAX_WINDOW_HEIGHT;
			} else {
				// Ha elérnénk a minimum méretet, rögzítsük azt és a pozíciót
				newHeight = MIN_WINDOW_HEIGHT;
				newTop = resizeStartTop + resizeStartHeight - MIN_WINDOW_HEIGHT;
			}
		}

		windowManager.updateSize(windowState.id, { width: newWidth, height: newHeight });
		windowManager.updatePosition(windowState.id, { x: newLeft, y: newTop });
	}

	/**
	 * Maximális elérhető méret ellenőrzése
	 * Ha automatikus/manuális méretezés során elérte az ablak a maximalizált állapotot, akkor az állapotát is átállítjuk.
	 */
	function checkIfMaximized() {
		// Workspace méretek
		const workspace = document.getElementById('workspace');
		if (!workspace) return false;

		const workspaceRect = workspace.getBoundingClientRect();
		const workspaceWidth = workspaceRect.width;
		const workspaceHeight = workspaceRect.height;

		// Ellenőrizzük, hogy az ablak mérete eléri-e a RESTORE_SIZE_THRESHOLD küszöböt
		const widthRatio = windowState.size.width / workspaceWidth;
		const heightRatio = windowState.size.height / workspaceHeight;

		return widthRatio >= RESTORE_SIZE_THRESHOLD && heightRatio >= RESTORE_SIZE_THRESHOLD;
	}

	/**
	 * Ablak méretezés befejezése
	 */
	function handleResizeEnd() {
		isResizing = false;
		resizeDirection = '';

		// Visszaállítjuk a szövegkijelölést és a kurzort
		document.body.style.userSelect = '';
		document.body.style.cursor = '';

		document.removeEventListener('mousemove', handleResizeMove);
		document.removeEventListener('mouseup', handleResizeEnd);

		// Ellenőrizzük, hogy elérte-e a maximális méretet
		if (!windowState.isMaximized && checkIfMaximized()) {
			windowManager.maximizeWindow(windowState.id);
		}
	}

	/**
	 * Ablak éleken dupla kattintás
	 * @param e Egér esemény
	 * @param direction Éle irány
	 */
	function handleEdgeDoubleClick(e: MouseEvent, direction: string) {
		if (windowState.isMaximized) return;

		e.preventDefault();
		e.stopPropagation();

		// Workspace méretek
		const workspace = document.getElementById('workspace');
		if (!workspace) return;

		const workspaceRect = workspace.getBoundingClientRect();
		const workspaceWidth = workspaceRect.width;
		const workspaceHeight = workspaceRect.height;

		let newWidth = windowState.size.width;
		let newHeight = windowState.size.height;
		let newLeft = windowState.position.x;
		let newTop = windowState.position.y;

		switch (direction) {
			case 'e': // Jobb él - nyújtás jobbra a workspace jobb széléig (max méret alatt)
				newWidth = Math.min(
					workspaceWidth - windowState.position.x - WORKSPACE_PADDING,
					MAX_WINDOW_WIDTH
				);
				break;
			case 'w': // Bal él - nyújtás balra a workspace bal széléig (max méret alatt)
				{
					const targetWidth = windowState.position.x + windowState.size.width - WORKSPACE_PADDING;
					newWidth = Math.min(targetWidth, MAX_WINDOW_WIDTH);
					// Pozíciót csak akkor változtatjuk, ha nem a max méret korlátozza
					if (newWidth === targetWidth) {
						newLeft = WORKSPACE_PADDING;
					} else {
						// Ha max méret korlátozza, számítsuk ki az új bal pozíciót
						newLeft = windowState.position.x + windowState.size.width - newWidth;
					}
				}
				break;
			case 's': // Alsó él - nyújtás lefelé a workspace aljáig (max méret alatt)
				newHeight = Math.min(
					workspaceHeight - windowState.position.y - WORKSPACE_PADDING,
					MAX_WINDOW_HEIGHT
				);
				break;
			case 'n': // Felső él - nyújtás felfelé a workspace tetejéig (max méret alatt)
				{
					const targetHeight = windowState.position.y + windowState.size.height - WORKSPACE_PADDING;
					newHeight = Math.min(targetHeight, MAX_WINDOW_HEIGHT);
					// Pozíciót csak akkor változtatjuk, ha nem a max méret korlátozza
					if (newHeight === targetHeight) {
						newTop = WORKSPACE_PADDING;
					} else {
						// Ha max méret korlátozza, számítsuk ki az új felső pozíciót
						newTop = windowState.position.y + windowState.size.height - newHeight;
					}
				}
				break;
			case 'ne': // Jobb felső sarok - nyújtás jobbra és felfelé (max méret alatt)
				{
					newWidth = Math.min(
						workspaceWidth - windowState.position.x - WORKSPACE_PADDING,
						MAX_WINDOW_WIDTH
					);
					const targetHeight = windowState.position.y + windowState.size.height - WORKSPACE_PADDING;
					newHeight = Math.min(targetHeight, MAX_WINDOW_HEIGHT);
					// Pozíciót csak akkor változtatjuk, ha nem a max méret korlátozza
					if (newHeight === targetHeight) {
						newTop = WORKSPACE_PADDING;
					} else {
						newTop = windowState.position.y + windowState.size.height - newHeight;
					}
				}
				break;
			case 'nw': // Bal felső sarok - nyújtás balra és felfelé (max méret alatt)
				{
					const targetWidth = windowState.position.x + windowState.size.width - WORKSPACE_PADDING;
					newWidth = Math.min(targetWidth, MAX_WINDOW_WIDTH);
					const targetHeight = windowState.position.y + windowState.size.height - WORKSPACE_PADDING;
					newHeight = Math.min(targetHeight, MAX_WINDOW_HEIGHT);
					// Pozíciókat csak akkor változtatjuk, ha nem a max méret korlátozza
					if (newWidth === targetWidth) {
						newLeft = WORKSPACE_PADDING;
					} else {
						newLeft = windowState.position.x + windowState.size.width - newWidth;
					}
					if (newHeight === targetHeight) {
						newTop = WORKSPACE_PADDING;
					} else {
						newTop = windowState.position.y + windowState.size.height - newHeight;
					}
				}
				break;
			case 'se': // Jobb alsó sarok - nyújtás jobbra és lefelé (max méret alatt)
				newWidth = Math.min(
					workspaceWidth - windowState.position.x - WORKSPACE_PADDING,
					MAX_WINDOW_WIDTH
				);
				newHeight = Math.min(
					workspaceHeight - windowState.position.y - WORKSPACE_PADDING,
					MAX_WINDOW_HEIGHT
				);
				break;
			case 'sw': // Bal alsó sarok - nyújtás balra és lefelé (max méret alatt)
				{
					const targetWidth = windowState.position.x + windowState.size.width - WORKSPACE_PADDING;
					newWidth = Math.min(targetWidth, MAX_WINDOW_WIDTH);
					newHeight = Math.min(
						workspaceHeight - windowState.position.y - WORKSPACE_PADDING,
						MAX_WINDOW_HEIGHT
					);
					// Pozíciót csak akkor változtatjuk, ha nem a max méret korlátozza
					if (newWidth === targetWidth) {
						newLeft = WORKSPACE_PADDING;
					} else {
						newLeft = windowState.position.x + windowState.size.width - newWidth;
					}
				}
				break;
		}

		// Minimum méretek ellenőrzése
		newWidth = Math.max(MIN_WINDOW_WIDTH, newWidth);
		newHeight = Math.max(MIN_WINDOW_HEIGHT, newHeight);

		windowManager.updateSize(windowState.id, { width: newWidth, height: newHeight });
		windowManager.updatePosition(windowState.id, { x: newLeft, y: newTop });

		// Ellenőrizzük, hogy elérte-e a maximális méretet a dupla kattintás után
		setTimeout(() => {
			if (!windowState.isMaximized && checkIfMaximized()) {
				windowManager.maximizeWindow(windowState.id);
			}
		}, 10); // Kis késleltetés, hogy a DOM frissüljön
	}

	// AKADÁLYMENTES MŰKÖDÉSHEZ SZÜKSÉGES ESEMÉNYEK - START
	function handleWindowKeydown(e: KeyboardEvent) {
		// Ne akadályozzuk meg a billentyűleütést input mezőkben, textarea-ban vagy contenteditable elemekben
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			windowManager.activateWindow(windowState.id);
		}
	}

	function handleHeaderKeydown(e: KeyboardEvent) {
		// Ne akadályozzuk meg a billentyűleütést input mezőkben, textarea-ban vagy contenteditable elemekben
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			// Dupla kattintás hatása (maximize)
			maximize();
		}
	}

	function handleResizeKeydown(e: KeyboardEvent) {
		// Ne akadályozzuk meg a billentyűleütést input mezőkben, textarea-ban vagy contenteditable elemekben
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			// Billentyűzetről nem indítunk resize-t, csak aktiváljuk az ablakot
			windowManager.activateWindow(windowState.id);
		}
	}
	// AKADÁLYMENTES MŰKÖDÉSHEZ SZÜKSÉGES ESEMÉNYEK - STOP

	/**
	 * Screenshot készítése az ablakról
	 */
	async function takeScreenshot() {
		await takeWindowScreenshot(windowState.id, windowManager, SCREENSHOT_THUMBNAIL_HEIGHT);
	}

	/**
	 * Ablak stílus számítása
	 */
	let windowStyle = $derived.by(() => {
		const left = windowState.isMaximized
			? 'var(--startmenu-margin)'
			: `${windowState.position.x}px`;
		const top = windowState.isMaximized ? 'var(--startmenu-margin)' : `${windowState.position.y}px`;
		const width = windowState.isMaximized
			? 'calc(100% - var(--startmenu-margin) *2 )'
			: `${windowState.size.width}px`;
		const height = windowState.isMaximized
			? 'calc(100% - var(--startmenu-margin) * 2)'
			: `${windowState.size.height}px`;
		const zIndex = windowState.zIndex;
		return `left: ${left}; top: ${top}; width: ${width}; height: ${height}; z-index: ${zIndex};`;
	});
</script>

<div
	class={[
		'window',
		windowState.isActive ? 'active' : '',
		windowState.isMaximized ? 'maximized' : '',
		windowState.isMinimized ? 'minimized' : '',
		isResizing ? 'resizing' : '',
		isVisuallyDragging ? 'dragging' : ''
	]}
	style={windowStyle}
	data-window-id={windowState.id}
	onclick={() => windowManager.activateWindow(windowState.id)}
	oncontextmenu={(e) => e.stopPropagation()}
	onkeydown={handleWindowKeydown}
	role="button"
	tabindex="0"
	bind:this={windowElement}
>
	<div
		class="window-header"
		onmousedown={handleMouseDown}
		ondblclick={handleDoubleClick}
		onkeydown={handleHeaderKeydown}
		role="button"
		tabindex="0"
	>
		<div class="window-title">{windowState.title}</div>
		<div class="window-controls">
			{#if windowState.helpId}
				<WindowControlButton controlType="help" onClick={() => help(windowState.helpId)} />
			{/if}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<WindowControlButton controlType="link" onClick={async () => link()} />
					</Tooltip.Trigger>
					<Tooltip.Content class="z-1001">{t('desktop.window.guidTooltip')}</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
			<WindowControlButton controlType="minimize" onClick={async () => minimize()} />
			{#if windowState.maximizable}
				<WindowControlButton
					controlType={windowState.isMaximized ? 'restore' : 'maximize'}
					onClick={maximize}
				/>
			{/if}
			<WindowControlButton controlType="close" onClick={close} />
		</div>
	</div>

	<div class="window-content" class:dragging={preferPerformance && isVisuallyDragging}>
		<div>
			{#if windowState.isLoading}
				<div class="loading">{t('desktop.window.loading')}</div>
			{:else if (windowState as any).isPluginWithLayout}
				{@const menuData = (windowState as any).pluginMenuData}
				{@const pluginId = (windowState as any).pluginId}
				{@const Component = windowState.component}
				<Component {pluginId} {menuData} />
			{:else if (windowState as any).customElementTag}
				{@const tagName = (windowState as any).customElementTag}
				{@const props = (windowState as any).pluginProps || {}}
				<svelte:element
					this={tagName}
					data-window-id={props.windowId}
					data-plugin-id={props.pluginId}
					data-parameters={JSON.stringify(props.parameters || {})}
				/>
			{:else if windowState.component}
				{@const Component = windowState.component}
				<Component />
			{:else}
				<div class="error">{t('desktop.window.loadError')}</div>
			{/if}
		</div>
	</div>

	<!-- Resize handles -->
	{#if !windowState.isMaximized}
		<div
			class="resize-handle resize-n"
			onmousedown={(e: MouseEvent) => handleResizeStart(e, 'n')}
			ondblclick={(e: MouseEvent) => handleEdgeDoubleClick(e, 'n')}
			onkeydown={(e: KeyboardEvent) => handleResizeKeydown(e)}
			role="button"
			tabindex="0"
			aria-label="Resize window"
		></div>
		<div
			class="resize-handle resize-s"
			onmousedown={(e: MouseEvent) => handleResizeStart(e, 's')}
			ondblclick={(e: MouseEvent) => handleEdgeDoubleClick(e, 's')}
			onkeydown={(e: KeyboardEvent) => handleResizeKeydown(e)}
			role="button"
			tabindex="0"
		></div>
		<div
			class="resize-handle resize-e"
			onmousedown={(e: MouseEvent) => handleResizeStart(e, 'e')}
			ondblclick={(e: MouseEvent) => handleEdgeDoubleClick(e, 'e')}
			onkeydown={(e: KeyboardEvent) => handleResizeKeydown(e)}
			role="button"
			tabindex="0"
		></div>
		<div
			class="resize-handle resize-w"
			onmousedown={(e: MouseEvent) => handleResizeStart(e, 'w')}
			ondblclick={(e: MouseEvent) => handleEdgeDoubleClick(e, 'w')}
			onkeydown={(e: KeyboardEvent) => handleResizeKeydown(e)}
			role="button"
			tabindex="0"
		></div>
		<div
			class="resize-handle resize-ne"
			onmousedown={(e: MouseEvent) => handleResizeStart(e, 'ne')}
			ondblclick={(e: MouseEvent) => handleEdgeDoubleClick(e, 'ne')}
			onkeydown={(e: KeyboardEvent) => handleResizeKeydown(e)}
			role="button"
			tabindex="0"
		></div>
		<div
			class="resize-handle resize-nw"
			onmousedown={(e: MouseEvent) => handleResizeStart(e, 'nw')}
			ondblclick={(e: MouseEvent) => handleEdgeDoubleClick(e, 'nw')}
			onkeydown={(e: KeyboardEvent) => handleResizeKeydown(e)}
			role="button"
			tabindex="0"
		></div>
		<div
			class="resize-handle resize-se"
			onmousedown={(e: MouseEvent) => handleResizeStart(e, 'se')}
			ondblclick={(e: MouseEvent) => handleEdgeDoubleClick(e, 'se')}
			onkeydown={(e: KeyboardEvent) => handleResizeKeydown(e)}
			role="button"
			tabindex="0"
		></div>
		<div
			class="resize-handle resize-sw"
			onmousedown={(e: MouseEvent) => handleResizeStart(e, 'sw')}
			ondblclick={(e: MouseEvent) => handleEdgeDoubleClick(e, 'sw')}
			onkeydown={(e: KeyboardEvent) => handleResizeKeydown(e)}
			role="button"
			tabindex="0"
		></div>
	{/if}
</div>

<style>
	:root {
		--window-border-width: 4px;
	}
	.window {
		display: flex;
		position: absolute;
		flex-direction: column;
		backdrop-filter: blur(12px) saturate(180%);
		transition:
			box-shadow 0.2s,
			border 0.2s,
			opacity 0.15s,
			transform 0.15s;
		box-shadow: var(--shadow-lg);
		border: var(--window-border-width) solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		background-color: var(--color-window-background-alpha-90);
	}

	/* Vizuális feedback mozgatás közben */
	.window.dragging {
		transform: scale(0.98);
		opacity: 0.85;
		box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.3));

		.window-header {
			opacity: 0.5;
		}

		.window-content {
			opacity: 0.4;
		}
	}

	.window.minimized {
		display: none;
	}

	.window.maximized {
		border-radius: 0;
	}

	/*:global(.window.active) {
		box-shadow:
			0 0 0 1px var(--color-primary-alpha-10),
			0 0 20px var(--color-primary-alpha-10),
			0 0 40px var(--color-primary-alpha-10),
			0 0 60px var(--color-primary-alpha-5);
	}

	:global(.window:not(.active)) {
		box-shadow: none;
	}*/

	.window-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: move;
		/*border-bottom: 1px solid var(--color-primary-alpha-20);*/
		border-radius: calc(var(--default-border-radius, 8px) - 2px)
			calc(var(--default-border-radius, 8px) - 2px) 0 0;
		/*background-color: var(--color-primary-alpha-70);*/
		background: linear-gradient(
			to bottom,
			var(--color-background),
			color-mix(in srgb, var(--color-background) 25%, transparent)
		);
		padding: 8px 12px;
		color: var(--color-primary-alpha-90);
		user-select: none;
	}

	.window.maximized .window-header {
		cursor: default;
	}

	.window:not(.active) .window-header {
		border-bottom-color: var(--color-border);
		/*background-color: transparent;*/
	}

	.window-title {
		display: flex;
		justify-content: center;
	}

	.window:not(.active) .window-title {
		color: var(--color-foreground);
	}
	.window-controls {
		display: flex;
		gap: 8px;
	}

	.window:not(.active) .window-controls {
		filter: grayscale(1);
	}

	.window-content {
		flex: 1;
		padding: 16px;
		overflow: hidden;

		& > div {
			height: 100%;
			overflow: auto;
		}
	}

	/* Teljesítmény optimalizáció: tartalom elrejtése mozgatás közben */
	.window-content.dragging {
		visibility: hidden;
	}

	.loading,
	.error {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: #666;
	}

	.error {
		color: #d32f2f;
	}

	/* Resize handles */
	.resize-handle {
		position: absolute;
		z-index: 10;
		user-select: none;
	}

	/* Sarkok - ezek magasabb prioritásúak, ezért előbb vannak */
	.resize-ne,
	.resize-nw,
	.resize-se,
	.resize-sw {
		z-index: 12;
		width: 15px;
		height: 15px;
	}

	.resize-ne {
		top: calc(var(--window-border-width) * -1.5);
		right: calc(var(--window-border-width) * -1.5);
		cursor: nesw-resize;
	}

	.resize-nw {
		top: calc(var(--window-border-width) * -1.5);
		left: calc(var(--window-border-width) * -1.5);
		cursor: nwse-resize;
	}

	.resize-se {
		right: calc(var(--window-border-width) * -1.5);
		bottom: calc(var(--window-border-width) * -1.5);
		cursor: nwse-resize;
	}

	.resize-sw {
		bottom: calc(var(--window-border-width) * -1.5);
		left: calc(var(--window-border-width) * -1.5);
		cursor: nesw-resize;
	}

	/* Élek - kisebb z-index, hogy a sarkok felülírják őket */
	.resize-n,
	.resize-s {
		right: 0;
		left: 0;
		z-index: 11;
		cursor: ns-resize;
		height: 8px;
	}

	.resize-n {
		top: calc(var(--window-border-width) * -1.5);
	}

	.resize-s {
		bottom: calc(var(--window-border-width) * -1.5);
	}

	.resize-e,
	.resize-w {
		top: 0;
		bottom: 0;
		z-index: 11;
		cursor: ew-resize;
		width: 8px;
	}

	.resize-e {
		right: calc(var(--window-border-width) * -1.5);
	}

	.resize-w {
		left: calc(var(--window-border-width) * -1.5);
	}
</style>
