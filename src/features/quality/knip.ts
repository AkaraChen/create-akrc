import type { IFeature } from '@/features/type';
import { Effect } from 'effect';
import { commands } from 'pm-combo';

const scripts = {
    knip: 'knip',
};

export const knip: IFeature = {
    name: 'knip',
    setup(ctx) {
        return Effect.gen(function* () {
            const exec = yield* ctx.exec;
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
