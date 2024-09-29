import type { IFeature } from '@/features/type';
import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import enquirer from 'enquirer';
import { genImport } from 'knitwork';

type PresetName = 'antfu' | 'sxzz' | 'akrc';
interface Preset {
    imports: Array<{
        specifier: string;
        source: string;
        named?: boolean;
    }>;
    deps: Array<string>;
    exportSpecifier: string;
}
const presets: Record<PresetName, Preset> = {
    antfu: {
        imports: [
            {
                specifier: 'antfu',
                source: '@antfu/eslint-config',
            },
        ],
        deps: ['@antfu/eslint-config'],
        exportSpecifier: 'antfu()',
    },
    sxzz: {
        imports: [
            {
                specifier: 'sxzz',
                source: '@sxzz/eslint-config',
                named: true,
            },
        ],
        deps: ['@sxzz/eslint-config'],
        exportSpecifier: 'sxzz()',
    },
    akrc: {
        imports: [
            {
                specifier: 'akrc',
                source: '@akrc/eslint-config',
            },
        ],
        deps: ['@akrc/eslint-config'],
        exportSpecifier: 'akrc()',
    },
};
const sharedDeps = ['eslint'];
const configFiles = ['eslint.config.{cjs,js,mjs,ts,mts,cts}'];
const scripts = {
    lint: 'eslint  .',
    'lint:fix': 'eslint --fix .',
};

export const eslintv9: IFeature<{
    preset: PresetName;
}> = {
    name: 'eslintv9',
    options: Effect.promise(() =>
        enquirer.prompt<{ preset: PresetName }>({
            type: 'select',
            name: 'preset',
            message: 'Choose a preset',
            choices: Object.keys(presets),
        }),
    ),
    setup(ctx, options) {
        const preset = presets[options.preset];
        const deps = [...preset.deps, ...sharedDeps];
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            const filePath = yield* ctx.join('eslint.config.mjs');
            const template = yield* ctx.template('eslintv9');
            const imports = preset.imports
                .map((i) => {
                    return `${genImport(
                        i.source,
                        i.named ? [i.specifier] : i.specifier,
                    )}`;
                })
                .join('\n');
            const exports = `export default ${preset.exportSpecifier}`;
            const content = ctx.encoder.encode(template({ imports, exports }));
            const fs = yield* FileSystem.FileSystem;
            yield* fs.writeFile(filePath, content);
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const files = yield* ctx.glob(configFiles);
            const fs = yield* FileSystem.FileSystem;
            yield* Effect.forEach(files, (file) => fs.remove(file));
            yield* ctx.removeScripts(scripts);
            yield* ctx.removeDeps(
                ...sharedDeps,
                ...Object.values(presets).flatMap((p) => p.deps),
            );
        });
    },
};
