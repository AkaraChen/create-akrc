import { Command, CommandExecutor, FileSystem } from '@effect/platform';
import { Effect, pipe } from 'effect';
import { commands } from 'pm-combo';
import type { IFeature } from '../type';

const configFiles = ['.husky'];
const deps = ['husky'];
const scripts = {
    prepare: 'husky',
};

export const husky: IFeature = {
    name: 'husky',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            const exec = yield* CommandExecutor.CommandExecutor;
            const process = yield* exec.start(
                pipe(
                    ctx.makeCommand(
                        commands.dlx.concat(ctx.pm, {
                            package: 'husky',
                            args: ['init'],
                        }),
                    ),
                    Command.stdout('inherit'),
                    Command.stderr('inherit'),
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
            yield* ctx.removeDeps(...deps);
            yield* ctx.removeScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) =>
                fs.remove(file, { recursive: true }),
            );
            const exec = yield* CommandExecutor.CommandExecutor;
            const process = yield* exec.start(
                ctx.makeCommand(
                    commands.create.concat(ctx.pm, {
                        name: 'husky',
                        args: ['uninstall'],
                    }),
                ),
            );
            yield* process.exitCode;
        });
    },
};
