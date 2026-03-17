<!--
  PluginDialog — Plugin SDK dialog handler komponens.

  Globálisan regisztrált dialog, amelyet az SDK UIService.dialog() hív meg.
  Támogatja az info, confirm és prompt típusokat.
-->
<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import type { DialogOptions, DialogResult } from '@elyos/sdk';

	// Belső állapot
	let open = $state(false);
	let title = $state('');
	let message = $state('');
	let type = $state<'info' | 'confirm' | 'prompt'>('info');
	let promptValue = $state('');
	let resolveFn: ((result: DialogResult) => void) | null = null;

	/**
	 * Dialog megjelenítése — az SDK UIService regisztrálja ezt a handlert.
	 */
	export function showDialog(options: DialogOptions): Promise<DialogResult> {
		title = options.title;
		message = options.message;
		type = options.type ?? 'info';
		promptValue = '';
		open = true;

		return new Promise<DialogResult>((resolve) => {
			resolveFn = resolve;
		});
	}

	function resolve(result: DialogResult) {
		open = false;
		resolveFn?.(result);
		resolveFn = null;
	}

	function handleOk() {
		resolve({ action: 'ok' });
	}

	function handleConfirm() {
		resolve({ action: 'confirm' });
	}

	function handleCancel() {
		resolve({ action: 'cancel' });
	}

	function handleSubmit() {
		resolve({ action: 'submit', value: promptValue });
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen && resolveFn) {
			// Dialog bezárva X gombbal vagy ESC-pel
			resolve({ action: 'cancel' });
		}
	}
</script>

<AlertDialog.Root bind:open onOpenChange={handleOpenChange}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>{message}</AlertDialog.Description>
		</AlertDialog.Header>

		{#if type === 'prompt'}
			<div class="prompt-input">
				<input
					type="text"
					bind:value={promptValue}
					class="input"
					onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
				/>
			</div>
		{/if}

		<AlertDialog.Footer>
			{#if type === 'info'}
				<Button onclick={handleOk}>OK</Button>
			{:else if type === 'confirm'}
				<Button variant="outline" onclick={handleCancel}>Mégse</Button>
				<Button onclick={handleConfirm}>Megerősítés</Button>
			{:else if type === 'prompt'}
				<Button variant="outline" onclick={handleCancel}>Mégse</Button>
				<Button onclick={handleSubmit}>Küldés</Button>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	.prompt-input {
		padding: 0.5rem 0 1rem;
	}

	.input {
		outline: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--background);
		padding: 0.5rem 0.75rem;
		width: 100%;
		color: var(--foreground);
		font-size: 0.875rem;
	}

	.input:focus {
		box-shadow: 0 0 0 2px var(--ring);
	}
</style>
