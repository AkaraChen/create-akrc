import { CommandExecutor, FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import { commands } from 'pm-combo';
import type { IFeature } from '../type';

const configFiles = 'jest.config.{js,ts,mjs,cjs}';

const scripts = {
    test: 'jest',
};

const deps = ['jest', 'typescript', 'ts-jest', '@types/jest'];

export const jest: IFeature = {
    name: 'jest',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(
                ...deps.map((dep) => ({
                    name: dep,
                    field: 'devDependencies' as const,
                })),
            );
            yield* ctx.addScripts(scripts);
            const exec = yield* CommandExecutor.CommandExecutor;
            yield* exec.start(
                ctx.makeCommand(
                    commands.dlx.concat(ctx.pm, {
                        package: 'ts-jest',
                        args: ['config:init'],
                    }),
                ),
            );
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps(...deps);
            yield* ctx.removeScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
