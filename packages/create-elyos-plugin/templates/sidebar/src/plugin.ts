/**
 * Plugin IIFE build entry point.
 * ElyOS tölti be ezt a bundle-t Web Component-ként.
 */
import { mount } from 'svelte';
import App from './App.svelte';

function __PLUGIN_ID_UNDERSCORE___Plugin() {
	const tagName = '__PLUGIN_ID__-plugin';

	if (!customElements.get(tagName)) {
		class PluginElement extends HTMLElement {
			connectedCallback() {
				mount(App, { target: this });
			}
		}
		customElements.define(tagName, PluginElement);
	}

	return { tagName };
}

(window as any).__PLUGIN_ID_UNDERSCORE___Plugin = __PLUGIN_ID_UNDERSCORE___Plugin;

export default __PLUGIN_ID_UNDERSCORE___Plugin;
