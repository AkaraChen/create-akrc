import { Effect } from 'effect';
import type { IFeature } from '../type';

const file = '.oxlintrc.json';

export const oxlint: IFeature = {
    name: 'oxlint',
    setup(ctx) {
        return Effect.gen(function* () {
            yield* ctx.addDeps('oxlint');
            const template = yield* ctx.template('oxlint');
            const fs = yield* ctx.fs;
            yield* fs.writeFileString(yield* ctx.join(file), template(null));
        });
    },
    detect(ctx) {
        return ctx.hasDep('oxlint');
    },
    teardown(ctx) {
        return Effect.gen(function* () {
            yield* ctx.removeDeps('oxlint');
            const fs = yield* ctx.fs;
            yield* fs.remove(yield* ctx.join(file));
        });
    },
};
