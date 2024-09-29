import type { IFeature } from '@/features/type';
import { Command } from '@effect/platform';
import { Effect, pipe } from 'effect';
import { commands } from 'pm-combo';

const configDir = 'docs/.vitepress';
const deps = ['vitepress'];
const scripts = {
    'docs:dev': 'vitepress dev docs',
    'docs:build': 'vitepress build docs',
    'docs:preview': 'vitepress preview docs',
};

export const vitepress: IFeature = {
    name: 'vitepress',
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            return yield* fs.exists(yield* ctx.join(configDir));
        });
    },
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(
                ...deps.map((dep) => ({
                    name: dep,
                })),
            );
            yield* ctx.addScripts(scripts);
            const exec = yield* ctx.exec;
            yield* Effect.log('Initializing Vitepress...');
            const process = yield* exec.start(
                pipe(
                    ctx.makeCommand(
                        commands.dlx.concat(ctx.pm, {
                            package: 'vitepress',
                            args: ['init', 'docs'],
                        }),
                    ),
                    Command.stdin('inherit'),
                    Command.stdout('inherit'),
                ),
            );
            yield* process.exitCode;
            yield* ctx.addGitignore('vitepress', [
                'docs/.vitepress/dist',
                'docs/.vitepress/cache',
            ]);
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps(...deps);
            yield* ctx.removeScripts(scripts);
            const fs = yield* ctx.fs;
            yield* fs.remove(yield* ctx.join(configDir), { recursive: true });
            return {
                afterTeardown: Effect.log(
                    'Vitest deps and its scripts have been removed, you can remove the docs folder manually.',
                ),
            };
        });
    },
};
