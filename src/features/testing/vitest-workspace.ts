import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const configFiles = ['vitest.{workspace,projects}.{json,ts,js}'];
const deps = ['vitest'];

export const vitestWorkspace: IFeature = {
    name: 'vitest-workspace',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            const template = yield* ctx.template('vitest.workspace');
            const fs = yield* ctx.fs;
            yield* fs.writeFileString(
                yield* ctx.join('vitest.config.ts'),
                template(null),
            );
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
