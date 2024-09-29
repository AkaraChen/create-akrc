import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const configFiles = ['turbo.json', '**/turbo.json'];
const deps = ['turbo'];

export const turbo: IFeature = {
    name: 'turbo',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps(...deps);
            const fs = yield* ctx.fs;
            const template = yield* ctx.template('turbo');
            yield* fs.writeFileString(
                yield* ctx.join('turbo.json'),
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
            yield* ctx.removeDeps(...deps);
            const fs = yield* ctx.fs;
            const files = yield* ctx.glob(configFiles);
            yield* Effect.forEach(files, (file) => fs.remove(file));
        });
    },
};
