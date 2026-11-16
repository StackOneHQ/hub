import { existsSync, readFileSync } from 'node:fs';

const MALACHITE = /[\\/]@stackone[\\/]malachite[\\/]/;
const WRAPPER = /\.woff2\.js$/;

// malachite ships each font as a woff2 file beside a wrapper that exports
// `new URL("./<font>.woff2", import.meta.url)`. In the IIFE that URL resolves next to wherever
// the customer serves webcomponent.js, where no font file exists, so each face the page uses
// 404s before malachite falls back to its inlined copy. Point each wrapper at that copy instead.
export const inlineMalachiteFonts = () => ({
    name: 'hub:inline-malachite-fonts',
    async resolveId(source, importer, options) {
        if (!WRAPPER.test(source)) {
            return null;
        }
        const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
        if (!resolved || !MALACHITE.test(resolved.id)) {
            return resolved;
        }
        const inlined = resolved.id.replace(WRAPPER, '.woff2.inline.js');
        if (existsSync(inlined)) {
            return { ...resolved, id: inlined };
        }
        // Before 2.134.1 the wrapper is itself the data URL, and there is nothing to swap.
        if (readFileSync(resolved.id, 'utf8').includes('import.meta.url')) {
            this.error(
                `${resolved.id} has no inlined copy at ${inlined}; webcomponent.js would load the font as a file`,
            );
        }
        return resolved;
    },
});
