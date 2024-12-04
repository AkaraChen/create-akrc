import { type IFeature, Order } from '@/features/type';
import { Effect } from 'effect';
import { commands } from 'pm-combo';
import { ensureEntry, switchToModule } from './utils';

const scripts = {
    build: 'bunchee',
    dev: 'bunchee --watch',
};

export const bunchee: IFeature = {
    name: 'bunchee',
    order: Order.First,
    setup(ctx) {
        return Effect.gen(function* () {
            yield* switchToModule(ctx);
            yield* ensureEntry(ctx.root);
            const exec = yield* ctx.exec;
            yield* ctx.addDeps({ name: 'bunchee' });
            yield* Effect.log('Preparing bunchee');
            const process = yield* exec.start(
                ctx.makeCommand(
                    commands.dlx.concat(ctx.pm, {
                        package: 'bunchee',
                        args: ['prepare'],
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
