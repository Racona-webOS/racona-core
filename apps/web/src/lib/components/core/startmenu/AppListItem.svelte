<script lang="ts">
	import type { AppMetadata } from '$lib/types/window';
	import { UniversalIcon } from '$lib/components/shared';

	interface Props {
		app: AppMetadata;
		onclick?: () => void;
		ondragstart?: () => void;
		ondragend?: () => void;
	}

	let { app, onclick, ondragstart, ondragend }: Props = $props();

	let isDragging = $state(false);

	function handleDragStart(e: DragEvent) {
		if (!e.dataTransfer) return;
		isDragging = true;
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('application/x-elyos-app', app.appName);
		e.dataTransfer.setData('text/plain', app.title);
		ondragstart?.();
	}

	function handleDragEnd() {
		isDragging = false;
		ondragend?.();
	}

	function handleClick() {
		if (isDragging) return;
		onclick?.();
	}
</script>

<button
	class="app-list-item"
	onclick={handleClick}
	type="button"
	draggable="true"
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
>
	<div class="app-icon" data-icon-style={app.iconStyle ?? 'icon'}>
		<UniversalIcon
			icon={app.icon ?? ''}
			size={app.iconStyle === 'cover' ? 40 : 22}
			appName={app.appName}
		/>
	</div>
	<div class="app-info">
		<span class="app-title">{app.title}</span>
		<span class="app-category">{app.category}</span>
	</div>
	<div class="app-arrow">
		<UniversalIcon icon="ChevronRight" size={16} />
	</div>
</button>

<style>
	.app-list-item {
		all: unset;
		display: flex;
		position: relative;
		align-items: center;
		gap: 10px;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		box-sizing: border-box;
		user-select: none;
		-webkit-user-drag: element;

		/* Subtle shadow */
		box-shadow:
			0 1px 4px rgba(0, 0, 0, 0.03),
			0 1px 2px rgba(0, 0, 0, 0.02);
		border: 1px solid transparent;
		border-radius: 10px;
		background: linear-gradient(145deg, rgba(245, 245, 248, 0.6), rgba(232, 232, 240, 0.4));
		padding: 8px 12px;
		width: 100%;

		&:hover {
			transform: translateX(4px);
			box-shadow:
				0 4px 16px rgba(0, 0, 0, 0.08),
				0 2px 4px rgba(0, 0, 0, 0.04),
				inset 0 1px 1px rgba(255, 255, 255, 0.4);
			border-color: rgba(255, 255, 255, 0.5);
			background:
				linear-gradient(
					135deg,
					color-mix(in srgb, var(--color-primary) 12%, transparent) 0%,
					transparent 60%
				),
				linear-gradient(145deg, rgba(250, 250, 255, 0.9), rgba(240, 240, 248, 0.7));

			.app-icon {
				transform: scale(1.05);
				box-shadow:
					0 4px 12px rgba(0, 0, 0, 0.12),
					0 2px 4px rgba(0, 0, 0, 0.08);
				border-color: rgba(255, 255, 255, 0.6);
				background:
					linear-gradient(
						135deg,
						color-mix(in srgb, var(--color-primary) 20%, transparent) 0%,
						transparent 50%
					),
					linear-gradient(145deg, #fafafa, #f0f0f8);
			}

			.app-title {
				color: var(--color-primary);
			}

			.app-arrow {
				transform: translateX(0);
				opacity: 1;
				color: var(--color-primary);
			}
		}

		&:active {
			transform: translateX(2px) scale(0.99);

			.app-icon {
				transform: scale(1);
			}
		}

		&:focus-visible {
			outline: 2px solid var(--color-primary);
			outline-offset: 2px;
		}
	}

	.app-icon {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			inset 0 1px 1px rgba(255, 255, 255, 0.2),
			0 2px 6px rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 8px;
		background: linear-gradient(145deg, #f5f5f8, #e8e8f0);
		width: 40px;
		height: 40px;
		color: var(--color-foreground);

		/* Icon style: centered pictogram with padding */
		&[data-icon-style='icon'] {
			padding: 6px;

			:global(svg) {
				opacity: 0.75;
			}
		}

		/* Cover style: image fills entire area */
		&[data-icon-style='cover'] {
			padding: 0;
			overflow: hidden;

			:global(.universal-icon) {
				width: 100%;
				height: 100%;
			}

			:global(img) {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			:global(.svg-container) {
				display: flex;
				justify-content: stretch;
				align-items: stretch;
				width: 100%;
				height: 100%;
			}

			:global(.svg-container svg) {
				width: 100%;
				height: 100%;
			}
		}
	}

	.app-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: flex-start;
		gap: 1px;
		text-align: left;
	}

	.app-title {
		transition: color 0.25s ease-out;
		color: var(--color-foreground);
		font-weight: 600;
		font-size: 13px;
		line-height: 1.2;
		letter-spacing: -0.01em;
	}

	.app-category {
		opacity: 0.6;
		color: var(--color-muted-foreground);
		font-size: 11px;
		line-height: 1.3;
		text-transform: capitalize;
	}

	.app-arrow {
		display: flex;
		align-items: center;
		transform: translateX(-8px);
		opacity: 0;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		color: var(--color-muted-foreground);
	}

	/* Dark mode */
	:global(.dark) .app-list-item {
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		background: linear-gradient(145deg, rgba(42, 42, 42, 0.6), rgba(28, 28, 28, 0.4));

		&:hover {
			box-shadow:
				0 6px 20px rgba(0, 0, 0, 0.25),
				0 2px 6px rgba(0, 0, 0, 0.15),
				inset 0 1px 1px rgba(255, 255, 255, 0.05);
			border-color: rgba(255, 255, 255, 0.1);
			background:
				linear-gradient(
					135deg,
					color-mix(in srgb, var(--color-primary) 15%, transparent) 0%,
					transparent 60%
				),
				linear-gradient(145deg, rgba(53, 53, 53, 0.9), rgba(40, 40, 40, 0.7));

			.app-icon {
				border-color: rgba(255, 255, 255, 0.15);
				background:
					linear-gradient(
						135deg,
						color-mix(in srgb, var(--color-primary) 25%, transparent) 0%,
						transparent 50%
					),
					linear-gradient(145deg, #353535, #282828);
			}
		}
	}

	:global(.dark) .app-icon {
		box-shadow:
			inset 0 1px 1px rgba(255, 255, 255, 0.05),
			0 2px 6px rgba(0, 0, 0, 0.25);
		border-color: rgba(255, 255, 255, 0.1);
		background: linear-gradient(145deg, #2a2a2a, #1c1c1c);

		&[data-icon-style='icon'] {
			:global(svg) {
				opacity: 1;
			}
		}
	}
</style>
