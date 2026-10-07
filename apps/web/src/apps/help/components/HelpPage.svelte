<!--
  Egy súgó oldal megjelenítése. A belső hivatkozások a súgón belül navigálnak,
  a külső hivatkozások új böngészőlapon nyílnak meg.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { getWindowId } from '$lib/services/client/appContext';
	import { getWindowManager } from '$lib/stores';
	import { useI18n } from '$lib/i18n/hooks';
	import type { MenuItem } from '$lib/types/menu';
	import { HELP_PAGE_COMPONENT, loadHelpPage, type HelpPageContent } from '../utils/helpContent';
	import type { HelpNavigation } from '../types';

	interface Props {
		/** A megjelenítendő oldal azonosítója. */
		slug: string;
		/** A súgó nyelve. */
		locale: string;
		/** Az ablak eredeti címe. */
		baseTitle: string;
		/** Oldalak közötti navigáció állapota (görgetési cél). */
		navigation: HelpNavigation;
	}

	let { slug, locale, baseTitle, navigation }: Props = $props();

	const { t } = useI18n();
	const shell = getAppShell();
	const windowManager = getWindowManager();
	const windowId = getWindowId();

	let page = $state<HelpPageContent | null>(null);
	let notFound = $state(false);
	let article = $state<HTMLElement>();

	$effect(() => {
		const currentSlug = slug;
		const currentLocale = locale;
		let cancelled = false;

		loadHelpPage(currentSlug, currentLocale).then(async (result) => {
			if (cancelled) return;
			page = result;
			notFound = !result;
			windowManager.updateWindowTitle(
				windowId,
				result ? `${baseTitle} - ${result.title}` : baseTitle
			);

			await tick();
			const anchor = navigation.anchor;
			navigation.anchor = undefined;
			if (!anchor || !scrollToAnchor(anchor)) {
				article?.closest('.app-layout-content-wrapper')?.scrollTo({ top: 0 });
			}
		});

		return () => {
			cancelled = true;
		};
	});

	function scrollToAnchor(anchor: string): boolean {
		const target = article?.querySelector(`#${CSS.escape(anchor)}`);
		target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
		return !!target;
	}

	function findMenuItem(items: MenuItem[], href: string): MenuItem | null {
		for (const item of items) {
			if (item.href === href && item.component) return item;
			const child = item.children ? findMenuItem(item.children, href) : null;
			if (child) return child;
		}
		return null;
	}

	function handleClick(event: MouseEvent) {
		const link = (event.target as HTMLElement).closest('a');
		if (!link) return;

		if (link.hasAttribute('data-help-external')) {
			event.preventDefault();
			window.open(link.href, '_blank', 'noopener,noreferrer');
			return;
		}

		const targetSlug = link.dataset.helpSlug;
		if (!targetSlug) return;
		event.preventDefault();

		const anchor = link.dataset.helpAnchor;
		if (targetSlug === slug) {
			if (anchor) scrollToAnchor(anchor);
			return;
		}

		navigation.anchor = anchor;
		const item = findMenuItem(shell.menuItems, `#${targetSlug}`);
		if (item) shell.handleMenuItemClick(item);
		else shell.navigateTo(HELP_PAGE_COMPONENT, { slug: targetSlug }, `#${targetSlug}`);
	}
</script>

{#if page}
	<div class="title-block">
		<h2>{page.title}</h2>
		{#if page.description}
			<h3>{page.description}</h3>
		{/if}
	</div>
	<!-- A kattintás a beágyazott hivatkozásokra vonatkozik, azok billentyűzettel is elérhetők -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<article bind:this={article} class="help-article" onclick={handleClick}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- DOMPurify-jal tisztított, a bundle-ből jövő tartalom -->
		{@html page.html}
	</article>
{:else if notFound}
	<p class="help-not-found">{t('help.notFound')}</p>
{/if}

<style>
	.help-not-found {
		color: var(--color-muted-foreground);
	}

	/* article.help-article: erősebb, mint az AppLayout .app-layout-content h2 szabálya */
	article.help-article {
		color: var(--color-neutral-800);
		line-height: 1.7;

		:global {
			h2,
			h3,
			h4 {
				scroll-margin-top: 1rem;
				color: var(--color-neutral-900);
				font-weight: 600;
				letter-spacing: -0.015em;
			}

			h2 {
				margin: 2rem 0 0.75rem;
				font-size: 1.35rem;
			}

			h3 {
				margin: 1.5rem 0 0.5rem;
				font-size: 1.1rem;
			}

			h4 {
				margin: 1.25rem 0 0.5rem;
				font-size: 1rem;
			}

			> :first-child {
				margin-top: 0;
			}

			p,
			ul,
			ol,
			table,
			blockquote,
			pre {
				margin: 0 0 1rem;
			}

			ul,
			ol {
				padding-left: 1.5rem;
			}

			ul {
				list-style: disc;
			}

			ol {
				list-style: decimal;
			}

			li + li,
			li > ul,
			li > ol {
				margin-top: 0.25rem;
			}

			li > ul,
			li > ol {
				margin-bottom: 0;
			}

			a {
				color: var(--color-primary);
				text-decoration: underline;
				text-underline-offset: 2px;
			}

			.help-broken-link {
				color: var(--color-neutral-500);
			}

			strong {
				color: var(--color-neutral-900);
				font-weight: 600;
			}

			code {
				border-radius: var(--radius-sm);
				background: var(--color-neutral-100);
				padding: 0.1rem 0.35rem;
				font-size: 0.875em;
			}

			pre {
				border-radius: var(--radius-md);
				background: var(--color-neutral-100);
				padding: 0.75rem 1rem;
				overflow-x: auto;

				code {
					background: none;
					padding: 0;
				}
			}

			blockquote {
				border-left: 3px solid var(--color-primary);
				border-radius: 0 var(--radius-md) var(--radius-md) 0;
				background: var(--color-neutral-100);
				padding: 0.75rem 1rem;

				> :last-child {
					margin-bottom: 0;
				}
			}

			img {
				display: block;
				margin: 0.5rem 0;
				border: 1px solid var(--color-neutral-200);
				border-radius: var(--radius-md);
				max-width: 100%;
				height: auto;
			}

			/* Képaláírás: a kép utáni dőlt sor */
			p > img + em,
			p:has(> img:only-child) + p > em:only-child {
				display: block;
				margin-top: -0.25rem;
				color: var(--color-neutral-500);
				font-size: 0.875rem;
			}

			table {
				border-collapse: collapse;
				width: 100%;
				font-size: 0.9rem;
			}

			th,
			td {
				vertical-align: top;
				border: 1px solid var(--color-neutral-200);
				padding: 0.4rem 0.75rem;
				text-align: left;
			}

			th {
				background: var(--color-neutral-100);
				font-weight: 600;
			}

			hr {
				margin: 1.5rem 0;
				border: none;
				border-top: 1px solid var(--color-neutral-200);
			}
		}
	}

	:global(.dark) article.help-article {
		color: var(--color-neutral-300);

		:global {
			h2,
			h3,
			h4,
			strong {
				color: var(--color-neutral-100);
			}

			code,
			pre,
			blockquote,
			th {
				background: var(--color-neutral-800);
			}

			img,
			th,
			td,
			hr {
				border-color: var(--color-neutral-700);
			}
		}
	}
</style>
