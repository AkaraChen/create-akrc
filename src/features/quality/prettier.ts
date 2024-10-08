import { prompt } from '@/core/utils';
import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const configFiles = {
    rcs: [
        '.prettierrc',
        '.prettierrc.{json,yml,yaml,json5,js,cjs,mjs,toml}',
        'prettier.config.{js,cjs,mjs}',
    ],
    ignore: '.prettierignore',
};

const scripts = {
    format: 'prettier --write .',
};

type Plugin = 'astro' | 'tailwind' | 'svelte';

const plugins = ['astro', 'svelte', 'tailwindcss'] as Plugin[];

export const prettier: IFeature<{
    plugins: Array<Plugin>;
}> = {
    name: 'prettier',
    options: prompt<{ plugins: Array<Plugin> }>({
        type: 'multiselect',
        name: 'plugins',
        message: 'Select plugins',
        choices: plugins,
    }),
    setup(ctx, options) {
        const { plugins } = options;
        return Effect.gen(function* () {
            yield* ctx.addDeps(
                { name: 'prettier' },
                ...plugins.map((plugin) => `prettier-plugin-${plugin}`),
            );
            const template = yield* ctx.template('prettier');
            yield* ctx.writeJson(
                yield* ctx.join('.prettierrc'),
                template({
                    plugins: plugins
                        .map((plugin) => `"prettier-plugin-${plugin}"`)
                        .join(','),
                }),
            );
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return ctx
            .glob([...configFiles.rcs, configFiles.ignore])
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps(
                'prettier',
                ...plugins.map((plugin) => `prettier-plugin-${plugin}`),
            );
            const configs = yield* ctx.glob([
                ...configFiles.rcs,
                configFiles.ignore,
            ]);
            const fs = yield* ctx.fs;
            yield* Effect.forEach(configs, (config) => fs.remove(config));
            yield* ctx.removeScripts(scripts);
        });
    },
};
