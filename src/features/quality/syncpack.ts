import { Effect } from 'effect';
import type { IFeature } from '../type';

const deps = ['syncpack'];
const scripts = {
    syncpack: 'syncpack',
};

export const syncpack: IFeature = {
    name: 'syncpack',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps.map((dep) => ({ name: dep })));
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return ctx.hasDep('syncpack');
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps(...deps);
            yield* ctx.removeScripts(scripts);
        });
    },
};
