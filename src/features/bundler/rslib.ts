import { type IFeature, Order } from '@/features/type';
import { Effect } from 'effect';
import { ensureEntry } from './utils';

const configFile = 'rslib.config.ts';
const scripts = {
    build: 'rslib build',
    dev: 'rslib build --watch',
};

export const rslib: IFeature = {
    name: 'rslib',
    order: Order.First,
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ensureEntry(ctx.root);
            yield* ctx.addDeps({ name: '@rslib/core' });
            const fs = yield* ctx.fs;
            const template = yield* ctx.template('rslib');
            yield* fs.writeFileString(
                yield* ctx.join(configFile),
                template(null),
            );
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            return yield* fs.exists(yield* ctx.join(configFile));
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            yield* fs.remove(yield* ctx.join(configFile));
            yield* ctx.removeDeps('@rslib/core');
            yield* ctx.removeScripts(scripts);
        });
    },
};
