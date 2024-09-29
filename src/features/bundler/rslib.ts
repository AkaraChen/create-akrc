import type { IFeature } from '@/features/type';
import { FileSystem } from '@effect/platform';
import { Effect } from 'effect';

const configFile = 'rslib.config.ts';
const scripts = {
    build: 'rslib build',
    dev: 'rslib build --watch',
};

export const rslib: IFeature = {
    name: 'rslib',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps({ name: '@rslib/core' });
            const template = yield* ctx.template('rslib');
            const content = ctx.encoder.encode(template(null));
            const fs = yield* FileSystem.FileSystem;
            yield* fs.writeFile(yield* ctx.join(configFile), content);
            yield* ctx.addScripts(scripts);
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
            const fs = yield* FileSystem.FileSystem;
            yield* fs.remove(yield* ctx.join(configFile));
            yield* ctx.removeDeps('@rslib/core');
            yield* ctx.removeScripts(scripts);
        });
    },
};
