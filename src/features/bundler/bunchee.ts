import { CommandExecutor } from '@effect/platform';
import { Effect } from 'effect';
import { commands } from 'pm-combo';
import type { IFeature } from '../type';
import { switchToModule } from './utils';

const scripts = {
    build: 'bunchee',
    dev: 'bunchee --watch',
};

export const bunchee: IFeature = {
    name: 'bunchee',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* switchToModule(ctx);
            const exec = yield* CommandExecutor.CommandExecutor;
            yield* ctx.addDeps({ name: 'bunchee' });
            yield* Effect.log('Preparing bunchee');
            const process = yield* exec.start(
                ctx.makeCommand(
                    commands.dlx.concat(ctx.pm, {
                        package: 'bunchee',
                        args: ['--prepare'],
                    }),
                ),
            );
            yield* process.exitCode;
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return ctx.hasDep('bunchee');
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('bunchee');
            yield* ctx.removeScripts(scripts);
        });
    },
};
