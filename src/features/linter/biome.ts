import { Command, CommandExecutor, FileSystem } from '@effect/platform';
import { BadArgument, isPlatformError } from '@effect/platform/Error';
import { Effect, pipe } from 'effect';
import { commands } from 'pm-combo';
import type { IFeature } from '../type';

const scripts = {
    check: 'biome check . --write',
};

export const biome: IFeature = {
    name: 'biome',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps({
                name: '@biomejs/biome',
                field: 'devDependencies',
            });
            yield* ctx.addScripts(scripts);
            const exec = yield* CommandExecutor.CommandExecutor;
            const command = pipe(
                ctx.makeCommand(
                    commands.exec.concat(ctx.pm, {
                        args: ['biome', 'init'],
                    }),
                ),
                Command.workingDirectory(ctx.root),
            );
            yield* exec.start(command).pipe(Effect.catchAll(Effect.logFatal));
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            return yield* fs.exists(yield* ctx.join('biome.json'));
        }).pipe(
            Effect.catchIf(
                (e): e is BadArgument => e instanceof BadArgument,
                (e) => Effect.fail(e),
            ),
            Effect.catchIf(isPlatformError, Effect.fail),
        );
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('@biomejs/biome');
            yield* ctx.removeScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            yield* fs.remove(yield* ctx.join('biome.json'));
        });
    },
};
