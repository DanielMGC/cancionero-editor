import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		watch: {
			// Tell Vite to ignore changes to our JSON database file
			ignored: ['**/src/data/canciones.json']
		}
	}
});