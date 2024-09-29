import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const scripts = {
    test: 'vitest run',
    'test:watch': 'vitest',
};

const configFile = 'vitest.config.ts';

export const vitest: IFeature = {
    name: 'vitest',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps({ name: 'vitest' });
            yield* ctx.addScripts(scripts);
            const template = yield* ctx.template('vitest.config');
            yield* Effect.gen(function* () {
                const fs = yield* ctx.fs;
                yield* fs.writeFileString(
                    yield* ctx.join(configFile),
                    template(null),
                );
            });
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
            yield* ctx.removeDeps('vitest');
            yield* ctx.removeScripts(scripts);
            yield* Effect.gen(function* () {
                const fs = yield* ctx.fs;
                yield* fs.remove(yield* ctx.join(configFile));
            });
        });
    },
};
