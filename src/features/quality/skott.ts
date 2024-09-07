import { Effect } from 'effect';
import type { IFeature } from '../type';

const deps = ['skott'];
const scripts = {
    skott: 'skott --displayMode=webapp',
};

export const skott: IFeature = {
    name: 'skott',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return ctx.hasDep('skott');
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps(...deps);
            yield* ctx.removeScripts(scripts);
        });
    },
};
