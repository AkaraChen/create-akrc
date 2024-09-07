import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import type { IFeature } from '../type';

const configFiles = ['vitest.{workspace,projects}.{json,ts,js}'];
const deps = ['vitest'];

export const vitestWorkspace: IFeature = {
    name: 'vitest-workspace',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            const template = yield* ctx.template('vitest.workspace');
            const content = ctx.encoder.encode(template(null));
            const fs = yield* FileSystem.FileSystem;
            yield* fs.writeFile(
                yield* ctx.join('vitest.workspace.ts'),
                content,
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
            const fs = yield* FileSystem.FileSystem;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
