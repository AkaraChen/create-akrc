import { CommandExecutor } from '@effect/platform';
import { Effect } from 'effect';
import { commands } from 'pm-combo';
import type { IFeature } from '../type';
import { switchToModule } from './utils';

export const bunchee: IFeature = {
    name: 'bunchee',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* switchToModule(ctx);
            const exec = yield* CommandExecutor.CommandExecutor;
            yield* ctx.addDeps({
                name: 'bunchee',
                field: 'devDependencies',
            });
            yield* exec.start(
                ctx.makeCommand(
                    commands.dlx.concat(ctx.pm, {
                        package: 'bunchee',
                        args: ['--prepare'],
                    }),
                ),
            );
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const json = yield* ctx.package;
            if (json.devDependencies) {
                return Boolean(json.devDependencies.bunchee);
            }
            return false;
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('bunchee');
        });
    },
};
