import { FileSystem } from '@effect/platform';
import { Effect, Encoding } from 'effect';
import type { IFeature } from '../type';

const scripts = {
    check: 'biome check . --write',
};

export const biome: IFeature = {
    name: 'biome',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps({ name: '@biomejs/biome' });
            yield* ctx.addScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            const template = yield* ctx.template('biome');
            const path = yield* ctx.join('biome.json');
            yield* fs.writeFile(
                path,
                yield* Encoding.decodeHex(template(null)),
            );
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem;
            return yield* fs.exists(yield* ctx.join('biome.json'));
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('@biomejs/biome');
            yield* ctx.removeScripts(scripts);
            const fs = yield* FileSystem.FileSystem;
            yield* fs.remove(yield* ctx.join('biome.json'));
        });
    },
};
