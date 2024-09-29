import type { IFeature } from '@/features/type';
import { FileSystem } from '@effect/platform';
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
            const content = yield* Effect.sync(() => {
                return template(null);
            });
            yield* Effect.gen(function* () {
                const fs = yield* FileSystem.FileSystem;
                yield* fs.writeFile(
                    yield* ctx.join(configFile),
                    ctx.encoder.encode(content),
                );
            });
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            return yield* fs.exists(yield* ctx.join(configFile));
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('vitest');
            yield* ctx.removeScripts(scripts);
            yield* Effect.gen(function* () {
                const fs = yield* FileSystem.FileSystem;
                yield* fs.remove(yield* ctx.join(configFile));
            });
        });
    },
};
