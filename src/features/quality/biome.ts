import type { IFeature } from '@/features/type';
import { Effect } from 'effect';

const scripts = {
    check: 'biome check . --write',
};

export const biome: IFeature = {
    name: 'biome',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps({ name: '@biomejs/biome' });
            yield* ctx.addScripts(scripts);
            const fs = yield* ctx.fs;
            const path = yield* ctx.join('biome.json');
            const template = yield* ctx.template('biome');
            yield* fs.writeFileString(path, template(null));
        });
    },
    detect(ctx) {
        return Effect.gen(function* () {
            const fs = yield* ctx.fs;
            return yield* fs.exists(yield* ctx.join('biome.json'));
        });
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('@biomejs/biome');
            yield* ctx.removeScripts(scripts);
            const fs = yield* ctx.fs;
            yield* fs.remove(yield* ctx.join('biome.json'));
        });
    },
};
