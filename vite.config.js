import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

function thirdPartyLicenses() {
    let licenses = [];
    return {
        name: 'fourmix-third-party-licenses',
        apply: 'build',
        generateBundle(options, bundle) {
            for (const [fileName, output] of Object.entries(bundle)) {
                if (output.type === 'chunk' && fileName !== 'sdk.js' && !/^[A-Za-z0-9_-]+-[A-Za-z0-9_-]{6,}\.js$/.test(fileName)) throw new Error(`配信できない分割ファイル名です: ${fileName}`);
            }
            const marked = dirname(dirname(require.resolve('marked')));
            const dompurify = dirname(dirname(require.resolve('dompurify')));
            licenses = [
                ['LICENSE.marked.txt', join(marked, 'LICENSE')],
                ['LICENSE.dompurify-apache.txt', join(dompurify, 'LICENSE')],
                ['LICENSE.dompurify-mpl.txt', join(dompurify, 'LICENSE-MPL')],
            ].map(([fileName, source]) => ({ fileName, source: readFileSync(source) }));
            const notices = [join(marked, 'lib/marked.esm.js'), join(dompurify, 'dist/purify.es.mjs')].map(source => {
                const notice = readFileSync(source, 'utf8').match(/^\s*(\/\*[\s\S]*?\*\/)/)?.[1];
                if (!notice) throw new Error(`第三者の著作権表示が見つかりません: ${source}`);
                return notice;
            });
            licenses.push({ fileName: 'NOTICE.third-party.txt', source: Buffer.from(`${notices.join('\n\n')}\n`) });
            const packages = new Map();
            for (const module of this.getModuleIds()) {
                if (!module.includes('node_modules')) continue;
                let directory = dirname(module.split('?')[0]);
                while (directory !== dirname(directory)) {
                    const metadata = join(directory, 'package.json');
                    if (existsSync(metadata)) {
                        const info = JSON.parse(readFileSync(metadata, 'utf8'));
                        if (info.name && info.version) { packages.set(`${info.name}@${info.version}`, directory); break; }
                    }
                    directory = dirname(directory);
                }
            }
            const inventory = [];
            for (const [name, directory] of [...packages].sort(([left], [right]) => left.localeCompare(right))) {
                for (const file of readdirSync(directory, { withFileTypes: true })) {
                    if (!file.isFile() || !/^(?:licen[cs]e|copying|notice)(?:$|[._-])/i.test(file.name)) continue;
                    const source = readFileSync(join(directory, file.name));
                    const fileName = `LICENSE.${name.replace(/[^a-zA-Z0-9._-]/g, '_')}.${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.txt`;
                    licenses.push({ fileName, source });
                    inventory.push({ package: name, file: fileName, sha256: createHash('sha256').update(source).digest('hex') });
                }
            }
            licenses.push({ fileName: 'NOTICE.license-inventory.json', source: Buffer.from(`${JSON.stringify(inventory, null, 2)}\n`) });
            for (const asset of licenses) this.emitFile({ type: 'asset', ...asset });
        },
        writeBundle({ dir }) {
            const digest = source => createHash('sha256').update(source).digest('hex');
            for (const asset of licenses) {
                const emitted = readFileSync(join(dir, asset.fileName));
                if (digest(emitted) !== digest(asset.source)) throw new Error(`第三者のライセンス原文が一致しません: ${asset.fileName}`);
            }
        },
    };
}

export default defineConfig({
    plugins: [tailwindcss(), thirdPartyLicenses()],
    build: {
        outDir: 'resources/dist',
        license: { fileName: 'NOTICE.bundled-dependencies.json' },
        rolldownOptions: { output: { chunkFileNames: chunk => `${chunk.name.replace(/[^A-Za-z0-9_-]/g, '-')}-[hash].js` } },
        lib: { entry: 'resources/js/sdk.js', formats: ['es'], fileName: 'sdk', cssFileName: 'sdk' },
    },
});
