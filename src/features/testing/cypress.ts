import type { IFeature } from '@/features/type';
import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';

const deps = ['cypress'];
const scripts = {
    'cy:open': 'cypress open',
};
const configFiles = ['cypress.json', 'cypress.config.js', 'cypress.config.ts'];

export const cypress: IFeature = {
    name: 'cypress',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            yield* ctx.addScripts(scripts);
        });
    },
    detect(ctx) {
        return ctx.hasDep('cypress');
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps(...deps);
            yield* ctx.removeScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
