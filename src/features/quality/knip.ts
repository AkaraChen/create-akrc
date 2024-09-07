import { CommandExecutor } from '@effect/platform';
import { Effect } from 'effect';
import { commands } from 'pm-combo';
import type { IFeature } from '../type';

const scripts = {
    knip: 'knip',
};

export const knip: IFeature = {
    name: 'knip',
    setup(ctx) {
        return Effect.gen(function* () {
            const exec = yield* CommandExecutor.CommandExecutor;
            yield* Effect.log('Initializing knip');
            const process = yield* exec.start(
                ctx.makeCommand(
                    commands.create.concat(ctx.pm, {
                        name: '@knip/config',
                        args: [],
                    }),
                ),
            );
            yield* process.exitCode;
        });
    },
    detect(ctx) {
        return ctx.hasDep('knip');
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('knip');
            yield* ctx.removeScripts(scripts);
        });
    },
};
