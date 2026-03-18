/**
 * Build All Script
 *
 * Build-eli a fő plugint és az összes sidebar komponenst.
 */

import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const __dirname = import.meta.dir;

console.log('🔨 Building plugin...\n');

// 1. Build fő plugin
console.log('📦 Building main plugin...');
try {
	execSync('BUILD_MODE=main vite build', { stdio: 'inherit', cwd: __dirname });
	console.log('✅ Main plugin built successfully\n');
} catch (error) {
	console.error('❌ Failed to build main plugin');
	process.exit(1);
}

// 2. Build komponensek
const componentsDir = resolve(__dirname, 'src/components');
if (existsSync(componentsDir)) {
	const files = readdirSync(componentsDir);
	const svelteFiles = files.filter((f) => f.endsWith('.svelte'));

	if (svelteFiles.length > 0) {
		console.log('📦 Building components...');

		for (const file of svelteFiles) {
			console.log(`  - Building ${file}...`);
			try {
				execSync(`BUILD_MODE=components COMPONENT_FILE=${file} vite build`, {
					stdio: 'inherit',
					cwd: __dirname
				});
			} catch (error) {
				console.error(`❌ Failed to build component: ${file}`);
				process.exit(1);
			}
		}

		console.log('✅ All components built successfully\n');
	}
}

console.log('🎉 Build completed successfully!');
