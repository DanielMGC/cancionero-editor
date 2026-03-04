// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// This tells SvelteKit to create a fallback page for routing
			fallback: '404.html' 
		}),
		paths: {
			// IMPORTANT: Replace 'cancionero-editor' with your exact GitHub repository name!
			base: process.argv.includes('dev') ? '' : '/cancionero-editor'
		}
	}
};

export default config;