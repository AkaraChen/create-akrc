import { CommandExecutor, FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import { commands } from 'pm-combo';
import type { IFeature } from '../type';

const configFiles = 'tailwind.config.{js,ts,mjs,cjs}';

export const tailwind: IFeature = {
    name: 'tailwind',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(
                { name: 'tailwindcss' },
                { name: 'autoprefixer' },
                { name: 'postcss' },
            );
            const exec = yield* CommandExecutor.CommandExecutor;
            yield* Effect.log('Initializing tailwind');
            const process = yield* exec.start(
                ctx.makeCommand(
                    commands.dlx.concat(ctx.pm, {
                        package: 'tailwindcss',
                        args: ['init', '-p', '--ts'],
                    }),
                ),
            );
            yield* process.exitCode;
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('tailwindcss');
            const fs = yield* FileSystem.FileSystem;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
