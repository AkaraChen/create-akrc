import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const scripts = {
    test: 'rstest run',
    'test:watch': 'rstest',
};

const configFiles = [
    'rstest.config.ts',
    'rstest.config.js',
    'rstest.config.mjs',
    'rstest.config.cjs',
    'rstest.config.mts',
    'rstest.config.cts',
];
const defaultConfigFile = 'rstest.config.ts';
const deps = ['@rstest/core'];

export const rstest: IFeature = {
    name: 'rstest',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            yield* ctx.addScripts(scripts);
            const template = yield* ctx.template('rstest');
            yield* Effect.gen(function* () {
                const fs = yield* ctx.fs;
                yield* fs.writeFileString(
                    yield* ctx.join(defaultConfigFile),
                    template(null),
                );
            });
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            return yield* ctx
                .glob(configFiles)
                .pipe(Effect.map((files) => files.length > 0));
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            yield* ctx.removeDeps(...deps);
            yield* ctx.removeScripts(scripts);
            yield* ctx
                .glob(configFiles)
                .pipe(
                    Effect.andThen((files) =>
                        Effect.forEach(files, (file) => fs.remove(file)),
                    ),
                );
        });
    },
};
