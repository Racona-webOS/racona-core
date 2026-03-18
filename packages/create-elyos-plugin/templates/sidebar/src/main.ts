/**
 * Standalone dev entry point.
 * Vite dev szerveren fut (bun dev), az App.svelte-t közvetlenül mountolja.
 */
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
