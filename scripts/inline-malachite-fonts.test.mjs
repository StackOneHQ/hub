import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { rollup } from 'rollup';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inlineMalachiteFonts } from './inline-malachite-fonts.mjs';

const WRAPPER = 'export default new URL("./face.woff2", import.meta.url).href;';
const INLINED = 'export default "data:font/woff2;base64,AAAA";';

let root;
const write = (path, code) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), code);
};
const bundle = async (wrapper) => {
    write('entry.js', `import face from './${wrapper}'; console.log(face);`);
    const build = await rollup({
        input: join(root, 'entry.js'),
        plugins: [inlineMalachiteFonts()],
    });
    try {
        const { output } = await build.generate({ format: 'iife' });
        return output[0].code;
    } finally {
        await build.close();
    }
};

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'hub-fonts-'));
});
afterEach(() => {
    rmSync(root, { recursive: true, force: true });
});

describe('inlineMalachiteFonts', () => {
    it('bundles the inlined copy of a malachite font instead of its file URL', async () => {
        const wrapper = 'node_modules/@stackone/malachite/dist/face.woff2.js';
        write(wrapper, WRAPPER);
        write(wrapper.replace('.js', '.inline.js'), INLINED);

        const code = await bundle(wrapper);

        expect(code).toContain('data:font/woff2;base64,AAAA');
        expect(code).not.toContain('face.woff2');
    });

    it('leaves a font wrapper from another package alone', async () => {
        const wrapper = 'node_modules/other/face.woff2.js';
        write(wrapper, WRAPPER);
        write(wrapper.replace('.js', '.inline.js'), INLINED);

        const code = await bundle(wrapper);

        expect(code).toContain('face.woff2');
        expect(code).not.toContain('data:font');
    });

    it('keeps a malachite font that is already a data URL, as before 2.134.1', async () => {
        const wrapper = 'node_modules/@stackone/malachite/dist/face.woff2.js';
        write(wrapper, INLINED);

        const code = await bundle(wrapper);

        expect(code).toContain('data:font/woff2;base64,AAAA');
    });

    it('fails the build when a malachite font has no inlined copy', async () => {
        const wrapper = 'node_modules/@stackone/malachite/dist/face.woff2.js';
        write(wrapper, WRAPPER);

        await expect(bundle(wrapper)).rejects.toThrow(/has no inlined copy/);
    });
});
