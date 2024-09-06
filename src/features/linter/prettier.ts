import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import enquirer from 'enquirer';
import type { IFeature } from '../type';

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

const plugins = ['astro', 'svelte', 'tailwind'] as Plugin[];

export const prettier: IFeature<{
    plugins: Array<Plugin>;
}> = {
    name: 'prettier',
    options: Effect.promise<{ plugins: Array<Plugin> }>(() =>
        enquirer.prompt({
            type: 'multiselect',
            name: 'plugins',
            message: 'Select plugins',
            choices: plugins,
        }),
    ),
    setup(ctx, options) {
        const { plugins } = options;
        return Effect.gen(function* () {
            yield* ctx.addDeps(
                {
                    name: 'prettier',
                    field: 'devDependencies',
                },
                ...plugins.map((plugin) => ({
                    name: `prettier-plugin-${plugin}`,
                    version: 'latest',
                    field: 'devDependencies' as const,
                })),
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
            const fs = yield* FileSystem.FileSystem;
            yield* Effect.forEach(configs, (config) => fs.remove(config));
            yield* ctx.removeScripts(scripts);
        });
    },
};
