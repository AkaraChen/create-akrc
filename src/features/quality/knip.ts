import { Effect } from 'effect';
import type { IFeature } from '../type';
import { CommandExecutor } from '@effect/platform';
import { commands } from 'pm-combo';

const scripts = {
    knip: 'knip',
};

export const knip: IFeature = {
    name: 'knip',
    setup(ctx) {
        return Effect.gen(function* () {
            const exec = yield* CommandExecutor.CommandExecutor;
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
        return ctx.package.pipe(
            Effect.map(
                (pkg) => pkg.devDependencies?.['@knip/config'] !== undefined,
            ),
        );
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('knip');
            yield* ctx.removeScripts(scripts);
        });
    },
};
