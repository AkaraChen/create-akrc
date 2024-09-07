import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';
import type { IFeature } from '../type';

const configFiles = ['turbo.json', '**/turbo.json'];
const deps = ['turbo'];

export const turbo: IFeature = {
    name: 'turbo',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            const fs = yield* FileSystem.FileSystem;
            const template = yield* ctx.template('turbo');
            const content = ctx.encoder.encode(template(null));
            yield* fs.writeFile(yield* ctx.join('turbo.json'), content);
        });
    },
    detect(ctx) {
        return ctx
            .glob(configFiles)
            .pipe(Effect.map((files) => files.length > 0));
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps(...deps);
            const fs = yield* FileSystem.FileSystem;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
